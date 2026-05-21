import {OBD2Data} from './OBD2Service';

export type DataPoint = {
  time: number;
  data: OBD2Data;
};

const LOG_PIDS: (keyof OBD2Data)[] = [
  'rpm', 'speed', 'coolantTemp', 'engineLoad', 'maf', 'throttlePos',
  'fuelLevel', 'fuelPressure', 'timingAdvance', 'map', 'batteryVoltage',
  'intakeTemp', 'shortTermFuelTrim', 'longTermFuelTrim', 'commandedAFR',
  'o2Sensor1Voltage', 'fuelRate', 'engineOilTemp', 'intakeTemp',
  'absoluteLoad', 'relativeThrottlePos', 'fuelRailPressureRelative',
  'distanceSinceDTCClear', 'runTime', 'wideRangeO2B1S1', 'injectionTiming',
];

class DataLogService {
  private points: DataPoint[] = [];
  private recording = false;
  private startTime = 0;
  private lastUpdateTime = 0;
  private _fuelConsumed = 0;
  private _fuelPrice = 0;

  get isRecording() { return this.recording; }
  get pointCount() { return this.points.length; }
  get elapsed() { return this.recording ? (Date.now() - this.startTime) / 1000 : 0; }
  get fuelUsed() { return this._fuelConsumed; }

  setFuelPrice(price: number) { this._fuelPrice = price; }

  start(initialData?: OBD2Data) {
    this.points = [];
    this._fuelConsumed = 0;
    this.lastUpdateTime = 0;
    this.startTime = Date.now();
    this.recording = true;
    if (initialData) this.addDataPoint(initialData);
  }

  stop(): DataPoint[] {
    this.recording = false;
    return this.points;
  }

  reset() {
    this.points = [];
    this._fuelConsumed = 0;
    this.lastUpdateTime = 0;
    this.recording = false;
  }

  addDataPoint(d: OBD2Data) {
    if (!this.recording) return;
    const now = Date.now();
    if (this.lastUpdateTime > 0 && d.fuelRate > 0) {
      const dt = (now - this.lastUpdateTime) / 1000;
      this._fuelConsumed += d.fuelRate * dt / 3600;
    }
    this.lastUpdateTime = now;
    this.points.push({time: now, data: {...d}});
  }

  getDuration(): number {
    if (this.points.length < 2) return 0;
    return (this.points[this.points.length - 1].time - this.points[0].time) / 1000;
  }

  getFuelCost(): number {
    return this._fuelConsumed * this._fuelPrice;
  }

  getSummary(): {label: string; min: number; max: number; avg: number}[] {
    const sums: Record<string, {sum: number; min: number; max: number; count: number}> = {};
    for (const pt of this.points) {
      for (const key of LOG_PIDS) {
        const val = pt.data[key];
        if (typeof val !== 'number') continue;
        if (!sums[key]) sums[key] = {sum: 0, min: Infinity, max: -Infinity, count: 0};
        sums[key].sum += val;
        sums[key].count++;
        if (val < sums[key].min) sums[key].min = val;
        if (val > sums[key].max) sums[key].max = val;
      }
    }
    return Object.entries(sums).map(([key, v]) => ({
      label: key,
      min: Math.round(v.min * 100) / 100,
      max: Math.round(v.max * 100) / 100,
      avg: Math.round((v.sum / v.count) * 100) / 100,
    }));
  }

  toCSV(): string {
    if (this.points.length === 0) return '';
    const headers = ['timestamp', ...LOG_PIDS];
    const rows = this.points.map(pt => {
      const row = [new Date(pt.time).toISOString()];
      for (const key of LOG_PIDS) {
        const v = pt.data[key];
        row.push(typeof v === 'number' ? v.toFixed(2) : String(v));
      }
      return row.join(',');
    });
    return headers.join(',') + '\n' + rows.join('\n');
  }
}

export const dataLogService = new DataLogService();
