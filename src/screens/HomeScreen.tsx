import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
  PermissionsAndroid,
  TextInput,
  AppState,
  StatusBar,
  Permission,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {obd2Service, ConnectionState} from '../services/OBD2Service';
import {loadSettings, getSettings} from '../services/AppSettings';
import {
  loadVehicles,
  getVehicles,
  getActiveVehicleId,
  Vehicle,
} from '../services/VehicleStorage';
import {getDTCScanCounts} from '../services/DTCHistory';
import {
  DTC_DESCRIPTIONS,
  getDTCCategory,
  getDTCCategoryColor,
  DTC_AI_ADVICE,
} from '../services/DTCDatabase';
import {getDtcDescription} from '../services/DtcDictionary';
import {dataLogService} from '../services/DataLogService';
import {initLogCapture} from '../services/AppLog';
import {ThemeProvider, useTheme} from '../services/ThemeContext';
import {
  checkForUpdate,
  promptUpdate,
  downloadActive,
  downloadProgress,
  onDownloadProgress,
} from '../services/UpdateService';
import {
  setupUpdateChannel,
  handleNotificationPress,
} from '../services/UpdateNotifications';
import KeepAwake from 'react-native-keep-awake';
import GaugesContainer from '../components/GaugesContainer';
import FeaturesGrid from '../components/FeaturesGrid';
import VehicleStatusCard from '../components/VehicleStatusCard';
import {calculateEngineHealth, EngineHealthResult} from '../services/EngineHealthService';
import packageJson from '../../package.json';

const APP_VERSION = packageJson.version;

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    KeepAwake.activate();
    return () => KeepAwake.deactivate();
  }, []);

  const [isConnected, setIsConnected] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [statusText, setStatusText] = useState('Bağlantı Bekleniyor...');
  const [_connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [connTab, setConnTab] = useState<'bluetooth' | 'wifi' | 'usb'>(
    'bluetooth',
  );
  const [wifiIP, setWifiIP] = useState('192.168.0.10');
  const [wifiPort, setWifiPort] = useState('35000');
  const [protocolLabel, setProtocolLabel] = useState('Otomatik');
  const [dtcScanCount, setDtcScanCount] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [showDownloadBar, setShowDownloadBar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<
    {code: string; description: string; source: string}[]
  >([]);
  const autoConnectDone = useRef(false);
  const searchDebounceRef = useRef<any>(null);
  const [engineHealth, setEngineHealth] = useState<EngineHealthResult | null>(null);
  const {colors, darkMode} = useTheme();

  useEffect(() => {
    initLogCapture();
    loadSettings();
    loadVehicles().then(async vs => {
      const activeId = await getActiveVehicleId();
      if (activeId) {
        const v = vs.find(x => x.id === activeId);
        setActiveVehicle(v || null);
      }
    });

    const unsubConnection = obd2Service.onConnectionUpdate(
      (state: ConnectionState, message?: string) => {
        setConnectionState(state);
        if (message) {
          setStatusText(message);
        }
        if (state === 'connected') {
          setIsConnected(true);
          setProtocolLabel(obd2Service.protocolLabel);
          if (getSettings().autoRecord && !dataLogService.isRecording) {
            dataLogService.setFuelPrice(getSettings().fuelPricePerLiter);
            dataLogService.start();
          }
        }
        if (state === 'background') {
          setStatusText('Arka planda çalışıyor...');
        }
        if (state === 'disconnected') {
          setIsConnected(false);
          setStatusText('Bağlantı Kesildi.');
          if (dataLogService.isRecording) {
            dataLogService.stop();
          }
        }
        if (state === 'error') {
          setStatusText('Bağlantı Hatası!');
        }
      },
    );

    setupUpdateChannel().catch(() => {});
    handleNotificationPress();

    if (!autoConnectDone.current) {
      autoConnectDone.current = true;
      requestPermissions().then(() => {
        obd2Service.autoConnect().then(ok => {
          if (ok) {
            setStatusText('Otomatik bağlanıldı');
          }
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

    // Motor sağlık skoru — her 5sn’de güncelle
    const healthInterval = setInterval(() => {
      const lastData = obd2Service.getLastData();
      const connected = obd2Service.isConnected;
      // DTC sayısını simule edilmiş DTC listesiyle geççi olarak sayıyoruz
      const fakeDtcs = dtcScanCount > 0
        ? Array.from({length: dtcScanCount}, (_, i) => ({code: `P${i}`, description: ''}))
        : [];
      setEngineHealth(calculateEngineHealth(lastData, fakeDtcs, connected));
    }, 5000);

    return () => {
      // NOT: disconnect burada YOK — başka ekrana geçince bağlantı kesilmesin!
      // Disconnect sadece kullanıcı butona basınca olur.
      unsubConnection();
      clearInterval(healthInterval);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getDTCScanCounts().then(counts => {
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        setDtcScanCount(total);
      });
    }, []),
  );

  useEffect(() => {
    const unsub = onDownloadProgress((pct: number) => {
      setDownloadPercent(pct);
      setShowDownloadBar(pct > 0 && pct < 100);
    });
    return unsub;
  }, []);

  const handleGlobalSearch = useCallback((q: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      const query = q.trim();
      if (!query) {
        setSearchRes([]);
        return;
      }
      const upper = query.toUpperCase();
      const lowerTR = query.toLocaleLowerCase('tr');
      const isCodeSearch = /^[PUCB]\d{0,4}$/i.test(query);
      const seenCodes = new Set<string>();
      const results: {code: string; description: string; source: string}[] = [];

      for (const [code, desc] of Object.entries(DTC_DESCRIPTIONS)) {
        if (isCodeSearch && code.startsWith(upper)) {
          results.push({code, description: desc, source: 'VT'});
          seenCodes.add(code);
        } else if (!isCodeSearch && desc.toLocaleLowerCase('tr').includes(lowerTR)) {
          results.push({code, description: desc, source: 'VT'});
          seenCodes.add(code);
        }
        if (results.length >= 30) { break; }
      }

      if (!isCodeSearch && results.length < 30) {
        for (const [code, advice] of Object.entries(DTC_AI_ADVICE)) {
          if (seenCodes.has(code)) { continue; }
          if ((advice.cause + ' ' + advice.advice).toLocaleLowerCase('tr').includes(lowerTR)) {
            results.push({
              code,
              description: (DTC_DESCRIPTIONS[code] || getDtcDescription(code) || code) + ' (AI)',
              source: 'AI',
            });
            seenCodes.add(code);
          }
          if (results.length >= 30) { break; }
        }
      }
      setSearchRes(results);
    }, 300); // 300ms debounce — her tuşta 2852 kayıt taranmasın
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
        if (perms.length > 0) {
          await PermissionsAndroid.requestMultiple(perms);
        }
      } catch (err) {
        console.warn(err);
      }
      if (typeof apiLevel === 'number' && apiLevel >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        } catch (_) {}
      }
    }
  };

  const handleConnectPress = async () => {
    if (!isConnected) {
      await requestPermissions();
      setModalVisible(true);
      if (connTab === 'bluetooth') {
        startScan();
      }
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
          Alert.alert(
            'Bluetooth Kapalı',
            "Lütfen Bluetooth'u açın ve tekrar deneyin.",
          );
          setIsScanning(false);
          setStatusText('Bağlantı Bekleniyor...');
          return;
        }
      }

      let discovered: any[] = [];
      try {
        const result = await obd2Service.startDiscovery();
        if (result && result.length > 0) {
          discovered = result;
        }
      } catch (discErr) {
        try {
          await obd2Service.cancelDiscovery();
        } catch {}
        await new Promise(r => setTimeout(r, 500));
        try {
          const fallback = await obd2Service.startDiscovery();
          if (fallback && fallback.length > 0) {
            discovered = fallback;
          }
        } catch {}
      }

      const paired = await obd2Service.getPairedDevices();
      const addrKey = (d: any) => (d.address || '').trim().toUpperCase();
      const pairedSet = new Set((paired || []).map(addrKey));
      const newDevices = (discovered || []).filter(
        d => !pairedSet.has(addrKey(d)),
      );
      const discoveredPaired = (discovered || []).filter(d =>
        pairedSet.has(addrKey(d)),
      );
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
      setStatusText(
        merged.length > 0
          ? `${merged.length} cihaz bulundu`
          : 'Cihaz bulunamadı',
      );
    } catch (e) {
      console.error('Scan error:', e);
    }
    setIsScanning(false);
  };

  const connectToDevice = async (device: any) => {
    if (!device.address) {
      Alert.alert('Hata', 'Cihaz adresi bulunamadı');
      return;
    }
    setModalVisible(false);
    setStatusText('Bağlanıyor: ' + device.name);
    const success = await obd2Service.connectBluetooth(
      device.address,
      device.name,
    );
    if (success) {
      setIsConnected(true);
      setStatusText('Bağlandı: ' + device.name);
    } else {
      setStatusText('Bağlantı Hatası!');
      Alert.alert(
        'Bağlantı Hatası',
        'Cihaza bağlanılamadı. Cihazın açık ve araç kontağının açık olduğundan emin olun.',
        [
          {text: 'Kapat', style: 'cancel'},
          {
            text: 'Bluetooth Ayarları',
            onPress: () => obd2Service.openBluetoothSettings(),
          },
        ],
      );
    }
  };

  const connectWiFi = async () => {
    const ip = wifiIP.trim();
    const port = parseInt(wifiPort, 10) || 35000;
    if (!ip) {
      Alert.alert('Hata', 'Lütfen geçerli bir IP adresi girin.');
      return;
    }
    setModalVisible(false);
    setStatusText(`WiFi bağlanıyor: ${ip}:${port}...`);
    const success = await obd2Service.connectWiFi(ip, port);
    if (success) {
      setIsConnected(true);
      setStatusText(`WiFi bağlandı: ${ip}`);
    } else {
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

  const screenNameMap: Record<string, keyof RootStackParamList> = {
    errorcodes: 'ErrorCodes',
    livedata: 'LiveData',
    hiddenfeature: 'HiddenFeature',
    settings: 'Settings',
    performance: 'Performance',
    freezeframe: 'FreezeFrame',
    vehicleinfo: 'VehicleInfo',
    datalog: 'DataLog',
    log: 'Log',
    changelog: 'Changelog',
    vehicles: 'Vehicles',
    tripsummary: 'TripSummary',
    trip: 'Trip',
    service: 'Service',
    aidiagnostic: 'AIDiagnostic',
  };

  const navigate = async (screen: string | null) => {
    if (screen) {
      const mapped = screenNameMap[screen] || screen;
      navigation.navigate(mapped as any);
    }
  };

  const handleGoVehicles = () => {
    navigation.navigate('Vehicles');
  };

  const styles = getStyles(colors);

  return (
    <>
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={darkMode ? 'light-content' : 'dark-content'}
      />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.container, {backgroundColor: colors.bg}]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleGoVehicles}
              style={{flexDirection: 'row', alignItems: 'center'}}>
              {activeVehicle && activeVehicle.imageUri ? (
                <Image
                  source={{uri: activeVehicle.imageUri}}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    marginRight: 12,
                    borderWidth: 2,
                    borderColor: colors.accent,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.inputBg,
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text style={{fontSize: 20}}>🚗</Text>
                </View>
              )}
              <View>
                <Text style={[styles.title, {color: colors.text}]}>
                  {activeVehicle ? activeVehicle.name : 'ARAÇLARIM'}
                </Text>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Text style={[styles.headerSub, {color: colors.textMuted}]}>
                    {activeVehicle
                      ? activeVehicle.brand || 'Seçili Araç'
                      : 'OBD2 Diagnostik'}
                  </Text>
                  {dtcScanCount > 0 && (
                    <TouchableOpacity
                      onPress={() => navigate('errorcodes')}
                      style={{
                        backgroundColor: 'rgba(255,71,87,0.15)',
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}>
                      <Text
                        style={{
                          color: '#ff4757',
                          fontSize: 10,
                          fontWeight: '800',
                        }}>
                        DTC {dtcScanCount}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowSearch(true);
                setSearchQ('');
                setSearchRes([]);
              }}
              style={{padding: 8}}>
              <Text style={{fontSize: 20}}>🔎</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.connectButton,
                {backgroundColor: colors.card, borderColor: colors.cardBorder},
                isConnected && styles.connectButtonActive,
              ]}
              onPress={handleConnectPress}>
              <View
                style={[
                  styles.statusDot,
                  isConnected && styles.statusDotActive,
                ]}
              />
              <Text style={[styles.connectButtonText, {color: colors.text}]}>
                {isConnected ? 'BAĞLI' : 'BAĞLAN'}
              </Text>
            </TouchableOpacity>
          </View>

          <VehicleStatusCard
            statusText={statusText}
            updateStatus={updateStatus}
            protocolLabel={protocolLabel}
            isConnected={isConnected}
          />

          <GaugesContainer />

          {/* MOTOR SAĞlIK SKORU */}
          {engineHealth && engineHealth.overall > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigate('errorcodes')}
              style={[
                {
                  marginHorizontal: 16,
                  marginBottom: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: engineHealth.color + '44',
                  backgroundColor: engineHealth.color + '11',
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                },
              ]}>
              {/* Skor çemberi */}
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 3,
                  borderColor: engineHealth.color,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: engineHealth.color + '22',
                }}>
                <Text
                  style={{
                    color: engineHealth.color,
                    fontSize: 20,
                    fontWeight: '900',
                  }}>
                  {engineHealth.grade}
                </Text>
                <Text
                  style={{
                    color: engineHealth.color,
                    fontSize: 10,
                    fontWeight: '700',
                  }}>
                  {engineHealth.overall}
                </Text>
              </View>
              {/* Detay */}
              <View style={{flex: 1}}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: '800',
                    marginBottom: 3,
                  }}>
                  MOTOR SAĞLIK SKORU
                </Text>
                <Text
                  style={{
                    color: engineHealth.color,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                  {engineHealth.summary}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    marginTop: 4,
                    flexWrap: 'wrap',
                  }}>
                  {engineHealth.categories.slice(0, 3).map(cat => (
                    <View
                      key={cat.name}
                      style={{
                        backgroundColor:
                          cat.status === 'excellent'
                            ? '#00e67622'
                            : cat.status === 'good'
                            ? '#7bed9f22'
                            : cat.status === 'warning'
                            ? '#ffa50222'
                            : '#ff475722',
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}>
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '700',
                          color:
                            cat.status === 'excellent'
                              ? '#00e676'
                              : cat.status === 'good'
                              ? '#7bed9f'
                              : cat.status === 'warning'
                              ? '#ffa502'
                              : '#ff4757',
                        }}>
                        {cat.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={{color: colors.textMuted, fontSize: 16}}>›</Text>
            </TouchableOpacity>
          )}

          <FeaturesGrid onNavigate={navigate} />

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[
                styles.quickAction,
                {backgroundColor: colors.card, borderColor: colors.cardBorder},
              ]}
              onPress={() => navigate('LiveData')}>
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={[styles.quickActionText, {color: colors.text}]}>
                CANLI VERİ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickAction,
                {backgroundColor: colors.card, borderColor: colors.cardBorder},
              ]}
              onPress={handleConnectPress}>
              <Text style={styles.quickActionIcon}>
                {isConnected ? '🔌' : '📡'}
              </Text>
              <Text style={[styles.quickActionText, {color: colors.text}]}>
                {isConnected ? 'BAĞLANTIYI KES' : 'BAĞLAN'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.quickActions, {marginTop: 6}]}>
            <TouchableOpacity
              style={[
                styles.quickAction,
                {backgroundColor: colors.card, borderColor: colors.cardBorder},
              ]}
              onPress={() => navigate('TripSummary')}>
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={[styles.quickActionText, {color: colors.text}]}>
                TRIP ÖZETI
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickAction,
                {backgroundColor: colors.card, borderColor: colors.cardBorder},
              ]}
              onPress={() => navigate('Log')}>
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={[styles.quickActionText, {color: colors.text}]}>
                HATA LOG
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickAction,
                {backgroundColor: colors.card, borderColor: colors.cardBorder},
              ]}
              onPress={() => navigate('Changelog')}>
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={[styles.quickActionText, {color: colors.text}]}>
                SÜRÜM NOTLARI
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {backgroundColor: colors.bg}]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, {color: colors.text}]}>
                  BAĞLANTI
                </Text>
                {isScanning ? (
                  <ActivityIndicator color={colors.accent} />
                ) : null}
              </View>

              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    {borderColor: colors.cardBorder},
                    connTab === 'bluetooth' && {
                      backgroundColor: colors.accent + '22',
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={async () => {
                    setConnTab('bluetooth');
                    setDevices([]);
                    await requestPermissions();
                    startScan();
                  }}>
                  <Text
                    style={[
                      styles.tabText,
                      {color: colors.textDim},
                      connTab === 'bluetooth' && {color: colors.accent},
                    ]}>
                    BLUETOOTH
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    {borderColor: colors.cardBorder},
                    connTab === 'wifi' && {
                      backgroundColor: colors.accent + '22',
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setConnTab('wifi')}>
                  <Text
                    style={[
                      styles.tabText,
                      {color: colors.textDim},
                      connTab === 'wifi' && {color: colors.accent},
                    ]}>
                    WİFİ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    {borderColor: colors.cardBorder},
                    connTab === 'usb' && {
                      backgroundColor: colors.accent + '22',
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setConnTab('usb')}>
                  <Text
                    style={[
                      styles.tabText,
                      {color: colors.textDim},
                      connTab === 'usb' && {color: colors.accent},
                    ]}>
                    USB
                  </Text>
                </TouchableOpacity>
              </View>

              {connTab === 'bluetooth' && (
                <>
                  <Text
                    style={[styles.modalSubtitle, {color: colors.textMuted}]}>
                    Bluetooth cihazları: yeni bulunanlar üstte, eşleşmişler
                    altta.
                  </Text>
                  <FlatList
                    data={devices}
                    keyExtractor={(item, i) => item.address || i.toString()}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={[
                          styles.deviceItem,
                          {
                            backgroundColor: colors.card,
                            borderColor: item.isNew
                              ? '#00bfff'
                              : colors.cardBorder,
                          },
                        ]}
                        onPress={() => connectToDevice(item)}>
                        <Text style={styles.deviceIcon}>📡</Text>
                        <View style={{flex: 1}}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}>
                            <Text
                              style={[styles.deviceName, {color: colors.text}]}>
                              {item.name}
                            </Text>
                            {item.isNew && (
                              <Text style={[styles.newBadge]}>YENİ</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.deviceAddr,
                              {color: colors.textMuted},
                            ]}>
                            {item.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={() =>
                      !isScanning ? (
                        <Text
                          style={[
                            styles.deviceAddr,
                            {
                              color: colors.textMuted,
                              textAlign: 'center',
                              marginVertical: 20,
                            },
                          ]}>
                          Eşleştirilmiş cihaz bulunamadı.
                        </Text>
                      ) : null
                    }
                    style={{maxHeight: 250}}
                  />
                  <TouchableOpacity
                    style={[
                      styles.refreshButton,
                      {backgroundColor: colors.card},
                    ]}
                    onPress={startScan}>
                    <Text style={[styles.refreshText, {color: colors.accent}]}>
                      {isScanning ? 'TARANIYOR...' : 'CIHAZLARI TARA'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deviceItem,
                      {backgroundColor: colors.card, borderColor: '#00ff7f'},
                    ]}
                    onPress={startSimulation}>
                    <Text style={styles.deviceIcon}>🎮</Text>
                    <View>
                      <Text style={[styles.deviceName, {color: '#00ff7f'}]}>
                        Simülasyon Modu (Test)
                      </Text>
                      <Text
                        style={[styles.deviceAddr, {color: colors.textMuted}]}>
                        Gerçek cihaz olmadan test et
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {connTab === 'wifi' && (
                <>
                  <Text
                    style={[styles.modalSubtitle, {color: colors.textMuted}]}>
                    WiFi ELM327 cihazına bağlanın.
                  </Text>
                  <Text style={[styles.inputLabel, {color: colors.textDim}]}>
                    IP Adresi
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    value={wifiIP}
                    onChangeText={setWifiIP}
                    placeholder="192.168.0.10"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                  />
                  <Text style={[styles.inputLabel, {color: colors.textDim}]}>
                    Port
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    value={wifiPort}
                    onChangeText={setWifiPort}
                    placeholder="35000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={[
                      styles.connectWifiBtn,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    onPress={connectWiFi}>
                    <Text
                      style={[styles.connectWifiText, {color: colors.accent}]}>
                      WİFİ İLE BAĞLAN
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {connTab === 'usb' && (
                <>
                  <Text
                    style={[styles.modalSubtitle, {color: colors.textMuted}]}>
                    USB-OTG ile ELM327 bağlayın.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.connectWifiBtn,
                      {
                        borderColor: '#00ff7f',
                        backgroundColor: 'rgba(0,255,127,0.1)',
                      },
                    ]}
                    onPress={async () => {
                      setModalVisible(false);
                      setStatusText('USB OBD2 bağlanıyor...');
                      const success = await obd2Service.connectUSB();
                      if (success) {
                        setIsConnected(true);
                        setStatusText('USB OBD2 bağlandı');
                      } else {
                        Alert.alert('Hata', 'USB OBD2 cihazına bağlanılamadı.');
                        setStatusText('USB Bağlantı Hatası!');
                      }
                    }}>
                    <Text
                      style={{
                        color: '#00ff7f',
                        fontWeight: '800',
                        fontSize: 14,
                        letterSpacing: 1.5,
                      }}>
                      USB İLE BAĞLAN
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => setModalVisible(false)}>
                <Text
                  style={[styles.closeButtonText, {color: colors.textMuted}]}>
                  İPTAL
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {showDownloadBar && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.card,
              padding: 16,
              paddingBottom: 24,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}>
            <Text
              style={{
                color: colors.text,
                fontWeight: '800',
                fontSize: 14,
                marginBottom: 10,
              }}>
              Guncelleme Indiriliyor... %{downloadPercent}
            </Text>
            <View
              style={{
                height: 6,
                backgroundColor: colors.inputBg,
                borderRadius: 3,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.accent,
                  borderRadius: 3,
                  width: `${downloadPercent}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Evrensel Arama Modal */}
        <Modal visible={showSearch} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.85)',
              paddingTop: 60,
            }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.bg,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                padding: 20,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: '900',
                    letterSpacing: 1,
                  }}>
                  🔎 EVRENSEL ARAMA
                </Text>
                <TouchableOpacity onPress={() => setShowSearch(false)}>
                  <Text style={{color: colors.accent, fontWeight: '700'}}>
                    KAPAT
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    marginBottom: 10,
                    textAlign: 'center',
                    fontWeight: '800',
                    letterSpacing: 2,
                  },
                ]}
                value={searchQ}
                onChangeText={t => {
                  setSearchQ(t);
                  handleGlobalSearch(t);
                }}
                placeholder="Kod veya kelime (turbo, egr, fren, yağ...)"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoFocus
              />
              {searchRes.length > 0 && (
                <Text
                  style={{
                    color: colors.textDim,
                    fontSize: 11,
                    marginBottom: 8,
                  }}>
                  {searchRes.length} sonuç bulundu (
                  {searchRes.filter(r => r.source === 'VT').length} VT +{' '}
                  {searchRes.filter(r => r.source === 'AI').length} AI)
                </Text>
              )}
              <ScrollView>
                {searchRes.map((item, idx) => (
                  <TouchableOpacity
                    key={item.code + idx}
                    onPress={() => {
                      navigation.navigate('ErrorCodes' as any);
                      setShowSearch(false);
                    }}
                    onLongPress={() => {
                      Linking.openURL(
                        `https://www.google.com/search?q=${encodeURIComponent(
                          item.code + ' OBD2 hata kodu',
                        )}`,
                      ).catch(() => {});
                    }}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: getDTCCategoryColor(item.code),
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                      <Text
                        style={{
                          color: getDTCCategoryColor(item.code),
                          fontSize: 18,
                          fontWeight: '900',
                          letterSpacing: 1,
                        }}>
                        📖 {item.code}
                      </Text>
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '700',
                          color: item.source === 'AI' ? '#00bfff' : '#ffa502',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                          borderRadius: 3,
                        }}>
                        {item.source}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textDim,
                        fontSize: 12,
                        marginTop: 4,
                        lineHeight: 16,
                      }}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))}
                {searchRes.length === 0 && searchQ.length >= 2 && (
                  <Text
                    style={{
                      color: colors.textDim,
                      textAlign: 'center',
                      marginTop: 40,
                      fontSize: 14,
                    }}>
                    Sonuç bulunamadı.
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    scrollContent: {padding: 20, paddingTop: 16},
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: 2,
    },
    headerSub: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 1,
      marginTop: 2,
    },
    connectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 8,
    },
    connectButtonActive: {
      backgroundColor: 'rgba(0, 255, 127, 0.15)',
      borderColor: '#00ff7f',
    },
    connectButtonText: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: 1,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ff4757',
    },
    statusDotActive: {backgroundColor: '#00ff7f'},
    quickActions: {flexDirection: 'row', justifyContent: 'space-between'},
    quickAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginHorizontal: 5,
      gap: 8,
    },
    quickActionIcon: {fontSize: 18},
    quickActionText: {
      color: colors.textDim,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
    },
    tabRow: {flexDirection: 'row', marginBottom: 20, gap: 8},
    tab: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    tabText: {
      color: colors.textDim,
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 30,
      minHeight: 400,
      maxHeight: 650,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    modalTitle: {color: colors.text, fontSize: 20, fontWeight: 'bold'},
    modalSubtitle: {
      color: colors.textDim,
      fontSize: 12,
      marginBottom: 15,
      lineHeight: 18,
    },
    inputLabel: {
      color: colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 6,
      marginTop: 8,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    connectWifiBtn: {
      backgroundColor: colors.gaugeBg,
      borderRadius: 15,
      padding: 16,
      alignItems: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    connectWifiText: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 1.5,
    },
    refreshButton: {
      marginTop: 10,
      padding: 12,
      backgroundColor: colors.gaugeBg,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.accent,
    },
    refreshText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 1,
    },
    deviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    deviceIcon: {fontSize: 24, marginRight: 15},
    deviceName: {color: colors.text, fontSize: 16, fontWeight: 'bold'},
    deviceAddr: {fontSize: 12},
    newBadge: {
      backgroundColor: colors.accent,
      color: '#fff',
      fontSize: 10,
      fontWeight: '900',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      letterSpacing: 1,
      overflow: 'hidden',
    },
    closeButton: {
      marginTop: 20,
      padding: 15,
      backgroundColor: colors.inputBg,
      borderRadius: 15,
      alignItems: 'center',
    },
    closeButtonText: {color: colors.text, fontWeight: 'bold'},
  });
