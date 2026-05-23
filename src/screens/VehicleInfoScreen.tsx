import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useTheme} from '../services/ThemeContext';
import {obd2Service, MonitorStatus} from '../services/OBD2Service';

interface Props {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export default function VehicleInfoScreen({onBack, onNavigate}: Props) {
  const {colors} = useTheme();
  const [vin, setVin] = useState('');
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(
    null,
  );
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
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.container, {backgroundColor: colors.bg}]}>
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
          <View
            style={[
              styles.glassCard,
              {backgroundColor: colors.card, borderColor: colors.cardBorder},
            ]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>
              KİMLİK NUMARASI (VIN)
            </Text>
            <Text style={styles.vinText}>{vin}</Text>
            <Text style={[styles.hint, {color: colors.textMuted}]}>
              VIN aracın kimlik numarasıdır. Bağlantı sırasında otomatik okunur.
            </Text>
          </View>

          {/* Monitor Readiness (Emisyon Testi) */}
          {monitorStatus && (
            <>
              {/* Genel Durum Kartı */}
              <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
                <Text style={[styles.cardLabel, {color: colors.textMuted}]}>EMİSYON TESTİ: GENEL DURUM</Text>
                <View style={[styles.summaryBox, {backgroundColor: (monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? 'rgba(0,255,127,0.1)' : 'rgba(255,71,87,0.1)'}]}>
                  <Text style={[styles.summaryText, {color: (monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? '#00ff7f' : '#ff4757'}]}>
                    {(monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? '✅ MUAYENEYE HAZIR' : '❌ HAZIR DEĞİL'}
                  </Text>
                  <Text style={[styles.summaryDesc, {color: colors.textDim}]}>
                    {(monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? 'Tüm sensör testleri tamamlandı. Araç egzoz emisyon testinden geçebilir.' : 'Bazı sistem testleri henüz tamamlanmamış. Aracınızı bir süre daha sürmeniz gerekebilir.'}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
                  <View style={{alignItems: 'center'}}>
                    <Text style={{color: '#fff', fontSize: 28, fontWeight: '900'}}>{monitorStatus.dtcCount}</Text>
                    <Text style={{fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.textMuted}}>HATA KODU</Text>
                  </View>
                  <View style={{alignItems: 'center'}}>
                    <Text style={{color: monitorStatus.milOn ? '#ff4757' : '#00ff7f', fontSize: 28, fontWeight: '900'}}>{monitorStatus.milOn ? 'AÇIK' : 'KAPALI'}</Text>
                    <Text style={{fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.textMuted}}>MOTOR IŞIĞI</Text>
                  </View>
                </View>
              </View>

              {/* Bileşen Testleri Kartı */}
              <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
                <Text style={[styles.cardLabel, {color: colors.textMuted}]}>BİLEŞEN TESTLERİ (I/M READINESS)</Text>
                {monitorStatus.tests.filter(t => t.available).length === 0 ? (
                  <Text style={[styles.hint, {color: colors.textMuted, textAlign: 'center'}]}>Test verisi okunamadı.</Text>
                ) : (
                  monitorStatus.tests.filter(t => t.available).map((test, index) => (
                    <View key={index} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.text, flex: 1}}>{test.name}</Text>
                      <View style={{paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: test.completed ? 'rgba(0,255,127,0.1)' : 'rgba(255,165,0,0.1)'}}>
                        <Text style={{fontSize: 11, fontWeight: '800', letterSpacing: 1, color: test.completed ? '#00ff7f' : '#ffa502'}}>{test.completed ? 'TAMAM' : 'EKSİK'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {/* Connection Info */}
          <View
            style={[
              styles.glassCard,
              {backgroundColor: colors.card, borderColor: colors.cardBorder},
            ]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>
              BAĞLANTI
            </Text>
            <InfoRow
              icon="📶"
              label="Protokol"
              value={obd2Service.protocolLabel}
            />
            <InfoRow
              icon="🔗"
              label="Tip"
              value={
                obd2Service.connectionType === 'bluetooth'
                  ? 'Bluetooth'
                  : obd2Service.connectionType === 'wifi'
                  ? 'WiFi'
                  : 'Simülasyon'
              }
            />
            <InfoRow
              icon="📱"
              label="Bağlı"
              value={obd2Service.isConnected ? 'Evet' : 'Hayır'}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  refreshBtn: {padding: 8},
  refreshText: {
    color: '#00bfff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  glassCard: {
    backgroundColor: 'rgba(30,33,40,0.7)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  vinText: {
    color: '#00bfff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  hint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginTop: 10,
    lineHeight: 16,
  },
  monitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  milBadge: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  milOn: {backgroundColor: 'rgba(255,71,87,0.2)'},
  milOff: {backgroundColor: 'rgba(0,255,127,0.15)'},
  milText: {fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 1},
  monitorCount: {color: 'rgba(255,255,255,0.5)', fontSize: 13},
  monitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  monitorName: {color: '#fff', fontSize: 14, flex: 1},
  monitorStatusRow: {flexDirection: 'row', gap: 4},
  na: {color: 'rgba(255,255,255,0.3)', fontSize: 13},
  ok: {color: '#00ff7f', fontSize: 16},
  fail: {color: '#ff4757', fontSize: 16},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  infoIcon: {fontSize: 16, width: 24},
  infoLabel: {color: 'rgba(255,255,255,0.5)', fontSize: 13, flex: 1},
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  detailedBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  detailedBtnText: {fontSize: 12, fontWeight: '800', letterSpacing: 1},
});
