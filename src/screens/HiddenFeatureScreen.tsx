import { SafeAreaView } from 'react-native-safe-area-context';
import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import {obd2Service} from '../services/OBD2Service';
import {useTheme} from '../services/ThemeContext';
import {
  detectManufacturer, getFeaturesForManufacturer, MANUFACTURER_NAMES,
  getManufacturerIcon, getAllManufacturers,
  type Manufacturer, type HiddenFeature,
} from '../services/HiddenFeatures';

interface Props {
  onBack: () => void;
}

export default function HiddenFeatureScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [vin, setVin] = useState('');
  const [manufacturer, setManufacturer] = useState<Manufacturer>('unknown');
  const [features, setFeatures] = useState<HiddenFeature[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [readResults, setReadResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [vinLoading, setVinLoading] = useState(false);
  const [customHeader, setCustomHeader] = useState('7E0');
  const [customCmd, setCustomCmd] = useState('');

  useEffect(() => {
    loadVIN();
  }, []);

  const loadVIN = async () => {
    setVinLoading(true);
    const v = obd2Service.vin;
    if (v) {
      setVin(v); const m = detectManufacturer(v);
      setManufacturer(m); setFeatures(getFeaturesForManufacturer(m));
    } else {
      const r = await obd2Service.readVIN();
      if (r) {
        setVin(r); const m = detectManufacturer(r);
        setManufacturer(m); setFeatures(getFeaturesForManufacturer(m));
      }
    }
    setVinLoading(false);
  };

  const selectManufacturer = (m: Manufacturer) => {
    setManufacturer(m);
    setFeatures(getFeaturesForManufacturer(m));
  };

  const readFeature = useCallback(async (f: HiddenFeature) => {
    setLoading(prev => ({...prev, [f.id]: true}));
    setReadResults(prev => ({...prev, [f.id]: 'Okunuyor...'}));
    const resp = await obd2Service.readFeature(f);
    setReadResults(prev => ({...prev, [f.id]: resp || '(boş)'}));
    setLoading(prev => ({...prev, [f.id]: false}));
  }, []);

  const toggleFeature = useCallback(async (f: HiddenFeature, turnOn: boolean) => {
    setLoading(prev => ({...prev, [f.id]: true}));
    const resp = await obd2Service.writeFeature(f, turnOn);
    setReadResults(prev => ({...prev, [f.id]: resp || '(boş)'}));
    setLoading(prev => ({...prev, [f.id]: false}));
    Alert.alert(
      turnOn ? 'Aktif' : 'Devre Dışı',
      `${f.name} ${turnOn ? 'açıldı' : 'kapatıldı'}. Yanıt: ${resp || '(boş)'}. Değişiklik için kontağı kapatıp açın.`,
    );
  }, []);

  const sendCustomCommand = async () => {
    if (!customCmd.trim()) { Alert.alert('Hata', 'Komut girin'); return; }
    setLoading(prev => ({...prev, _custom: true}));
    setReadResults(prev => ({...prev, _custom: 'Gönderiliyor...'}));
    await obd2Service.sendCustomCommand(`ATSH${customHeader}`);
    const resp = await obd2Service.sendCustomCommand(customCmd.trim());
    setReadResults(prev => ({...prev, _custom: resp || '(boş)'}));
    setLoading(prev => ({...prev, _custom: false}));
  };

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({...prev, [key]: !prev[key]}));

  const grouped: Record<string, HiddenFeature[]> = {};
  for (const f of features) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  const allMfrs = getAllManufacturers();

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>GİZLİ ÖZELLİKLER</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 60}}>
        <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
          <Text style={styles.cardIcon}>{getManufacturerIcon(manufacturer)}</Text>
          <Text style={[styles.cardTitle, {color: colors.text}]}>
            {vinLoading ? 'VIN Okunuyor...' : vin ? MANUFACTURER_NAMES[manufacturer] : 'Araç Bağlı Değil'}
          </Text>
          {vin ? <Text style={styles.vinText}>VIN: {vin}</Text> : null}
          {vinLoading && <ActivityIndicator color="#00bfff" />}
          {!vin && !vinLoading && (
            <TouchableOpacity style={styles.vinBtn} onPress={loadVIN}><Text style={styles.vinBtnText}>VIN OKU</Text></TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>Marka Seç</Text>
          <View style={styles.mfrRow}>
            {allMfrs.map(m => (
              <TouchableOpacity key={m} style={[styles.mfrBtn, manufacturer === m && styles.mfrBtnActive]}
                onPress={() => selectManufacturer(m)}>
                <Text style={styles.mfrBtnLabel}>
                  {getManufacturerIcon(m)}
                </Text>
                <Text style={[styles.mfrBtnText, manufacturer === m && styles.mfrBtnTextActive]}>
                  {MANUFACTURER_NAMES[m].split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {features.length === 0 && (
          <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <Text style={[styles.cardDesc, {color: colors.textDim}]}>Seçilen marka için henüz özellik tanımlanmamış. Aşağıdan özel komut gönderebilirsiniz.</Text>
          </View>
        )}

        {Object.entries(grouped).map(([category, catFeatures]) => (
          <View key={category} style={styles.featureGroup}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => toggleSection(category)}>
              <Text style={[styles.groupTitle, {color: colors.text}]}>{category} ({catFeatures.length})</Text>
              <Text style={[styles.groupArrow, {color: colors.textMuted}]}>{expandedSections[category] ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            {expandedSections[category] && catFeatures.map(f => (
              <View key={f.id} style={styles.featureCard}>
                <Text style={[styles.featureName, {color: colors.text}]}>{f.name}</Text>
                <Text style={[styles.featureDesc, {color: colors.textDim}]}>{f.description}</Text>
                {f.compatibility ? <Text style={styles.compatText}>Uyum: {f.compatibility}</Text> : null}
                {readResults[f.id] ? (
                  <View style={styles.resultBox}>
                    <Text style={styles.resultLabel}>Yanıt:</Text>
                    <Text style={styles.resultText} selectable>{readResults[f.id]}</Text>
                  </View>
                ) : null}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => readFeature(f)} disabled={loading[f.id]}>
                    {loading[f.id] ? <ActivityIndicator size="small" color="#00bfff" /> : <Text style={[styles.actionText, {color: colors.text}]}>OKU</Text>}
                  </TouchableOpacity>
                  {f.writeOn ? (
                    <TouchableOpacity style={[styles.actionBtn, styles.actionOn]} onPress={() => toggleFeature(f, true)} disabled={loading[f.id]}>
                      <Text style={[styles.actionText, {color: '#00ff7f'}]}>AÇ</Text>
                    </TouchableOpacity>
                  ) : null}
                  {f.writeOff ? (
                    <TouchableOpacity style={[styles.actionBtn, styles.actionOff]} onPress={() => toggleFeature(f, false)} disabled={loading[f.id]}>
                      <Text style={[styles.actionText, {color: '#ff4757'}]}>KAPAT</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder, marginTop: 10}]}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>Özel UDS Komutu</Text>
          <Text style={[styles.cardDesc, {color: colors.textDim}]}>CAN ID ve hex komut girerek kendi kodlamanızı gönderin</Text>
          <View style={styles.customRow}>
            <View style={styles.headerInputGroup}>
              <Text style={[styles.inputLabel, {color: colors.textDim}]}>CAN ID</Text>
              <TextInput style={[styles.customInput, {color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.cardBorder}]} value={customHeader} onChangeText={setCustomHeader} placeholder="7E0" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.cmdInputGroup}>
              <Text style={[styles.inputLabel, {color: colors.textDim}]}>Komut (Hex)</Text>
              <TextInput style={[styles.customInput, {color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.cardBorder}]} value={customCmd} onChangeText={setCustomCmd} placeholder="22F00C" placeholderTextColor={colors.textMuted} />
            </View>
          </View>
          <TouchableOpacity style={[styles.actionBtn, {alignSelf: 'center', marginTop: 10}]} onPress={sendCustomCommand} disabled={loading._custom}>
            {loading._custom ? <ActivityIndicator size="small" color="#00bfff" /> : <Text style={[styles.actionText, {color: colors.text}]}>GÖNDER</Text>}
          </TouchableOpacity>
          {readResults._custom ? (
            <View style={[styles.resultBox, {marginTop: 10}]}>
              <Text style={styles.resultLabel}>Yanıt:</Text>
              <Text style={styles.resultText} selectable>{readResults._custom}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={[styles.infoTitle, {color: colors.text}]}>Uyarı</Text>
          <Text style={[styles.infoText, {color: colors.textDim}]}>
            Kodlama işlemleri ELM327 üzerinden UDS komutları gönderir.{'\n\n'}
            • ELM327 aracın CAN/UDS protokolünü desteklemelidir{'\n'}
            • Her araç/ECU tüm komutları desteklemeyebilir{'\n'}
            • BMW/Mercedes/Opel/PSA/Fiat/Toyota/Hyundai özellikleri deneyseldir{'\n'}
            • Değişikliklerin etkili olması için kontağı kapatıp açın{'\n'}
            • Yanlış kodlama araca zarar verebilir, dikkatli olun
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0b10'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40},
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  card: {backgroundColor: 'rgba(30,33,40,0.7)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20, alignItems: 'center'},
  cardIcon: {fontSize: 48, marginBottom: 10},
  cardTitle: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textAlign: 'center'},
  cardDesc: {color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 15, lineHeight: 20},
  vinText: {color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace', marginBottom: 5},
  vinBtn: {backgroundColor: 'rgba(0,191,255,0.1)', borderRadius: 15, paddingHorizontal: 25, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(0,191,255,0.3)'},
  vinBtnText: {color: '#00bfff', fontWeight: '700', fontSize: 12, letterSpacing: 1},
  mfrRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center'},
  mfrBtn: {paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', minWidth: 55},
  mfrBtnActive: {backgroundColor: 'rgba(0,191,255,0.15)', borderColor: '#00bfff'},
  mfrBtnLabel: {fontSize: 18},
  mfrBtnText: {color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 10, marginTop: 2},
  mfrBtnTextActive: {color: '#00bfff'},
  featureGroup: {marginBottom: 15},
  groupHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30,33,40,0.8)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  groupTitle: {color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1},
  groupArrow: {color: 'rgba(255,255,255,0.3)', fontSize: 14},
  featureCard: {backgroundColor: 'rgba(20,23,30,0.6)', borderRadius: 14, padding: 16, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', marginHorizontal: 5},
  featureName: {color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6},
  featureDesc: {color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 17, marginBottom: 6},
  compatText: {color: 'rgba(255,255,255,0.2)', fontSize: 10, marginBottom: 10},
  resultBox: {backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 10, marginBottom: 10, width: '100%'},
  resultLabel: {color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 4},
  resultText: {color: '#00ff7f', fontSize: 11, fontFamily: 'monospace', lineHeight: 16},
  actions: {flexDirection: 'row', gap: 8},
  actionBtn: {backgroundColor: 'rgba(0,191,255,0.1)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(0,191,255,0.25)', minWidth: 60, alignItems: 'center'},
  actionOn: {backgroundColor: 'rgba(0,255,127,0.08)', borderColor: 'rgba(0,255,127,0.2)'},
  actionOff: {backgroundColor: 'rgba(255,71,87,0.08)', borderColor: 'rgba(255,71,87,0.2)'},
  actionText: {color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1},
  customRow: {flexDirection: 'row', gap: 10, width: '100%'},
  headerInputGroup: {flex: 1},
  cmdInputGroup: {flex: 2},
  inputLabel: {color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6, fontWeight: '600'},
  customInput: {backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontFamily: 'monospace', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  infoCard: {backgroundColor: 'rgba(255,165,0,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,165,0,0.2)', marginTop: 10},
  infoTitle: {color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10},
  infoText: {color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 19},
});
