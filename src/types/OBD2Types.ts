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
  fuelConsumption: number;
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
  engineFuelRate: number;
  engineFrictionTorque: number;
  distanceSinceDTCClearHighRes: number;
  throttlePositionG: number;
  secondaryAirStatus: string;
  obdStandard: string;
  evapVaporPressureAbsolute: number;
  egtBank2: number;
  turboCompressorInletPressure: number;
  vgtControl: number;
  wastegateControl: number;
  turboTemp: number;
  fuelPressureControl: number;
  injectionPressureControl: number;
  catalystTempBank1Sensor2: number;
  catalystTempBank2Sensor2: number;
  boostPressureControl: number;
  dpfBypassPressure: number;
  noxNTEControlStatus: number;
  pmNTEControlStatus: number;
  engineAuxiliarySupported: string;
  o2Sensor3Voltage: number;
  o2Sensor4Voltage: number;
  o2Sensor5Voltage: number;
  o2Sensor6Voltage: number;
  o2Sensor7Voltage: number;
  o2Sensor8Voltage: number;
  shortTermO2TrimB1: number;
  longTermO2TrimB1: number;
  mafSensorA: number;
  mafSensorB: number;
  engineCoolantTemp2: number;
  intakeAirTemp2: number;
  engineRunTime: number;
  widebandO2S1: number;
  widebandO2S2: number;
  widebandO2S3: number;
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
  | 'background'
  | 'error';

export type ConnectionType = 'bluetooth' | 'wifi' | 'usb' | 'simulation';

export type ConnectionConfig = {
  type: ConnectionType;
  address?: string;
  name?: string;
  ip?: string;
  port?: number;
};

export type OBD2Callback = (data: OBD2Data) => void;
export type ConnectionCallback = (state: ConnectionState, message?: string) => void;

export interface Transport {
  connect(onProgress?: (msg: string) => void): Promise<boolean>;
  disconnect(): Promise<void>;
  write(data: string): Promise<void>;
  readAll(): Promise<string>;
  isAvailable(): Promise<number>;
}

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

export const PROTOCOL_LABELS: Record<string, string> = {
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

export const CONNECT_TIMEOUT = 10000;

export const ELM_CONSTANTS = {
  ATZ_RESET_DELAY: 2000,
  AT_CMD_DELAY: 300,
  ATSP_DELAY: 800,
  WRITE_DELAY: 150,
  READ_POLL_INTERVAL: 40,
  READ_MAX_POLLS: 50,
  READ_EMPTY_LIMIT: 5,
  FAST_WRITE_DELAY: 15,
  FAST_POLL_INTERVAL: 25,
  FAST_MAX_POLLS: 20,
};
