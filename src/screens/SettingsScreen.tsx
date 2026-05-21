import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Switch, TextInput, ActivityIndicator,
} from 'react-native';
import {obd2Service, OBD2_PROTOCOLS} from '../services/OBD2Service';
import {loadSettings, saveSettings, getSettings} from '../services/AppSettings';
import {useTheme} from '../services/ThemeContext';
import {checkForUpdate, promptUpdate} from '../services/UpdateService';
import {dataLogService} from '../services/DataLogService';
const APP_VERSION = require('../../version.json').version as string;

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({onBack}: Props) {
  const {darkMode, toggleTheme, colors} = useTheme();
  const [protocolLabel, setProtocolLabel] = useState(obd2Service.protocolLabel);
  const [speedWarnOn, setSpeedWarnOn] = useState(false);
  const [speedWarnVal, setSpeedWarnVal] = useState('130');
  const [coolantWarnOn, setCoolantWarnOn] = useState(false);
  const [coolantWarnVal, setCoolantWarnVal] = useState('100');
  const [fuelPrice, setFuelPrice] = useState('0');
  const [autoRecord, setAutoRecord] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{protocol: string; label: string; success: boolean}[] | null>(null);
  const [settingProto, setSettingProto] = useState(false);

  useEffect(() => {
    setProtocolLabel(obd2Service.protocolLabel);
    loadSettings().then(s => {
      setSpeedWarnOn(s.speedWarningEnabled);
      setSpeedWarnVal(String(s.speedWarningThreshold));
      setCoolantWarnOn(s.coolantWarningEnabled);
      setCoolantWarnVal(String(s.coolantWarningThreshold));
      setFuelPrice(String(s.fuelPricePerLiter || 0));
      setAutoRecord(s.autoRecord || false);
    });
  }, []);

  const toggleSpeedWarn = (v: boolean) => {
    setSpeedWarnOn(v);
    saveSettings({speedWarningEnabled: v});
  };

  const setSpeedThresh = (t: string) => {
    setSpeedWarnVal(t);
    const n = parseInt(t, 10);
    if (!isNaN(n) && n > 0) saveSettings({speedWarningThreshold: n});
  };

  const toggleCoolantWarn = (v: boolean) => {
    setCoolantWarnOn(v);
    saveSettings({coolantWarningEnabled: v});
  };

  const setCoolantThresh = (t: string) => {
    setCoolantWarnVal(t);
    const n = parseInt(t, 10);
    if (!isNaN(n) && n > 0) saveSettings({coolantWarningThreshold: n});
  };

  const toggleAutoRecord = (v: boolean) => {
    setAutoRecord(v);
    saveSettings({autoRecord: v});
  };

  const setFuelPriceVal = (t: string) => {
    setFuelPrice(t);
    const n = parseFloat(t);
    if (!isNaN(n) && n > 0) saveSettings({fuelPricePerLiter: n});
  };

  const handleSimulation = () => {
    if (!obd2Service.isConnected) {
      obd2Service.startSimulation();
      Alert.alert('Simülasyon', 'Simülasyon modu başlatıldı.');
    } else {
      Alert.alert('Uyarı', 'Simülasyon başlatmak için önce bağlantıyı kesin.');
    }
  };

  const startScan = async () => {
    if (!obd2Service.isConnected) {
      Alert.alert('Uyarı', 'Önce araca bağlanın.');
      return;
    }
    setScanning(true);
    setScanResults(null);
    const results = await obd2Service.scanAllProtocols();
    setScanResults(results);
    setScanning(false);
    setProtocolLabel(obd2Service.protocolLabel);
  };

  const changeProtocol = async (val: string) => {
    setSettingProto(true);
    await obd2Service.setProtocol(val);
    setSettingProto(false);
    setProtocolLabel(obd2Service.protocolLabel);
    Alert.alert('Protokol Değiştirildi', `Yeni protokol: ${obd2Service.protocolLabel}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AYARLAR</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UYARILAR</Text>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>🚀</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Hız Uyarısı</Text>
              <Text style={styles.rowDesc}>Belirtilen hız aşılınca ana ekranda uyar</Text>
            </View>
            <Switch value={speedWarnOn} onValueChange={toggleSpeedWarn} trackColor={{false: 'rgba(255,255,255,0.1)', true: 'rgba(0,191,255,0.4)'}} thumbColor={speedWarnOn ? '#00bfff' : '#666'} />
          </View>
          {speedWarnOn && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Eşik</Text>
              <TextInput style={styles.settingInput} value={speedWarnVal} onChangeText={setSpeedThresh} keyboardType="number-pad" placeholderTextColor="rgba(255,255,255,0.3)" />
              <Text style={styles.settingUnit}>KM/H</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowIcon}>🌡️</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Hararet Uyarısı</Text>
              <Text style={styles.rowDesc}>Motor sıcaklığı eşiği aşılınca uyar</Text>
            </View>
            <Switch value={coolantWarnOn} onValueChange={toggleCoolantWarn} trackColor={{false: 'rgba(255,255,255,0.1)', true: 'rgba(255,71,87,0.4)'}} thumbColor={coolantWarnOn ? '#ff4757' : '#666'} />
          </View>
          {coolantWarnOn && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Eşik</Text>
              <TextInput style={styles.settingInput} value={coolantWarnVal} onChangeText={setCoolantThresh} keyboardType="number-pad" placeholderTextColor="rgba(255,255,255,0.3)" />
              <Text style={styles.settingUnit}>°C</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GÖRÜNÜM</Text>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>{darkMode ? '🌙' : '☀️'}</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Koyu Tema</Text>
              <Text style={styles.rowDesc}>{darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}</Text>
            </View>
            <Switch value={darkMode} onValueChange={toggleTheme} trackColor={{false: 'rgba(255,255,255,0.1)', true: 'rgba(0,191,255,0.4)'}} thumbColor={darkMode ? '#00bfff' : '#666'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YAKIT</Text>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>⛽</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Yakıt Fiyatı</Text>
              <Text style={styles.rowDesc}>Litresi TL olarak girin</Text>
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Fiyat</Text>
            <TextInput style={styles.settingInput} value={fuelPrice} onChangeText={setFuelPriceVal} keyboardType="decimal-pad" placeholderTextColor="rgba(255,255,255,0.3)" />
            <Text style={styles.settingUnit}>₺/L</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VERİ KAYDI</Text>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>⏺</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Otomatik Kayıt</Text>
              <Text style={styles.rowDesc}>OBD2 bağlanınca otomatik veri kaydı başlasın</Text>
            </View>
            <Switch value={autoRecord} onValueChange={toggleAutoRecord} trackColor={{false: 'rgba(255,255,255,0.1)', true: 'rgba(0,191,255,0.4)'}} thumbColor={autoRecord ? '#00bfff' : '#666'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BAĞLANTI</Text>
          <TouchableOpacity style={styles.row} onPress={handleSimulation}>
            <Text style={styles.rowIcon}>🎮</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Simülasyon Modu</Text>
              <Text style={styles.rowDesc}>Gerçek cihaz olmadan test et</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>📶</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Mevcut Protokol</Text>
              <Text style={styles.rowDesc}>{protocolLabel}</Text>
            </View>
            {settingProto && <ActivityIndicator size="small" color="#00bfff" />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROTOKOL TARA</Text>
          <Text style={styles.sectionDesc}>Tüm protokolleri sırayla dene ve çalışanı bul. Bu işlem 10-30 saniye sürebilir.</Text>
          <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning}>
            {scanning ? <ActivityIndicator size="small" color="#00bfff" /> : <Text style={styles.scanBtnText}>🔍 PROTOKOLLERİ TARA</Text>}
          </TouchableOpacity>
          {scanResults && scanResults.length > 0 && (
            <View style={styles.scanResults}>
              {scanResults.map(r => (
                <View key={r.protocol} style={[styles.scanRow, r.success && styles.scanRowOk]}>
                  <Text style={[styles.scanProto, r.success && {color: '#00ff7f'}]}>{r.success ? '✅' : '❌'} SP{r.protocol}</Text>
                  <Text style={[styles.scanLabel, r.success && {color: '#00ff7f'}]}>{r.label}</Text>
                  {r.success && <Text style={styles.scanMatch}>EŞLEŞTİ</Text>}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROTOKOL SEÇ</Text>
          <Text style={styles.sectionDesc}>Mevcut bağlantının protokolünü manuel değiştir. Otomatik algılama çalışmazsa kullan.</Text>
          {OBD2_PROTOCOLS.map(p => (
            <TouchableOpacity key={p.value} style={styles.protoRow} onPress={() => changeProtocol(p.value)}>
              <Text style={styles.protoBadge}>SP{p.value}</Text>
              <Text style={styles.protoLabel}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GÜNCELLEME</Text>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>ℹ️</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Sürüm</Text>
              <Text style={styles.rowDesc}>v{APP_VERSION}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.row} onPress={async () => {
            const ac = new AbortController();
            setTimeout(() => ac.abort(), 20000);
            const result = await checkForUpdate(APP_VERSION, ac.signal);
            if (result.found) promptUpdate(result.info);
            else if (result.reason === 'network') Alert.alert('Hata', 'Güncelleme kontrol edilemedi. İnternet bağlantınızı kontrol edin.');
            else Alert.alert('Güncel', 'En son sürüm kullanılıyor.');
          }}>
            <Text style={styles.rowIcon}>📥</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Güncelleme Kontrolü</Text>
              <Text style={styles.rowDesc}>GitHub üzerinden yeni sürümü denetle</Text>
            </View>
          </TouchableOpacity>
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
  section: {marginBottom: 25},
  sectionTitle: {color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4},
  sectionDesc: {color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 18, marginBottom: 12, marginHorizontal: 4},
  row: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,33,40,0.7)', borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  rowIcon: {fontSize: 22, marginRight: 14},
  rowContent: {flex: 1},
  rowLabel: {color: '#fff', fontSize: 15, fontWeight: '600'},
  rowDesc: {color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2},
  settingRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,23,30,0.6)', borderRadius: 12, padding: 12, marginTop: -4, marginBottom: 8, marginLeft: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)'},
  settingLabel: {color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600', marginRight: 10},
  settingInput: {backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 8, color: '#fff', fontSize: 16, fontWeight: '800', width: 70, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  settingUnit: {color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700', marginLeft: 8},
  scanBtn: {backgroundColor: 'rgba(0,191,255,0.12)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,191,255,0.3)', marginBottom: 12},
  scanBtnText: {color: '#00bfff', fontWeight: '800', fontSize: 14, letterSpacing: 1},
  scanResults: {backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  scanRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)'},
  scanRowOk: {backgroundColor: 'rgba(0,255,127,0.05)', borderRadius: 8},
  scanProto: {color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', fontFamily: 'monospace', width: 45},
  scanLabel: {color: 'rgba(255,255,255,0.5)', fontSize: 11, flex: 1},
  scanMatch: {color: '#00ff7f', fontSize: 9, fontWeight: '800', letterSpacing: 1},
  protoRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)'},
  protoBadge: {color: '#00bfff', fontSize: 11, fontWeight: '800', fontFamily: 'monospace', width: 40, letterSpacing: 1},
  protoLabel: {color: 'rgba(255,255,255,0.6)', fontSize: 13, flex: 1},
});
