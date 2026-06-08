import {
  PermissionsAndroid,
  Platform,
  NativeModules,
  Permission,
} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getSettings} from './AppSettings';
import notifee, {
  AndroidImportance,
  AndroidForegroundServiceType,
  EventType,
} from '@notifee/react-native';
import type {HiddenFeature} from './HiddenFeatures';
import {OemSensorDef, OEM_SENSORS, detectBrandFromVIN} from './OemSensors';
import {
  OBD2Data,
  MonitorStatus,
  TripData,
  DTC,
  FreezeFrameData,
  ConnectionState,
  ConnectionType,
  ConnectionConfig,
  OBD2Callback,
  ConnectionCallback,
  Transport,
  OBD2_PROTOCOLS,
  PROTOCOL_LABELS,
  ELM_CONSTANTS,
} from '../types/OBD2Types';
import {BluetoothTransport} from './transport/BluetoothTransport';
import {UsbTransport} from './transport/UsbTransport';
import {WiFiTransport} from './transport/WiFiTransport';

const STORAGE_LAST_DEVICE = '@arabanitani/last_device';
const STORAGE_LAST_TYPE = '@arabanitani/connection_type';

import {DTC_DESCRIPTIONS} from './DTCDatabase';

class OBD2Service {
  private commandLock: Promise<void> = Promise.resolve();
  private transport: Transport | null = null;
  private _isConnected = false;
  private dataCallbacks: Set<OBD2Callback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private _vin: string = '';
  public carBrand: string = 'UNKNOWN';
  public supportedOemPids: OemSensorDef[] = [];
  public oemData: Record<string, number | string> = {};
  private _connecting = false;
  private lastCallbackTime = 0;
  private lastDataTime = Date.now();
  private foregroundServiceActive = false;

  private priorityPids: Set<string> = new Set();
  private sleepingPids: Record<string, number> = {};
  private SLOW_PIDS = new Set(['05', '46', '0F', '11']); // Coolant, Ambient, Intake Temp, Throttle Pos
  private unsupportedCount: Record<string, number> = {};
  public compatibilityMode: boolean = false;
  private lastPollTimes: Record<string, number> = {};

  private lastWidgetUpdateTime = 0; // Widget'ı saniyede 1 kez güncelle

  private validKeysArray: string[] = [
    'rpm',
    'speed',
    'batteryVoltage',
    'coolantTemp',
  ];
  private validKeys = new Set<string>(this.validKeysArray);
  private _validKeysDirty = false;

  private isPidSupported(pid: string): boolean {
    if (this.supportedPids.size <= 1) {return true;}
    return this.supportedPids.has(pid);
  }

  private async readPidRanges() {
    this.supportedPids.clear();
    this.supportedPids.add('0100'); // Always assumed safe

    const parseSupport = (response: string, offset: number) => {
      const prefix = '41' + offset.toString(16).padStart(2, '0').toUpperCase();
      const clean = response.replace(/\s/g, '');
      const blocks = clean.split('\r').filter(b => b.includes(prefix));
      blocks.forEach(b => {
        const idx = b.indexOf(prefix);
        if (idx >= 0 && b.length >= idx + 12) {
          const hex = b.substring(idx + 4, idx + 12);
          const binary = parseInt(hex, 16).toString(2).padStart(32, '0');
          for (let i = 0; i < 32; i++) {
            if (binary[i] === '1') {
              const pidNum = offset + i + 1;
              const pidHex =
                '01' + pidNum.toString(16).padStart(2, '0').toUpperCase();
              this.supportedPids.add(pidHex);
            }
          }
        }
      });
    };

    try {
      const res1 = await this.sendCommandFast('0100');
      parseSupport(res1, 0x00);
      if (this.supportedPids.has('0120')) {
        const res2 = await this.sendCommandFast('0120');
        parseSupport(res2, 0x20);
      }
      if (this.supportedPids.has('0140')) {
        const res3 = await this.sendCommandFast('0140');
        parseSupport(res3, 0x40);
      }
      if (this.supportedPids.has('0160')) {
        const res4 = await this.sendCommandFast('0160');
        parseSupport(res4, 0x60);
      }
    } catch (e) {}
  }

  private currentData: OBD2Data = new Proxy(
    {
      rpm: 0,
      speed: 0,
      coolantTemp: 0,
      engineLoad: 0,
      intakeTemp: 0,
      maf: 0,
      throttlePos: 0,
      fuelLevel: 0,
      fuelPressure: 0,
      timingAdvance: 0,
      map: 0,
      batteryVoltage: 0,
      shortTermFuelTrim: 0,
      longTermFuelTrim: 0,
      commandedAFR: 0,
      barometricPressure: 0,
      absoluteLoad: 0,
      relativeThrottlePos: 0,
      ethanolPercent: 0,
      fuelSystemStatus: '',
      o2Sensor1Voltage: 0,
      o2Sensor2Voltage: 0,
      catalystTempBank1: 0,
      shortTermFuelTrim2: 0,
      longTermFuelTrim2: 0,
      distanceSinceDTCClear: 0,
      fuelRailPressureRelative: 0,
      runTime: 0,
      engineOilTemp: 0,
      fuelRate: 0,
      fuelConsumption: 0,
      distanceWithMIL: 0,
      timeSinceDTCClear: 0,
      absoluteThrottleB: 0,
      absoluteThrottleC: 0,
      commandedThrottleActuator: 0,
      acceleratorPosD: 0,
      warmUpsSinceDTCClear: 0,
      fuelType: '',
      timeWithMIL: 0,
      injectionTiming: 0,
      catalystTempBank2: 0,
      wideRangeO2B1S1: 0,
      acceleratorPosE: 0,
      acceleratorPosF: 0,
      fuelRailPressureAbsolute: 0,
      egtBank1: 0,
      evapVaporPressure: 0,
      relativePedalPos: 0,
      commandedEgr: 0,
      egrError: 0,
      commandedEvapPurge: 0,
      o2B1S1EquivRatio: 0,
      o2B1S2EquivRatio: 0,
      actualEgr: 0,
      egrErrorDuty: 0,
      commandedEvapPurgeFlow: 0,
      milOn: false,
      dtcCount: 0,
      actualEngineTorque: 0,
      driverDemandTorque: 0,
      engineReferenceTorque: 0,
      turboBoostPressure: 0,
      odometer: 0,
      hybridBatteryLife: 0,
      dpfDifferentialPressure: 0,
      dpfTemp: 0,
      exhaustPressure: 0,
      turboRpm: 0,
      chargeAirCoolerTemp: 0,
      fuelRailGaugePressure: 0,
      engineFuelRate: 0,

      engineFrictionTorque: 0,
      distanceSinceDTCClearHighRes: 0,
      throttlePositionG: 0,
      secondaryAirStatus: '',
      obdStandard: '',
      evapVaporPressureAbsolute: 0,
      egtBank2: 0,
      turboCompressorInletPressure: 0,
      vgtControl: 0,
      wastegateControl: 0,
      turboTemp: 0,
      fuelPressureControl: 0,
      injectionPressureControl: 0,
      catalystTempBank1Sensor2: 0,
      catalystTempBank2Sensor2: 0,
      boostPressureControl: 0,
      dpfBypassPressure: 0,
      noxNTEControlStatus: 0,
      pmNTEControlStatus: 0,
      engineAuxiliarySupported: '',
      o2Sensor3Voltage: 0,
      o2Sensor4Voltage: 0,
      o2Sensor5Voltage: 0,
      o2Sensor6Voltage: 0,
      o2Sensor7Voltage: 0,
      o2Sensor8Voltage: 0,
      shortTermO2TrimB1: 0,
      longTermO2TrimB1: 0,
      mafSensorA: 0,
      mafSensorB: 0,
      engineCoolantTemp2: 0,
      intakeAirTemp2: 0,
      engineRunTime: 0,
      widebandO2S1: 0,
      widebandO2S2: 0,
      widebandO2S3: 0,
    } as OBD2Data,
    {
      set: (target, prop, value) => {
        if (
          typeof prop === 'string' &&
          prop !== '_validKeys' &&
          !this.validKeys.has(prop)
        ) {
          this.validKeys.add(prop);
          this._validKeysDirty = true;
        }
        target[prop as keyof OBD2Data] = value as never;
        return true;
      },
    },
  );

  private async startForegroundService() {
    if (this.foregroundServiceActive || Platform.OS !== 'android') {return;}
    try {
      const channelId = await notifee.createChannel({
        id: 'obd_connection',
        name: 'ArabanıTanı Bağlantı Durumu',
        importance: AndroidImportance.LOW,
      });

      await notifee.displayNotification({
        title: 'ArabaniTani Calisiyor',
        body: 'Aracla baglanti kuruldu, veri okunuyor...',
        android: {
          channelId,
          asForegroundService: true,
          ongoing: true,
          color: '#e74c3c',
          colorized: true,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: 'BAĞLANTIYI KES',
              pressAction: {id: 'disconnect_obd'},
            },
          ]
        },
      });
      this.foregroundServiceActive = true;
    } catch (e) {
      console.error('Foreground service error:', e);
    }
  }

  private async stopForegroundService() {
    if (!this.foregroundServiceActive || Platform.OS !== 'android') {return;}
    try {
      await notifee.stopForegroundService();
      this.foregroundServiceActive = false;
    } catch (e) {}
  }
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
    if (idx === -1) {
      return;
    }
    const data = clean.substring(idx + 4, idx + 12);
    if (data.length < 8) {
      return;
    }
    const val = parseInt(data, 16);
    if (isNaN(val)) {
      return;
    }
    const binary = val.toString(2).padStart(32, '0');
    const offset = parseInt(offsetHex, 16);
    for (let i = 0; i < 32; i++) {
      if (binary[i] === '1') {
        const pidNum = offset + i + 1;
        const pidHex =
          '01' + pidNum.toString(16).toUpperCase().padStart(2, '0');
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
        if (perms.length === 0) {
          return true;
        }
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
      if (!enabled) {
        return [];
      }
      const found = await RNBluetoothClassic.startDiscovery();
      return found;
    } catch (err: any) {
      if (
        String(err).includes('Security') ||
        String(err).includes('Permission')
      ) {
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
    } catch {
      return false;
    }
  }

  async requestBluetoothEnabled(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.requestBluetoothEnabled();
    } catch {
      return false;
    }
  }

  async unpairDevice(address: string): Promise<boolean> {
    try {
      return await RNBluetoothClassic.unpairDevice(address);
    } catch {
      // unpair başarısız olursa disconnect dene
      try {
        await RNBluetoothClassic.disconnectFromDevice(address);
      } catch {}
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
      const connected = await this.transport.connect(msg => {
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
      this.startForegroundService();
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
    if (this._connecting) {return false;}
    this._connecting = true;
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
      this.startForegroundService();
      await this.saveLastDevice({type: 'usb', name: 'USB ELM327'});
      return true;
    } catch (err) {
      console.error('USB connection failed:', err);
      await this.disconnectTransport();
      this.setConnectionState('error', 'USB bağlantı hatası');
      return false;
    } finally {
      this._connecting = false;
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
      this.startForegroundService();
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
    if (this._connecting) {
      return false;
    }
    const config = await this.loadLastDevice();
    if (!config) {
      return false;
    }
    this._lastConfig = config;
    // Önce native state temizle
    if (config.type === 'bluetooth' && config.address) {
      try {
        await RNBluetoothClassic.disconnectFromDevice(config.address);
      } catch (_) {}
      try {
        const existing = await RNBluetoothClassic.getConnectedDevices();
        for (const d of existing) {
          if (d.address === config.address) {
            try {
              await d.disconnect();
            } catch {}
          }
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

    // OEM Discovery
    if (this._vin) {
      this.carBrand = detectBrandFromVIN(this._vin);
    }

    // Asynchronous discovery of OEM sensors
    setTimeout(async () => {
      this.supportedOemPids = [];
      const brand = this.carBrand;
      // Eğer VIN yoksa veya marka bulunamadıysa (UNKNOWN), tüm sensörleri dener (Brute-Force)
      const candidates =
        brand === 'UNKNOWN'
          ? OEM_SENSORS
          : OEM_SENSORS.filter(
              s => s.brands.includes(brand) || s.brands.includes('ALL')
            );

      for (const sensor of candidates) {
        try {
          if (sensor.header) {
            await this.sendCommandFast('ATSH' + sensor.header);
            await this.delay(50);
          }
          const resp = await this.sendCommandFast(sensor.command);
          if (sensor.header) {
            await this.sendCommandFast('ATSH7E0'); // reset to default engine header
            await this.delay(50);
          }

          if (
            resp &&
            !resp.includes('NO DATA') &&
            !resp.includes('ERROR') &&
            !resp.includes('7F')
          ) {
            const parsed = sensor.parse(resp);
            if (parsed !== null) {
              this.supportedOemPids.push(sensor);
              this.oemData[sensor.id] = parsed;

              if (!this.validKeys.has(sensor.id)) {
                this.validKeys.add(sensor.id);
                this._validKeysDirty = true;
              }

              console.log('OEM Sensor Discovered:', sensor.name, parsed);
            }
          }
        } catch (e) {}
      }
    }, 2000);

    this.pollRunning = true;
    this.currentData.speed = 0;

    const simPoll = () => {
      if (!this.pollRunning) {
        return;
      }
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
      d.secondaryAirStatus = 'Upstream';
      d.obdStandard = 'OBD-II (CARB)';
      d.evapVaporPressureAbsolute = 40 + Math.random() * 20;
      d.egtBank2 = 500 + Math.floor(Math.random() * 300);
      d.turboCompressorInletPressure = 90 + Math.random() * 20;
      d.vgtControl = 10 + Math.random() * 50;
      d.wastegateControl = 20 + Math.random() * 40;
      d.turboTemp = 300 + Math.floor(Math.random() * 400);
      d.fuelPressureControl = 10 + Math.random() * 80;
      d.injectionPressureControl = 20 + Math.random() * 60;
      d.catalystTempBank1Sensor2 = 300 + Math.random() * 200;
      d.catalystTempBank2Sensor2 = 300 + Math.random() * 200;
      d.boostPressureControl = 50 + Math.random() * 50;
      d.dpfBypassPressure = 10 + Math.random() * 10;
      d.noxNTEControlStatus = 1;
      d.pmNTEControlStatus = 1;
      d.engineAuxiliarySupported = 'PTO Active';
      d.o2Sensor3Voltage = Math.random();
      d.o2Sensor4Voltage = Math.random();
      d.o2Sensor5Voltage = Math.random();
      d.o2Sensor6Voltage = Math.random();
      d.o2Sensor7Voltage = Math.random();
      d.o2Sensor8Voltage = +(Math.random() * 1.2).toFixed(2);
      d.shortTermO2TrimB1 = +(Math.random() * 10 - 5).toFixed(2);
      d.longTermO2TrimB1 = +(Math.random() * 10 - 5).toFixed(2);
      d.mafSensorA = +(Math.random() * 50 + 10).toFixed(1);
      d.mafSensorB = +(Math.random() * 50 + 10).toFixed(1);
      d.engineCoolantTemp2 = d.coolantTemp + 2;
      d.intakeAirTemp2 = d.intakeTemp + 2;
      d.engineRunTime = Math.floor(Math.random() * 5000);
      d.widebandO2S1 = +(Math.random() * 5).toFixed(2);
      d.widebandO2S2 = +(Math.random() * 5).toFixed(2);
      d.widebandO2S3 = +(Math.random() * 5).toFixed(2);
      this.updateTripData(d.speed);
      this.addLogEntry(d);
      this.dataCallbacks.forEach(cb => cb({...d}));
      this.pollTimer = setTimeout(simPoll, 300);
    };
    this.pollTimer = setTimeout(simPoll, 100);
  }

  private setConnectionState(state: ConnectionState, message?: string) {
    this.connectionCallbacks.forEach(cb => cb(state, message));
  }

  onConnectionUpdate(callback: ConnectionCallback) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onDataUpdate(callback: OBD2Callback) {
    this.dataCallbacks.add(callback);
    return () => {
      this.dataCallbacks.delete(callback);
    };
  }

  getLastData(): OBD2Data {
    return {...this.currentData};
  }

  // Komut yazma — commandLock zaten serialization sağlıyor, ayrı queue gereksiz
  private async enqueueWrite(fn: () => Promise<void>): Promise<void> {
    return fn();
  }


  private acquireLock(): Promise<() => void> {
    let release!: () => void;
    const nextLock = new Promise<void>(resolve => {
      release = resolve;
    });
    const currentLock = this.commandLock;
    this.commandLock = currentLock.then(() => nextLock);
    return currentLock.then(() => release);
  }

  private async sendCommand(cmd: string): Promise<string> {
    const release = await this.acquireLock();
    try {
      const t = this.transport;
      if (!t || !this._isConnected) {
        return '';
      }
      try {
        await t.readAll();
        await this.enqueueWrite(() => t.write(cmd + '\r'));
        await this.delay(ELM_CONSTANTS.WRITE_DELAY);
        let response = '';
        let emptyCount = 0;
        for (let i = 0; i < ELM_CONSTANTS.READ_MAX_POLLS; i++) {
          await this.delay(ELM_CONSTANTS.READ_POLL_INTERVAL);
          const chunk = await t.readAll();
          if (chunk) {
            response += chunk;
            emptyCount = 0;
          } else {
            emptyCount++;
            if (
              emptyCount > ELM_CONSTANTS.READ_EMPTY_LIMIT &&
              response.length > 0
            ) {
              break;
            }
          }
          if (response.includes('>')) {
            break;
          }
        }
        let clean = response
          .replace(/\d+:/g, '')
          .replace(/>/g, '')
          .replace(/\s/g, '')
          .trim();
        if (cmd.startsWith('01') && cmd.length === 4) {
          const respPrefix = '41' + cmd.substring(2);
          const idx = clean.indexOf(respPrefix);
          if (idx > 0) {
            clean = clean.substring(idx);
          } else if (idx < 0) {
            clean = '';
          }
        }
        return clean;
      } catch (e) {
        const msg = String(e);
        if (
          msg.includes('Not connected') ||
          msg.includes('disconnected') ||
          msg.includes('closed')
        ) {
          this._isConnected = false;
          this.stopForegroundService();
          this.setConnectionState('disconnected', 'Bağlantı koptu');
        }
        return '';
      }
    } finally {
      release();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  private async readMorePidRanges(
    sendFn: (cmd: string) => Promise<string>,
  ): Promise<void> {
    if (!this.supportedPids.has('0120')) {
      return;
    }
    const r20 = await sendFn('0120');
    if (!r20 || r20.includes('NO DATA')) {
      return;
    }
    this.parseSupportedPids(r20, '20');
    if (!this.supportedPids.has('0140')) {
      return;
    }
    const r40 = await sendFn('0140');
    if (!r40 || r40.includes('NO DATA')) {
      return;
    }
    this.parseSupportedPids(r40, '40');
    if (!this.supportedPids.has('0160')) {
      return;
    }
    const r60 = await sendFn('0160');
    if (!r60 || r60.includes('NO DATA')) {
      return;
    }
    this.parseSupportedPids(r60, '60');
    if (!this.supportedPids.has('0180')) {
      return;
    }
    const r80 = await sendFn('0180');
    if (!r80 || r80.includes('NO DATA')) {
      return;
    }
    this.parseSupportedPids(r80, '80');
    if (!this.supportedPids.has('01A0')) {
      return;
    }
    const rA0 = await sendFn('01A0');
    if (rA0 && !rA0.includes('NO DATA')) {
      this.parseSupportedPids(rA0, 'A0');
    }
  }

  private async initializeELM327(): Promise<boolean> {
    // Ultimate Init Sequence (AndrOBD / Python-OBD Standards)
    await this.sendCommand('ATZ');
    await this.delay(ELM_CONSTANTS.ATZ_RESET_DELAY);
    await this.sendCommand('ATE0');
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
    await this.sendCommand('ATL0');
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
    await this.sendCommand('ATS0');
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
    await this.sendCommand('ATH0'); // Headers Off
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
    await this.sendCommand('ATST32'); // Timeout to 200ms for responsiveness
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
    await this.sendCommand('ATAT1'); // Adaptive Timing Auto 1
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
    await this.sendCommand('ATST62'); // Set Timeout (faster recovery)
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);

    this.supportedPids.clear();

    if (getSettings().rangeRoverLegacyMode) {
      console.log(
        'initializeELM327: Eski Range Rover Modu aktif. Özel AT komutları gönderiliyor...',
      );
      await this.sendCommand('ATSP5'); // KWP Fast Init
      await this.delay(ELM_CONSTANTS.ATSP_DELAY);
      await this.sendCommand('ATIIA14'); // Init Address 14
      await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
      await this.sendCommand('ATWM8114F3'); // Wakeup Message
      await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
      await this.sendCommand('ATSH8114F3'); // Header
      await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
      await this.sendCommand('ATFI'); // Fast Init
      await this.delay(ELM_CONSTANTS.ATSP_DELAY);
      const rrResp = await this.sendCommand('0100');
      if (rrResp && !rrResp.includes('UNABLE') && !rrResp.includes('NO DATA')) {
        this.currentProtocolLabel = 'Range Rover EAS / ISO 14230-4 KWP';
        this.parseSupportedPids(rrResp, '00');
        await this.readMorePidRanges(this.sendCommand.bind(this));
        return true;
      } else {
        console.log(
          'initializeELM327: Range Rover ATSP5 başarisiz, normal denemelere dönülüyor...',
        );
      }
    }

    await this.sendCommand('ATSP0');
    await this.delay(ELM_CONSTANTS.ATSP_DELAY);
    // Smart Timeout Logic (AT ST)
    // We will set this dynamically after protocol detection, but for now ATSP0 will auto-detect
    await this.sendCommand('ATST19'); // Default 100ms for FAST CAN responses
    await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
    const testResp = await this.sendCommand('0100');
    if (
      testResp &&
      !testResp.includes('UNABLE') &&
      !testResp.includes('NO DATA')
    ) {
      console.log('initializeELM327: ECU yanıt verdi');
      this.parseSupportedPids(testResp, '00');
      await this.readMorePidRanges(this.sendCommand.bind(this));
      return true;
    }

    console.log(
      'initializeELM327: Otomatik protokol başarısız, protokoller taranıyor...',
    );
    const tryProtocols = [
      '6',
      '7',
      '5',
      '3',
      '8',
      '9',
      '1',
      '2',
      '4',
      'A',
      'B',
      'C',
    ];
    for (const proto of tryProtocols) {
      await this.sendCommand(`ATSP${proto}`);
      await this.delay(ELM_CONSTANTS.AT_CMD_DELAY);
      const resp = await this.sendCommand('0100');
      if (
        resp &&
        !resp.includes('UNABLE') &&
        !resp.includes('NO DATA') &&
        !resp.includes('?')
      ) {
        this.currentProtocolLabel = PROTOCOL_LABELS[proto] || `SP ${proto}`;
        console.log(
          `initializeELM327: Protokol ${proto} (${this.currentProtocolLabel}) çalışıyor`,
        );
        this.parseSupportedPids(resp, '00');
        await this.readMorePidRanges(this.sendCommand.bind(this));
        await this.sendCommand('ATST64');
        await this.delay(100);
        return true;
      }
    }
    await this.sendCommand('ATST64');

    console.error(
      'initializeELM327: Hiçbir protokol ECU ile iletişim kuramadı',
    );
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

  async scanAllProtocols(): Promise<
    {protocol: string; label: string; success: boolean}[]
  > {
    const wasPolling = this.pollRunning;
    if (wasPolling) {
      this.stopPolling();
    }
    const results: {protocol: string; label: string; success: boolean}[] = [];
    const protocols = [
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'A',
      '1',
      '2',
      'B',
      'C',
    ];
    for (const p of protocols) {
      const label = PROTOCOL_LABELS[p] || `SP${p}`;
      await this.sendCommand(`ATSP${p}`);
      await this.delay(400);
      await this.sendCommand('ATE0');
      await this.delay(100);
      const resp = await this.sendCommand('010C');
      if (resp.startsWith('410C') || resp.includes('410C')) {
        this.currentProtocolLabel = `${label} (CAN)`;
        if (wasPolling) {
          this.startPolling();
        }
        return results;
      }
    }
    await this.sendCommand('ATSP0');
    await this.delay(300);
    await this.detectProtocol();
    if (wasPolling) {
      this.startPolling();
    }
    return results;
  }

  async sendRawAT(cmd: string): Promise<string> {
    return this.sendCommand(cmd);
  }

  private canRespAddr(header: string): string {
    const val = parseInt(header, 16);
    if (isNaN(val)) {
      return header;
    }
    return (val + 8).toString(16).toUpperCase();
  }

  async readFeature(feature: HiddenFeature): Promise<string> {
    if (!this._isConnected) {
      return 'Bağlı değil';
    }
    if (this.isSimulating) {
      return 'Simülasyon: ' + feature.readCmd;
    }
    if (!feature.readHeader) {
      return this.sendCommand(feature.readCmd);
    }
    await this.sendCommand(`ATSH${feature.readHeader}`);
    await this.sendCommand('ATCRA' + this.canRespAddr(feature.readHeader));
    await this.delay(30);
    const result = await this.sendCommand(feature.readCmd);
    // Reset headers so live data doesn't break
    await this.sendCommand('ATSH7DF');
    await this.sendCommand('ATAR');
    return result;
  }

  async writeFeature(feature: HiddenFeature, turnOn: boolean): Promise<string> {
    if (!this._isConnected) {
      return 'Bağlı değil';
    }
    if (this.isSimulating) {
      return 'Simülasyon: ' + (turnOn ? 'AÇ' : 'KAPAT');
    }
    const cmd = turnOn ? feature.writeOn : feature.writeOff;
    if (!feature.writeHeader) {
      return this.sendCommand(cmd);
    }
    await this.sendCommand(`ATSH${feature.writeHeader}`);
    await this.sendCommand('ATCRA' + this.canRespAddr(feature.writeHeader));
    await this.delay(30);
    const result = await this.sendCommand(cmd);
    // Reset headers
    await this.sendCommand('ATSH7DF');
    await this.sendCommand('ATAR');
    return result;
  }

  public requestPriorityPids(keys: string[]) {
    this.isViewBasedPollingActive = keys.length > 0;

    this.priorityPids = new Set(keys);
  }

  private shouldPoll(key: string): boolean {
    const now = Date.now();
    const last = this.lastPollTimes[key] || 0;
    const isPriority = this.priorityPids.has(key);

    // Öncelikli sensörler (Ekranda görünenler) olabildiğince hızlı (0ms) güncellenir.
    // Ekranda görünmeyen arkaplan sensörleri 5 saniyede bir sorulur.
    const interval = isPriority ? 0 : 5000;

    if (now - last >= interval) {
      this.lastPollTimes[key] = now;
      return true;
    }
    return false;
  }

  async sendCustomCommand(cmd: string): Promise<string> {
    if (!this._isConnected) {
      return 'Bağlı değil';
    }
    if (this.isSimulating) {
      return 'Simülasyon: ' + cmd;
    }
    return this.sendCommand(cmd);
  }

  private pollRunning = false;
  private pollTimer: any = null;
  private pollCycle = 0;
  private pollErrorCount = 0;

  private canPoll(pid: string): boolean {
    return this.supportedPids.size <= 1 || this.supportedPids.has(pid);
  }

  // View-Based Polling aktif mi? (Eğer priorityPids doluysa aktif)
  private isViewBasedPollingActive = false;

  private async sendCommandFast(cmd: string, key?: string): Promise<string> {
    const release = await this.acquireLock();
    try {
      // ---------------- PROFESSIONAL VIEW-BASED POLLING ----------------
      // Kritik sensörler (010C, 010D, AT komutları) her zaman geçer.
      // Diğer sensörler sadece priorityPids (ekranda görünenler) listesinde ise geçer!
      if (
        this.isViewBasedPollingActive &&
        cmd.startsWith('01') &&
        cmd !== '010C0D' &&
        cmd !== '010C' &&
        cmd !== '010D'
      ) {
        if (!key || !this.priorityPids.has(key)) {
          // Ekranda görünmüyor, bant genişliğini meşgul etme!
          release();
          return '';
        }
      }

      const now = Date.now();
      // Smart Sleep (Ping after 10s)
      if (this.sleepingPids[cmd]) {
        if (now - this.sleepingPids[cmd] < 10000) {
          return '';
        } else {
          delete this.sleepingPids[cmd];
        }
      }

      if (key && !this.shouldPoll(key)) {
        return '';
      }

      if (cmd.startsWith('01') && cmd.length === 4) {
        if (!this.canPoll(cmd)) {
          return '';
        }
        this.lastPollTimes[cmd] = now;
      }
      const t = this.transport;
      if (!t || !this._isConnected) {
        return '';
      }
      try {
        await t.readAll();
        await this.enqueueWrite(() => t.write(cmd + '\r'));
        await this.delay(ELM_CONSTANTS.FAST_WRITE_DELAY);
        let response = '';
        for (let i = 0; i < ELM_CONSTANTS.FAST_MAX_POLLS; i++) {
          await this.delay(ELM_CONSTANTS.FAST_POLL_INTERVAL);
          const chunk = await t.readAll();
          if (chunk) {
            response += chunk;
          }
          if (response.includes('>')) {
            break;
          }
        }
        let clean = response
          .replace(/\d+:/g, '')
          .replace(/>/g, '')
          .replace(/\s/g, '')
          .trim();
        if (cmd.startsWith('01') && cmd.length === 4) {
          const respPrefix = '41' + cmd.substring(2);
          const idx = clean.indexOf(respPrefix);
          if (idx > 0) {
            clean = clean.substring(idx);
          } else if (idx < 0) {
            clean = '';
          }
        }
        return clean;
      } catch (e) {
        const msg = String(e);
        if (
          msg.includes('Not connected') ||
          msg.includes('disconnected') ||
          msg.includes('closed')
        ) {
          this._isConnected = false;
          this.stopForegroundService();
          this.setConnectionState('disconnected', 'Bağlantı koptu');
        }
        return '';
      }
    } finally {
      release();
    }
  }

  private multiPidSupported: boolean | null = null;
  private async sendCritical(): Promise<boolean> {
    if (!this.pollRunning) {return false;}

    // Multi-PID (Sadece RPM ve Hız) - Gecikmeyi Önlemek İçin Küçültüldü
    if (
      this.multiPidSupported !== false &&
      this.isPidSupported('010C') &&
      this.isPidSupported('010D')
    ) {
      const multiResp = await this.sendCommandFast('010C0D', 'multi_fast');
      if (multiResp && multiResp.includes('410C') && multiResp.includes('0D')) {
        this.multiPidSupported = true;
        this.parseMultiResponse(multiResp);
      } else {
        this.multiPidSupported = false; // Klon veya uyumsuz ECU
      }
    }

    if (this.multiPidSupported === false) {
      if (this.isPidSupported('010C')) {
        const rpmResp = await this.sendCommandFast('010C', 'rpm');
        if (rpmResp) {this.parseMultiResponse(rpmResp);}
      }
      if (!this.pollRunning) {return false;}
      if (this.isPidSupported('010D')) {
        const speedResp = await this.sendCommandFast('010D', 'speed');
        if (speedResp) {this.parseMultiResponse(speedResp);}
      }
    }


    // Calculate Fuel Consumption manually if 015E is not providing it
    if (this.currentData.fuelRate === 0) {
      if (this.currentData.maf > 0) {
        this.currentData.fuelRate =
          Math.round(this.currentData.maf * 0.298 * 10) / 10;
      } else if (
        this.currentData.map > 0 &&
        this.currentData.rpm > 0 &&
        this.currentData.intakeTemp > -40
      ) {
        // Ideal gas law approximation: Engine_Disp = 1.6L, VE = 0.85
        // MAF(g/s) = (MAP(kPa) * Disp(L) * VE * RPM) / (120 * 0.287 * (IntakeTemp(C) + 273.15))
        const rpm = this.currentData.rpm;
        const map = this.currentData.map;
        const tempK = this.currentData.intakeTemp + 273.15;
        const mafCalc = (map * 1.6 * 0.85 * rpm) / (120 * 0.287 * tempK);
        this.currentData.fuelRate = Math.round(mafCalc * 0.298 * 10) / 10;
      }
    }

    // Update fuel consumption L/100km
    if (this.currentData.speed > 5 && this.currentData.fuelRate > 0) {
      this.currentData.fuelConsumption =
        Math.round(
          (this.currentData.fuelRate / this.currentData.speed) * 100 * 10,
        ) / 10;
    } else {
      this.currentData.fuelConsumption = 0;
    }

    this.updateTripData(this.currentData.speed);
    this.addLogEntry(this.currentData);
    // Redundant callback removed to prevent lag
    this.updateWidget();
    return true;
  }

  private parseMultiResponse(hex: string) {
    let i = 0;
    while (i < hex.length - 2) {
      if (hex.substring(i, i + 2) === '41') {
        i += 2; // Skip '41' prefix if present
      }

      const pid = hex.substring(i, i + 2);
      i += 2;

      if (pid === '0C') {
        if (i + 4 <= hex.length) {
          this.parseRPM('410C' + hex.substring(i, i + 4));
          i += 4;
        } else {break;}
      } else if (pid === '0D') {
        if (i + 2 <= hex.length) {
          this.parseSpeed('410D' + hex.substring(i, i + 2));
          i += 2;
        } else {break;}
      } else if (pid === '05') {
        if (i + 2 <= hex.length) {
          this.parseCoolantTemp('4105' + hex.substring(i, i + 2));
          i += 2;
        } else {break;}
      } else {
        // Unknown PID or garbage, stop parsing to prevent misalignment
        break;
      }
    }
  }

  private updateWidget() {
    // Native köprü pahalı — saniyede 1 kez güncelle (her 25ms'de değil)
    const now = Date.now();
    if (now - this.lastWidgetUpdateTime < 1000) {
      return;
    }
    this.lastWidgetUpdateTime = now;
    try {
      if (NativeModules.WidgetDataModule) {
        NativeModules.WidgetDataModule.updateWidget({
          rpm: String(Math.floor(this.currentData.rpm || 0)),
          speed: String(Math.floor(this.currentData.speed || 0)),
          coolant:
            this.currentData.coolantTemp != null
              ? String(Math.floor(this.currentData.coolantTemp))
              : '--',
          connected: this._isConnected,
        });
      }
    } catch (_e) {}
  }

  private startPolling() {
    if (this.pollRunning || this.pollTimer) {
      console.log('Polling is already running, ignoring startPolling request.');
      return;
    }
    this.pollRunning = true;
    this.pollCycle = 0;
    this.pollErrorCount = 0;

    const poll = async () => {
      try {
        if (!this.pollRunning || !this._isConnected || !this.transport) {
          return;
        }

        this.pollCycle++;
        const cycle = this.pollCycle;

        const isIdle =
          this.currentData.speed === 0 && this.currentData.rpm === 0;

        const ok = await this.sendCritical();

        // Timeout Watchdog
        if (ok) {
          this.lastDataTime = Date.now();
        } else if (Date.now() - this.lastDataTime > 3000) {
          // Reset data if no response for > 3 seconds
          Object.keys(this.currentData).forEach(k => {
            if (
              k !== '_validKeys' &&
              k !== 'fuelSystemStatus' &&
              k !== 'fuelType' &&
              k !== 'milOn'
            ) {
              (this.currentData as any)[k] = 0;
            }
          });
          this.currentData.fuelSystemStatus = '';
          this.currentData.fuelType = '';
          this.dataCallbacks.forEach(cb =>
            cb({...this.currentData, ...this.oemData}),
          );
          this.updateWidget();
        }

        if (!this.pollRunning) {
          return;
        }

        if (isIdle) {
          if (this.pollCycle % 2 !== 0) {
            this.pollTimer = setTimeout(poll, 500);
            return;
          }
        }

        // Genişletilmiş sensörler - Sensör yükü yayılarak (Throttle/Lag önleme)
        // Her döngüde maksimum 1-2 sensör sorulur
        switch (cycle % 8) {
          case 0: {
            if (this.isPidSupported('0105')) {
              const r0 = await this.sendCommandFast('0105', 'coolantTemp');
              if (r0) {this.parseMultiResponse(r0);}
            }
            break;
          }
          case 1: {
            if (this.isPidSupported('0110')) {
              const r1 = await this.sendCommandFast('0110', 'maf');
              this.parseMAF(r1);
            }
            if (this.isPidSupported('010B')) {
              const r2 = await this.sendCommandFast('010B', 'map');
              this.parseMAP(r2);
            }
            break;
          }
          case 2: {
            if (this.isPidSupported('0104')) {
              const r3 = await this.sendCommandFast('0104', 'engineLoad');
              this.parseEngineLoad(r3);
            }
            if (this.isPidSupported('010F')) {
              const r4 = await this.sendCommandFast('010F', 'intakeTemp');
              this.parseIntakeTemp(r4);
            }
            break;
          }
          case 3: {
            // Batarya Voltajı (ATRV veya PID 0142)
            const rv = await this.sendCommandFast('ATRV');
            if (rv && rv.includes('V')) {
              const v = parseFloat(rv.replace('V', ''));
              if (!isNaN(v)) {
                this.currentData.batteryVoltage = v;
              }
            } else {
              if (this.isPidSupported('0142')) {
                const r1 = await this.sendCommandFast('0142', 'batteryVoltage');
                this.parseBatteryVoltage(r1);
              }
            }
            if (this.isPidSupported('0101')) {
              const r2 = await this.sendCommandFast('0101', 'dtcCount');
              this.parseMonitorStatusForPoll(r2);
            }
            if (this.isPidSupported('0111')) {
              const r3 = await this.sendCommandFast('0111', 'throttlePos');
              this.parseThrottlePos(r3);
            }
            if (this.isPidSupported('012F')) {
              const r4 = await this.sendCommandFast('012F', 'fuelLevel');
              this.parseFuelLevel(r4);
            }
            break;
          }
          case 4: {
            if (this.isPidSupported('010E')) {
              const r1 = await this.sendCommandFast('010E', 'timingAdvance');
              this.parseTimingAdvance(r1);
            }
            if (this.isPidSupported('0146')) {
              const r2 = await this.sendCommandFast('0146', 'ambientTemp');
              this.parseAmbientTemp(r2);
            }
            if (this.isPidSupported('0144')) {
              const r3 = await this.sendCommandFast('0144', 'commandedAFR');
              this.parseCommandedAFR(r3);
            }
            if (this.isPidSupported('0133')) {
              const r4 = await this.sendCommandFast(
                '0133',
                'barometricPressure',
              );
              this.parseBarometricPressure(r4);
            }
            break;
          }
          case 5: {
            if (this.isPidSupported('015C')) {
              const r1 = await this.sendCommandFast('015C', 'engineOilTemp');
              this.parseEngineOilTemp(r1);
            }
            if (this.isPidSupported('015E')) {
              const r2 = await this.sendCommandFast('015E', 'fuelRate');
              this.parseFuelRate(r2);
            }
            if (this.isPidSupported('011F')) {
              const r3 = await this.sendCommandFast('011F', 'runTime');
              this.parseRunTime(r3);
            }
            if (this.isPidSupported('015D')) {
              const r4 = await this.sendCommandFast('015D', 'injectionTiming');
              this.parseInjectionTiming(r4);
            }
            break;
          }
          case 6: {
            if (this.isPidSupported('0107')) {
              const r1 = await this.sendCommandFast(
                '0107',
                'shortTermFuelTrim',
              );
              this.parseShortTermFuelTrim(r1);
            }
            if (this.isPidSupported('0108')) {
              const r2 = await this.sendCommandFast('0108', 'longTermFuelTrim');
              this.parseLongTermFuelTrim(r2);
            }
            if (this.isPidSupported('0123')) {
              const r3 = await this.sendCommandFast('0123', 'fuelPressure');
              this.parseFuelPressure(r3);
            }
            if (this.isPidSupported('0162')) {
              const r4 = await this.sendCommandFast(
                '0162',
                'actualEngineTorque',
              );
              this.parseActualEngineTorque(r4);
            }
            if (this.isPidSupported('0163')) {
              const r5 = await this.sendCommandFast(
                '0163',
                'engineReferenceTorque',
              );
              this.parseEngineReferenceTorque(r5);
            }
            break;
          }
          case 7: {
            if (this.isPidSupported('0147')) {
              const r1 = await this.sendCommandFast(
                '0147',
                'absoluteThrottleB',
              );
              this.parseAbsoluteThrottleB(r1);
            }
            if (this.isPidSupported('0148')) {
              const r2 = await this.sendCommandFast(
                '0148',
                'absoluteThrottleC',
              );
              this.parseAbsoluteThrottleC(r2);
            }
            if (this.isPidSupported('014C')) {
              const r3 = await this.sendCommandFast(
                '014C',
                'commandedThrottleActuator',
              );
              this.parseCommandedThrottleActuator(r3);
            }
            if (this.isPidSupported('0149')) {
              const r4 = await this.sendCommandFast('0149', 'acceleratorPosD');
              this.parseAcceleratorPosD(r4);
            }
            if (this.isPidSupported('0161')) {
              const r5 = await this.sendCommandFast(
                '0161',
                'driverDemandTorque',
              );
              this.parseDriverDemandTorque(r5);
            }
            break;
          }
        }
        if (!this.pollRunning) {
          return;
        }

        // Süper genişletilmiş sensörler - döngü başına 2-5 adet dağıtıldı
        switch (((cycle - 1) % 22) + 1) {
          case 1: {
            if (this.isPidSupported('0114')) {
              const r1 = await this.sendCommandFast('0114', 'o2Sensor1Voltage');
              this.parseO2Sensor1Voltage(r1);
            }
            if (this.isPidSupported('013C')) {
              const r2 = await this.sendCommandFast(
                '013C',
                'catalystTempBank1',
              );
              this.parseCatalystTempBank1(r2);
            }
            break;
          }
          case 2: {
            const r1 = await this.sendCommandFast(
              '0131',
              'distanceSinceDTCClear',
            );
            this.parseDistanceSinceDTCClear(r1);
            const r2 = await this.sendCommandFast(
              '0122',
              'fuelRailPressureRelative',
            );
            this.parseFuelRailPressureRelative(r2);
            break;
          }
          case 3: {
            const r1 = await this.sendCommandFast(
              '0159',
              'fuelRailPressureAbsolute',
            );
            this.parseFuelRailPressureAbsolute(r1);
            if (this.isPidSupported('015F')) {
              const r2 = await this.sendCommandFast('015F', 'egtBank1');
              this.parseEGTBank1(r2);
            }
            break;
          }
          case 4: {
            if (this.isPidSupported('0153')) {
              const r1 = await this.sendCommandFast(
                '0153',
                'evapVaporPressure',
              );
              this.parseEVAPVaporPressure(r1);
            }
            if (this.isPidSupported('015A')) {
              const r2 = await this.sendCommandFast('015A', 'relativePedalPos');
              this.parseRelativePedalPos(r2);
            }
            break;
          }
          case 5: {
            if (this.isPidSupported('0143')) {
              const r1 = await this.sendCommandFast('0143', 'absoluteLoad');
              this.parseAbsoluteLoad(r1);
            }
            const r2 = await this.sendCommandFast(
              '0145',
              'relativeThrottlePos',
            );
            this.parseRelativeThrottlePos(r2);
            break;
          }
          case 6: {
            if (this.isPidSupported('0152')) {
              const r1 = await this.sendCommandFast('0152', 'ethanolPercent');
              this.parseEthanolPercent(r1);
            }
            if (this.isPidSupported('0103')) {
              const r2 = await this.sendCommandFast('0103', 'fuelSystemStatus');
              this.parseFuelSystemStatus(r2);
            }
            break;
          }
          case 7: {
            if (this.isPidSupported('0115')) {
              const r1 = await this.sendCommandFast('0115', 'o2Sensor2Voltage');
              this.parseO2Sensor2Voltage(r1);
            }
            if (this.isPidSupported('0109')) {
              const r2 = await this.sendCommandFast(
                '0109',
                'shortTermFuelTrim2',
              );
              this.parseShortTermFuelTrim2(r2);
            }
            if (this.isPidSupported('010A')) {
              const r3 = await this.sendCommandFast(
                '010A',
                'longTermFuelTrim2',
              );
              this.parseLongTermFuelTrim2(r3);
            }
            break;
          }
          case 8: {
            if (this.isPidSupported('0121')) {
              const r1 = await this.sendCommandFast('0121', 'distanceWithMIL');
              this.parseDistanceWithMIL(r1);
            }
            if (this.isPidSupported('014F')) {
              const r2 = await this.sendCommandFast(
                '014F',
                'timeSinceDTCClear',
              );
              this.parseTimeSinceDTCClear(r2);
            }
            break;
          }
          case 9: {
            const r1 = await this.sendCommandFast(
              '0130',
              'warmUpsSinceDTCClear',
            );
            this.parseWarmUpsSinceDTCClear(r1);
            if (this.isPidSupported('0151')) {
              const r2 = await this.sendCommandFast('0151', 'fuelType');
              this.parseFuelType(r2);
            }
            if (this.isPidSupported('014E')) {
              const r3 = await this.sendCommandFast('014E', 'timeWithMIL');
              this.parseTimeWithMIL(r3);
            }
            break;
          }
          case 10: {
            if (this.isPidSupported('013D')) {
              const r1 = await this.sendCommandFast(
                '013D',
                'catalystTempBank2',
              );
              this.parseCatalystTempBank2(r1);
            }
            if (this.isPidSupported('0134')) {
              const r2 = await this.sendCommandFast('0134', 'wideRangeO2B1S1');
              this.parseWideRangeO2B1S1(r2);
            }
            if (this.isPidSupported('014A')) {
              const r3 = await this.sendCommandFast('014A', 'acceleratorPosE');
              this.parseAcceleratorPosE(r3);
            }
            if (this.isPidSupported('014B')) {
              const r4 = await this.sendCommandFast('014B', 'acceleratorPosF');
              this.parseAcceleratorPosF(r4);
            }
            break;
          }
          case 11: {
            if (this.isPidSupported('012C')) {
              const r1 = await this.sendCommandFast('012C', 'commandedEgr');
              this.parseCommandedEgr(r1);
            }
            if (this.isPidSupported('012D')) {
              const r2 = await this.sendCommandFast('012D', 'egrError');
              this.parseEgrError(r2);
            }
            const r3 = await this.sendCommandFast(
              '012E',
              'commandedEvapPurgeFlow',
            );
            this.parseCommandedEvapPurge(r3);
            break;
          }
          case 12: {
            if (this.isPidSupported('0124')) {
              const r1 = await this.sendCommandFast('0124', 'o2B1S1EquivRatio');
              this.parseO2B1S1EquivRatio(r1);
            }
            if (this.isPidSupported('0125')) {
              const r2 = await this.sendCommandFast('0125', 'o2B1S2EquivRatio');
              this.parseO2B1S2EquivRatio(r2);
            }
            if (this.isPidSupported('0160')) {
              const r3 = await this.sendCommandFast('0160', 'actualEgr');
              this.parseActualEgr(r3);
            }
            if (this.isPidSupported('0161')) {
              const r4 = await this.sendCommandFast('0161', 'egrErrorDuty');
              this.parseEgrErrorDuty(r4);
            }
            // NOT: PID 0162 (actualEngineTorque) case 6'da zaten sorgulanıyor — duplikasyon kaldırıldı
            const r6 = await this.sendCommandFast(
              '0163',
              'engineReferenceTorque',
            );
            this.parseEngineReferenceTorque(r6);
            break;
          }
          case 13: {
            if (this.isPidSupported('01A6')) {
              const r1 = await this.sendCommandFast('01A6', 'odometer');
              this.parseOdometer(r1);
            }
            if (this.isPidSupported('015B')) {
              const r2 = await this.sendCommandFast(
                '015B',
                'hybridBatteryLife',
              );
              this.parseHybridBatteryLife(r2);
            }
            const r3 = await this.sendCommandFast(
              '017A',
              'dpfDifferentialPressure',
            );
            this.parseDpfDifferentialPressure(r3);
            if (this.isPidSupported('017C')) {
              const r4 = await this.sendCommandFast('017C', 'dpfTemp');
              this.parseDpfTemp(r4);
            }
            break;
          }
          case 14: {
            if (this.isPidSupported('0173')) {
              const r1 = await this.sendCommandFast('0173', 'exhaustPressure');
              this.parseExhaustPressure(r1);
            }
            if (this.isPidSupported('0174')) {
              const r2 = await this.sendCommandFast('0174', 'turboRpm');
              this.parseTurboRpm(r2);
            }
            const r3 = await this.sendCommandFast(
              '0177',
              'chargeAirCoolerTemp',
            );
            this.parseChargeAirCoolerTemp(r3);
            const r4 = await this.sendCommandFast(
              '0123',
              'fuelRailGaugePressure',
            );
            this.parseFuelRailGaugePressure(r4);
            break;
          }
          case 15: {
            if (this.isPidSupported('015D')) {
              const r1 = await this.sendCommandFast('015D', 'injectionTiming');
              this.parseInjectionTiming(r1);
            }
            const r2 = await this.sendCommandFast(
              '018E',
              'engineFrictionTorque',
            );
            this.parseEngineFrictionTorque(r2);
            const r3 = await this.sendCommandFast(
              '018B',
              'distanceSinceDTCClearHighRes',
            );
            this.parseDistanceSinceDTCClearHighRes(r3);
            if (this.isPidSupported('018D')) {
              const r4 = await this.sendCommandFast(
                '018D',
                'throttlePositionG',
              );
              this.parseThrottlePositionG(r4);
            }
            break;
          }
          case 16: {
            if (this.isPidSupported('0112')) {
              const r1 = await this.sendCommandFast(
                '0112',
                'secondaryAirStatus',
              );
              this.parseSecondaryAirStatus(r1);
            }
            if (this.isPidSupported('011C')) {
              const r2 = await this.sendCommandFast('011C', 'obdStandard');
              this.parseObdStandard(r2);
            }
            const r3 = await this.sendCommandFast(
              '0154',
              'evapVaporPressureAbsolute',
            );
            this.parseEvapVaporPressureAbsolute(r3);
            if (this.isPidSupported('0179')) {
              const r4 = await this.sendCommandFast('0179', 'egtBank2');
              this.parseEgtBank2(r4);
            }
            break;
          }
          case 17: {
            const r1 = await this.sendCommandFast(
              '016F',
              'turboCompressorInletPressure',
            );
            this.parseTurboCompressorInletPressure(r1);
            if (this.isPidSupported('0171')) {
              const r2 = await this.sendCommandFast('0171', 'vgtControl');
              this.parseVgtControl(r2);
            }
            if (this.isPidSupported('0172')) {
              const r3 = await this.sendCommandFast('0172', 'wastegateControl');
              this.parseWastegateControl(r3);
            }
            break;
          }
          case 18: {
            if (this.isPidSupported('0175')) {
              const r1 = await this.sendCommandFast('0175', 'turboTemp');
              this.parseTurboTemp(r1);
            }
            const r2 = await this.sendCommandFast(
              '016D',
              'fuelPressureControl',
            );
            this.parseFuelPressureControl(r2);
            const r3 = await this.sendCommandFast(
              '016E',
              'injectionPressureControl',
            );
            this.parseInjectionPressureControl(r3);
            break;
          }
          case 19: {
            const r1 = await this.sendCommandFast(
              '013E',
              'catalystTempBank1Sensor2',
            );
            this.parseCatalystTempBank1Sensor2(r1);
            const r2 = await this.sendCommandFast(
              '013F',
              'catalystTempBank2Sensor2',
            );
            this.parseCatalystTempBank2Sensor2(r2);
            const r3 = await this.sendCommandFast(
              '0170',
              'boostPressureControl',
            );
            this.parseBoostPressureControl(r3);
            if (this.isPidSupported('017B')) {
              const r4 = await this.sendCommandFast(
                '017B',
                'dpfBypassPressure',
              );
              this.parseDpfBypassPressure(r4);
            }
            break;
          }
          case 20: {
            const r1 = await this.sendCommandFast(
              '017D',
              'noxNTEControlStatus',
            );
            this.parseNoxNTEControlStatus(r1);
            if (this.isPidSupported('017E')) {
              const r2 = await this.sendCommandFast(
                '017E',
                'pmNTEControlStatus',
              );
              this.parsePmNTEControlStatus(r2);
            }
            const r3 = await this.sendCommandFast(
              '0165',
              'engineAuxiliarySupported',
            );
            this.parseEngineAuxiliarySupported(r3);
            break;
          }
          case 21: {
            if (this.isPidSupported('0116')) {
              const r1 = await this.sendCommandFast('0116', 'o2Sensor3Voltage');
              this.parseO2Sensor3Voltage(r1);
            }
            if (this.isPidSupported('0117')) {
              const r2 = await this.sendCommandFast('0117', 'o2Sensor4Voltage');
              this.parseO2Sensor4Voltage(r2);
            }
            if (this.isPidSupported('0118')) {
              const r3 = await this.sendCommandFast('0118', 'o2Sensor5Voltage');
              this.parseO2Sensor5Voltage(r3);
            }
            if (this.isPidSupported('0119')) {
              const r4 = await this.sendCommandFast('0119', 'o2Sensor6Voltage');
              this.parseO2Sensor6Voltage(r4);
            }
            if (this.isPidSupported('011A')) {
              const r5 = await this.sendCommandFast('011A', 'o2Sensor7Voltage');
              this.parseO2Sensor7Voltage(r5);
            }
            if (this.isPidSupported('011B')) {
              const r6 = await this.sendCommandFast('011B', 'o2Sensor8Voltage');
              this.parseO2Sensor8Voltage(r6);
            }
            break;
          }
          case 22: {
            if (this.isPidSupported('0155')) {
              const r1 = await this.sendCommandFast(
                '0155',
                'shortTermO2TrimB1',
              );
              this.parseShortTermO2TrimB1(r1);
            }
            if (this.isPidSupported('0156')) {
              const r2 = await this.sendCommandFast('0156', 'longTermO2TrimB1');
              this.parseLongTermO2TrimB1(r2);
            }
            if (this.isPidSupported('0166')) {
              const r3 = await this.sendCommandFast('0166', 'mafSensorA');
              this.parseMafSensors(r3);
            } // It sets both A and B
            if (this.isPidSupported('0167')) {
              const r4 = await this.sendCommandFast(
                '0167',
                'engineCoolantTemp2',
              );
              this.parseCoolantTemp2(r4);
            }
            if (this.isPidSupported('0168')) {
              const r5 = await this.sendCommandFast('0168', 'intakeAirTemp2');
              this.parseIntakeAirTemp2(r5);
            }
            if (this.isPidSupported('017F')) {
              const r6 = await this.sendCommandFast('017F', 'engineRunTime');
              this.parseEngineRunTimeExtended(r6);
            }
            if (this.isPidSupported('0126')) {
              const r7 = await this.sendCommandFast('0126', 'widebandO2S1');
              this.parseWidebandO2S1(r7);
            }
            if (this.isPidSupported('0127')) {
              const r8 = await this.sendCommandFast('0127', 'widebandO2S2');
              this.parseWidebandO2S2(r8);
            }
            if (this.isPidSupported('0128')) {
              const r9 = await this.sendCommandFast('0128', 'widebandO2S3');
              this.parseWidebandO2S3(r9);
            }
            break;
          }
        }

        this.pollTimer = setTimeout(poll, isIdle ? 500 : 15); // 10ms CPU'yu boğduğu için 15ms yapıldı
        if (
          this.dataCallbacks.size > 0 &&
          Date.now() - this.lastCallbackTime > 80
        ) {
          if (this._validKeysDirty) {
            this.validKeysArray = Array.from(this.validKeys);
            this._validKeysDirty = false;
          }
          this.currentData._validKeys = this.validKeysArray;
          this.dataCallbacks.forEach(cb => cb({...this.currentData}));
          this.lastCallbackTime = Date.now();
        }
        this.pollErrorCount = 0;
      } catch (e) {
        console.error('Polling hatası:', e);
        this.pollErrorCount++;
        const delay = Math.min(
          1000 * Math.pow(2, this.pollErrorCount - 1),
          30000,
        );
        if (this.pollRunning) {
          this.pollTimer = setTimeout(poll, delay);
        }
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

  pausePolling() {
    this.stopPolling();
  }

  resumePolling() {
    if (this.isSimulating) {
      this.startSimulation();
    } else if (this._isConnected && this.transport) {
      this.startPolling();
    }
  }

  async goBackground() {
    this.stopPolling();
    this.stopForegroundService();
    if (this.isSimulating) {
      this.isSimulating = false;
      this._isConnected = false;
      this.pollRunning = false;
      return;
    }
    if (this._isConnected && this.transport) {
      this.setConnectionState('background', 'Arka planda');
    }
  }

  async goForeground() {
    if (this.isSimulating) {
      this.startSimulation();
      return;
    }
    if (this._isConnected && this.transport) {
      this.startForegroundService();
      this.startPolling();
      this.setConnectionState('connected', 'Devam ediliyor');
    } else {
      const config = await this.loadLastDevice();
      if (!config) {return;}
      this._lastConfig = config;
      if (config.type === 'bluetooth') {
        try {
          if (!(await this.isBluetoothEnabled())) {return;}
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
        this.setConnectionState('disconnected', 'Bağlanılamadı');
      }
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
        this.currentData.turboBoostPressure = Math.max(
          0,
          val - this.currentData.barometricPressure,
        );
      }
    }
  }

  private parseTimingAdvance(response: string) {
    const val = this.parseHexValue(response, '410E', 4, 2);
    if (val !== null) {
      this.currentData.timingAdvance = val / 2 - 64;
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
        this.currentData.batteryVoltage =
          Math.round(((A * 256 + B) / 1000) * 10) / 10;
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
      this.currentData.shortTermFuelTrim = Math.round((val / 128 - 1) * 100);
    }
  }

  private parseLongTermFuelTrim(response: string) {
    const val = this.parseHexValue(response, '4108', 4, 2);
    if (val !== null) {
      this.currentData.longTermFuelTrim = Math.round((val / 128 - 1) * 100);
    }
  }

  private parseCommandedAFR(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4144') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.commandedAFR =
          Math.round(((A * 256 + B) / 32768) * 14.7 * 10) / 10;
      }
    }
  }

  private parseBarometricPressure(response: string) {
    const val = this.parseHexValue(response, '4133', 4, 2);
    if (val !== null) {
      this.currentData.barometricPressure = val;
    }
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
    if (val !== null) {
      this.currentData.relativeThrottlePos = Math.round((val / 255) * 100);
    }
  }

  private parseEthanolPercent(response: string) {
    const val = this.parseHexValue(response, '4152', 4, 2);
    if (val !== null) {
      this.currentData.ethanolPercent = val;
    }
  }

  private parseFuelSystemStatus(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4103') && clean.length >= 8) {
      const s1 = parseInt(clean.substring(4, 6), 16);
      const statuses: Record<number, string> = {
        0: 'Arızalı',
        1: 'Open Loop',
        2: 'Closed Loop',
        4: 'Open Loop (Fault)',
        8: 'Closed Loop (Fault)',
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
        this.currentData.catalystTempBank1 = Math.round(
          (A * 256 + B) / 10 - 40,
        );
      }
    }
  }

  private parseShortTermFuelTrim2(response: string) {
    const val = this.parseHexValue(response, '4109', 4, 2);
    if (val !== null) {
      this.currentData.shortTermFuelTrim2 = Math.round((val / 128 - 1) * 100);
    }
  }

  private parseLongTermFuelTrim2(response: string) {
    const val = this.parseHexValue(response, '410A', 4, 2);
    if (val !== null) {
      this.currentData.longTermFuelTrim2 = Math.round((val / 128 - 1) * 100);
    }
  }

  private parseDistanceSinceDTCClear(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4131') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.distanceSinceDTCClear = Math.round(A * 256 + B);
      }
    }
  }

  private parseFuelRailPressureRelative(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4122') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.fuelRailPressureRelative = Math.round(
          (A * 256 + B) * 0.079,
        );
      }
    }
  }

  private parseRunTime(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('411F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.runTime = A * 256 + B;
      }
    }
  }

  private parseEngineOilTemp(response: string) {
    const val = this.parseHexValue(response, '415C', 4, 2);
    if (val !== null) {
      this.currentData.engineOilTemp = val - 40;
    }
  }

  private parseFuelRate(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('415E') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.fuelRate = Math.round(((A * 256 + B) / 20) * 10) / 10;
      }
    }
  }

  private parseDistanceWithMIL(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4121') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.distanceWithMIL = A * 256 + B;
      }
    }
  }

  private parseActualEngineTorque(response: string) {
    const val = this.parseHexValue(response, '4162', 4, 2);
    if (val !== null) {
      this.currentData.actualEngineTorque = val - 125;
    }
  }

  private parseDriverDemandTorque(response: string) {
    const val = this.parseHexValue(response, '4161', 4, 2);
    if (val !== null) {
      this.currentData.driverDemandTorque = val - 125;
    }
  }

  private parseEngineReferenceTorque(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4163') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.engineReferenceTorque = A * 256 + B;
      }
    }
  }

  private parseTimeSinceDTCClear(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('414F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.timeSinceDTCClear = A * 256 + B;
      }
    }
  }

  private parseAbsoluteThrottleB(response: string) {
    const val = this.parseHexValue(response, '4147', 4, 2);
    if (val !== null) {
      this.currentData.absoluteThrottleB = Math.round((val / 255) * 100);
    }
  }

  private parseAbsoluteThrottleC(response: string) {
    const val = this.parseHexValue(response, '4148', 4, 2);
    if (val !== null) {
      this.currentData.absoluteThrottleC = Math.round((val / 255) * 100);
    }
  }

  private parseCommandedThrottleActuator(response: string) {
    const val = this.parseHexValue(response, '414C', 4, 2);
    if (val !== null) {
      this.currentData.commandedThrottleActuator = Math.round(
        (val / 255) * 100,
      );
    }
  }

  private parseAcceleratorPosD(response: string) {
    const val = this.parseHexValue(response, '4149', 4, 2);
    if (val !== null) {
      this.currentData.acceleratorPosD = Math.round((val / 255) * 100);
    }
  }

  private parseWarmUpsSinceDTCClear(response: string) {
    const val = this.parseHexValue(response, '4130', 4, 2);
    if (val !== null) {
      this.currentData.warmUpsSinceDTCClear = val;
    }
  }

  private parseFuelType(response: string) {
    const val = this.parseHexValue(response, '4151', 4, 2);
    if (val !== null) {
      const types: Record<number, string> = {
        1: 'Benzin',
        2: 'Metanol',
        3: 'Etanol',
        4: 'Dizel',
        5: 'LPG',
        6: 'CNG',
        7: 'Propan',
        8: 'Elektrik',
        9: 'Hibrit',
        10: 'Biyodizel',
        11: 'Etanol (E85)',
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
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.timeWithMIL = A * 256 + B;
      }
    }
  }

  private parseInjectionTiming(response: string) {
    const val = this.parseHexValue(response, '415D', 4, 2);
    if (val !== null) {
      this.currentData.injectionTiming = Math.round((val / 2 - 64) * 10) / 10;
    }
  }

  private parseCatalystTempBank2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('413D') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.catalystTempBank2 = Math.round(
          (A * 256 + B) / 10 - 40,
        );
      }
    }
  }

  private parseWideRangeO2B1S1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4134') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.wideRangeO2B1S1 =
          Math.round(((A * 256 + B) / 32768) * 10) / 10;
      }
    }
  }

  private parseAcceleratorPosE(response: string) {
    const val = this.parseHexValue(response, '414A', 4, 2);
    if (val !== null) {
      this.currentData.acceleratorPosE = Math.round((val / 255) * 100);
    }
  }

  private parseAcceleratorPosF(response: string) {
    const val = this.parseHexValue(response, '414B', 4, 2);
    if (val !== null) {
      this.currentData.acceleratorPosF = Math.round((val / 255) * 100);
    }
  }

  private parseFuelRailPressureAbsolute(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4159') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.fuelRailPressureAbsolute = Math.round(
          ((A * 256 + B) * 10) / 200,
        );
      }
    }
  }

  private parseEGTBank1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('415F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.egtBank1 = Math.round((A * 256 + B) / 10 - 40);
      }
    }
  }

  private parseEVAPVaporPressure(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4153') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.evapVaporPressure = A * 256 + B - 32767;
      }
    }
  }

  private parseRelativePedalPos(response: string) {
    const val = this.parseHexValue(response, '415A', 4, 2);
    if (val !== null) {
      this.currentData.relativePedalPos = Math.round((val / 255) * 100);
    }
  }

  private parseCommandedEgr(response: string) {
    const val = this.parseHexValue(response, '412C', 4, 2);
    if (val !== null) {
      this.currentData.commandedEgr = Math.round((val / 255) * 100);
    }
  }

  private parseEgrError(response: string) {
    const val = this.parseHexValue(response, '412D', 4, 2);
    if (val !== null) {
      this.currentData.egrError = Math.round((val / 128 - 1) * 100);
    }
  }

  private parseCommandedEvapPurge(response: string) {
    const val = this.parseHexValue(response, '412E', 4, 2);
    if (val !== null) {
      this.currentData.commandedEvapPurge = Math.round((val / 255) * 100);
    }
  }

  private parseO2B1S1EquivRatio(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4124') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.o2B1S1EquivRatio =
          Math.round(((A * 256 + B) / 32768) * 10) / 10;
      }
    }
  }

  private parseO2B1S2EquivRatio(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4125') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.o2B1S2EquivRatio =
          Math.round(((A * 256 + B) / 32768) * 10) / 10;
      }
    }
  }

  private parseActualEgr(response: string) {
    const val = this.parseHexValue(response, '4160', 4, 2);
    if (val !== null) {
      this.currentData.actualEgr = Math.round((val / 255) * 100);
    }
  }

  private parseEgrErrorDuty(response: string) {
    const val = this.parseHexValue(response, '4161', 4, 2);
    if (val !== null) {
      this.currentData.egrErrorDuty = Math.round((val / 128 - 1) * 100);
    }
  }

  private parseCommandedEvapPurgeFlow(response: string) {
    const val = this.parseHexValue(response, '4162', 4, 2);
    if (val !== null) {
      this.currentData.commandedEvapPurgeFlow = Math.round((val / 255) * 100);
    }
  }

  private parseMonitorStatusForPoll(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4101') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A)) {
        this.currentData.milOn = A >> 7 === 1;
        this.currentData.dtcCount = (A & 0x7f) * 2 + (B >> 4);
      }
    }
  }

  async readMonitorStatus(): Promise<MonitorStatus> {
    if (this.isSimulating) {
      return {
        milOn: false,
        dtcCount: 0,
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
          milOn = A >> 7 === 1;
          dtcCount = (A & 0x7f) * 2 + (B >> 4);
        }
      }
      const testNames = [
        'Katalitik Konvertör',
        'Katalitik Isıtıcı',
        'EGR/VVT Sistemi',
        'Yakıt Sistemi',
        'O2 Sensörü',
        'O2 Isıtıcı',
        'Buhar Emisyon',
        'Hava/Yakıt Oranı',
      ];
      const tests = testNames.map((name, i) => {
        const shift = i * 2;
        const byteIdx = Math.floor((shift + 3) / 8);
        const bitIdx = (shift + 3) % 8;
        const byteVal = parseInt(
          clean.substring(4 + byteIdx * 2, 6 + byteIdx * 2),
          16,
        );
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
      avgSpeed:
        this.tripSpeedCount > 0
          ? Math.round(this.tripSpeedSum / this.tripSpeedCount)
          : 0,
      maxSpeed: this.tripMaxSpeed,
      avgConsumption:
        this.tripDistanceKm > 0
          ? Math.round((this.tripFuelUsedL / this.tripDistanceKm) * 100 * 10) /
            10
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
    if (speedKmh > this.tripMaxSpeed) {
      this.tripMaxSpeed = speedKmh;
    }
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
    if (this.logBuffer.length === 0) {
      return {headers: '', rows: []};
    }
    const keys = Object.keys(this.currentData) as (keyof OBD2Data)[];
    const headers = keys.join(',');
    const rows = this.logBuffer.map(line => line).filter(Boolean);
    return {headers, rows};
  }

  getLogCSV(): string {
    if (this.logBuffer.length === 0) {
      return '';
    }
    const keys = Object.keys(this.currentData) as (keyof OBD2Data)[];
    const headers = 'timestamp,' + keys.join(',') + '\n';
    return headers + this.logBuffer.join('\n');
  }

  clearLogData() {
    this.logBuffer = [];
  }

  private addLogEntry(data: OBD2Data) {
    const now = Date.now();
    if (now - this.lastLogTime < 1000) {
      return;
    }
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
      let dtcs = this.parseDTCs(response);

      if (getSettings().rangeRoverLegacyMode) {
        const kwpResp = await this.sendCommand('18000000');
        const kwpDtcs = this.parseDTCs(kwpResp);
        dtcs = [...dtcs, ...kwpDtcs];
      }

      return dtcs.filter(
        (d, index, self) => index === self.findIndex(t => t.code === d.code),
      );
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
        rpm: 1200,
        speed: 45,
        coolantTemp: 92,
        engineLoad: 45,
        intakeTemp: 30,
        maf: 3.5,
        throttlePos: 25,
        fuelLevel: 60,
        map: 45,
        timingAdvance: 12,
        shortTermFuelTrim: 3,
        longTermFuelTrim: -2,
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
        throttlePos:
          throttleV !== null ? Math.round((throttleV / 255) * 100) : 0,
        fuelLevel: fuelV !== null ? Math.round((fuelV / 255) * 100) : 0,
        map: mapV !== null ? mapV : 0,
        timingAdvance: timingV !== null ? timingV / 2 - 64 : 0,
        shortTermFuelTrim:
          stftV !== null ? Math.round((stftV / 128 - 1) * 100) : 0,
        longTermFuelTrim:
          ltftV !== null ? Math.round((ltftV / 128 - 1) * 100) : 0,
        commandedAFR: afrV !== null ? afrV : 0,
      };
    } catch {
      return {
        dtc: null,
        rpm: 0,
        speed: 0,
        coolantTemp: 0,
        engineLoad: 0,
        intakeTemp: 0,
        maf: 0,
        throttlePos: 0,
        fuelLevel: 0,
        map: 0,
        timingAdvance: 0,
        shortTermFuelTrim: 0,
        longTermFuelTrim: 0,
        commandedAFR: 0,
      };
    }
  }

  async readPendingDTCs(): Promise<DTC[]> {
    if (this.isSimulating) {
      return [
        {code: 'P0171', description: 'Fakir Karışım (Banka 1) - Beklemede'},
      ];
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

  async readPermanentDTCs(): Promise<DTC[]> {
    if (this.isSimulating) {
      return [
        {code: 'P0600', description: 'Seri İletişim Bağlantı Hatası - Kalıcı'},
      ];
    }
    if (!this._isConnected || !this.transport) {
      return [];
    }
    try {
      const response = await this.sendCommand('0A');
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
    response: string,
    prefix: string,
    start: number,
    len: number,
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

  calculateHP(
    maf: number,
    useMetric: boolean = true,
  ): {whp: number; bhp: number} {
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
    // Remove all whitespace and multi-frame prefixes (0:, 1:, 2:)
    const clean = response.replace(/\s/g, '').replace(/[0-9A-Fa-f]:/gi, '');

    // Look for Mode 03 (43), Mode 07 (47), Mode 0A (4A), Mode 18 KWP (58)
    const match = clean.match(
      /43([0-9A-Fa-f]+)|47([0-9A-Fa-f]+)|4A([0-9A-Fa-f]+)|58([0-9A-Fa-f]+)/i,
    );
    if (!match) {return dtcs;}

    let payload = match[1] || match[2] || match[3] || match[4];
    if (!payload) {return dtcs;}

    // Mode 18 (58) returns Number of DTCs as first byte, ignore it
    let step = 4; // Standard OBD Mode 03 is 2 bytes per DTC (4 hex chars)
    if (match[4]) {
      payload = payload.substring(2);
      step = 6; // KWP Mode 18 is 3 bytes per DTC (High, Low, Status) -> 6 hex chars
    }

    for (let i = 0; i < payload.length - 3; i += step) {
      const b1 = payload.substring(i, i + 2);
      const b2 = payload.substring(i + 2, i + 4);
      if (b1 === '00' && b2 === '00') {continue;}

      const code = this.decodeDTC(b1, b2);
      if (code) {
        dtcs.push({
          code,
          description:
            DTC_DESCRIPTIONS[code] || `${code} - Tanımlanmamış hata kodu`,
        });
      }
    }

    return dtcs.filter(
      (d, index, self) => index === self.findIndex(t => t.code === d.code),
    );
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
      if (!isNaN(val)) {
        this.currentData.odometer = val / 10;
      }
    }
  }

  private parseHybridBatteryLife(response: string) {
    const val = this.parseHexValue(response, '415B', 4, 2);
    if (val !== null) {
      this.currentData.hybridBatteryLife = Math.round((val * 100) / 255);
    }
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
        this.currentData.dpfTemp = (A * 256 + B) / 10 - 40;
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
        this.currentData.turboRpm = A * 256 + B;
      }
    }
  }

  private parseChargeAirCoolerTemp(response: string) {
    const val = this.parseHexValue(response, '4177', 4, 2);
    if (val !== null) {
      this.currentData.chargeAirCoolerTemp = val - 40;
    }
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
    if (val !== null) {
      this.currentData.engineFrictionTorque = val - 125;
    }
  }

  private parseDistanceSinceDTCClearHighRes(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('418B') && clean.length >= 12) {
      const val = parseInt(clean.substring(4, 12), 16);
      if (!isNaN(val)) {
        this.currentData.distanceSinceDTCClearHighRes = val / 10;
      }
    }
  }

  private parseThrottlePositionG(response: string) {
    const val = this.parseHexValue(response, '418D', 4, 2);
    if (val !== null) {
      this.currentData.throttlePositionG = Math.round((val / 255) * 100);
    }
  }

  private parseSecondaryAirStatus(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4112') && clean.length >= 6) {
      const val = parseInt(clean.substring(4, 6), 16);
      if (val === 1) {
        this.currentData.secondaryAirStatus = 'Upstream';
      } else if (val === 2) {
        this.currentData.secondaryAirStatus = 'Downstream';
      } else if (val === 4) {
        this.currentData.secondaryAirStatus = 'Atmosphere';
      } else if (val === 8) {
        this.currentData.secondaryAirStatus = 'Off';
      } else {
        this.currentData.secondaryAirStatus = 'Unknown';
      }
    }
  }

  private parseObdStandard(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('411C') && clean.length >= 6) {
      const val = parseInt(clean.substring(4, 6), 16);
      const map: Record<number, string> = {
        1: 'OBD-II (CARB)',
        2: 'OBD (EPA)',
        3: 'OBD and OBD-II',
        4: 'OBD-I',
        5: 'Not OBD Compliant',
        6: 'EOBD',
        7: 'EOBD and OBD-II',
        8: 'EOBD and OBD',
        9: 'EOBD, OBD and OBD II',
        10: 'JOBD',
        11: 'JOBD and OBD II',
        12: 'JOBD and EOBD',
        13: 'JOBD, EOBD, and OBD II',
      };
      this.currentData.obdStandard = map[val] || `Bilinmiyor (${val})`;
    }
  }

  private parseEvapVaporPressureAbsolute(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4154') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.evapVaporPressureAbsolute = (A * 256 + B) / 200;
      }
    }
  }

  private parseEgtBank2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4179') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.egtBank2 = (A * 256 + B) / 10 - 40;
      }
    }
  }

  private parseTurboCompressorInletPressure(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('416F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.turboCompressorInletPressure = A;
      }
    }
  }

  private parseVgtControl(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4171') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.vgtControl = Math.round((A * 256 + B) / 2.55) / 100;
      }
    }
  }

  private parseWastegateControl(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4172') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.wastegateControl =
          Math.round((A * 256 + B) / 2.55) / 100;
      }
    }
  }

  private parseTurboTemp(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4175') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.turboTemp = (A * 256 + B) / 10 - 40;
      }
    }
  }

  private parseFuelPressureControl(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('416D') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.fuelPressureControl =
          Math.round((A * 256 + B) / 2.55) / 100;
      }
    }
  }

  private parseInjectionPressureControl(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('416E') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.injectionPressureControl =
          Math.round((A * 256 + B) / 2.55) / 100;
      }
    }
  }

  private parseCatalystTempBank1Sensor2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('413E') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.catalystTempBank1Sensor2 = (A * 256 + B) / 10 - 40;
      }
    }
  }

  private parseCatalystTempBank2Sensor2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('413F') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.catalystTempBank2Sensor2 = (A * 256 + B) / 10 - 40;
      }
    }
  }

  private parseBoostPressureControl(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4170') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.boostPressureControl = (A * 256 + B) / 10;
      }
    }
  }

  private parseDpfBypassPressure(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('417B') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.dpfBypassPressure = (A * 256 + B) / 10;
      }
    }
  }

  private parseNoxNTEControlStatus(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('417D') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.noxNTEControlStatus = A;
      }
    }
  }

  private parsePmNTEControlStatus(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('417E') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.pmNTEControlStatus = A;
      }
    }
  }

  private parseEngineAuxiliarySupported(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4165') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.engineAuxiliarySupported =
          A & 1 ? 'PTO Active' : 'None';
      }
    }
  }

  private parseO2Sensor3Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4116') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.o2Sensor3Voltage = A / 200;
      }
    }
  }

  private parseO2Sensor4Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4117') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.o2Sensor4Voltage = A / 200;
      }
    }
  }

  private parseO2Sensor5Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4118') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.o2Sensor5Voltage = A / 200;
      }
    }
  }

  private parseO2Sensor6Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4119') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.o2Sensor6Voltage = A / 200;
      }
    }
  }

  private parseO2Sensor7Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('411A') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.o2Sensor7Voltage = A / 200;
      }
    }
  }

  private parseO2Sensor8Voltage(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('411B') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.o2Sensor8Voltage = A / 200;
      }
    }
  }

  private parseShortTermO2TrimB1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4155') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.shortTermO2TrimB1 = ((A - 128) * 100) / 128;
      }
    }
  }

  private parseLongTermO2TrimB1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4156') && clean.length >= 6) {
      const A = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(A)) {
        this.currentData.longTermO2TrimB1 = ((A - 128) * 100) / 128;
      }
    }
  }

  private parseMafSensors(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4166') && clean.length >= 12) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      const C = parseInt(clean.substring(8, 10), 16);
      const D = parseInt(clean.substring(10, 12), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.mafSensorA = (A * 256 + B) / 100;
      }
      if (!isNaN(C) && !isNaN(D)) {
        this.currentData.mafSensorB = (C * 256 + D) / 100;
      }
    }
  }

  private parseCoolantTemp2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4167') && clean.length >= 8) {
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(B)) {
        this.currentData.engineCoolantTemp2 = B - 40;
      }
    }
  }

  private parseIntakeAirTemp2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4168') && clean.length >= 8) {
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(B)) {
        this.currentData.intakeAirTemp2 = B - 40;
      }
    }
  }

  private parseEngineRunTimeExtended(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('417F') && clean.length >= 12) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      const C = parseInt(clean.substring(8, 10), 16);
      const D = parseInt(clean.substring(10, 12), 16);
      if (!isNaN(A)) {
        this.currentData.engineRunTime = A * 16777216 + B * 65536 + C * 256 + D;
      }
    }
  }

  private parseWidebandO2S1(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4126') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.widebandO2S1 = (A * 256 + B) * (8 / 65535);
      }
    }
  }

  private parseWidebandO2S2(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4127') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.widebandO2S2 = (A * 256 + B) * (8 / 65535);
      }
    }
  }

  private parseWidebandO2S3(response: string) {
    const clean = response.replace(/\s/g, '');
    if (clean.startsWith('4128') && clean.length >= 8) {
      const A = parseInt(clean.substring(4, 6), 16);
      const B = parseInt(clean.substring(6, 8), 16);
      if (!isNaN(A) && !isNaN(B)) {
        this.currentData.widebandO2S3 = (A * 256 + B) * (8 / 65535);
      }
    }
  }

  private async disconnectTransport() {
    this._isConnected = false;
    this.stopPolling();
    this.stopForegroundService();
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
      if (
        k !== '_validKeys' &&
        k !== 'fuelSystemStatus' &&
        k !== 'fuelType' &&
        k !== 'milOn'
      ) {
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
    ['rpm', 'speed', 'batteryVoltage', 'coolantTemp'].forEach(k =>
      this.validKeys.add(k),
    );
    this.validKeysArray = Array.from(this.validKeys);
    this.currentData._validKeys = this.validKeysArray;
    this.dataCallbacks.forEach(cb => cb({...this.currentData}));
    this.setConnectionState('disconnected');
  }
}

export const obd2Service = new OBD2Service();

export type {
  OBD2Data,
  MonitorStatus,
  TripData,
  DTC,
  FreezeFrameData,
  ConnectionState,
  ConnectionType,
  ConnectionConfig,
} from '../types/OBD2Types';
export {OBD2_PROTOCOLS} from '../types/OBD2Types';
