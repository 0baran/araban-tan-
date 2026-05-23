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
  
  const styles = getStyles(colors);

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
      style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ARAÇ BİLGİSİ</Text>
        <TouchableOpacity onPress={fetchAll} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{marginTop: 60}} />
      ) : (
        <ScrollView contentContainerStyle={{padding: 16}}>
          {/* VIN */}
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>
              KİMLİK NUMARASI (VIN)
            </Text>
            <Text style={styles.vinText}>{vin}</Text>
            <Text style={styles.hint}>
              VIN aracın kimlik numarasıdır. Bağlantı sırasında otomatik okunur.
            </Text>
          </View>

          {/* Monitor Readiness (Emisyon Testi) */}
          {monitorStatus && (
            <>
              {/* Genel Durum Kartı */}
              <View style={styles.glassCard}>
                <Text style={styles.cardLabel}>EMİSYON TESTİ: GENEL DURUM</Text>
                <View style={[styles.summaryBox, {backgroundColor: (monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? 'rgba(0,255,127,0.1)' : 'rgba(255,71,87,0.1)'}]}>
                  <Text style={[styles.summaryText, {color: (monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? '#00bfff' : '#ff4757'}]}>
                    {(monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? '✅ MUAYENEYE HAZIR' : '❌ HAZIR DEĞİL'}
                  </Text>
                  <Text style={styles.summaryDesc}>
                    {(monitorStatus.tests.filter(t => t.available).every(t => t.completed)) ? 'Tüm sensör testleri tamamlandı. Araç egzoz emisyon testinden geçebilir.' : 'Bazı sistem testleri henüz tamamlanmamış. Aracınızı bir süre daha sürmeniz gerekebilir.'}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 15}}>
                  <View style={{alignItems: 'center'}}>
                    <Text style={{color: colors.text, fontSize: 28, fontWeight: '900'}}>{monitorStatus.dtcCount}</Text>
                    <Text style={{fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.textMuted}}>HATA KODU</Text>
                  </View>
                  <View style={{alignItems: 'center'}}>
                    <Text style={{color: monitorStatus.milOn ? '#ff4757' : colors.text, fontSize: 28, fontWeight: '900'}}>{monitorStatus.milOn ? 'AÇIK' : 'KAPALI'}</Text>
                    <Text style={{fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.textMuted}}>MOTOR IŞIĞI</Text>
                  </View>
                </View>
              </View>

              {/* Bileşen Testleri Kartı */}
              <View style={styles.glassCard}>
                <Text style={styles.cardLabel}>BİLEŞEN TESTLERİ (I/M READINESS)</Text>
                {monitorStatus.tests.filter(t => t.available).length === 0 ? (
                  <Text style={[styles.hint, {textAlign: 'center'}]}>Test verisi okunamadı.</Text>
                ) : (
                  monitorStatus.tests.filter(t => t.available).map((test, index) => (
                    <View key={index} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.text, flex: 1}}>{test.name}</Text>
                      <View style={{paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: test.completed ? 'rgba(0,191,255,0.1)' : 'rgba(255,165,0,0.1)'}}>
                        <Text style={{fontSize: 11, fontWeight: '800', letterSpacing: 1, color: test.completed ? colors.accent : '#ffa502'}}>{test.completed ? 'TAMAM' : 'EKSİK'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {/* Connection Info */}
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>
              BAĞLANTI
            </Text>
            <InfoRow icon="📶" label="Protokol" value={obd2Service.protocolLabel} colors={colors} styles={styles} />
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
              colors={colors}
              styles={styles}
            />
            <InfoRow icon="📱" label="Bağlı" value={obd2Service.isConnected ? 'Evet' : 'Hayır'} colors={colors} styles={styles} />
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
  colors,
  styles
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
  styles: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
  },
  backButton: {padding: 8},
  backText: {color: colors.accent, fontSize: 16, fontWeight: '700'},
  title: {color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 1},
  refreshBtn: {padding: 8},
  refreshText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  glassCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  vinText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 10,
    lineHeight: 16,
  },
  summaryBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  summaryDesc: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  infoIcon: {fontSize: 16, width: 24},
  infoLabel: {color: colors.textDim, fontSize: 13, flex: 1},
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
