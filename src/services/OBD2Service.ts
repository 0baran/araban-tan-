import {PermissionsAndroid, Platform, NativeModules, Permission} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {HiddenFeature} from './HiddenFeatures';

const STORAGE_LAST_DEVICE = '@arabanitani/last_device';
const STORAGE_LAST_TYPE = '@arabanitani/connection_type';

export type ConnectionType = 'bluetooth' | 'wifi' | 'usb' | 'simulation';

export type ConnectionConfig = {
  type: ConnectionType;
  address?: string;
  name?: string;
  ip?: string;
  port?: number;
};

export type OBD2Data = {
  rpm: number;
  speed: number;
  coolantTemp: number;
  engineLoad: number;
  intakeTemp: number;
  maf: number;
  throttlePos: number;
  fuelLevel: number;
  fuelPressure: number;
  timingAdvance: number;
  map: number;
  batteryVoltage: number;
  ambientTemp: number;
  shortTermFuelTrim: number;
  longTermFuelTrim: number;
  commandedAFR: number;
  barometricPressure: number;
  absoluteLoad: number;
  relativeThrottlePos: number;
  ethanolPercent: number;
  fuelSystemStatus: string;
  o2Sensor1Voltage: number;
  o2Sensor2Voltage: number;
  catalystTempBank1: number;
  shortTermFuelTrim2: number;
  longTermFuelTrim2: number;
  distanceSinceDTCClear: number;
  fuelRailPressureRelative: number;
  runTime: number;
  engineOilTemp: number;
  fuelRate: number;
  distanceWithMIL: number;
  timeSinceDTCClear: number;
  absoluteThrottleB: number;
  absoluteThrottleC: number;
  commandedThrottleActuator: number;
  acceleratorPosD: number;
  warmUpsSinceDTCClear: number;
  fuelType: string;
  timeWithMIL: number;
  injectionTiming: number;
  catalystTempBank2: number;
  wideRangeO2B1S1: number;
  acceleratorPosE: number;
  acceleratorPosF: number;
  fuelRailPressureAbsolute: number;
  egtBank1: number;
  evapVaporPressure: number;
  relativePedalPos: number;
  commandedEgr: number;
  egrError: number;
  commandedEvapPurge: number;
  o2B1S1EquivRatio: number;
  o2B1S2EquivRatio: number;
  actualEgr: number;
  egrErrorDuty: number;
  commandedEvapPurgeFlow: number;
  milOn: boolean;
  dtcCount: number;
  actualEngineTorque: number;
  driverDemandTorque: number;
  engineReferenceTorque: number;
  turboBoostPressure: number;
  odometer: number;
  hybridBatteryLife: number;
  dpfDifferentialPressure: number;
  dpfTemp: number;
  exhaustPressure: number;
  turboRpm: number;
  chargeAirCoolerTemp: number;
  fuelRailGaugePressure: number;
  engineFrictionTorque: number;
  distanceSinceDTCClearHighRes: number;
  throttlePositionG: number;
  _validKeys?: string[];
};

export type MonitorStatus = {
  milOn: boolean;
  dtcCount: number;
  tests: {name: string; available: boolean; completed: boolean}[];
};

export type TripData = {
  startTime: number;
  distanceKm: number;
  fuelUsedL: number;
  avgSpeed: number;
  maxSpeed: number;
  avgConsumption: number;
};

export type DTC = {
  code: string;
  description: string;
};

export type FreezeFrameData = {
  dtc: DTC | null;
  rpm: number;
  speed: number;
  coolantTemp: number;
  engineLoad: number;
  intakeTemp: number;
  maf: number;
  throttlePos: number;
  fuelLevel: number;
  map: number;
  timingAdvance: number;
  shortTermFuelTrim: number;
  longTermFuelTrim: number;
  commandedAFR: number;
};

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export const OBD2_PROTOCOLS: {value: string; label: string}[] = [
  {value: '0', label: 'Otomatik (Tüm Protokoller)'},
  {value: '1', label: 'SAE J1850 PWM (Eski Ford / Mazda)'},
  {value: '2', label: 'SAE J1850 VPW (Eski GM / Chevrolet)'},
  {value: '3', label: 'ISO 9141-2 (Eski Avrupa / Asya / Chrysler)'},
  {value: '4', label: 'ISO 14230-4 KWP (VAG / Avrupa 5 baud)'},
  {value: '5', label: 'ISO 14230-4 KWP (VAG / Avrupa fast init)'},
  {value: '6', label: 'ISO 15765-4 CAN (Standart Modern Araçlar)'},
  {value: '7', label: 'ISO 15765-4 CAN (Asya / HD 29 bit)'},
  {value: '8', label: 'ISO 15765-4 CAN (11 bit, 250 kbaud)'},
  {value: '9', label: 'ISO 15765-4 CAN (29 bit, 250 kbaud)'},
  {value: 'A', label: 'SAE J1939 CAN (Ağır Vasıta / Kamyon)'},
  {value: 'B', label: 'USER1 CAN (Ford MS-CAN / 125 kbaud)'},
  {value: 'C', label: 'USER2 CAN (GM/Fiat SW-CAN / 50 kbaud)'},
];

const PROTOCOL_LABELS: Record<string, string> = {
  '1': 'SAE J1850 PWM',
  '2': 'SAE J1850 VPW',
  '3': 'ISO 9141-2',
  '4': 'ISO 14230-4 KWP (5 baud)',
  '5': 'ISO 14230-4 KWP (fast)',
  '6': 'ISO 15765-4 CAN (11b 500k)',
  '7': 'ISO 15765-4 CAN (29b 500k)',
  '8': 'ISO 15765-4 CAN (11b 250k)',
  '9': 'ISO 15765-4 CAN (29b 250k)',
  A: 'SAE J1939 CAN',
  B: 'USER1 CAN (125k)',
  C: 'USER2 CAN (50k)',
};

type OBD2Callback = (data: OBD2Data) => void;
type ConnectionCallback = (state: ConnectionState, message?: string) => void;

type Transport = {
  connect(onProgress?: (msg: string) => void): Promise<boolean>;
  disconnect(): Promise<void>;
  write(data: string): Promise<void>;
  readAll(): Promise<string>;
  isAvailable(): Promise<number>;
};

class BluetoothTransport implements Transport {
  private device: BluetoothDevice | null = null;
  address: string;

  constructor(address: string) {
    this.address = address;
  }

  async connect(onProgress?: (msg: string) => void): Promise<boolean> {
    onProgress?.('Önceki bağlantılar temizleniyor...');
    try { await RNBluetoothClassic.disconnectFromDevice(this.address); } catch (_) {}
    await new Promise(r => setTimeout(r, 200));

    const attempts: {opts: any; label: string}[] = [
      {opts: {CONNECTOR_TYPE: 'rfcomm', DELIMITER: '\r', SECURE_SOCKET: false} as any, label: 'Normal bağlantı'},
      {opts: {SECURE_SOCKET: true, DELIMITER: '\r'} as any, label: 'Güvenli bağlantı'},
    ];
    for (let i = 0; i < attempts.length; i++) {
      const label = `${i + 1}/${attempts.length} - ${attempts[i].label}`;
      onProgress?.(`${label} (en fazla ${CONNECT_TIMEOUT / 1000}sn)...`);
      try {
        this.device = await Promise.race([
          RNBluetoothClassic.connectToDevice(this.address, attempts[i].opts),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), CONNECT_TIMEOUT),
          ),
        ]);
        onProgress?.('Bağlantı başarılı');
        return !!this.device;
      } catch (e: any) {
        const reason = e?.message?.includes('Timeout') ? 'süre aşımı' : 'hata';
        console.log(`BT connect try ${i + 1} failed:`, e);
        onProgress?.(`${label} başarısız (${reason})`);
        try { await RNBluetoothClassic.disconnectFromDevice(this.address); } catch (_) {}
        await new Promise(r => setTimeout(r, 500));
      }
    }
    onProgress?.('Bağlantı denemeleri başarısız');
    return false;
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try { await this.device.disconnect(); } catch (_) {}
      this.device = null;
    }
  }

  async write(data: string): Promise<void> {
    if (!this.device) {
      throw new Error('Device not connected');
    }
    await this.device.write(data);
  }

  async readAll(): Promise<string> {
    if (!this.device) return '';
    let data = '';
    try {
      while (await this.device.available() > 0) {
        const chunk = await this.device.read();
        if (chunk) data += chunk;
      }
    } catch (_) {}
    return data;
  }

  async isAvailable(): Promise<number> {
    if (!this.device) return 0;
    try {
      return await this.device.available();
    } catch { return 0; }
  }
}

class UsbTransport implements Transport {
  private RNSerialport: any = null;
  private buffer = '';
  private _subscription: any = null;

  async connect(_onProgress?: (msg: string) => void): Promise<boolean> {
    const mod = require('react-native-usb-serialport');
    this.RNSerialport = mod.RNSerialport;
    if (!this.RNSerialport) throw new Error('react-native-usb-serialport modülü bulunamadı');
    const devices = await this.RNSerialport.listDevices();
    if (!devices || devices.length === 0) throw new Error('USB ELM327 cihazı bulunamadı');
    const dev = devices[0];
    const devId = dev.deviceId || dev.path || dev.name || dev.vendorId;
    if (!devId) throw new Error('USB cihaz ID alınamadı');
    await this.RNSerialport.openDevice(devId);
    await this.RNSerialport.setParams(38400, 8, 1, 0, 0);
    if (this.RNSerialport.onReceived) {
      this._subscription = this.RNSerialport.onReceived((data: string) => {
        this.buffer += data;
      });
    }
    return true;
  }

  async disconnect(): Promise<void> {
    if (this._subscription) { try { this._subscription.remove(); } catch {} this._subscription = null; }
    if (this.RNSerialport) {
      try { await this.RNSerialport.closeDevice(); } catch {}
      this.RNSerialport = null;
    }
    this.buffer = '';
  }

  async write(data: string): Promise<void> {
    if (!this.RNSerialport) throw new Error('USB not connected');
    await this.RNSerialport.sendData(data);
  }

  async readAll(): Promise<string> {
    const d = this.buffer;
    this.buffer = '';
    return d;
  }

  async isAvailable(): Promise<number> {
    return this.buffer.length;
  }
}

class WiFiTransport implements Transport {
  private socket: any = null;
  private ip: string;
  private port: number;
  private buffer = '';
  private TcpSocket: any = null;

  constructor(ip: string, port: number = 35000) {
    this.ip = ip;
    this.port = port;
  }

  async connect(_onProgress?: (msg: string) => void): Promise<boolean> {
    try {
      this.TcpSocket = require('react-native-tcp-socket');
    } catch {
      throw new Error('react-native-tcp-socket modülü bulunamadı');
    }
    return new Promise((resolve, reject) => {
      try {
        const client = this.TcpSocket.createConnection(
          {
            host: this.ip,
            port: this.port,
            timeout: 10000,
          },
          () => {
            this.socket = client;
            resolve(true);
          },
        );
        client.on('error', (err: any) => {
          reject(err);
        });
        client.on('timeout', () => {
          client.destroy();
          reject(new Error('Timeout'));
        });
        client.on('data', (data: any) => {
          this.buffer += data.toString();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (_) {}
      this.socket = null;
    }
    this.buffer = '';
  }

  async write(data: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return new Promise((resolve, reject) => {
      this.socket.write(data, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async readAll(): Promise<string> {
    const data = this.buffer;
    this.buffer = '';
    return data;
  }

  async isAvailable(): Promise<number> {
    return this.buffer.length;
  }
}

import {DTC_DESCRIPTIONS} from './DTCDatabase';

// Zamanlama sabitleri
const ATZ_RESET_DELAY = 2000;
const AT_CMD_DELAY = 300;
const ATSP_DELAY = 800;
const WRITE_DELAY = 150;
const READ_POLL_INTERVAL = 80;
const READ_MAX_POLLS = 25;
const READ_EMPTY_LIMIT = 5;
const FAST_WRITE_DELAY = 20;
const FAST_POLL_INTERVAL = 30;
const FAST_MAX_POLLS = 10;
const CONNECT_TIMEOUT = 10000;

class OBD2Service {
  private transport: Transport | null = null;
  private _isConnected = false;
  private dataCallback: OBD2Callback | null = null;
  private connectionCallback: ConnectionCallback | null = null;
  private _vin: string = '';
  private _connecting = false;
  private lastCallbackTime = 0;

  private _writeBusy = false;
  private _writeQueue: Array<() => Promise<void>> = [];

  private validKeysArray: string[] = ['rpm', 'speed', 'batteryVoltage', 'coolantTemp'];
  private validKeys = new Set<string>(this.validKeysArray);

  private currentData: OBD2Data = new Proxy({
    rpm: 0, speed: 0, coolantTemp: 0, engineLoad: 0, intakeTemp: 0,
    maf: 0, throttlePos: 0, fuelLevel: 0, fuelPressure: 0, timingAdvance: 0,
    map: 0, batteryVoltage: 0, shortTermFuelTrim: 0, longTermFuelTrim: 0, commandedAFR: 0, barometricPressure: 0, absoluteLoad: 0,
    relativeThrottlePos: 0, ethanolPercent: 0, fuelSystemStatus: '', o2Sensor1Voltage: 0,
    o2Sensor2Voltage: 0, catalystTempBank1: 0, shortTermFuelTrim2: 0, longTermFuelTrim2: 0,
    distanceSinceDTCClear: 0, fuelRailPressureRelative: 0, runTime: 0, engineOilTemp: 0,
    fuelRate: 0, distanceWithMIL: 0, timeSinceDTCClear: 0, absoluteThrottleB: 0,
    absoluteThrottleC: 0, commandedThrottleActuator: 0, acceleratorPosD: 0,
    warmUpsSinceDTCClear: 0, fuelType: '', timeWithMIL: 0, injectionTiming: 0,
    catalystTempBank2: 0, wideRangeO2B1S1: 0, acceleratorPosE: 0, acceleratorPosF: 0,
    fuelRailPressureAbsolute: 0, egtBank1: 0, evapVaporPressure: 0, relativePedalPos: 0,
    commandedEgr: 0, egrError: 0, commandedEvapPurge: 0, o2B1S1EquivRatio: 0,
    o2B1S2EquivRatio: 0, actualEgr: 0, egrErrorDuty: 0, commandedEvapPurgeFlow: 0,
    milOn: false, dtcCount: 0, actualEngineTorque: 0, driverDemandTorque: 0,
    engineReferenceTorque: 0, turboBoostPressure: 0, odometer: 0, hybridBatteryLife: 0,
    dpfDifferentialPressure: 0, dpfTemp: 0, exhaustPressure: 0, turboRpm: 0, chargeAirCoolerTemp: 0,
    fuelRailGaugePressure: 0, engineFrictionTorque: 0, distanceSinceDTCClearHighRes: 0, throttlePositionG: 0,
  } as OBD2Data, {
    set: (target, prop, value) => {
      if (typeof prop === 'string' && prop !== '_validKeys' && !this.validKeys.has(prop)) {
        this.validKeys.add(prop);
        this.validKeysArray = Array.from(this.validKeys);
      }
      target[prop as keyof OBD2Data] = value as never;
      return true;
    }
  });
  private logBuffer: string[] = [];
  private logMax = 6000;
  private tripStartTime = 0;
  private tripLastSpeed = 0;
  private tripDistanceKm = 0;
  private tripFuelUsedL = 0;
  private tripSpeedSum = 0;
  private tripSpeedCount = 0;
  private tripMaxSpeed = 0;
  private lastLogTime = Date.now();
  private isSimulating = false;
  private currentProtocolLabel = 'Otomatik / Algılanıyor...';
  private _connectionType: ConnectionType = 'bluetooth';
  private _lastConfig: ConnectionConfig | null = null;
  private supportedPids: Set<string> = new Set();

  private parseSupportedPids(response: string, offsetHex: string) {
    const clean = response.replace(/\s/g, '');
    const prefix = '41' + offsetHex;
    const idx = clean.indexOf(prefix);
    if (idx === -1) return;
    const data = clean.substring(idx + 4, idx + 12);
    if (data.length < 8) return;
    const val = parseInt(data, 16);
    if (isNaN(val)) return;
    const binary = val.toString(2).padStart(32, '0');
    const offset = parseInt(offsetHex, 16);
    for (let i = 0; i < 32; i++) {
      if (binary[i] === '1') {
        const pidNum = offset + i + 1;
        const pidHex = '01' + pidNum.toString(16).toUpperCase().padStart(2, '0');
        this.supportedPids.add(pidHex);
      }
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get connectionType(): ConnectionType {
    return this._connectionType;
  }

  get protocolLabel(): string {
    return this.currentProtocolLabel;
  }

  get vin(): string {
    return this._vin;
  }

  get lastConfig(): ConnectionConfig | null {
    return this._lastConfig;
  }

  async saveLastDevice(config: ConnectionConfig): Promise<void> {
    this._lastConfig = config;
    try {
      await AsyncStorage.setItem(STORAGE_LAST_DEVICE, JSON.stringify(config));
      await AsyncStorage.setItem(STORAGE_LAST_TYPE, config.type);
    } catch (_) {}
  }

  async loadLastDevice(): Promise<ConnectionConfig | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_LAST_DEVICE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (_) {}
    return null;
  }

  async clearLastDevice(): Promise<void> {
    this._lastConfig = null;
    try {
      await AsyncStorage.removeItem(STORAGE_LAST_DEVICE);
      await AsyncStorage.removeItem(STORAGE_LAST_TYPE);
    } catch (_) {}
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
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
        if (perms.length === 0) return true;
        const results = await PermissionsAndroid.requestMultiple(perms);
        return Object.values(results).every(
          r => r === 'granted' || r === 'never_ask_again',
        );
      } catch {
        return false;
      }
    }
    return true;
  }

  async getPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      const paired = await RNBluetoothClassic.getBondedDevices();
      return paired;
    } catch (err) {
      console.error('Bluetooth error:', err);
      return [];
    }
  }

  async startDiscovery(): Promise<BluetoothDevice[]> {
    try {
      const enabled = await this.isBluetoothEnabled();
      if (!enabled) return [];
      const found = await RNBluetoothClassic.startDiscovery();
      return found;
    } catch (err: any) {
      if (String(err).includes('Security') || String(err).includes('Permission')) {
        console.warn('Discovery permission denied');
      } else {
        console.error('Discovery error:', err);
      }
      return [];
    }
  }

  async cancelDiscovery(): Promise<void> {
    try {
      await RNBluetoothClassic.cancelDiscovery();
    } catch {}
  }

  async isBluetoothEnabled(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.isBluetoothEnabled();
    } catch { return false; }
  }

  async requestBluetoothEnabled(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.requestBluetoothEnabled();
    } catch { return false; }
  }

  async unpairDevice(address: string): Promise<boolean> {
    try {
      return await RNBluetoothClassic.unpairDevice(address);
    } catch {
      // unpair başarısız olursa disconnect dene
      try { await RNBluetoothClassic.disconnectFromDevice(address); } catch {}
      return false;
    }
  }

  openBluetoothSettings() {
    try {
      RNBluetoothClassic.openBluetoothSettings();
    } catch {}
  }

  async connectBluetooth(
    deviceAddress: string,
    deviceName?: string,
  ): Promise<boolean> {
    if (this._connecting) {
      console.log('Zaten bağlantı denemesi sürüyor');
      return false;
    }
    this._connecting = true;
    try {
      this._connectionType = 'bluetooth';
      this.setConnectionState('connecting', 'Bluetooth bağlanıyor...');
      this.transport = new BluetoothTransport(deviceAddress);
      const connected = await this.transport.connect((msg) => {
        this.setConnectionState('connecting', msg);
      });
      if (!connected) {
        await this.disconnectTransport();
        this.setConnectionState('error', 'Bluetooth cihazına bağlanılamadı');
        this._connecting = false;
        return false;
      }
      this.isSimulating = false;
      this._isConnected = true;
      const ok = await this.initializeELM327();
      if (!ok) {
        await this.disconnectTransport();
        this._isConnected = false;
        this._connecting = false;
        this.setConnectionState('error', 'ELM327 başlatılamadı');
        return false;
      }
      await this.detectProtocol();
      this._vin = await this.readVIN();
      this.startPolling();
      this.setConnectionState(
        'connected',
        `${deviceName || deviceAddress} bağlandı`,
      );
      await this.saveLastDevice({
        type: 'bluetooth',
        address: deviceAddress,
        name: deviceName,
      });
      this._connecting = false;
      return true;
    } catch (err) {
      console.error('Bluetooth connection failed:', err);
      await this.disconnectTransport();
      this.setConnectionState('error', 'Bluetooth bağlantı hatası');
      this._connecting = false;
      return false;
    }
  }

  async connectUSB(): Promise<boolean> {
    try {
      this._connectionType = 'usb';
      this.setConnectionState('connecting', 'USB OBD2 bağlanıyor...');
      this.transport = new UsbTransport();
      await this.transport.connect();
      this.isSimulating = false;
      this._isConnected = true;
      const ok = await this.initializeELM327();
      if (!ok) {
        await this.disconnectTransport();
        this.setConnectionState('error', 'USB ELM327 başlatılamadı');
        return false;
      }
      await this.detectProtocol();
      this._vin = await this.readVIN();
      this.startPolling();
      this.setConnectionState('connected', 'USB OBD2 bağlandı');
      await this.saveLastDevice({type: 'usb', name: 'USB ELM327'});
      return true;
    } catch (err) {
      console.error('USB connection failed:', err);
      await this.disconnectTransport();
      this.setConnectionState('error', 'USB bağlantı hatası');
      return false;
    }
  }

  async connectWiFi(ip: string, port: number = 35000): Promise<boolean> {
    try {
      this._connectionType = 'wifi';
      this.setConnectionState(
        'connecting',
        `WiFi bağlanıyor: ${ip}:${port}...`,
      );
      this.transport = new WiFiTransport(ip, port);
      await this.transport.connect();
      this.isSimulating = false;
      this._isConnected = true;
      const ok = await this.initializeELM327();
      if (!ok) {
        await this.disconnectTransport();
        this.setConnectionState('error', 'ELM327 WiFi başlatılamadı');
        return false;
      }
      await this.detectProtocol();
      this._vin = await this.readVIN();
      this.startPolling();
      this.setConnectionState('connected', `WiFi: ${ip}`);
      await this.saveLastDevice({
        type: 'wifi',
        ip,
        port,
        name: `ELM327 WiFi (${ip})`,
      });
      return true;
    } catch (err) {
      console.error('WiFi connection failed:', err);
      await this.disconnectTransport();
      this.setConnectionState('error', `WiFi bağlantı hatası: ${ip}:${port}`);
      return false;
    }
  }

  async autoConnect(): Promise<boolean> {
    if (this._connecting) return false;
    const config = await this.loadLastDevice();
    if (!config) {
      return false;
    }
    this._lastConfig = config;
    // Önce native state temizle
    if (config.type === 'bluetooth' && config.address) {
      try { await RNBluetoothClassic.disconnectFromDevice(config.address); } catch (_) {}
      try {
        const existing = await RNBluetoothClassic.getConnectedDevices();
        for (const d of existing) {
          if (d.address === config.address) try { await d.disconnect(); } catch {}
        }
      } catch {}
      await new Promise(r => setTimeout(r, 300));
    }
    if (config.type === 'bluetooth' && config.address) {
      return this.connectBluetooth(config.address, config.name);
    }
    if (config.type === 'wifi' && config.ip) {
      return this.connectWiFi(config.ip, config.port || 35000);
    }
    if (config.type === 'usb') {
      return this.connectUSB();
    }
    return false;
  }

  startSimulation() {
    this._isConnected = true;
    this.isSimulating = true;
    this._connectionType = 'simulation';
    this.currentProtocolLabel = 'Simülasyon';
    this.setConnectionState('connected', 'Simülasyon Modu Aktif');

    this.pollRunning = true;
    this.currentData.speed = 0;

    const simPoll = () => {
      if (!this.pollRunning) return;
      const d = this.currentData;
      d.rpm = 800 + Math.floor(Math.random() * 2000);
      d.speed = d.speed < 120 ? d.speed + 1 : 0;
      d.coolantTemp = 85 + Math.floor(Math.random() * 15);
      d.engineLoad = 20 + Math.floor(Math.random() * 60);
      d.intakeTemp = 25 + Math.floor(Math.random() * 20);
      d.maf = 2 + Math.random() * 8;
      d.throttlePos = 10 + Math.floor(Math.random() * 70);
      d.fuelLevel = 30 + Math.floor(Math.random() * 50);
      d.fuelPressure = 40 + Math.floor(Math.random() * 20);
      d.timingAdvance = 5 + Math.floor(Math.random() * 20);
      d.map = 30 + Math.floor(Math.random() * 70);
      d.batteryVoltage = 12 + Math.random() * 3;
      d.ambientTemp = 15 + Math.floor(Math.random() * 25);
      d.shortTermFuelTrim = -5 + Math.floor(Math.random() * 10);
      d.longTermFuelTrim = -3 + Math.floor(Math.random() * 6);
      d.commandedAFR = 14 + Math.random();
      d.barometricPressure = 95 + Math.floor(Math.random() * 10);
      d.absoluteLoad = 20 + Math.floor(Math.random() * 60);
      d.relativeThrottlePos = 5 + Math.floor(Math.random() * 40);
      d.ethanolPercent = Math.floor(Math.random() * 15);
      d.fuelSystemStatus = 'Closed Loop';
      d.o2Sensor1Voltage = 0.1 + Math.random() * 0.8;
      d.o2Sensor2Voltage = 0.1 + Math.random() * 0.8;
      d.catalystTempBank1 = 400 + Math.floor(Math.random() * 200);
      d.shortTermFuelTrim2 = -4 + Math.floor(Math.random() * 8);
      d.longTermFuelTrim2 = -2 + Math.floor(Math.random() * 4);
      d.distanceSinceDTCClear = Math.floor(Math.random() * 500);
      d.fuelRailPressureRelative = 300 + Math.floor(Math.random() * 100);
      d.runTime = Math.floor(Date.now() / 1000) % 3600;
      d.engineOilTemp = 80 + Math.floor(Math.random() * 30);
      d.fuelRate = Math.round((2 + Math.random() * 10) * 10) / 10;
      d.distanceWithMIL = Math.floor(Math.random() * 200);
      d.timeSinceDTCClear = Math.floor(Math.random() * 1440);
      d.absoluteThrottleB = 8 + Math.floor(Math.random() * 60);
      d.absoluteThrottleC = 5 + Math.floor(Math.random() * 40);
      d.commandedThrottleActuator = 10 + Math.floor(Math.random() * 70);
      d.acceleratorPosD = 10 + Math.floor(Math.random() * 80);
      d.warmUpsSinceDTCClear = Math.floor(Math.random() * 20);
      d.fuelType = 'Benzin';
      d.timeWithMIL = Math.floor(Math.random() * 120);
      d.injectionTiming = Math.round((2 + Math.random() * 15) * 10) / 10;
      d.catalystTempBank2 = 350 + Math.floor(Math.random() * 250);
      d.wideRangeO2B1S1 = Math.round((0.8 + Math.random() * 0.4) * 100) / 100;
      d.acceleratorPosE = 5 + Math.floor(Math.random() * 30);
      d.acceleratorPosF = 3 + Math.floor(Math.random() * 20);
      d.fuelRailPressureAbsolute = 300 + Math.floor(Math.random() * 200);
      d.egtBank1 = 500 + Math.floor(Math.random() * 300);
      d.evapVaporPressure = Math.floor(Math.random() * 1000) - 500;
      d.relativePedalPos = 10 + Math.floor(Math.random() * 80);
      d.commandedEgr = Math.floor(Math.random() * 60);
      d.egrError = Math.floor(Math.random() * 10) - 5;
      d.commandedEvapPurge = Math.floor(Math.random() * 50);
      d.o2B1S1EquivRatio = Math.round((0.8 + Math.random() * 0.4) * 100) / 100;
      d.o2B1S2EquivRatio = Math.round((0.8 + Math.random() * 0.4) * 100) / 100;
      d.actualEgr = Math.floor(Math.random() * 50);
      d.egrErrorDuty = Math.floor(Math.random() * 10) - 5;
      d.commandedEvapPurgeFlow = Math.floor(Math.random() * 50);
      d.milOn = false;
      d.dtcCount = 0;
      d.actualEngineTorque = 20 + Math.floor(Math.random() * 60);
      d.driverDemandTorque = 25 + Math.floor(Math.random() * 70);
      d.engineReferenceTorque = 300;
      d.turboBoostPressure = Math.floor(Math.random() * 150);
      d.odometer = 0;
      d.hybridBatteryLife = 0;
      d.dpfDifferentialPressure = 0;
      d.dpfTemp = 0;
      d.exhaustPressure = 0;
      d.turboRpm = 0;
      d.chargeAirCoolerTemp = 0;
      d.throttlePositionG = 0;
      this.updateTripData(d.speed);
      this.addLogEntry(d);
      if (this.dataCallback) {
        this.dataCallback({...d});
      }
      this.pollTimer = setTimeout(simPoll, 300);
    };
    this.pollTimer = setTimeout(simPoll, 100);
  }

  private setConnectionState(state: ConnectionState, message?: string) {
    if (this.connectionCallback) {
      this.connectionCallback(state, message);
    }
  }

  onConnectionUpdate(callback: ConnectionCallback) {
    this.connectionCallback = callback;
  }

  onDataUpdate(callback: OBD2Callback) {
    this.dataCallback = callback;
  }

  getLastData(): OBD2Data {
    return {...this.currentData};
  }

  // Write queue - tüm komutlar sırayla işlenir
  private async enqueueWrite(fn: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this._writeQueue.push(async () => {
        try { await fn(); resolve(); }
        catch (e) { reject(e); }
      });
      if (!this._writeBusy) this._processQueue();
    });
  }

  private async _processQueue() {
    this._writeBusy = true;
    while (this._writeQueue.length > 0) {
      const fn = this._writeQueue.shift();
      if (fn) await fn();
    }
    this._writeBusy = false;
  }

  private async sendCommand(cmd: string): Promise<string> {
    const t = this.transport;
    if (!t || !this._isConnected) return '';
    try {
      await t.readAll();
      await this.enqueueWrite(() => t.write(cmd + '\r'));
      await this.delay(WRITE_DELAY);
      let response = '';
      let emptyCount = 0;
      for (let i = 0; i < READ_MAX_POLLS; i++) {
        await this.delay(READ_POLL_INTERVAL);
        const chunk = await t.readAll();
        if (chunk) {
          response += chunk;
          emptyCount = 0;
        } else {
          emptyCount++;
          if (emptyCount > READ_EMPTY_LIMIT && response.length > 0) break;
        }
        if (response.includes('>')) break;
      }
      let clean = response.replace(/\d+:/g, '').replace(/>/g, '').replace(/\s/g, '').trim();
      if (cmd.startsWith('01') && cmd.length === 4) {
        const respPrefix = '41' + cmd.substring(2);
        const idx = clean.indexOf(respPrefix);
        if (idx > 0) clean = clean.substring(idx);
        else if (idx < 0) clean = '';
      }
      return clean;
    } catch (e) {
      const msg = String(e);
      if (msg.includes('Not connected') || msg.includes('disconnected') || msg.includes('closed')) {
        this._isConnected = false;
        this.setConnectionState('disconnected', 'Bağlantı koptu');
      }
      return '';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  private async readMorePidRanges(sendFn: (cmd: string) => Promise<string>): Promise<void> {
    if (!this.supportedPids.has('0120')) return;
    const r20 = await sendFn('0120');
    if (!r20 || r20.includes('NO DATA')) return;
    this.parseSupportedPids(r20, '20');
    if (!this.supportedPids.has('0140')) return;
    const r40 = await sendFn('0140');
    if (!r40 || r40.includes('NO DATA')) return;
    this.parseSupportedPids(r40, '40');
    if (!this.supportedPids.has('0160')) return;
    const r60 = await sendFn('0160');
    if (!r60 || r60.includes('NO DATA')) return;
    this.parseSupportedPids(r60, '60');
    if (!this.supportedPids.has('0180')) return;
    const r80 = await sendFn('0180');
    if (!r80 || r80.includes('NO DATA')) return;
    this.parseSupportedPids(r80, '80');
    if (!this.supportedPids.has('01A0')) return;
    const rA0 = await sendFn('01A0');
    if (rA0 && !rA0.includes('NO DATA')) this.parseSupportedPids(rA0, 'A0');
  }

  private async initializeELM327(): Promise<boolean> {
    await this.sendCommand('ATZ');
    await this.delay(ATZ_RESET_DELAY);
    await this.sendCommand('ATE0');
    await this.delay(AT_CMD_DELAY);
    await this.sendCommand('ATL0');
    await this.delay(AT_CMD_DELAY);
    await this.sendCommand('ATS0');
    await this.delay(AT_CMD_DELAY);
    await this.sendCommand('ATAT1');
    await this.delay(AT_CMD_DELAY);
    await this.sendCommand('ATST64');
    await this.delay(AT_CMD_DELAY);

    this.supportedPids.clear();
    await this.sendCommand('ATSP0');
    await this.delay(ATSP_DELAY);
    const testResp = await this.sendCommand('0100');
    if (testResp && !testResp.includes('UNABLE') && !testResp.includes('NO DATA')) {
      console.log('initializeELM327: ECU yanıt verdi');
      this.parseSupportedPids(testResp, '00');
      await this.readMorePidRanges(this.sendCommand.bind(this));
      return true;
    }

    console.log('initializeELM327: Otomatik protokol başarısız, protokoller taranıyor...');
    const tryProtocols = ['6', '7', '5', '3', '8', '9', '1', '2', '4', 'A', 'B', 'C'];
    for (const proto of tryProtocols) {
      await this.sendCommand(`ATSP${proto}`);
      await this.delay(AT_CMD_DELAY);
      const resp = await this.sendCommand('0100');
      if (resp && !resp.includes('UNABLE') && !resp.includes('NO DATA') && !resp.includes('?')) {
        this.currentProtocolLabel = PROTOCOL_LABELS[proto] || `SP ${proto}`;
        console.log(`initializeELM327: Protokol ${proto} (${this.currentProtocolLabel}) çalışıyor`);
        this.parseSupportedPids(resp, '00');
        await this.readMorePidRanges(this.sendCommand.bind(this));
        await this.sendCommand('ATST64');
        await this.delay(100);
        return true;
      }
    }
    await this.sendCommand('ATST64');

    console.error('initializeELM327: Hiçbir protokol ECU ile iletişim kuramadı');
    return false;
  }

  private async detectProtocol() {
    const resp = await this.sendCommand('ATDPN');
    const clean = resp.replace(/\s/g, '');
    if (clean) {
      const match = clean.match(/A?(\d+|[A-F])/i);
      if (match) {
        const proto = match[1].toUpperCase();
        this.currentProtocolLabel =
          PROTOCOL_LABELS[proto] || `Protokol ${proto}`;
        return;
      }
    }
    this.currentProtocolLabel = 'Otomatik (Algılandı)';
  }

  async readVIN(): Promise<string> {
    const resp = await this.sendCommand('0902');
    const clean = resp.replace(/[\s\r\n>]/g, '');
    const idx = clean.indexOf('4902');
    if (idx >= 0) {
      const hex = clean.substring(idx + 4);
      let vin = '';
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substring(i, i + 2), 16);
        if (!isNaN(code) && code >= 32 && code <= 126) {
          vin += String.fromCharCode(code);
        }
      }
      return vin;
    }
    return '';
  }

  async setProtocol(protocolValue: string) {
    await this.sendCommand(`ATSP${protocolValue}`);
    await this.delay(300);
    await this.detectProtocol();
  }

  async scanAllProtocols(): Promise<{protocol: string; label: string; success: boolean}[]> {
    const wasPolling = this.pollRunning;
    if (wasPolling) this.stopPolling();
    const results: {protocol: string; label: string; success: boolean}[] = [];
    const protocols = ['3', '4', '5', '6', '7', '8', '9', 'A', '1', '2', 'B', 'C'];
    for (const p of protocols) {
      const label = PROTOCOL_LABELS[p] || `SP${p}`;
      await this.sendCommand(`ATSP${p}`);
      await this.delay(400);
      await this.sendCommand('ATE0');
      await this.delay(100);
      const resp = await this.sendCommand('010C');
      if (resp.startsWith('410C') || resp.includes('410C')) {
        this.currentProtocolLabel = `${label} (CAN)`;
        if (wasPolling) this.startPolling();
        return results;
      }
    }
    await this.sendCommand('ATSP0');
    await this.delay(300);
    await this.detectProtocol();
    if (wasPolling) this.startPolling();
    return results;
  }

  async sendRawAT(cmd: string): Promise<string> {
    return this.sendCommand(cmd);
  }

  private canRespAddr(header: string): string {
    const val = parseInt(header, 16);
    if (isNaN(val)) return header;
    return (val + 8).toString(16).toUpperCase();
  }

  async readFeature(feature: HiddenFeature): Promise<string> {
    if (!this._isConnected) return 'Bağlı değil';
    if (this.isSimulating) return 'Simülasyon: ' + feature.readCmd;
    if (!feature.readHeader) return this.sendCommand(feature.readCmd);
    await this.sendCommand(`ATSH${feature.readHeader}`);
    await this.sendCommand('ATCRA' + this.canRespAddr(feature.readHeader));
    await this.delay(30);
    return this.sendCommand(feature.readCmd);
  }

  async writeFeature(feature: HiddenFeature, turnOn: boolean): Promise<string> {
    if (!this._isConnected) return 'Bağlı değil';
    if (this.isSimulating) return 'Simülasyon: ' + (turnOn ? 'AÇ' : 'KAPAT');
    const cmd = turnOn ? feature.writeOn : feature.writeOff;
    if (!feature.writeHeader) return this.sendCommand(cmd);
    await this.sendCommand(`ATSH${feature.writeHeader}`);
    await this.sendCommand('ATCRA' + this.canRespAddr(feature.writeHeader));
    await this.delay(30);
    return this.sendCommand(cmd);
  }

  async sendCustomCommand(cmd: string): Promise<string> {
    if (!this._isConnected) return 'Bağlı değil';
    if (this.isSimulating) return 'Simülasyon: ' + cmd;
    return this.sendCommand(cmd);
  }

  private pollRunning = false;
  private pollTimer: any = null;
  private pollCycle = 0;
  private pollErrorCount = 0;

  private canPoll(pid: string): boolean {
    return this.supportedPids.size === 0 || this.supportedPids.has(pid);
  }

  private async sendCommandFast(cmd: string): Promise<string> {
    if (cmd.startsWith('01') && cmd.length === 4) {
      if (!this.canPoll(cmd)) return '';
    }
    const t = this.transport;
    if (!t || !this._isConnected) return '';
    try {
      await t.readAll();
      await this.enqueueWrite(() => t.write(cmd + '\r'));
      await this.delay(FAST_WRITE_DELAY);
      let response = '';
      for (let i = 0; i < FAST_MAX_POLLS; i++) {
        await this.delay(FAST_POLL_INTERVAL);
        const chunk = await t.readAll();
        if (chunk) response += chunk;
        if (response.includes('>')) break;
      }
      let clean = response.replace(/\d+:/g, '').replace(/>/g, '').replace(/\s/g, '').trim();
      if (cmd.startsWith('01') && cmd.length === 4) {
        const respPrefix = '41' + cmd.substring(2);
        const idx = clean.indexOf(respPrefix);
        if (idx > 0) clean = clean.substring(idx);
        else if (idx < 0) clean = '';
      }
      return clean;
    } catch (e) {
      const msg = String(e);
      if (msg.includes('Not connected') || msg.includes('disconnected') || msg.includes('closed')) {
        this._isConnected = false;
        this.setConnectionState('disconnected', 'Bağlantı koptu');
      }
      return '';
    }
  }

  private async sendCritical(): Promise<boolean> {
    const r1 = await this.sendCommandFast('010C'); this.parseRPM(r1);
    if (!this.pollRunning) return false;
    const r2 = await this.sendCommandFast('010D'); this.parseSpeed(r2);
    if (!this.pollRunning) return false;
    const r3 = await this.sendCommandFast('0105'); this.parseCoolantTemp(r3);
    if (!this.pollRunning) return false;

    this.updateTripData(this.currentData.speed);
    this.addLogEntry(this.currentData);
    if (this.dataCallback) {
      this.dataCallback({...this.currentData});
    }
    this.updateWidget();
    return true;
  }

  private updateWidget() {
    try {
      if (NativeModules.WidgetDataModule) {
        NativeModules.WidgetDataModule.updateWidget({
          rpm: String(Math.floor(this.currentData.rpm || 0)),
          speed: String(Math.floor(this.currentData.speed || 0)),
          coolant: this.currentData.coolantTemp != null ? String(Math.floor(this.currentData.coolantTemp)) : '--',
          connected: this._isConnected,
        });
      }
    } catch (_e) {}
  }

  private startPolling() {
    this.pollRunning = true;
    this.pollCycle = 0;
    this.pollErrorCount = 0;

    const poll = async () => {
      try {
        if (!this.pollRunning || !this._isConnected || !this.transport) return;

        this.pollCycle++;
        const cycle = this.pollCycle;

        const isIdle = this.currentData.speed === 0 && this.currentData.rpm === 0;

        const ok = await this.sendCritical();
        if (!ok || !this.pollRunning) return;

        if (isIdle) {
          if (this.pollCycle % 3 !== 0) {
            this.pollTimer = setTimeout(poll, 1000);
            return;
          }
        }

        // Genişletilmiş sensörler - döngü başına 3-4 adet dağıtıldı
        switch (cycle % 6) {
          case 1: {
            const r1 = await this.sendCommandFast('0110'); this.parseMAF(r1);
            const r2 = await this.sendCommandFast('010B'); this.parseMAP(r2);
            const r3 = await this.sendCommandFast('0104'); this.parseEngineLoad(r3);
            const r4 = await this.sendCommandFast('010F'); this.parseIntakeTemp(r4);
            break;
          }
          case 2: {
            const rv = await this.sendCommandFast('ATRV');
            if (rv && rv.includes('V')) {
              const v = parseFloat(rv.replace('V', ''));
              if (!isNaN(v)) this.currentData.batteryVoltage = v;
            } else {
              const r1 = await this.sendCommandFast('0142'); this.parseBatteryVoltage(r1);
            }
            const r2 = await this.sendCommandFast('0101'); this.parseMonitorStatusForPoll(r2);
            const r3 = await this.sendCommandFast('0111'); this.parseThrottlePos(r3);
            const r4 = await this.sendCommandFast('012F'); this.parseFuelLevel(r4);
            break;
          }
          case 3: {
            const r1 = await this.sendCommandFast('010E'); this.parseTimingAdvance(r1);
            const r2 = await this.sendCommandFast('0146'); this.parseAmbientTemp(r2);
            const r3 = await this.sendCommandFast('0144'); this.parseCommandedAFR(r3);
            const r4 = await this.sendCommandFast('0133'); this.parseBarometricPressure(r4);
            break;
          }
          case 4: {
            const r1 = await this.sendCommandFast('015C'); this.parseEngineOilTemp(r1);
            const r2 = await this.sendCommandFast('015E'); this.parseFuelRate(r2);
            const r3 = await this.sendCommandFast('011F'); this.parseRunTime(r3);
            const r4 = await this.sendCommandFast('015D'); this.parseInjectionTiming(r4);
            break;
          }
          case 5: {
            const r1 = await this.sendCommandFast('0107'); this.parseShortTermFuelTrim(r1);
            const r2 = await this.sendCommandFast('0108'); this.parseLongTermFuelTrim(r2);
            const r3 = await this.sendCommandFast('0123'); this.parseFuelPressure(r3);
            break;
          }
          case 0: {
            const r1 = await this.sendCommandFast('0147'); this.parseAbsoluteThrottleB(r1);
            const r2 = await this.sendCommandFast('0148'); this.parseAbsoluteThrottleC(r2);
            const r3 = await this.sendCommandFast('014C'); this.parseCommandedThrottleActuator(r3);
            const r4 = await this.sendCommandFast('0149'); this.parseAcceleratorPosD(r4);
            const r5 = await this.sendCommandFast('0161'); this.parseDriverDemandTorque(r5);
            break;
          }
        }
        if (!this.pollRunning) return;

        // Süper genişletilmiş sensörler - döngü başına 2-5 adet dağıtıldı
        switch ((cycle - 1) % 15 + 1) {
          case 1: {
            const r1 = await this.sendCommandFast('0114'); this.parseO2Sensor1Voltage(r1);
            const r2 = await this.sendCommandFast('013C'); this.parseCatalystTempBank1(r2);
            break;
          }
          case 2: {
            const r1 = await this.sendCommandFast('0131'); this.parseDistanceSinceDTCClear(r1);
            const r2 = await this.sendCommandFast('0122'); this.parseFuelRailPressureRelative(r2);
            break;
          }
          case 3: {
            const r1 = await this.sendCommandFast('0159'); this.parseFuelRailPressureAbsolute(r1);
            const r2 = await this.sendCommandFast('015F'); this.parseEGTBank1(r2);
            break;
          }
          case 4: {
            const r1 = await this.sendCommandFast('0153'); this.parseEVAPVaporPressure(r1);
            const r2 = await this.sendCommandFast('015A'); this.parseRelativePedalPos(r2);
            break;
          }
          case 5: {
            const r1 = await this.sendCommandFast('0143'); this.parseAbsoluteLoad(r1);
            const r2 = await this.sendCommandFast('0145'); this.parseRelativeThrottlePos(r2);
            break;
          }
          case 6: {
            const r1 = await this.sendCommandFast('0152'); this.parseEthanolPercent(r1);
            const r2 = await this.sendCommandFast('0103'); this.parseFuelSystemStatus(r2);
            break;
          }
          case 7: {
            const r1 = await this.sendCommandFast('0115'); this.parseO2Sensor2Voltage(r1);
            const r2 = await this.sendCommandFast('0109'); this.parseShortTermFuelTrim2(r2);
            const r3 = await this.sendCommandFast('010A'); this.parseLongTermFuelTrim2(r3);
            break;
          }
          case 8: {
            const r1 = await this.sendCommandFast('0121'); this.parseDistanceWithMIL(r1);
            const r2 = await this.sendCommandFast('014F'); this.parseTimeSinceDTCClear(r2);
            break;
          }
          case 9: {
            const r1 = await this.sendCommandFast('0130'); this.parseWarmUpsSinceDTCClear(r1);
            const r2 = await this.sendCommandFast('0151'); this.parseFuelType(r2);
            const r3 = await this.sendCommandFast('014E'); this.parseTimeWithMIL(r3);
            break;
          }
          case 10: {
            const r1 = await this.sendCommandFast('013D'); this.parseCatalystTempBank2(r1);
            const r2 = await this.sendCommandFast('0134'); this.parseWideRangeO2B1S1(r2);
            const r3 = await this.sendCommandFast('014A'); this.parseAcceleratorPosE(r3);
            const r4 = await this.sendCommandFast('014B'); this.parseAcceleratorPosF(r4);
            break;
          }
          case 11: {
            const r1 = await this.sendCommandFast('012C'); this.parseCommandedEgr(r1);
            const r2 = await this.sendCommandFast('012D'); this.parseEgrError(r2);
            const r3 = await this.sendCommandFast('012E'); this.parseCommandedEvapPurge(r3);
            break;
          }
          case 12: {
            const r1 = await this.sendCommandFast('0124'); this.parseO2B1S1EquivRatio(r1);
            const r2 = await this.sendCommandFast('0125'); this.parseO2B1S2EquivRatio(r2);
            const r3 = await this.sendCommandFast('0160'); this.parseActualEgr(r3);
            const r4 = await this.sendCommandFast('0161'); this.parseEgrErrorDuty(r4);
            const r5 = await this.sendCommandFast('0162'); this.parseActualEngineTorque(r5);
            const r6 = await this.sendCommandFast('0163'); this.parseEngineReferenceTorque(r6);
            break;
          }
          case 13: {
            const r1 = await this.sendCommandFast('01A6'); this.parseOdometer(r1);
            const r2 = await this.sendCommandFast('015B'); this.parseHybridBatteryLife(r2);
            const r3 = await this.sendCommandFast('017A'); this.parseDpfDifferentialPressure(r3);
            const r4 = await this.sendCommandFast('017C'); this.parseDpfTemp(r4);
            break;
          }
          case 14: {
            const r1 = await this.sendCommandFast('0173'); this.parseExhaustPressure(r1);
            const r2 = await this.sendCommandFast('0174'); this.parseTurboRpm(r2);
            const r3 = await this.sendCommandFast('0177'); this.parseChargeAirCoolerTemp(r3);
            const r4 = await this.sendCommandFast('0123'); this.parseFuelRailGaugePressure(r4);
            break;
          }
          case 15: {
            const r1 = await this.sendCommandFast('015D'); this.parseInjectionTiming(r1);
            const r2 = await this.sendCommandFast('018E'); this.parseEngineFrictionTorque(r2);
            const r3 = await this.sendCommandFast('018B'); this.parseDistanceSinceDTCClearHighRes(r3);
            const r4 = await this.sendCommandFast('018D'); this.parseThrottlePositionG(r4);
            break;
          }
        }

        this.pollTimer = setTimeout(poll, isIdle ? 1000 : 25);
        if (this.dataCallback && (Date.now() - this.lastCallbackTime > 250)) {
          this.currentData._validKeys = this.validKeysArray;
          this.dataCallback({...this.currentData});
          this.lastCallbackTime = Date.now();
        }
        this.pollErrorCount = 0;

      } catch (e) {
        console.error('Polling hatası:', e);
        this.pollErrorCount++;
        const delay = Math.min(1000 * Math.pow(2, this.pollErrorCount - 1), 30000);
        if (this.pollRunning) this.pollTimer = setTimeout(poll, delay);
      }
    };

    this.pollTimer = setTimeout(poll, 200);
  }

  private stopPolling() {
    this.pollRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  pausePolling() { this.stopPolling(); }

  resumePolling() {
    if (this.isSimulating) {
      this.startSimulation();
    } else if (this._isConnected && this.transport) {
      this.startPolling();
    }
  }

  async goBackground() {
    this.stopPolling();
    if (this.isSimulating) {
      this.isSimulating = false;
      this._isConnected = false;
      this.pollRunning = false;
      return;
    }
    this._isConnected = false;
    if (this.transport) {
      try { await this.transport.disconnect(); } catch (_) {}
      this.transport = null;
    }
  }

  private _lastReconnectAttempt = 0;

  async goForeground() {
    if (this.isSimulating) {
      this.startSimulation();
      return;
    }
    const now = Date.now();
    if (now - this._lastReconnectAttempt < 15000) return;
    this._lastReconnectAttempt = now;
    const config = await this.loadLastDevice();
    if (!config) return;
    this._lastConfig = config;
    if (config.type === 'bluetooth') {
      try {
        if (!await this.isBluetoothEnabled()) {
          this.setConnectionState('disconnected', 'Bluetooth kapalı');
          return;
        }
      } catch (_) {}
    }
    this.setConnectionState('connecting', 'Yeniden bağlanıyor...');
    let ok = false;
    if (config.type === 'bluetooth' && config.address) {
      ok = await this.connectBluetooth(config.address, config.name);
    } else if (config.type === 'wifi' && config.ip) {
      ok = await this.connectWiFi(config.ip, config.port || 35000);
    } else if (config.type === 'usb') {
      ok = await this.connectUSB();
    }
    if (!ok) {
      this.setConnectionState('disconnected', 'Yeniden bağlanılamadı');
    }
  }

  private parseHexValue(
    response: string,
    prefix: string,
    startIndex: number,
    length: number,
  ): number | null {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith(prefix) && clean.length >= startIndex + length) {
      const val = parseInt(
        clean.substring(startIndex, startIndex + length),
        16,
      );
      return isNaN(val) ? null : val;
    }
    return null;
  }

  private parseRPM(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('410C') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.rpm = Math.floor((A * 256 + B) / 4);
      }
    }
  }

  private parseSpeed(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('410D') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.speed = A;
      }
    }
  }

  private parseCoolantTemp(response: string) {
    const val = this.parseHexValue(response, '4105', 4, 2);
    if (val !== null) {
      this.currentData.coolantTemp = val - 40;
    }
  }

  private parseEngineLoad(response: string) {
    const val = this.parseHexValue(response, '4104', 4, 2);
    if (val !== null) {
      this.currentData.engineLoad = Math.round((val / 255) * 100);
    }
  }

  private parseIntakeTemp(response: string) {
    const val = this.parseHexValue(response, '410F', 4, 2);
    if (val !== null) {
      this.currentData.intakeTemp = val - 40;
    }
  }

  private parseMAF(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4110') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.maf = Math.round(((A * 256 + B) / 100) * 10) / 10;
      }
    }
  }

  private parseThrottlePos(response: string) {
    const val = this.parseHexValue(response, '4111', 4, 2);
    if (val !== null) {
      this.currentData.throttlePos = Math.round((val / 255) * 100);
    }
  }

  private parseFuelLevel(response: string) {
    const val = this.parseHexValue(response, '412F', 4, 2);
    if (val !== null) {
      this.currentData.fuelLevel = Math.round((val / 255) * 100);
    }
  }

  private parseMAP(response: string) {
    const val = this.parseHexValue(response, '410B', 4, 2);
    if (val !== null) {
      this.currentData.map = val;
      if (this.currentData.barometricPressure > 0) {
        this.currentData.turboBoostPressure = Math.max(0, val - this.currentData.barometricPressure);
      }
    }
  }

  private parseTimingAdvance(response: string) {
    const val = this.parseHexValue(response, '410E', 4, 2);
    if (val !== null) {
      this.currentData.timingAdvance = (val / 2) - 64;
    }
  }

  private parseFuelPressure(response: string) {
    const val = this.parseHexValue(response, '4123', 4, 2);
    if (val !== null) {
      this.currentData.fuelPressure = val * 10;
    }
  }

  private parseBatteryVoltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4142') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.batteryVoltage = Math.round(((A * 256 + B) / 1000) * 10) / 10;
      }
    }
  }

  private parseAmbientTemp(response: string) {
    const val = this.parseHexValue(response, '4146', 4, 2);
    if (val !== null) {
      this.currentData.ambientTemp = val - 40;
    }
  }

  private parseShortTermFuelTrim(response: string) {
    const val = this.parseHexValue(response, '4107', 4, 2);
    if (val !== null) {
      this.currentData.shortTermFuelTrim = Math.round(((val / 128) - 1) * 100);
    }
  }

  private parseLongTermFuelTrim(response: string) {
    const val = this.parseHexValue(response, '4108', 4, 2);
    if (val !== null) {
      this.currentData.longTermFuelTrim = Math.round(((val / 128) - 1) * 100);
    }
  }

  private parseCommandedAFR(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4144') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.commandedAFR = Math.round(((A * 256 + B) / 32768) * 14.7 * 10) / 10;
      }
    }
  }

  private parseBarometricPressure(response: string) {
    const val = this.parseHexValue(response, '4133', 4, 2);
    if (val !== null) this.currentData.barometricPressure = val;
  }

  private parseAbsoluteLoad(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4143') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.absoluteLoad = Math.round(((A * 256 + B) / 255) * 100);
      }
    }
  }

  private parseRelativeThrottlePos(response: string) {
    const val = this.parseHexValue(response, '4145', 4, 2);
    if (val !== null) this.currentData.relativeThrottlePos = Math.round((val / 255) * 100);
  }

  private parseEthanolPercent(response: string) {
    const val = this.parseHexValue(response, '4152', 4, 2);
    if (val !== null) this.currentData.ethanolPercent = val;
  }

  private parseFuelSystemStatus(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4103') && clean.length >= 8) {
      const s1 = parseInt(clean.substring(4, 6), 16);
      const statuses: Record<number, string> = {
        0: 'Arızalı', 1: 'Open Loop', 2: 'Closed Loop',
        4: 'Open Loop (Fault)', 8: 'Closed Loop (Fault)',
        16: 'Kapalı',
      };
      this.currentData.fuelSystemStatus = statuses[s1] || `Bilinmeyen (${s1})`;
    }
  }

  private parseO2Sensor1Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4114') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.o2Sensor1Voltage = Math.round((A / 200) * 10) / 10;
      }
    }
  }

  private parseO2Sensor2Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4115') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.o2Sensor2Voltage = Math.round((A / 200) * 10) / 10;
      }
    }
  }

  private parseCatalystTempBank1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('413C') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.catalystTempBank1 = Math.round(((A * 256 + B) / 10) - 40);
      }
    }
  }

  private parseShortTermFuelTrim2(response: string) {
    const val = this.parseHexValue(response, '4109', 4, 2);
    if (val !== null) this.currentData.shortTermFuelTrim2 = Math.round(((val / 128) - 1) * 100);
  }

  private parseLongTermFuelTrim2(response: string) {
    const val = this.parseHexValue(response, '410A', 4, 2);
    if (val !== null) this.currentData.longTermFuelTrim2 = Math.round(((val / 128) - 1) * 100);
  }

  private parseDistanceSinceDTCClear(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4131') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.distanceSinceDTCClear = Math.round((A * 256 + B));
    }
  }

  private parseFuelRailPressureRelative(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4122') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.fuelRailPressureRelative = Math.round((A * 256 + B) * 0.079);
    }
  }

  private parseRunTime(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('411F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.runTime = A * 256 + B;
    }
  }

  private parseEngineOilTemp(response: string) {
    const val = this.parseHexValue(response, '415C', 4, 2);
    if (val !== null) this.currentData.engineOilTemp = val - 40;
  }

  private parseFuelRate(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('415E') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.fuelRate = Math.round(((A * 256 + B) / 20) * 10) / 10;
    }
  }

  private parseDistanceWithMIL(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4121') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.distanceWithMIL = A * 256 + B;
    }
  }

  private parseActualEngineTorque(response: string) {
    const val = this.parseHexValue(response, '4162', 4, 2);
    if (val !== null) this.currentData.actualEngineTorque = val - 125;
  }

  private parseDriverDemandTorque(response: string) {
    const val = this.parseHexValue(response, '4161', 4, 2);
    if (val !== null) this.currentData.driverDemandTorque = val - 125;
  }

  private parseEngineReferenceTorque(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4163') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.engineReferenceTorque = A * 256 + B;
    }
  }

  private parseTimeSinceDTCClear(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('414F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.timeSinceDTCClear = A * 256 + B;
    }
  }

  private parseAbsoluteThrottleB(response: string) {
    const val = this.parseHexValue(response, '4147', 4, 2);
    if (val !== null) this.currentData.absoluteThrottleB = Math.round((val / 255) * 100);
  }

  private parseAbsoluteThrottleC(response: string) {
    const val = this.parseHexValue(response, '4148', 4, 2);
    if (val !== null) this.currentData.absoluteThrottleC = Math.round((val / 255) * 100);
  }

  private parseCommandedThrottleActuator(response: string) {
    const val = this.parseHexValue(response, '414C', 4, 2);
    if (val !== null) this.currentData.commandedThrottleActuator = Math.round((val / 255) * 100);
  }

  private parseAcceleratorPosD(response: string) {
    const val = this.parseHexValue(response, '4149', 4, 2);
    if (val !== null) this.currentData.acceleratorPosD = Math.round((val / 255) * 100);
  }

  private parseWarmUpsSinceDTCClear(response: string) {
    const val = this.parseHexValue(response, '4130', 4, 2);
    if (val !== null) this.currentData.warmUpsSinceDTCClear = val;
  }

  private parseFuelType(response: string) {
    const val = this.parseHexValue(response, '4151', 4, 2);
    if (val !== null) {
      const types: Record<number, string> = {
        1: 'Benzin', 2: 'Metanol', 3: 'Etanol', 4: 'Dizel',
        5: 'LPG', 6: 'CNG', 7: 'Propan', 8: 'Elektrik',
        9: 'Hibrit', 10: 'Biyodizel', 11: 'Etanol (E85)',
        12: 'Metanol (M85)',
      };
      this.currentData.fuelType = types[val] || `Bilinmeyen (${val})`;
    }
  }

  private parseTimeWithMIL(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('414E') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.timeWithMIL = A * 256 + B;
    }
  }

  private parseInjectionTiming(response: string) {
    const val = this.parseHexValue(response, '415D', 4, 2);
    if (val !== null) this.currentData.injectionTiming = Math.round(((val / 2) - 64) * 10) / 10;
  }

  private parseCatalystTempBank2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('413D') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.catalystTempBank2 = Math.round(((A * 256 + B) / 10) - 40);
    }
  }

  private parseWideRangeO2B1S1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4134') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.wideRangeO2B1S1 = Math.round(((A * 256 + B) / 32768) * 10) / 10;
    }
  }

  private parseAcceleratorPosE(response: string) {
    const val = this.parseHexValue(response, '414A', 4, 2);
    if (val !== null) this.currentData.acceleratorPosE = Math.round((val / 255) * 100);
  }

  private parseAcceleratorPosF(response: string) {
    const val = this.parseHexValue(response, '414B', 4, 2);
    if (val !== null) this.currentData.acceleratorPosF = Math.round((val / 255) * 100);
  }

  private parseFuelRailPressureAbsolute(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4159') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.fuelRailPressureAbsolute = Math.round(((A * 256 + B) * 10) / 200);
    }
  }

  private parseEGTBank1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('415F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.egtBank1 = Math.round(((A * 256 + B) / 10) - 40);
    }
  }

  private parseEVAPVaporPressure(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4153') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.evapVaporPressure = (A * 256 + B) - 32767;
    }
  }

  private parseRelativePedalPos(response: string) {
    const val = this.parseHexValue(response, '415A', 4, 2);
    if (val !== null) this.currentData.relativePedalPos = Math.round((val / 255) * 100);
  }

  private parseCommandedEgr(response: string) {
    const val = this.parseHexValue(response, '412C', 4, 2);
    if (val !== null) this.currentData.commandedEgr = Math.round((val / 255) * 100);
  }

  private parseEgrError(response: string) {
    const val = this.parseHexValue(response, '412D', 4, 2);
    if (val !== null) this.currentData.egrError = Math.round(((val / 128) - 1) * 100);
  }

  private parseCommandedEvapPurge(response: string) {
    const val = this.parseHexValue(response, '412E', 4, 2);
    if (val !== null) this.currentData.commandedEvapPurge = Math.round((val / 255) * 100);
  }

  private parseO2B1S1EquivRatio(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4124') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.o2B1S1EquivRatio = Math.round(((A * 256 + B) / 32768) * 10) / 10;
    }
  }

  private parseO2B1S2EquivRatio(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4125') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) this.currentData.o2B1S2EquivRatio = Math.round(((A * 256 + B) / 32768) * 10) / 10;
    }
  }

  private parseActualEgr(response: string) {
    const val = this.parseHexValue(response, '4160', 4, 2);
    if (val !== null) this.currentData.actualEgr = Math.round((val / 255) * 100);
  }

  private parseEgrErrorDuty(response: string) {
    const val = this.parseHexValue(response, '4161', 4, 2);
    if (val !== null) this.currentData.egrErrorDuty = Math.round(((val / 128) - 1) * 100);
  }

  private parseCommandedEvapPurgeFlow(response: string) {
    const val = this.parseHexValue(response, '4162', 4, 2);
    if (val !== null) this.currentData.commandedEvapPurgeFlow = Math.round((val / 255) * 100);
  }

  private parseMonitorStatusForPoll(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4101') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A)) {
        this.currentData.milOn = (A >> 7) === 1;
        this.currentData.dtcCount = (A & 0x7F) * 2 + (B >> 4);
      }
    }
  }

  async readMonitorStatus(): Promise<MonitorStatus> {
    if (this.isSimulating) {
      return {
        milOn: false, dtcCount: 0,
        tests: [
          {name: 'Katalitik Konvertör', available: true, completed: true},
          {name: 'Katalitik Isıtıcı', available: true, completed: true},
          {name: 'EGR/VVT Sistemi', available: true, completed: true},
          {name: 'Yakıt Sistemi', available: true, completed: true},
          {name: 'O2 Sensörü', available: true, completed: true},
          {name: 'O2 Isıtıcı', available: true, completed: false},
          {name: 'Buhar Emisyon', available: true, completed: true},
          {name: 'Hava/Yakıt Oranı', available: true, completed: true},
        ],
      };
    }
    if (!this._isConnected || !this.transport) {
      return {milOn: false, dtcCount: 0, tests: []};
    }
    try {
      const resp = await this.sendCommand('0101');
      const clean = resp.replace(/\s/g, '');
      let milOn = false;
      let dtcCount = 0;
      if (clean.startsWith('4101') && clean.length >= 8) {
        const A = parseInt(clean.substring(4, 6), 16);
        const B = parseInt(clean.substring(6, 8), 16);
        if (!isNaN(A)) {
          milOn = (A >> 7) === 1;
          dtcCount = (A & 0x7F) * 2 + (B >> 4);
        }
      }
      const testNames = [
        'Katalitik Konvertör', 'Katalitik Isıtıcı', 'EGR/VVT Sistemi',
        'Yakıt Sistemi', 'O2 Sensörü', 'O2 Isıtıcı', 'Buhar Emisyon',
        'Hava/Yakıt Oranı',
      ];
      const tests = testNames.map((name, i) => {
        const shift = i * 2;
        const byteIdx = Math.floor((shift + 3) / 8);
        const bitIdx = (shift + 3) % 8;
        const byteVal = parseInt(clean.substring(4 + byteIdx * 2, 6 + byteIdx * 2), 16);
        if (!isNaN(byteVal)) {
          const available = ((byteVal >> (bitIdx + 1)) & 1) === 1;
          const completed = ((byteVal >> bitIdx) & 1) === 1;
          return {name, available, completed};
        }
        return {name, available: false, completed: false};
      });
      return {milOn, dtcCount, tests};
    } catch {
      return {milOn: false, dtcCount: 0, tests: []};
    }
  }

  getTripData(): TripData {
    const elapsedH = (Date.now() - this.tripStartTime) / 3600000;
    return {
      startTime: this.tripStartTime,
      distanceKm: Math.round(this.tripDistanceKm * 10) / 10,
      fuelUsedL: Math.round(this.tripFuelUsedL * 100) / 100,
      avgSpeed: this.tripSpeedCount > 0 ? Math.round(this.tripSpeedSum / this.tripSpeedCount) : 0,
      maxSpeed: this.tripMaxSpeed,
      avgConsumption: this.tripDistanceKm > 0
        ? Math.round((this.tripFuelUsedL / this.tripDistanceKm) * 100 * 10) / 10
        : 0,
    };
  }

  isTripRecording(): boolean {
    return this.tripStartTime > 0;
  }

  resetTripData() {
    this.tripStartTime = Date.now();
    this.tripDistanceKm = 0;
    this.tripFuelUsedL = 0;
    this.tripSpeedSum = 0;
    this.tripSpeedCount = 0;
    this.tripMaxSpeed = 0;
  }

  private updateTripData(speedKmh: number) {
    if (!this.tripStartTime) {
      this.tripStartTime = Date.now();
    }
    if (speedKmh > this.tripMaxSpeed) this.tripMaxSpeed = speedKmh;
    if (this.tripLastSpeed > 0 && speedKmh > 0) {
      const dt = 0.5 / 3600;
      const avgSpeedKmh = (this.tripLastSpeed + speedKmh) / 2;
      this.tripDistanceKm += avgSpeedKmh * dt;
      this.tripSpeedSum += speedKmh;
      this.tripSpeedCount++;
      const mafGs = this.currentData.maf;
      if (mafGs > 0) {
        const fuelConsumptionGL = 14.7;
        this.tripFuelUsedL += (mafGs * dt * 3600) / (fuelConsumptionGL * 1000);
      }
    }
    this.tripLastSpeed = speedKmh;
  }

  getLogData(): {headers: string; rows: string[]} {
    if (this.logBuffer.length === 0) return {headers: '', rows: []};
    const keys = Object.keys(this.currentData) as (keyof OBD2Data)[];
    const headers = keys.join(',');
    const rows = this.logBuffer.map(line => line).filter(Boolean);
    return {headers, rows};
  }

  getLogCSV(): string {
    if (this.logBuffer.length === 0) return '';
    const keys = Object.keys(this.currentData) as (keyof OBD2Data)[];
    const headers = 'timestamp,' + keys.join(',') + '\n';
    return headers + this.logBuffer.join('\n');
  }

  clearLogData() {
    this.logBuffer = [];
  }

  private addLogEntry(data: OBD2Data) {
    const now = Date.now();
    if (now - this.lastLogTime < 1000) return;
    this.lastLogTime = now;
    const vals = Object.values(data).map(v =>
      typeof v === 'string' ? v : String(v),
    );
    this.logBuffer.push(now + ',' + vals.join(','));
    if (this.logBuffer.length > this.logMax) {
      this.logBuffer.splice(0, this.logBuffer.length - this.logMax);
    }
  }

  async readDTCs(): Promise<DTC[]> {
    if (this.isSimulating) {
      return this.simulateDTCs();
    }
    if (!this._isConnected || !this.transport) {
      return [];
    }
    try {
      const response = await this.sendCommand('03');
      return this.parseDTCs(response);
    } catch {
      return [];
    }
  }

  async clearDTCs(): Promise<boolean> {
    if (this.isSimulating) {
      return true;
    }
    if (!this._isConnected || !this.transport) {
      return false;
    }
    try {
      const resp = await this.sendCommand('04');
      return resp.includes('OK');
    } catch {
      return false;
    }
  }

  async readFreezeFrame(): Promise<FreezeFrameData | null> {
    if (this.isSimulating) {
      return {
        dtc: {code: 'P0301', description: 'Silindir 1 Ateşleme Hatası'},
        rpm: 1200, speed: 45, coolantTemp: 92, engineLoad: 45,
        intakeTemp: 30, maf: 3.5, throttlePos: 25, fuelLevel: 60,
        map: 45, timingAdvance: 12, shortTermFuelTrim: 3, longTermFuelTrim: -2,
        commandedAFR: 14.7,
      };
    }
    if (!this._isConnected || !this.transport) {
      return null;
    }
    try {
      const dtcResp = await this.sendCommand('02');
      const dtcs = this.parseDTCs(dtcResp);
      const dtc = dtcs.length > 0 ? dtcs[0] : null;

      const rpmResp = await this.sendCommand('020C');
      const speedResp = await this.sendCommand('020D');
      const coolantResp = await this.sendCommand('0205');
      const loadResp = await this.sendCommand('0204');
      const intakeResp = await this.sendCommand('020F');
      const mafResp = await this.sendCommand('0210');
      const throttleResp = await this.sendCommand('0211');
      const fuelResp = await this.sendCommand('022F');
      const mapResp = await this.sendCommand('020B');
      const timingResp = await this.sendCommand('020E');
      const stftResp = await this.sendCommand('0207');
      const ltftResp = await this.sendCommand('0208');
      const afrResp = await this.sendCommand('0244');

      const rpmV = this.parseFreezeFrameRPM(rpmResp);
      const speedV = this.parseHexValueStrict(speedResp, '420D', 4, 2);
      const coolantV = this.parseHexValueStrict(coolantResp, '4205', 4, 2);
      const loadV = this.parseHexValueStrict(loadResp, '4204', 4, 2);
      const intakeV = this.parseHexValueStrict(intakeResp, '420F', 4, 2);
      const mafR = this.parseMAFRaw(mafResp, '4210');
      const throttleV = this.parseHexValueStrict(throttleResp, '4211', 4, 2);
      const fuelV = this.parseHexValueStrict(fuelResp, '422F', 4, 2);
      const mapV = this.parseHexValueStrict(mapResp, '420B', 4, 2);
      const timingV = this.parseHexValueStrict(timingResp, '420E', 4, 2);
      const stftV = this.parseHexValueStrict(stftResp, '4207', 4, 2);
      const ltftV = this.parseHexValueStrict(ltftResp, '4208', 4, 2);
      const afrV = this.parseAFRRaw(afrResp, '4244');

      return {
        dtc,
        rpm: rpmV,
        speed: speedV !== null ? speedV : 0,
        coolantTemp: coolantV !== null ? coolantV - 40 : 0,
        engineLoad: loadV !== null ? Math.round((loadV / 255) * 100) : 0,
        intakeTemp: intakeV !== null ? intakeV - 40 : 0,
        maf: mafR !== null ? mafR : 0,
        throttlePos: throttleV !== null ? Math.round((throttleV / 255) * 100) : 0,
        fuelLevel: fuelV !== null ? Math.round((fuelV / 255) * 100) : 0,
        map: mapV !== null ? mapV : 0,
        timingAdvance: timingV !== null ? (timingV / 2) - 64 : 0,
        shortTermFuelTrim: stftV !== null ? Math.round(((stftV / 128) - 1) * 100) : 0,
        longTermFuelTrim: ltftV !== null ? Math.round(((ltftV / 128) - 1) * 100) : 0,
        commandedAFR: afrV !== null ? afrV : 0,
      };
    } catch {
      return {
        dtc: null, rpm: 0, speed: 0, coolantTemp: 0, engineLoad: 0,
        intakeTemp: 0, maf: 0, throttlePos: 0, fuelLevel: 0,
        map: 0, timingAdvance: 0, shortTermFuelTrim: 0, longTermFuelTrim: 0,
        commandedAFR: 0,
      };
    }
  }

  async readPendingDTCs(): Promise<DTC[]> {
    if (this.isSimulating) {
      return [{code: 'P0171', description: 'Fakir Karışım (Banka 1) - Beklemede'}];
    }
    if (!this._isConnected || !this.transport) {
      return [];
    }
    try {
      const response = await this.sendCommand('07');
      return this.parseDTCs(response);
    } catch {
      return [];
    }
  }

  private parseFreezeFrameRPM(response: string): number {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('420C') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        return Math.floor((A * 256 + B) / 4);
      }
    }
    return 0;
  }

  private parseHexValueStrict(
    response: string, prefix: string, start: number, len: number,
  ): number | null {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith(prefix) && clean.length >= start + len) {
      const val = parseInt(clean.substring(start, start + len), 16);
      return isNaN(val) ? null : val;
    }
    return null;
  }

  private parseMAFRaw(response: string, prefix: string): number | null {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith(prefix) && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        return Math.round(((A * 256 + B) / 100) * 10) / 10;
      }
    }
    return null;
  }

  private parseAFRRaw(response: string, prefix: string): number | null {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith(prefix) && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        return Math.round(((A * 256 + B) / 32768) * 14.7 * 10) / 10;
      }
    }
    return null;
  }

  calculateHP(maf: number, useMetric: boolean = true): {whp: number; bhp: number} {
    // MAF-based HP estimation
    // WHP ≈ MAF (g/s) / 0.73 (rule of thumb)
    // BHP ≈ WHP * 1.15 (15% drivetrain loss)
    const whp = Math.round((maf / 0.73) * 10) / 10;
    const bhp = Math.round(whp * 1.15 * 10) / 10;
    return {whp, bhp};
  }

  private simulateDTCs(): DTC[] {
    return [
      {code: 'P0301', description: 'Silindir 1 Ateşleme Hatası'},
      {code: 'P0171', description: 'Fakir Karışım (Banka 1)'},
      {
        code: 'P0420',
        description: 'Katalitik Konvertör Verim Düşüklüğü (Banka 1)',
      },
    ];
  }

  private parseDTCs(response: string): DTC[] {
    const dtcs: DTC[] = [];
    const lines = response.split(/[\r\n]+/);
    
    let rawBytes: string[] = [];
    for (let line of lines) {
      line = line.trim();
      // Çoklu çerçeve satır numaralarını (ör. "0: ", "1: ") temizle
      line = line.replace(/^[0-9A-Fa-f]:\s*/, '');
      const parts = line.split(/\s+/).filter(p => p.length === 2);
      rawBytes.push(...parts);
    }
    
    const startIndex = rawBytes.findIndex(b => b === '43' || b === '47' || b === '4A');
    if (startIndex === -1) return dtcs;
    
    for (let i = startIndex + 1; i < rawBytes.length - 1; i += 2) {
      const b1 = rawBytes[i];
      const b2 = rawBytes[i + 1];
      if (b1 === '00' && b2 === '00') continue;
      
      const code = this.decodeDTC(b1, b2);
      if (code) {
        dtcs.push({
          code,
          description: DTC_DESCRIPTIONS[code] || `${code} - Tanımlanmamış hata kodu`,
        });
      }
    }
    
    return dtcs.filter((d, index, self) => index === self.findIndex((t) => t.code === d.code));
  }

  private decodeDTC(byte1: string, byte2: string): string | null {
    const b1 = parseInt(byte1, 16);
    const b2 = parseInt(byte2, 16);
    if (isNaN(b1) || isNaN(b2)) {
      return null;
    }
    const prefixes = [
      'P0',
      'P1',
      'P2',
      'P3',
      'C0',
      'C1',
      'C2',
      'C3',
      'B0',
      'B1',
      'B2',
      'B3',
      'U0',
      'U1',
      'U2',
      'U3',
    ];
    const prefixIndex = (b1 >> 4) & 0x0f;
    if (prefixIndex >= prefixes.length) {
      return null;
    }
    const prefix = prefixes[prefixIndex];
    const firstDigit = b1 & 0x0f;
    const secondDigit = (b2 >> 4) & 0x0f;
    const thirdDigit = b2 & 0x0f;
    return `${prefix}${firstDigit.toString(16).toUpperCase()}${secondDigit
      .toString(16)
      .toUpperCase()}${thirdDigit.toString(16).toUpperCase()}`;
  }

  private parseOdometer(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('41A6') && clean.length >= 12) {
      const val = parseInt(clean.substring(4, 12), 16);
      if (!isNaN(val)) this.currentData.odometer = val / 10;
    }
  }

  private parseHybridBatteryLife(response: string) {
    const val = this.parseHexValue(response, '415B', 4, 2);
    if (val !== null) this.currentData.hybridBatteryLife = Math.round((val * 100) / 255);
  }

  private parseDpfDifferentialPressure(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('417A') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.dpfDifferentialPressure = (A * 256 + B) / 100;
      }
    }
  }

  private parseDpfTemp(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('417C') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.dpfTemp = ((A * 256 + B) / 10) - 40;
      }
    }
  }

  private parseExhaustPressure(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4173') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.exhaustPressure = (A * 256 + B) / 100;
      }
    }
  }

  private parseTurboRpm(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4174') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.turboRpm = (A * 256 + B);
      }
    }
  }

  private parseChargeAirCoolerTemp(response: string) {
    const val = this.parseHexValue(response, '4177', 4, 2);
    if (val !== null) this.currentData.chargeAirCoolerTemp = val - 40;
  }

  private parseFuelRailGaugePressure(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4123') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.fuelRailGaugePressure = (A * 256 + B) * 10;
      }
    }
  }

  private parseEngineFrictionTorque(response: string) {
    const val = this.parseHexValue(response, '418E', 4, 2);
    if (val !== null) this.currentData.engineFrictionTorque = val - 125;
  }

  private parseDistanceSinceDTCClearHighRes(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('418B') && clean.length >= 12) {
      const val = parseInt(clean.substring(4, 12), 16);
      if (!isNaN(val)) this.currentData.distanceSinceDTCClearHighRes = val / 10;
    }
  }

  private parseThrottlePositionG(response: string) {
    const val = this.parseHexValue(response, '418D', 4, 2);
    if (val !== null) this.currentData.throttlePositionG = Math.round((val / 255) * 100);
  }

  private async disconnectTransport() {
    this._isConnected = false;
    this.stopPolling();
    if (this.transport) {
      try {
        await this.transport.disconnect();
      } catch (_) {}
      this.transport = null;
    }
  }

  async disconnect() {
    this.isSimulating = false;
    await this.disconnectTransport();
    Object.keys(this.currentData).forEach(k => {
      if (k !== '_validKeys' && k !== 'fuelSystemStatus' && k !== 'fuelType' && k !== 'milOn') {
        (this.currentData as any)[k] = 0;
      }
    });
    this.currentData.fuelSystemStatus = '';
    this.currentData.fuelType = '';
    this.currentData.milOn = false;
    this.logBuffer = [];
    this.lastCallbackTime = 0;
    this.resetTripData();
    this.validKeys.clear();
    ['rpm', 'speed', 'batteryVoltage', 'coolantTemp'].forEach(k => this.validKeys.add(k));
    this.validKeysArray = Array.from(this.validKeys);
    if (this.dataCallback) {
      this.currentData._validKeys = this.validKeysArray;
      this.dataCallback({...this.currentData});
    }
    this.setConnectionState('disconnected');
  }
}

export const obd2Service = new OBD2Service();
