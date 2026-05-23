import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, ActivityIndicator, FlatList, Platform, Alert, PermissionsAndroid,
  TextInput, BackHandler, AppState, StatusBar, Permission,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  obd2Service, OBD2Data, ConnectionState,
} from './src/services/OBD2Service';
import {loadSettings, getSettings} from './src/services/AppSettings';
import {dataLogService} from './src/services/DataLogService';
import {initLogCapture} from './src/services/AppLog';
import ErrorCodesScreen from './src/screens/ErrorCodesScreen';
import LiveDataScreen from './src/screens/LiveDataScreen';
import HiddenFeatureScreen from './src/screens/HiddenFeatureScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PerformanceScreen from './src/screens/PerformanceScreen';
import FreezeFrameScreen from './src/screens/FreezeFrameScreen';
import VehicleInfoScreen from './src/screens/VehicleInfoScreen';
import DataLogScreen from './src/screens/DataLogScreen';
import LogScreen from './src/screens/LogScreen';
import ChangelogScreen from './src/screens/ChangelogScreen';
import VehiclesScreen from './src/screens/VehiclesScreen';
import TripSummaryScreen from './src/screens/TripSummaryScreen';
import {ThemeProvider, useTheme} from './src/services/ThemeContext';
import {checkForUpdate, promptUpdate, downloadActive, downloadProgress, onDownloadProgress} from './src/services/UpdateService';
import {setupUpdateChannel, handleNotificationPress} from './src/services/UpdateNotifications';
import KeepAwake from 'react-native-keep-awake';

const APP_VERSION = '3.1.6.20260523.1752';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, errorMsg: string}> {
  state = {hasError: false, errorMsg: ''};
  static getDerivedStateFromError(error: Error) { return {hasError: true, errorMsg: error.message || String(error)}; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{flex:1, backgroundColor:'#0a0b10', alignItems:'center', justifyContent:'center', padding:20}}>
          <Text style={{color:'#FFD700', fontSize:18, fontWeight:'bold', textAlign:'center'}}>Beklenmeyen Hata</Text>
          <Text style={{color:'#aaa', fontSize:14, marginTop:10, textAlign:'center'}}>Hata Detayı:</Text>
          <Text style={{color:'#ff4757', fontSize:12, marginTop:5, textAlign:'center', fontFamily:'monospace'}}>{this.state.errorMsg}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <MainScreen />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function MainScreen() {
  useEffect(() => {
    KeepAwake.activate();
    return () => KeepAwake.deactivate();
  }, []);
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [coolant, setCoolant] = useState(0);
  const [maf, setMaf] = useState(0);
  const [hp, setHp] = useState(0);
  const [map, setMap] = useState(0);
  const [batteryVoltage, setBatteryVoltage] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [statusText, setStatusText] = useState('Bağlantı Bekleniyor...');
  const [_connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  const [connTab, setConnTab] = useState<'bluetooth' | 'wifi' | 'usb'>('bluetooth');
  const [wifiIP, setWifiIP] = useState('192.168.0.10');
  const [wifiPort, setWifiPort] = useState('35000');
  const [protocolLabel, setProtocolLabel] = useState('Otomatik');
  const [speedWarnActive, setSpeedWarnActive] = useState(false);
  const [coolantWarnActive, setCoolantWarnActive] = useState(false);
  const [dtcCount, setDtcCount] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [showDownloadBar, setShowDownloadBar] = useState(false);
  const autoConnectDone = useRef(false);
  const {colors, darkMode} = useTheme();

  useEffect(() => {
    initLogCapture();
    loadSettings();
    let lastUiUpdate = 0;
    obd2Service.onDataUpdate((data: OBD2Data) => {
      const now = Date.now();
      if (now - lastUiUpdate > 250) {
        lastUiUpdate = now;
        const s = getSettings();
        setSpeedWarnActive(s.speedWarningEnabled && data.speed >= s.speedWarningThreshold);
        setCoolantWarnActive(s.coolantWarningEnabled && data.coolantTemp >= s.coolantWarningThreshold);
        setRpm(data.rpm);
        setSpeed(data.speed);
        setCoolant(data.coolantTemp);
        setMaf(data.maf);
        setHp(Math.round((data.maf / 0.73) * 1.15));
        setMap(data.map);
        setBatteryVoltage(data.batteryVoltage);
        setDtcCount(data.dtcCount);
      }
    });

    obd2Service.onConnectionUpdate((state: ConnectionState, message?: string) => {
      setConnectionState(state);
      if (message) setStatusText(message);
      if (state === 'connected') {
        setIsConnected(true);
        setProtocolLabel(obd2Service.protocolLabel);
        readDtcOnConnect();
        if (getSettings().autoRecord && !dataLogService.isRecording) {
          dataLogService.setFuelPrice(getSettings().fuelPricePerLiter);
          dataLogService.start();
        }
      }
      if (state === 'disconnected') {
        setIsConnected(false);
        setStatusText('Bağlantı Kesildi.');
        setDtcCount(0);
        if (dataLogService.isRecording) dataLogService.stop();
      }
      if (state === 'error') setStatusText('Bağlantı Hatası!');
    });

    setupUpdateChannel().catch(() => {});
    handleNotificationPress();

    if (!autoConnectDone.current) {
      autoConnectDone.current = true;
      requestPermissions().then(() => {
        obd2Service.autoConnect().then(ok => {
          if (ok) setStatusText('Otomatik bağlanıldı');
        });
      });
      setUpdateStatus('Güncelleme kontrol ediliyor...');
      const ac = new AbortController();
      setTimeout(() => ac.abort(), 20000);
      checkForUpdate(APP_VERSION, ac.signal).then(result => {
        if (result.found) {
          setUpdateStatus('');
          promptUpdate(result.info);
        } else if (result.reason === 'network') {
          setUpdateStatus('Güncelleme kontrol edilemedi');
          setTimeout(() => setUpdateStatus(''), 3000);
        } else {
          setUpdateStatus('En son sürüm kullanılıyor');
          setTimeout(() => setUpdateStatus(''), 3000);
        }
      });
    }

    // Otomatik DTC kontrolü (her 30sn)
    let dtcInterval: ReturnType<typeof setInterval> | null = setInterval(async () => {
      if (obd2Service.isConnected) {
        const status = await obd2Service.readMonitorStatus();
        setDtcCount(status.dtcCount);
      }
    }, 30000);

    // Arka planda pil tasarrufu kaldirildi (Foreground Service ile arka planda calismaya devam edecek)

    return () => {
      obd2Service.disconnect();
      if (dtcInterval) clearInterval(dtcInterval);
    };
  }, []);

  useEffect(() => {
    const onBack = () => {
      if (currentScreen) { setCurrentScreen(null); return true; }
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
  }, [currentScreen]);

  useEffect(() => {
    const unsub = onDownloadProgress((pct: number) => {
      setDownloadPercent(pct);
      if (pct > 0 && pct < 100) {
        setShowDownloadBar(true);
      } else {
        setShowDownloadBar(false);
      }
    });
    return unsub;
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const perms: Permission[] = [];
      const apiLevel = Platform.Version;
      if (typeof apiLevel === 'number' && apiLevel >= 31) {
        perms.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
      }
      if (typeof apiLevel !== 'number' || apiLevel < 31) {
        perms.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
      try {
        if (perms.length > 0) await PermissionsAndroid.requestMultiple(perms);
      } catch (err) { console.warn(err); }
      if (typeof apiLevel === 'number' && apiLevel >= 33) {
        try {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        } catch (_) {}
      }
    }
  };

  const handleConnectPress = async () => {
    if (!isConnected) {
      await requestPermissions();
      setModalVisible(true);
      if (connTab === 'bluetooth') startScan();
    } else {
      obd2Service.disconnect();
      setIsConnected(false);
      setStatusText('Bağlantı Kesildi.');
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setDevices([]);
    setStatusText('Cihazlar taranıyor...');
    try {
      const btOn = await obd2Service.isBluetoothEnabled();
      if (!btOn) {
        console.log('Bluetooth is OFF, requesting enable...');
        const enabled = await obd2Service.requestBluetoothEnabled();
        if (!enabled) {
          Alert.alert('Bluetooth Kapalı', 'Lütfen Bluetooth\'u açın ve tekrar deneyin.');
          setIsScanning(false);
          setStatusText('Bağlantı Bekleniyor...');
          return;
        }
      }

      let discovered: any[] = [];
      try {
        const result = await obd2Service.startDiscovery();
        console.log('Discovery result:', result?.length, 'devices');
        if (result && result.length > 0) {
          discovered = result;
        }
      } catch (discErr) {
        console.warn('Discovery error:', discErr);
        try { await obd2Service.cancelDiscovery(); } catch {}
        // CancelDiscovery sonrası kalan cihazları al
        await new Promise(r => setTimeout(r, 500));
        try {
          const fallback = await obd2Service.startDiscovery();
          if (fallback && fallback.length > 0) discovered = fallback;
        } catch {}
      }

      const paired = await obd2Service.getPairedDevices();
      console.log('Bonded devices:', paired?.length);

      // Adresleri büyük harfe çevirerek karşılaştır
      const addrKey = (d: any) => (d.address || '').trim().toUpperCase();
      const pairedSet = new Set((paired || []).map(addrKey));

      const newDevices = (discovered || []).filter(d => !pairedSet.has(addrKey(d)));
      const discoveredPaired = (discovered || []).filter(d => pairedSet.has(addrKey(d)));
      const newAddrSet = new Set(newDevices.map(addrKey));

      const seen = new Set<string>();
      const merged: any[] = [];
      for (const d of [...newDevices, ...discoveredPaired, ...(paired || [])]) {
        const key = addrKey(d) || d.name || Math.random().toString();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({...d, isNew: newAddrSet.has(addrKey(d))});
        }
      }
      setDevices(merged);
      setStatusText(merged.length > 0 ? `${merged.length} cihaz bulundu` : 'Cihaz bulunamadı');
    } catch (e) { console.error('Scan error:', e); }
    setIsScanning(false);
  };

  const readDtcOnConnect = async () => {
    const status = await obd2Service.readMonitorStatus();
    setDtcCount(status.dtcCount);
    console.log('DTC on connect:', status.dtcCount, 'MIL:', status.milOn);
  };

  const connectToDevice = async (device: any) => {
    if (!device.address) { Alert.alert('Hata', 'Cihaz adresi bulunamadı'); return; }
    setModalVisible(false);
    setStatusText('Bağlanıyor: ' + device.name);
    const success = await obd2Service.connectBluetooth(device.address, device.name);
    if (success) { setIsConnected(true); setStatusText('Bağlandı: ' + device.name); }
    else {
      setStatusText('Bağlantı Hatası!');
      Alert.alert('Bağlantı Hatası', 'Cihaza bağlanılamadı. Cihazın açık ve araç kontağının açık olduğundan emin olun.', [
        {text: 'Kapat', style: 'cancel'},
        {text: 'Bluetooth Ayarları', onPress: () => obd2Service.openBluetoothSettings()},
      ]);
    }
  };

  const connectWiFi = async () => {
    const ip = wifiIP.trim();
    const port = parseInt(wifiPort, 10) || 35000;
    if (!ip) { Alert.alert('Hata', 'Lütfen geçerli bir IP adresi girin.'); return; }
    setModalVisible(false);
    setStatusText(`WiFi bağlanıyor: ${ip}:${port}...`);
    const success = await obd2Service.connectWiFi(ip, port);
    if (success) { setIsConnected(true); setStatusText(`WiFi bağlandı: ${ip}`); }
    else {
      Alert.alert('Hata', 'WiFi ELM327 cihazına bağlanılamadı.');
      setStatusText('WiFi Bağlantı Hatası!');
    }
  };

  const startSimulation = () => {
    setModalVisible(false);
    obd2Service.startSimulation();
    setIsConnected(true);
    setStatusText('Simülasyon Modu Aktif');
  };

  const navigate = (screen: string | null) => setCurrentScreen(screen);

  const screenProps = {onBack: () => navigate(null), onNavigate: navigate};
  const styles = getStyles(colors);

  return (
    <>
      <StatusBar backgroundColor={colors.bg} barStyle={darkMode ? 'light-content' : 'dark-content'} />
      {currentScreen === 'errorcodes' && <ErrorCodesScreen {...screenProps} />}
      {currentScreen === 'livedata' && <LiveDataScreen {...screenProps} />}
      {currentScreen === 'hiddenfeature' && <HiddenFeatureScreen {...screenProps} />}
      {currentScreen === 'settings' && <SettingsScreen {...screenProps} />}
      {currentScreen === 'performance' && <PerformanceScreen {...screenProps} />}
      {currentScreen === 'freezeframe' && <FreezeFrameScreen {...screenProps} />}
      {currentScreen === 'vehicleinfo' && <VehicleInfoScreen {...screenProps} />}
      {currentScreen === 'datalog' && <DataLogScreen {...screenProps} />}
      {currentScreen === 'log' && <LogScreen {...screenProps} />}
      {currentScreen === 'changelog' && <ChangelogScreen {...screenProps} />}
      {currentScreen === 'vehicles' && <VehiclesScreen {...screenProps} />}
      {currentScreen === 'tripsummary' && <TripSummaryScreen {...screenProps} />}

      {!currentScreen && (
        <SafeAreaView edges={['top', 'bottom']} style={[styles.container, {backgroundColor: colors.bg}]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigate('vehicles')}>
                <Text style={[styles.title, {color: colors.text}]}>ARAÇLARIM</Text>
                <Text style={[styles.headerSub, {color: colors.textMuted}]}>OBD2 Diagnostik</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.connectButton, {backgroundColor: colors.card, borderColor: colors.cardBorder}, isConnected && styles.connectButtonActive]} onPress={handleConnectPress}>
                <View style={[styles.statusDot, isConnected && styles.statusDotActive]} />
                <Text style={[styles.connectButtonText, {color: colors.text}]}>{isConnected ? 'BAĞLI' : 'BAĞLAN'}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
              <Text style={[styles.cardLabel, {color: colors.textDim}]}>ARAÇ DURUMU</Text>
              <Text style={[styles.vehicleText, {color: colors.text}, isConnected && styles.textNeonGreen]}>{statusText}</Text>
              {updateStatus ? (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6}}>
                  <ActivityIndicator size="small" color="#00bfff" />
                  <Text style={[styles.protocolText, {color: '#00bfff'}]}>{updateStatus}</Text>
                </View>
              ) : null}
              {isConnected && <Text style={[styles.protocolText, {color: colors.textMuted}]}>Protokol: {protocolLabel}</Text>}
              {!isConnected && !updateStatus && <Text style={[styles.protocolText, {color: colors.textMuted}]}>Bluetooth / WiFi / Simülasyon ile bağlanın.</Text>}
              {isConnected && (
                <View style={styles.vehicleInfoRow}>
                  <Text style={[styles.vehicleInfoItem, {color: colors.textDim}]}>⚡ {batteryVoltage.toFixed(1)}V</Text>
                  <Text style={[styles.vehicleInfoItem, {color: colors.textDim}]}>🌬️ {map} kPa</Text>
                </View>
              )}
            </View>

            <View style={styles.gaugesContainer}>
              <View style={[styles.glassCard, styles.gaugeCard, {backgroundColor: colors.card}]}>
                <Text style={[styles.gaugeLabel, {color: colors.textDim}]}>MOTOR DEVRİ</Text>
                <Text style={[styles.gaugeValue, {color: colors.accent}]}>{rpm}</Text>
                <Text style={[styles.gaugeUnit, {color: colors.textMuted}]}>RPM</Text>
              </View>
              <View style={[styles.glassCard, styles.gaugeCard, {backgroundColor: colors.card}]}>
                <Text style={[styles.gaugeLabel, {color: colors.textDim}]}>HIZ</Text>
                <Text style={[styles.gaugeValue, {color: speedWarnActive ? '#ff4757' : '#2ed573'}]}>{speed}</Text>
                <Text style={[styles.gaugeUnit, {color: colors.textMuted}]}>KM/H</Text>
              </View>
            </View>

            <View style={styles.featuresGrid}>
              <View style={[styles.glassCard, styles.featureCard, {backgroundColor: coolantWarnActive ? 'rgba(255,71,87,0.12)' : colors.card, borderColor: coolantWarnActive ? '#ff4757' : colors.cardBorder}]}>
                <Text style={[styles.featureIcon, {color: coolantWarnActive ? '#ff4757' : colors.accent}]}>🌡️</Text>
                <Text style={[styles.featureValue, {color: coolantWarnActive ? '#ff4757' : colors.text}]}>{coolant}°C</Text>
                <Text style={[styles.featureLabel, {color: colors.textDim}]}>SOĞUTMA SIVISI</Text>
              </View>
              <TouchableOpacity style={[styles.glassCard, styles.featureCard, {backgroundColor: colors.card}]} onPress={() => navigate('errorcodes')}>
                <Text style={[styles.featureIcon, dtcCount > 0 && {color: '#ff4757'}]}>⚠️</Text>
                {dtcCount > 0 && <View style={styles.dtcBadge}><Text style={styles.dtcBadgeText}>{dtcCount}</Text></View>}
                <Text style={[styles.featureLabel, {color: colors.textDim}]}>HATA KODLARI</Text>
                <Text style={[styles.featureHint, {color: colors.textMuted}]}>DTC Tara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.glassCard, styles.featureCard, {backgroundColor: colors.card}]} onPress={() => navigate('performance')}>
                <Text style={styles.featureIcon}>🏁</Text>
                <Text style={[styles.featureValue, {fontSize: 22, color: colors.text}]}>{hp} BG</Text>
                <Text style={[styles.featureLabel, {color: colors.textDim}]}>PERFORMANS</Text>
                <Text style={[styles.featureHint, {color: colors.textMuted}]}>0-100 Testi & HP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.glassCard, styles.featureCard, {backgroundColor: colors.card}]} onPress={() => navigate('vehicleinfo')}>
                <Text style={styles.featureIcon}>🚗</Text>
                <Text style={[styles.featureValue, {fontSize: 20, color: colors.text}]}>BİLGİ</Text>
                <Text style={[styles.featureLabel, {color: colors.textDim}]}>ARAÇ BİLGİSİ</Text>
                <Text style={[styles.featureHint, {color: colors.textMuted}]}>VIN / Mode 09</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.glassCard, styles.featureCard, {backgroundColor: colors.card}]} onPress={() => navigate('freezeframe')}>
                <Text style={styles.featureIcon}>❄️</Text>
                <Text style={[styles.featureLabel, {color: colors.textDim}]}>DONMA NOKTASI</Text>
                <Text style={[styles.featureHint, {color: colors.textMuted}]}>Hata Anı Sensörler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.glassCard, styles.featureCard, {backgroundColor: colors.card}]} onPress={() => navigate('datalog')}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={[styles.featureLabel, {color: colors.textDim}]}>YOL BİLGİSAYARI</Text>
                <Text style={[styles.featureHint, {color: colors.textMuted}]}>Veri Kaydı & Tüketim</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.glassCard, styles.featureCard, {backgroundColor: colors.card}]} onPress={() => navigate('hiddenfeature')}>
                <Text style={styles.featureIcon}>🔧</Text>
                <Text style={[styles.featureLabel, {color: colors.textDim}]}>GİZLİ ÖZELLİK</Text>
                <Text style={[styles.featureHint, {color: colors.textMuted}]}>Kodlama</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.glassCard, styles.featureCard, {backgroundColor: colors.card}]} onPress={() => navigate('settings')}>
                <Text style={styles.featureIcon}>⚙️</Text>
                <Text style={styles.featureLabel}>AYARLAR</Text>
                <Text style={styles.featureHint}>Tercihler</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.quickAction, {backgroundColor: colors.card, borderColor: colors.cardBorder}]} onPress={() => navigate('livedata')}>
                <Text style={styles.quickActionIcon}>📊</Text>
                <Text style={[styles.quickActionText, {color: colors.text}]}>CANLI VERİ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, {backgroundColor: colors.card, borderColor: colors.cardBorder}]} onPress={handleConnectPress}>
                <Text style={styles.quickActionIcon}>{isConnected ? '🔌' : '📡'}</Text>
                <Text style={[styles.quickActionText, {color: colors.text}]}>{isConnected ? 'BAĞLANTIYI KES' : 'BAĞLAN'}</Text>
              </TouchableOpacity>
            </View>

            {/* DEBUG */}
            <View style={[styles.quickActions, {marginTop: 6}]}>
              <TouchableOpacity style={[styles.quickAction, {backgroundColor: colors.card, borderColor: colors.cardBorder}]} onPress={() => navigate('tripsummary')}>
                <Text style={styles.quickActionIcon}>📋</Text>
                <Text style={[styles.quickActionText, {color: colors.text}]}>TRIP ÖZETI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, {backgroundColor: colors.card, borderColor: colors.cardBorder}]} onPress={() => navigate('log')}>
                <Text style={styles.quickActionIcon}>📋</Text>
                <Text style={[styles.quickActionText, {color: colors.text}]}>HATA LOG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, {backgroundColor: colors.card, borderColor: colors.cardBorder}]} onPress={() => navigate('changelog')}>
                <Text style={styles.quickActionIcon}>📝</Text>
                <Text style={[styles.quickActionText, {color: colors.text}]}>SÜRÜM NOTLARI</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

          <Modal visible={isModalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, {backgroundColor: colors.bg}]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, {color: colors.text}]}>BAĞLANTI</Text>
                  {isScanning ? <ActivityIndicator color={colors.accent} /> : null}
                </View>

                <View style={styles.tabRow}>
                  <TouchableOpacity style={[styles.tab, {borderColor: colors.cardBorder}, connTab === 'bluetooth' && {backgroundColor: colors.accent + '22', borderColor: colors.accent}]}
                    onPress={async () => { setConnTab('bluetooth'); setDevices([]); await requestPermissions(); startScan(); }}>
                    <Text style={[styles.tabText, {color: colors.textDim}, connTab === 'bluetooth' && {color: colors.accent}]}>BLUETOOTH</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, {borderColor: colors.cardBorder}, connTab === 'wifi' && {backgroundColor: colors.accent + '22', borderColor: colors.accent}]}
                    onPress={() => setConnTab('wifi')}>
                    <Text style={[styles.tabText, {color: colors.textDim}, connTab === 'wifi' && {color: colors.accent}]}>WİFİ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tab, {borderColor: colors.cardBorder}, connTab === 'usb' && {backgroundColor: colors.accent + '22', borderColor: colors.accent}]}
                    onPress={() => setConnTab('usb')}>
                    <Text style={[styles.tabText, {color: colors.textDim}, connTab === 'usb' && {color: colors.accent}]}>USB</Text>
                  </TouchableOpacity>
                </View>

                {connTab === 'bluetooth' && (
                  <>
                    <Text style={[styles.modalSubtitle, {color: colors.textMuted}]}>Bluetooth cihazları: yeni bulunanlar üstte, eşleşmişler altta.</Text>
                    <FlatList data={devices} keyExtractor={(item, i) => item.address || i.toString()}
                      renderItem={({item}) => (
                        <TouchableOpacity style={[styles.deviceItem, {backgroundColor: colors.card, borderColor: item.isNew ? '#00bfff' : colors.cardBorder}]} onPress={() => connectToDevice(item)}>
                          <Text style={styles.deviceIcon}>📡</Text>
                          <View style={{flex: 1}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                              <Text style={[styles.deviceName, {color: colors.text}]}>{item.name}</Text>
                              {item.isNew && <Text style={[styles.newBadge]}>YENİ</Text>}
                            </View>
                            <Text style={[styles.deviceAddr, {color: colors.textMuted}]}>{item.address}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={() => !isScanning ? <Text style={[styles.deviceAddr, {color: colors.textMuted, textAlign: 'center', marginVertical: 20}]}>Eşleştirilmiş cihaz bulunamadı.</Text> : null}
                      style={{maxHeight: 250}}
                    />
                    <TouchableOpacity style={[styles.refreshButton, {backgroundColor: colors.card}]} onPress={startScan}>
                      <Text style={[styles.refreshText, {color: colors.accent}]}>{isScanning ? 'TARANIYOR...' : 'CIHAZLARI TARA'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deviceItem, {backgroundColor: colors.card, borderColor: '#00ff7f'}]} onPress={startSimulation}>
                      <Text style={styles.deviceIcon}>🎮</Text>
                      <View>
                        <Text style={[styles.deviceName, {color: '#00ff7f'}]}>Simülasyon Modu (Test)</Text>
                        <Text style={[styles.deviceAddr, {color: colors.textMuted}]}>Gerçek cihaz olmadan test et</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {connTab === 'wifi' && (
                  <>
                    <Text style={[styles.modalSubtitle, {color: colors.textMuted}]}>WiFi ELM327 cihazına bağlanın.</Text>
                    <Text style={[styles.inputLabel, {color: colors.textDim}]}>IP Adresi</Text>
                    <TextInput style={[styles.input, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder}]} value={wifiIP} onChangeText={setWifiIP} placeholder="192.168.0.10"
                      placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" autoCapitalize="none" />
                    <Text style={[styles.inputLabel, {color: colors.textDim}]}>Port</Text>
                    <TextInput style={[styles.input, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder}]} value={wifiPort} onChangeText={setWifiPort} placeholder="35000"
                      placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
                    <TouchableOpacity style={[styles.connectWifiBtn, {backgroundColor: colors.card, borderColor: colors.cardBorder}]} onPress={connectWiFi}>
                      <Text style={[styles.connectWifiText, {color: colors.accent}]}>WİFİ İLE BAĞLAN</Text>
                    </TouchableOpacity>
                  </>
                )}

                {connTab === 'usb' && (
                  <>
                    <Text style={[styles.modalSubtitle, {color: colors.textMuted}]}>USB-OTG ile ELM327 bağlayın.</Text>
                    <TouchableOpacity style={[styles.connectWifiBtn, {borderColor: '#00ff7f', backgroundColor: 'rgba(0,255,127,0.1)'}]}
                      onPress={async () => {
                        setModalVisible(false);
                        setStatusText('USB OBD2 bağlanıyor...');
                        const success = await obd2Service.connectUSB();
                        if (success) { setIsConnected(true); setStatusText('USB OBD2 bağlandı'); }
                        else { Alert.alert('Hata', 'USB OBD2 cihazına bağlanılamadı.'); setStatusText('USB Bağlantı Hatası!'); }
                      }}>
                      <Text style={{color: '#00ff7f', fontWeight: '800', fontSize: 14, letterSpacing: 1.5}}>USB İLE BAĞLAN</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={[styles.closeButton, {backgroundColor: colors.card, borderColor: colors.cardBorder}]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.closeButtonText, {color: colors.textMuted}]}>İPTAL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {showDownloadBar && (
            <View style={{position:'absolute', bottom:0, left:0, right:0, backgroundColor:colors.card, padding:16, paddingBottom:24, borderTopLeftRadius:20, borderTopRightRadius:20, borderWidth:1, borderColor:colors.cardBorder}}>
              <Text style={{color:colors.text, fontWeight:'800', fontSize:14, marginBottom:10}}>Güncelleme İndiriliyor... %{downloadPercent}</Text>
              <View style={{height:6, backgroundColor:colors.inputBg, borderRadius:3, overflow:'hidden'}}>
                <View style={{height:6, backgroundColor:colors.accent, borderRadius:3, width:`${downloadPercent}%`}} />
              </View>
            </View>
          )}
        </SafeAreaView>
      )}
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scrollContent: {padding: 20, paddingTop: 40},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30},
  title: {color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 2},
  headerSub: {color: colors.textMuted, fontSize: 12, fontWeight: '500', letterSpacing: 1, marginTop: 2},
  connectButton: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, gap: 8},
  connectButtonActive: {backgroundColor: 'rgba(0, 255, 127, 0.15)', borderColor: '#00ff7f'},
  connectButtonText: {color: colors.text, fontWeight: '800', fontSize: 13, letterSpacing: 1},
  statusDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4757'},
  statusDotActive: {backgroundColor: '#00ff7f'},
  glassCard: {
    borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20,
  },
  cardLabel: {color: colors.textDim, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10},
  vehicleText: {color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 5},
  textNeonGreen: {color: '#00ff7f'},
  protocolText: {color: colors.textMuted, fontSize: 14},
  vehicleInfoRow: {flexDirection: 'row', gap: 16, marginTop: 10},
  vehicleInfoItem: {color: colors.textDim, fontSize: 13, fontWeight: '600'},
  gaugesContainer: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20},
  gaugeCard: {flex: 1, alignItems: 'center', marginHorizontal: 5, paddingVertical: 35},
  gaugeLabel: {color: colors.textDim, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20},
  gaugeCircle: {width: 150, height: 150, borderRadius: 75, borderWidth: 5, borderColor: 'rgba(0, 191, 255, 0.3)', justifyContent: 'center', alignItems: 'center'},
  gaugeCircleGreen: {borderColor: 'rgba(0, 255, 127, 0.3)'},
  gaugeValue: {fontSize: 44, fontWeight: '900'},
  gaugeValueGreen: {color: '#00ff7f', fontSize: 44, fontWeight: '900'},
  gaugeUnit: {color: colors.textMuted, fontSize: 12, fontWeight: 'bold', marginTop: 5},
  warningBanner: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,165,0,0.12)', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ffa502'},
  warningIcon: {fontSize: 20, marginRight: 10},
  warningText: {color: '#ffa502', fontSize: 15, fontWeight: '800', letterSpacing: 0.5},
  featuresGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  featureCard: {width: '48%', alignItems: 'center', paddingVertical: 25, position: 'relative'},
  featureIcon: {fontSize: 32, marginBottom: 10},
  dtcBadge: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#ff4757',
    borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  dtcBadgeText: {color: '#fff', fontSize: 10, fontWeight: '900'},
  featureValue: {color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 5},
  featureLabel: {color: colors.text, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center'},
  featureHint: {color: colors.textMuted, fontSize: 10, marginTop: 4, letterSpacing: 1},
  quickActions: {flexDirection: 'row', justifyContent: 'space-between'},
  quickAction: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, marginHorizontal: 5, gap: 8},
  quickActionIcon: {fontSize: 18},
  quickActionText: {color: colors.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1},
  tabRow: {flexDirection: 'row', marginBottom: 20, gap: 8},
  tab: {flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.inputBg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder},
  tabActive: {backgroundColor: colors.gaugeBg, borderColor: colors.accent},
  tabText: {color: colors.textDim, fontWeight: '700', fontSize: 12, letterSpacing: 1},
  tabTextActive: {color: colors.accent},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, minHeight: 400, maxHeight: 650},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  modalTitle: {color: colors.text, fontSize: 20, fontWeight: 'bold'},
  modalSubtitle: {color: colors.textDim, fontSize: 12, marginBottom: 15, lineHeight: 18},
  inputLabel: {color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 8},
  input: {backgroundColor: colors.inputBg, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'},
  connectWifiBtn: {backgroundColor: colors.gaugeBg, borderRadius: 15, padding: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: colors.accent},
  connectWifiText: {color: colors.accent, fontWeight: '800', fontSize: 14, letterSpacing: 1.5},
  refreshButton: {marginTop: 10, padding: 12, backgroundColor: colors.gaugeBg, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.accent},
  refreshText: {color: colors.accent, fontWeight: '700', fontSize: 12, letterSpacing: 1},
  deviceItem: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder},
  deviceIcon: {fontSize: 24, marginRight: 15},
  deviceName: {color: colors.text, fontSize: 16, fontWeight: 'bold'},
  deviceAddr: {fontSize: 12},
  newBadge: {backgroundColor: colors.accent, color: '#fff', fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, letterSpacing: 1, overflow: 'hidden'},
  closeButton: {marginTop: 20, padding: 15, backgroundColor: colors.inputBg, borderRadius: 15, alignItems: 'center'},
  closeButtonText: {color: colors.text, fontWeight: 'bold'},
});
