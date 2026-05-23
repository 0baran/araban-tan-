import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useTheme} from '../services/ThemeContext';
import {obd2Service, MonitorStatus} from '../services/OBD2Service';

interface Props {
  onBack: () => void;
}

export default function IMReadinessScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [data, setData] = useState<MonitorStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    const status = await obd2Service.readMonitorStatus();
    setData(status);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const availableTests = data?.tests.filter(t => t.available) || [];
  const allPassed =
    availableTests.length > 0 && availableTests.every(t => t.completed);

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>EMİSYON TESTİ</Text>
        <TouchableOpacity onPress={fetchStatus} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          color="#00bfff"
          style={{marginTop: 60}}
          size="large"
        />
      ) : (
        <ScrollView contentContainerStyle={{paddingBottom: 20}}>
          {/* Ozet Kartı */}
          <View
            style={[
              styles.glassCard,
              {backgroundColor: colors.card, borderColor: colors.cardBorder},
            ]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>
              GENEL DURUM
            </Text>
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: allPassed
                    ? 'rgba(0,255,127,0.1)'
                    : 'rgba(255,71,87,0.1)',
                },
              ]}>
              <Text
                style={[
                  styles.summaryText,
                  {color: allPassed ? '#00ff7f' : '#ff4757'},
                ]}>
                {allPassed ? '✅ MUAYENEYE HAZIR' : '❌ HAZIR DEĞİL'}
              </Text>
              <Text style={[styles.summaryDesc, {color: colors.textDim}]}>
                {allPassed
                  ? 'Tüm sensör testleri tamamlandı. Araç egzoz emisyon testinden geçebilir.'
                  : 'Bazı sistem testleri henüz tamamlanmamış. Aracınızı bir süre daha sürmeniz gerekebilir.'}
              </Text>
            </View>

            <View style={styles.dtcRow}>
              <View style={styles.dtcItem}>
                <Text style={styles.dtcValue}>{data?.dtcCount || 0}</Text>
                <Text style={[styles.dtcLabel, {color: colors.textMuted}]}>
                  HATA KODU
                </Text>
              </View>
              <View style={styles.dtcItem}>
                <Text
                  style={[
                    styles.dtcValue,
                    {color: data?.milOn ? '#ff4757' : '#00ff7f'},
                  ]}>
                  {data?.milOn ? 'AÇIK' : 'KAPALI'}
                </Text>
                <Text style={[styles.dtcLabel, {color: colors.textMuted}]}>
                  MOTOR IŞIĞI
                </Text>
              </View>
            </View>
          </View>

          {/* Test Listesi */}
          <View
            style={[
              styles.glassCard,
              {backgroundColor: colors.card, borderColor: colors.cardBorder},
            ]}>
            <Text style={[styles.cardLabel, {color: colors.textMuted}]}>
              BİLEŞEN TESTLERİ (I/M READINESS)
            </Text>
            {availableTests.length === 0 ? (
              <Text style={[styles.emptyText, {color: colors.textMuted}]}>
                Test verisi okunamadı.
              </Text>
            ) : (
              availableTests.map((test, index) => (
                <View
                  key={index}
                  style={[
                    styles.testRow,
                    {borderBottomColor: colors.cardBorder},
                  ]}>
                  <Text style={[styles.testName, {color: colors.text}]}>
                    {test.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: test.completed
                          ? 'rgba(0,255,127,0.1)'
                          : 'rgba(255,165,0,0.1)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: test.completed ? '#00ff7f' : '#ffa502'},
                      ]}>
                      {test.completed ? 'TAMAM' : 'EKSİK'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  summaryBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  summaryDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  dtcRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dtcItem: {
    alignItems: 'center',
  },
  dtcValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  dtcLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    marginVertical: 12,
  },
});
