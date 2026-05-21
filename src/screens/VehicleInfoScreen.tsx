import { SafeAreaView } from 'react-native-safe-area-context';
import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import {useTheme} from '../services/ThemeContext';
import {obd2Service, MonitorStatus} from '../services/OBD2Service';

interface Props {
  onBack: () => void;
}

export default function VehicleInfoScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [vin, setVin] = useState('');
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const v = obd2Service.vin || '—';
    setVin(v);
    const ms = await obd2Service.readMonitorStatus();
    setMonitorStatus(ms);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>ARAÇ BİLGİSİ</Text>
        <TouchableOpacity onPress={fetchAll} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#00bfff" style={{marginTop: 60}} />
      ) : (
        <ScrollView contentContainerStyle={{padding: 16}}>
          {/* VIN */}
          <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>KİMLİK NUMARASI (VIN)</Text>
            <Text style={styles.vinText}>{vin}</Text>
            <Text style={[styles.hint, {color: colors.textMuted}]}>
              VIN aracın kimlik numarasıdır. Bağlantı sırasında otomatik okunur.
            </Text>
          </View>

          {/* Monitor Readiness */}
          {monitorStatus && (
            <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
              <Text style={[styles.cardLabel, {color: colors.textMuted}]}>OBD2 MONİTÖR DURUMU</Text>
              <View style={styles.monitorHeader}>
                <View style={[styles.milBadge, monitorStatus.milOn ? styles.milOn : styles.milOff]}>
                  <Text style={[styles.milText, {color: colors.text}]}>
                    MIL: {monitorStatus.milOn ? 'AÇIK' : 'KAPALI'}
                  </Text>
                </View>
                <Text style={[styles.monitorCount, {color: colors.textMuted}]}>
                  DTC: {monitorStatus.dtcCount}
                </Text>
              </View>
              {monitorStatus.tests.map((t, i) => (
                <View key={i} style={styles.monitorRow}>
                  <Text style={[styles.monitorName, {color: colors.text}]}>{t.name}</Text>
                  {!t.available ? (
                    <Text style={styles.na}>N/A</Text>
                  ) : (
                    <View style={styles.monitorStatusRow}>
                      <Text style={t.completed ? styles.ok : styles.fail}>
                        {t.completed ? '✔' : '✘'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              <Text style={[styles.hint, {color: colors.textMuted}]}>
                Tüm monitörlerin ✔ olması araç emisyon testine hazır demektir.
              </Text>
            </View>
          )}

          {/* Connection Info */}
          <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>BAĞLANTI</Text>
            <InfoRow icon="📶" label="Protokol" value={obd2Service.protocolLabel} />
            <InfoRow icon="🔗" label="Tip" value={obd2Service.connectionType === 'bluetooth' ? 'Bluetooth' : obd2Service.connectionType === 'wifi' ? 'WiFi' : 'Simülasyon'} />
            <InfoRow icon="📱" label="Bağlı" value={obd2Service.isConnected ? 'Evet' : 'Hayır'} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({icon, label, value}: {icon: string; label: string; value: string}) {
  const {colors} = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={[styles.infoLabel, {color: colors.textDim}]}>{label}</Text>
      <Text style={[styles.infoValue, {color: colors.text}]}>{value}</Text>
    </View>
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
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold',
    letterSpacing: 1, marginBottom: 12,
  },
  vinText: {
    color: '#00bfff', fontSize: 18, fontWeight: '900', letterSpacing: 2,
    fontFamily: 'monospace', marginBottom: 8,
  },
  hint: {color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 10, lineHeight: 16},
  monitorHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12},
  milBadge: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  milOn: {backgroundColor: 'rgba(255,71,87,0.2)'},
  milOff: {backgroundColor: 'rgba(0,255,127,0.15)'},
  milText: {fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 1},
  monitorCount: {color: 'rgba(255,255,255,0.5)', fontSize: 13},
  monitorRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  monitorName: {color: '#fff', fontSize: 14, flex: 1},
  monitorStatusRow: {flexDirection: 'row', gap: 4},
  na: {color: 'rgba(255,255,255,0.3)', fontSize: 13},
  ok: {color: '#00ff7f', fontSize: 16},
  fail: {color: '#ff4757', fontSize: 16},
  infoRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10},
  infoIcon: {fontSize: 16, width: 24},
  infoLabel: {color: 'rgba(255,255,255,0.5)', fontSize: 13, flex: 1},
  infoValue: {color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'right'},
});
