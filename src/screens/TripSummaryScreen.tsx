import { SafeAreaView } from 'react-native-safe-area-context';
import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import {useTheme} from '../services/ThemeContext';
import {obd2Service, TripData} from '../services/OBD2Service';
import {getSettings, loadSettings} from '../services/AppSettings';

interface Props {
  onBack: () => void;
}

export default function TripSummaryScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [trip, setTrip] = useState<TripData>(obd2Service.getTripData());
  const [elapsed, setElapsed] = useState('00:00:00');
  const [fuelPrice, setFuelPrice] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadSettings();
    const s = getSettings();
    setFuelPrice(s.fuelPricePerLiter);
    setAutoRecord(s.autoRecord);
    refresh();
    timerRef.current = setInterval(refresh, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const refresh = () => {
    const td = obd2Service.getTripData();
    setTrip(td);
    setIsRecording(obd2Service.isTripRecording());
    if (td.startTime > 0) {
      setElapsed(formatElapsed(Date.now() - td.startTime));
    }
  };

  const formatElapsed = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fuelCost = fuelPrice > 0 ? trip.fuelUsedL * fuelPrice : 0;

  const rows: {label: string; value: string; color: string}[] = [
    {label: 'SÜRE', value: elapsed, color: '#00bfff'},
    {label: 'MESAFE', value: `${trip.distanceKm.toFixed(1)} km`, color: '#00ff7f'},
    {label: 'YAKIT', value: `${trip.fuelUsedL.toFixed(2)} L`, color: '#ff9ff3'},
    {label: 'ORT. TÜKETİM', value: `${trip.avgConsumption.toFixed(1)} L/100km`, color: '#feca57'},
    {label: 'ORT. HIZ', value: `${trip.avgSpeed} km/h`, color: '#70a1ff'},
    {label: 'MAKS. HIZ', value: `${trip.maxSpeed} km/h`, color: '#ff4757'},
    {label: 'YAKIT MALİYETİ', value: `${fuelCost.toFixed(2)} TL`, color: '#2ed573'},
  ];

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={[styles.header, {backgroundColor: colors.bg}]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>TRIP ÖZETİ</Text>
        <View style={{width: 60}} />
      </View>

      <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
        {trip.startTime > 0 ? (
          <View style={styles.grid}>
            {rows.map(r => (
              <View key={r.label} style={styles.row}>
                <Text style={[styles.rowLabel, {color: colors.textMuted}]}>{r.label}</Text>
                <Text style={[styles.rowValue, {color: r.color}]}>{r.value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, {color: colors.textMuted}]}>
            Bağlanınca otomatik kayıt başlar
          </Text>
        )}
      </View>

      {trip.startTime > 0 && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: 'rgba(255,71,87,0.15)'}]}
            onPress={() => { obd2Service.resetTripData(); refresh(); }}>
            <Text style={[styles.actionBtnText, {color: '#ff4757'}]}>SİFIRLA</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 40,
  },
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {fontSize: 18, fontWeight: '900', letterSpacing: 1},
  glassCard: {
    borderRadius: 24, padding: 20,
    borderWidth: 1, marginHorizontal: 16, marginBottom: 16,
  },
  grid: {gap: 16},
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLabel: {fontSize: 12, fontWeight: '700', letterSpacing: 1, opacity: 0.6},
  rowValue: {fontSize: 20, fontWeight: '900'},
  emptyText: {fontSize: 14, textAlign: 'center', marginVertical: 20, opacity: 0.5},
  buttonRow: {flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, gap: 12},
  actionBtn: {
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16,
    alignItems: 'center',
  },
  actionBtnText: {fontSize: 14, fontWeight: '800', letterSpacing: 1},
});
