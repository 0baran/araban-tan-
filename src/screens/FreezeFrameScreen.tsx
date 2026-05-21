import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../services/ThemeContext';
import {obd2Service, FreezeFrameData, DTC} from '../services/OBD2Service';

interface Props {
  onBack: () => void;
}

export default function FreezeFrameScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [ff, setFf] = useState<FreezeFrameData | null>(null);
  const [pending, setPending] = useState<DTC[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [ffData, pendingDtcs] = await Promise.all([
      obd2Service.readFreezeFrame(),
      obd2Service.readPendingDTCs(),
    ]);
    setFf(ffData);
    setPending(pendingDtcs);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const rows: {label: string; value: string; color: string}[] = [
    {label: 'Motor Devri', value: `${ff?.rpm || 0} RPM`, color: '#00bfff'},
    {label: 'Hız', value: `${ff?.speed || 0} KM/H`, color: '#00ff7f'},
    {label: 'Soğutma Sıvısı', value: `${ff?.coolantTemp || 0}°C`, color: '#ff9ff3'},
    {label: 'Motor Yükü', value: `%${ff?.engineLoad || 0}`, color: '#feca57'},
    {label: 'Emme Havası', value: `${ff?.intakeTemp || 0}°C`, color: '#ff6348'},
    {label: 'MAF', value: `${ff?.maf.toFixed(1) || '0.0'} g/s`, color: '#7bed9f'},
    {label: 'Gaz Kelebeği', value: `%${ff?.throttlePos || 0}`, color: '#70a1ff'},
    {label: 'MAP Basıncı', value: `${ff?.map || 0} kPa`, color: '#ff4757'},
    {label: 'Ateşleme Avansı', value: `${ff?.timingAdvance || 0}°`, color: '#2ed573'},
    {label: 'Kısa Dönem Yakıt', value: `${ff?.shortTermFuelTrim || 0}%`, color: '#ffafcc'},
    {label: 'Uzun Dönem Yakıt', value: `${ff?.longTermFuelTrim || 0}%`, color: '#cdb4db'},
    {label: 'Hedef H/Y Oranı', value: `${ff?.commandedAFR.toFixed(1) || '0.0'} λ`, color: '#a2d2ff'},
    {label: 'Yakıt', value: `%${ff?.fuelLevel || 0}`, color: '#ffa502'},
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>DONMA NOKTASI</Text>
        <TouchableOpacity onPress={fetchAll} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#00bfff" style={{marginTop: 60}} />
      ) : (
        <>
          {/* DTC that triggered freeze frame */}
          <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>TETİKLEYEN HATA</Text>
            {ff?.dtc ? (
              <View style={styles.dtcBox}>
                <Text style={styles.dtcCode}>{ff.dtc.code}</Text>
                <Text style={[styles.dtcDesc, {color: colors.textDim}]}>{ff.dtc.description}</Text>
              </View>
            ) : (
              <Text style={[styles.emptyText, {color: colors.textMuted}]}>Donma noktası kaydı yok</Text>
            )}
          </View>

          {/* Freeze frame sensor data */}
          <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>SENSOR KAYDI</Text>
            <View style={styles.grid}>
              {rows.map(r => (
                <View key={r.label} style={styles.sensorItem}>
                  <Text style={[styles.sensorValue, {color: r.color}]}>{r.value}</Text>
                  <Text style={[styles.sensorLabel, {color: colors.textMuted}]}>{r.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pending DTCs */}
          <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>BEKLEYEN HATA KODLARI</Text>
            {pending.length === 0 ? (
              <Text style={[styles.emptyText, {color: colors.textMuted}]}>Bekleyen hata kodu yok</Text>
            ) : (
              pending.map(d => (
                <View key={d.code} style={styles.pendingItem}>
                  <Text style={styles.pendingCode}>{d.code}</Text>
                  <Text style={[styles.pendingDesc, {color: colors.textDim}]}>{d.description}</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0b10'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 40,
  },
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  refreshBtn: {padding: 8},
  refreshText: {color: '#00bfff', fontWeight: '700', fontSize: 12, letterSpacing: 1},
  glassCard: {
    backgroundColor: 'rgba(30,33,40,0.7)', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16, marginBottom: 16,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold',
    letterSpacing: 1, marginBottom: 12,
  },
  dtcBox: {
    backgroundColor: 'rgba(255,71,87,0.1)', borderRadius: 14, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#ff4757',
  },
  dtcCode: {color: '#ff4757', fontSize: 22, fontWeight: '900', letterSpacing: 1},
  dtcDesc: {color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4},
  emptyText: {
    color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', marginVertical: 12,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  sensorItem: {
    width: '50%', paddingVertical: 10, paddingHorizontal: 4,
  },
  sensorValue: {fontSize: 20, fontWeight: '900'},
  sensorLabel: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600',
    marginTop: 2, letterSpacing: 0.5,
  },
  pendingItem: {
    backgroundColor: 'rgba(255,165,0,0.08)', borderRadius: 12, padding: 12,
    marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#ffa502',
  },
  pendingCode: {color: '#ffa502', fontSize: 16, fontWeight: '900', letterSpacing: 1},
  pendingDesc: {color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3},
});
