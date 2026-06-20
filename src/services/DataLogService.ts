import {OBD2Data} from './OBD2Service';
import ReactNativeBlobUtil from 'react-native-blob-util';

export type DataPoint = {
  time: number;
  data: OBD2Data;
};

const LOG_PIDS: (keyof OBD2Data)[] = [
  'rpm',
  'speed',
  'coolantTemp',
  'engineLoad',
  'maf',
  'throttlePos',
  'fuelLevel',
  'fuelPressure',
  'timingAdvance',
  'map',
  'batteryVoltage',
  'intakeTemp',
  'shortTermFuelTrim',
  'longTermFuelTrim',
  'commandedAFR',
  'o2Sensor1Voltage',
  'fuelRate',
  'engineOilTemp',
  'absoluteLoad',
  'relativeThrottlePos',
  'fuelRailPressureRelative',
  'distanceSinceDTCClear',
  'runTime',
  'wideRangeO2B1S1',
  'injectionTiming',
];

class DataLogService {
  private recording = false;
  private startTime = 0;
  private lastUpdateTime = 0;
  private _fuelConsumed = 0;
  private _fuelPrice = 0;
  private currentFilePath = '';
  private _pointCount = 0;

  get isRecording() {
    return this.recording;
  }
  get pointCount() {
    return this._pointCount;
  }
  get elapsed() {
    return this.recording ? (Date.now() - this.startTime) / 1000 : 0;
  }
  get fuelUsed() {
    return this._fuelConsumed;
  }

  setFuelPrice(price: number) {
    this._fuelPrice = price;
  }

  start(initialData?: OBD2Data) {
    this._fuelConsumed = 0;
    this._pointCount = 0;
    this.lastUpdateTime = 0;
    this.startTime = Date.now();
    
    const dirs = ReactNativeBlobUtil.fs.dirs;
    this.currentFilePath = `${dirs.DownloadDir}/ArabanTani_Log_${Date.now()}.csv`;
    
    // Write Header
    const headers = ['timestamp', ...LOG_PIDS];
    ReactNativeBlobUtil.fs.writeFile(this.currentFilePath, headers.join(',') + '\n', 'utf8').catch(console.warn);

    this.recording = true;
    if (initialData) {
      this.addDataPoint(initialData);
    }
  }

  stop(): string {
    this.recording = false;
    return this.currentFilePath;
  }

  reset() {
    this._fuelConsumed = 0;
    this._pointCount = 0;
    this.lastUpdateTime = 0;
    this.recording = false;
    this.currentFilePath = '';
  }

  addDataPoint(d: OBD2Data) {
    if (!this.recording || !this.currentFilePath) {
      return;
    }
    const now = Date.now();
    if (this.lastUpdateTime > 0 && d.fuelRate > 0) {
      const dt = (now - this.lastUpdateTime) / 1000;
      this._fuelConsumed += (d.fuelRate * dt) / 3600;
    }
    this.lastUpdateTime = now;
    this._pointCount++;
    
    const row = [new Date(now).toISOString()];
    for (const key of LOG_PIDS) {
      const v = d[key];
      row.push(typeof v === 'number' ? v.toFixed(2) : String(v));
    }
    
    // Append to file asynchronously
    ReactNativeBlobUtil.fs.appendFile(this.currentFilePath, row.join(',') + '\n', 'utf8').catch(console.warn);
  }

  getFuelCost(): number {
    return this._fuelConsumed * this._fuelPrice;
  }
}

export const dataLogService = new DataLogService();
