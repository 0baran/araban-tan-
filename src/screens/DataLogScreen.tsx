import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Share} from 'react-native';
import {obd2Service} from '../services/OBD2Service';
import {dataLogService} from '../services/DataLogService';
import {loadSettings, getSettings} from '../services/AppSettings';
import {useTheme} from '../services/ThemeContext';

interface Props {
  onBack: () => void;
}

export default function DataLogScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [recording, setRecording] = useState(false);
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [fuelUsed, setFuelUsed] = useState(0);
  const [summary, setSummary] = useState<{label: string; min: number; max: number; avg: number}[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSettings();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const startRecord = () => {
    const s = getSettings();
    dataLogService.setFuelPrice(s.fuelPricePerLiter);
    dataLogService.start();
    setRecording(true);
    setSummary([]);
    pollRef.current = setInterval(() => {
      const d = obd2Service.getLastData();
      dataLogService.addDataPoint(d);
    }, 400);
    tickRef.current = setInterval(() => {
      setCount(dataLogService.pointCount);
      setElapsed(dataLogService.elapsed);
      setFuelUsed(dataLogService.fuelUsed);
      setFuelCost(dataLogService.getFuelCost());
    }, 200);
  };

  const stopRecord = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    dataLogService.stop();
    setRecording(false);
    setElapsed(dataLogService.getDuration());
    setFuelUsed(dataLogService.fuelUsed);
    setFuelCost(dataLogService.getFuelCost());
    setSummary(dataLogService.getSummary());
  };

  const resetRecord = () => {
    dataLogService.reset();
    setCount(0);
    setElapsed(0);
    setFuelCost(0);
    setFuelUsed(0);
    setSummary([]);
  };

  const formatTime = (t: number) => {
    const min = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}` : `${t.toFixed(1)}s`;
  };

  const handleShare = async () => {
    const csv = dataLogService.toCSV();
    try {
      const fuelInfo = `Toplam Yakıt: ${dataLogService.fuelUsed.toFixed(2)} L, Maliyet: ${dataLogService.getFuelCost().toFixed(1)} TL\n\n`;
      await Share.share({message: fuelInfo + csv});
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, {color: colors.accent}]}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>VERİ KAYDI</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView>
        <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
          <Text style={[styles.cardLabel, {color: colors.textDim}]}>KAYIT DURUMU</Text>
          <View style={[styles.statusBadge, {backgroundColor: recording ? 'rgba(0,255,127,0.15)' : colors.card, borderColor: recording ? '#00ff7f' : colors.cardBorder}]}>
            <Text style={[styles.statusText, {color: recording ? '#00ff7f' : colors.textDim}]}>
              {recording ? '⚫ KAYIT AKTİF' : '⏸ DURAKLAMA'}
            </Text>
          </View>
          <Text style={[styles.bigNum, {color: recording ? '#00ff7f' : colors.text}]}>
            {recording ? formatTime(elapsed) : count > 0 ? formatTime(elapsed) : '—'}
          </Text>
          <Text style={[styles.bigUnit, {color: colors.textMuted}]}>
            {recording ? 'SÜRE' : count > 0 ? 'KAYDEDİLDİ' : ''}
          </Text>
        </View>

        {count > 0 && (
          <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardLabel, {color: colors.textDim}]}>YAKIT & MALİYET</Text>
            <View style={styles.row3}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, {color: colors.text}]}>{count}</Text>
                <Text style={[styles.statLabel, {color: colors.textMuted}]}>VERİ NOKTASI</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, {color: '#e9c46a'}]}>{fuelUsed.toFixed(2)}</Text>
                <Text style={[styles.statLabel, {color: colors.textMuted}]}>L</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, {color: '#ffa502'}]}>₺{fuelCost.toFixed(1)}</Text>
                <Text style={[styles.statLabel, {color: colors.textMuted}]}>TL</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.btnRow}>
          {recording ? (
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={stopRecord}>
              <Text style={[styles.btnText, {color: '#ff4757'}]}>⏹ DURDUR</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={startRecord}>
              <Text style={[styles.btnText, {color: colors.accent}]}>⏺ BAŞLAT</Text>
            </TouchableOpacity>
          )}
        </View>

        {!recording && count > 0 && (
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={resetRecord}>
              <Text style={[styles.btnText, {color: '#ff4757'}]}>SIFIRLA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={handleShare}>
              <Text style={[styles.btnText, {color: '#00ff7f'}]}>📤 PAYLAŞ</Text>
            </TouchableOpacity>
          </View>
        )}

        {summary.length > 0 && (
          <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardLabel, {color: colors.textDim}]}>ÖZET (min / max / avg)</Text>
            {summary.map(item => (
              <View key={item.label} style={[styles.summaryRow, {borderBottomColor: colors.cardBorder}]}>
                <Text style={[styles.summaryLabel, {color: colors.textDim}]}>{item.label}</Text>
                <Text style={[styles.summaryVal, {color: colors.text}]}>{item.min}</Text>
                <Text style={[styles.summaryVal, {color: colors.text}]}>{item.max}</Text>
                <Text style={[styles.summaryVal, {color: colors.text}]}>{item.avg}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40},
  backButton: {padding: 8},
  backText: {fontSize: 16, fontWeight: '700'},
  title: {fontSize: 18, fontWeight: '900', letterSpacing: 1},
  card: {borderRadius: 20, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1},
  cardLabel: {fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10},
  bigNum: {fontSize: 48, fontWeight: '900', textAlign: 'center', fontFamily: 'monospace'},
  bigUnit: {fontSize: 12, textAlign: 'center', marginTop: 2, fontWeight: '700'},
  statusBadge: {alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginBottom: 10},
  statusText: {fontWeight: '700', fontSize: 12, letterSpacing: 1},
  row3: {flexDirection: 'row', justifyContent: 'space-around', marginTop: 14},
  statItem: {alignItems: 'center'},
  statVal: {fontSize: 22, fontWeight: '900'},
  statLabel: {fontSize: 10, fontWeight: '600', marginTop: 4},
  btnRow: {flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12},
  btn: {flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1},
  btnPrimary: {backgroundColor: 'rgba(0,191,255,0.12)', borderColor: 'rgba(0,191,255,0.3)'},
  btnDanger: {backgroundColor: 'rgba(255,71,87,0.12)', borderColor: 'rgba(255,71,87,0.3)'},
  btnGreen: {backgroundColor: 'rgba(0,255,127,0.12)', borderColor: 'rgba(0,255,127,0.3)'},
  btnText: {fontWeight: '800', fontSize: 14, letterSpacing: 1},
  summaryRow: {flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1},
  summaryLabel: {flex: 1, fontSize: 12, fontWeight: '600'},
  summaryVal: {width: 60, textAlign: 'right', fontSize: 12, fontWeight: '700'},
});
