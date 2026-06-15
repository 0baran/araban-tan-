// =============================================================================
// OBD2 Diagnostic Modes: $05 (O2 Monitor), $06 (On-Board Monitor Tests),
//   $08 (Evap Control), $09 (Vehicle Information)
//
// Reference: SAE J1979 / ISO 15031-5
// =============================================================================

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface Mode05SensorResult {
  sensorNumber: number;
  bank: number; // 1..2 if detected, 0 if unknown
  manufacturer: 'OBD-II' | 'OE';
  richToLeanVoltage: number;
  leanToRichVoltage: number;
  richToLeanTime_ms: number;
  leanToRichTime_ms: number;
  minimumVoltage: number;
  maximumVoltage: number;
  transitionTime_ms: number; // this is a 2-byte field in later standards
  rawHex: string;
}

export interface Mode05Results {
  supportedSensors: number; // bitmask
  sensorResults: Mode05SensorResult[];
}

// ---------------------------------------------------------------------------
// MODE $06 – On-Board Monitor Test Results
// ---------------------------------------------------------------------------

/**
 * TID = Test ID – identifies *which* monitor/test is being reported.
 * CID = Component ID – identifies *which component* within the test.
 *
 * Professional scanner apps (Torque Pro, Car Scanner ELM OBD2, FORScan, etc.)
 * use Mode 06 extensively to diagnose failing emissions systems *before* a DTC
 * sets. The ECU runs continuous & non-continuous monitors; each monitor
 * reports a measured value and a min/max limit. If the measured value is
 * outside the limits, a pending DTC is flagged but the MIL may still be off.
 *
 * Common TID → Monitor mapping (SAE J1979-DA, manufacturer-dependent):
 *   TID $01–$0F  → Catalyst Monitor
 *   TID $10–$1F  → EGR / VVT Monitor
 *   TID $20–$2F  → HO2S / O2 Sensor Monitor
 *   TID $30–$3F  → EVAP System Monitor
 *   TID $40–$4F  → Secondary Air / Heated Catalyst
 *   TID $50–$5F  → Misfire Monitor
 *   TID $60–$6F  → Fuel System Monitor
 *   TID $70–$7F  → Comprehensive Component Monitor
 *   TID $80–$8F  → NMHC Catalyst
 *   TID $90–$9F  → NOx/SCR Monitor
 *   TID $A0–$AF  → Boost Pressure / PM Filter
 *   TID $B0–$BF  → EGR / VVT (manufacturer-specific)
 *   TID $C0–$CF  → Engine Cooling (manufacturer-specific)
 *   TID $D0–$DF  → Cold Start Emission Reduction
 *   TID $E0–$EF  → A/C Refrigerant Monitor
 *   TID $F0–$FF  → Manufacturer-Specific
 *
 * Each TID/CID pair returns 3 or 4 data bytes:
 *   [Measured Value (1-2B)] [Min Limit (1-2B)] [Max Limit (1-2B)]
 * The byte count is indicated by bits 6–7 of the TID response type byte.
 */

export interface Mode06TestResult {
  tid: number;          // Test ID (hex)
  tidName: string;      // Human-friendly monitor name
  cid: number;          // Component ID
  cidName: string;      // Component description
  valueRaw: number;     // Raw measured value (16-bit unsigned)
  minLimitRaw: number;  // Raw minimum limit
  maxLimitRaw: number;  // Raw maximum limit
  valueScaled: number;  // Scaled physical value
  minLimitScaled: number;
  maxLimitScaled: number;
  unit: string;         // Physical unit
  pass: boolean;        // True if value is within [min, max]
  passed: boolean | null; // null if limits are zero (monitor not run/completed)
  scalingType: 'A' | 'B' | 'C' | 'D' | 'unknown'; // SAE scaling type
  rawHex: string;
}

export interface Mode06Results {
  /** All test results keyed as "TID_CID" */
  results: Mode06TestResult[];
  /** Grouped by monitor category */
  grouped: Map<string, Mode06TestResult[]>;
}

// TID → Monitor name mapping (generic, may vary by manufacturer)
export const TID_NAMES: Record<number, string> = {
  // Catalyst
  0x01: 'Catalyst - Bank 1',
  0x02: 'Catalyst - Bank 2',
  0x03: 'Catalyst - Bank 1 (Oscillation)',
  0x04: 'Catalyst - Bank 2 (Oscillation)',
  0x05: 'Catalyst - Bank 1 (Other)',
  0x06: 'Catalyst - Bank 2 (Other)',
  // Oxygen Sensor
  0x10: 'O2 Sensor B1S1',
  0x11: 'O2 Sensor B1S2',
  0x12: 'O2 Sensor B2S1',
  0x13: 'O2 Sensor B2S2',
  0x14: 'O2 Sensor B1S3',
  0x15: 'O2 Sensor B2S3',
  0x16: 'O2 Sensor B1S4',
  0x17: 'O2 Sensor B2S4',
  0x18: 'O2 Sensor Heater B1S1',
  0x19: 'O2 Sensor Heater B1S2',
  0x1A: 'O2 Sensor Heater B2S1',
  0x1B: 'O2 Sensor Heater B2S2',
  0x1C: 'O2 Sensor Response B1S1',
  0x1D: 'O2 Sensor Response B2S1',
  // EGR / VVT
  0x20: 'EGR Monitor',
  0x21: 'EGR Flow',
  0x22: 'EGR Monitor (Bank 2)',
  0x23: 'VVT Monitor Bank 1',
  0x24: 'VVT Monitor Bank 2',
  0x25: 'EGR Temperature',
  0x26: 'EGR Pressure',
  // EVAP
  0x30: 'EVAP System (0.020 in)',
  0x31: 'EVAP System (0.040 in)',
  0x32: 'EVAP System (0.090 in)',
  0x33: 'EVAP Purge Flow',
  0x34: 'EVAP Vent Control',
  0x35: 'EVAP Leak Detection Pump',
  0x36: 'EVAP System (0.150 in)',
  0x37: 'EVAP System (0.500 in)',
  0x38: 'EVAP System (0.020 in, alternate)',
  // Secondary Air
  0x40: 'Secondary Air Monitor (Bank 1)',
  0x41: 'Secondary Air Monitor (Bank 2)',
  // Heated Catalyst
  0x50: 'Heated Catalyst - Bank 1',
  0x51: 'Heated Catalyst - Bank 2',
  // Misfire
  0x60: 'Misfire Monitor - General',
  0x61: 'Misfire - Cyl 1',
  0x62: 'Misfire - Cyl 2',
  0x63: 'Misfire - Cyl 3',
  0x64: 'Misfire - Cyl 4',
  0x65: 'Misfire - Cyl 5',
  0x66: 'Misfire - Cyl 6',
  0x67: 'Misfire - Cyl 7',
  0x68: 'Misfire - Cyl 8',
  0x69: 'Misfire - Cyl 9',
  0x6A: 'Misfire - Cyl 10',
  0x6B: 'Misfire - Cyl 11',
  0x6C: 'Misfire - Cyl 12',
  0x6D: 'Misfire - Rough Road Sensor',
  0x6E: 'Misfire - Crankshaft Sensor',
  // Fuel System
  0x70: 'Fuel System Monitor',
  0x71: 'Fuel Trim Bank 1',
  0x72: 'Fuel Trim Bank 2',
  0x73: 'Fuel Pressure Monitor',
  // Comprehensive Components
  0x80: 'Comprehensive Components',
  0x81: 'NMHC Catalyst Monitor',
  0x82: 'NOx/SCR Monitor',
  0x83: 'Boost Pressure Monitor',
  0x84: 'PM Filter Monitor',
  0x85: 'Exhaust Gas Sensor Monitor',
  // Additional
  0x90: 'Engine Cooling',
  0x91: 'Cold Start Strategy',
  0x92: 'VVT Response Bank 1',
  0x93: 'VVT Response Bank 2',
  0xA0: 'A/C Refrigerant',
  0xA1: 'PCV System',
};

export const CID_NAMES: Record<string, string> = {
  // Catalyst
  '01_01': 'Catalyst Bank 1 Efficiency',
  '02_01': 'Catalyst Bank 2 Efficiency',
  // O2
  '10_01': 'O2 B1S1 Rich→Lean Time',
  '10_02': 'O2 B1S1 Lean→Rich Time',
  '10_03': 'O2 B1S1 Low Voltage Switch',
  '10_04': 'O2 B1S1 High Voltage Switch',
  '10_05': 'O2 B1S1 Period',
  '10_06': 'O2 B1S1 Transition Count',
  '11_01': 'O2 B1S2 Rich→Lean Time',
  '11_02': 'O2 B1S2 Lean→Rich Time',
  '12_01': 'O2 B2S1 Rich→Lean Time',
  '12_02': 'O2 B2S1 Lean→Rich Time',
  '13_01': 'O2 B2S2 Rich→Lean Time',
  '13_02': 'O2 B2S2 Lean→Rich Time',
  '18_01': 'O2 Heater B1S1 Current',
  '18_02': 'O2 Heater B1S1 Voltage',
  '19_01': 'O2 Heater B1S2 Current',
  '1A_01': 'O2 Heater B2S1 Current',
  '1B_01': 'O2 Heater B2S2 Current',
  // EGR
  '20_01': 'EGR Flow Delta Pressure',
  '20_02': 'EGR Temperature',
  '20_03': 'EGR Valve Position',
  '23_01': 'VVT Intake Bank 1 Angle',
  '23_02': 'VVT Exhaust Bank 1 Angle',
  '24_01': 'VVT Intake Bank 2 Angle',
  '24_02': 'VVT Exhaust Bank 2 Angle',
  // EVAP
  '30_01': 'EVAP Leak 0.020in Vacuum Decay',
  '31_01': 'EVAP Leak 0.040in Vacuum Decay',
  '33_01': 'EVAP Purge Flow Rate',
  // Misfire
  '61_01': 'Misfire Cyl 1 Count',
  '62_01': 'Misfire Cyl 2 Count',
  '63_01': 'Misfire Cyl 3 Count',
  '64_01': 'Misfire Cyl 4 Count',
  '65_01': 'Misfire Cyl 5 Count',
  '66_01': 'Misfire Cyl 6 Count',
  '6D_01': 'Rough Road Sensor Status',
  // Fuel
  '71_01': 'Long Term Fuel Trim Bank 1',
  '71_02': 'Short Term Fuel Trim Bank 1',
  '72_01': 'Long Term Fuel Trim Bank 2',
  '73_01': 'Fuel Pressure',
};

/**
 * Scaling types (SAE J1979):
 *   A = Linear, 1 byte value, 1 byte limits (result type 0x00-0x3F)
 *   B = Linear, 2 byte value, 2 byte limits (result type 0x40-0x7F)
 *   C = 2-byte value with 1-byte limits (result type 0x80-0xBF)
 *   D = 1-byte value with 2-byte limits (result type 0xC0-0xFF)
 */

interface Mode06Scaling {
  type: 'A' | 'B' | 'C' | 'D';
  valueBytes: number;
  limitBytes: number;
  factor: number;
  offset: number;
  unit: string;
}

function detectScaling(tid: number, cid: number): Mode06Scaling {
  const tidRange = (tid >> 4) & 0x0f; // upper nibble to guess monitor type

  if (tid >= 0x01 && tid <= 0x06) {
    return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1/65535, offset: 0, unit: 'ratio'};
  }
  if (tid >= 0x10 && tid <= 0x1D) {
    if (tid >= 0x18) {
      return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1, offset: 0, unit: 'mA'};
    }
    return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1/1000, offset: 0, unit: 's'};
  }
  if (tid >= 0x20 && tid <= 0x26) {
    if (tid === 0x25) return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1/10 - 40, offset: 0, unit: '°C'};
    if (tid === 0x26) return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1, offset: 0, unit: 'Pa'};
    return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1, offset: 0, unit: ''};
  }
  if (tid >= 0x30 && tid <= 0x37) {
    return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1, offset: 0, unit: 'Pa'};
  }
  if (tid >= 0x60 && tid <= 0x6E) {
    return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1, offset: 0, unit: 'counts'};
  }
  if (tid >= 0x70 && tid <= 0x73) {
    return {type: 'A', valueBytes: 1, limitBytes: 1, factor: 100/128 - 100, offset: 0, unit: '%'};
  }
  if (tid >= 0x80 && tid <= 0x85) {
    return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1, offset: 0, unit: ''};
  }
  // Default: Type B (2-byte value, 2-byte limits)
  return {type: 'B', valueBytes: 2, limitBytes: 2, factor: 1, offset: 0, unit: 'raw'};
}

/**
 * How professional scanner apps use $06:
 *   - Torque Pro: Shows TID/CID table with green (pass) / red (fail) indicators.
 *     Many users install custom PID files for manufacturer-specific TIDs.
 *   - Car Scanner ELM OBD2: Renders per-monitor gauge cards; tapping expands
 *     the TID/CID list. Uses manufacturer databases to label TIDs/CIDs.
 *   - FORScan: Full Mode 06 with PID descriptors loaded from Ford VBF files.
 *   - BlueDriver: Auto-parses and highlights failing tests with probable DTC.
 */

// ---------------------------------------------------------------------------
// MODE $05 – Oxygen Sensor Monitoring (pre-CAN only, most modern ECUs moved
//   this data to Mode $06 TIDs $10–$1D)
// ---------------------------------------------------------------------------

const O2_MONITOR_NAMES = [
  'O2 Sensor 1 (Bank 1 Sensor 1)',
  'O2 Sensor 2 (Bank 1 Sensor 2)',
  'O2 Sensor 3 (Bank 2 Sensor 1)',
  'O2 Sensor 4 (Bank 2 Sensor 2)',
  'O2 Sensor 5 (Bank 1 Sensor 3)',
  'O2 Sensor 6 (Bank 2 Sensor 3)',
  'O2 Sensor 7 (Bank 1 Sensor 4)',
  'O2 Sensor 8 (Bank 2 Sensor 4)',
];

export function parseMode05(response: string): Mode05Results | null {
  const clean = response.replace(/\s/g, '');
  if (!clean.startsWith('45')) return null;

  // Skip '45' prefix
  let pos = 2;

  // Read Test ID byte – on mode 05 the sub-command byte is the sensor mask
  // For generic ELM327, the user sends '05' and gets a multi-frame response.
  // The response contains a bitmask byte then up to 8 sensor blocks.
  // Each sensor block for OE sensors is 7 bytes; for OBD-II it's 2 bytes.

  if (pos >= clean.length) return null;

  const sensorMask = parseInt(clean.substring(pos, pos + 2), 16);
  if (isNaN(sensorMask)) return null;
  pos += 2;

  const results: Mode05SensorResult[] = [];

  for (let i = 0; i < 8; i++) {
    if (!((sensorMask >> (7 - i)) & 1)) continue;

    if (pos + 4 > clean.length) break;

    // First byte after mask: tells us OBD-II vs OE and data format
    const sensorTypeByte = parseInt(clean.substring(pos, pos + 2), 16);
    const isOE = (sensorTypeByte & 0x10) !== 0; // bit 4 = OE sensor data
    pos += 2;

    if (isOE) {
      // OE sensor data: 11 bytes total
      if (pos + 22 > clean.length) break;

      const richToLeanV = parseInt(clean.substring(pos, pos + 2), 16);
      pos += 2;
      const leanToRichV = parseInt(clean.substring(pos, pos + 2), 16);
      pos += 2;
      const rtlTimeRaw = parseInt(clean.substring(pos, pos + 4), 16);
      pos += 4;
      const ltrTimeRaw = parseInt(clean.substring(pos, pos + 4), 16);
      pos += 4;
      const minV = parseInt(clean.substring(pos, pos + 2), 16);
      pos += 2;
      const maxV = parseInt(clean.substring(pos, pos + 2), 16);
      pos += 2;
      const transTimeRaw = parseInt(clean.substring(pos, pos + 4), 16);
      pos += 4;

      results.push({
        sensorNumber: i + 1,
        bank: i < 2 ? 1 : 2,
        manufacturer: 'OE',
        richToLeanVoltage: richToLeanV * 0.005,
        leanToRichVoltage: leanToRichV * 0.005,
        richToLeanTime_ms: rtlTimeRaw * 0.0156,
        leanToRichTime_ms: ltrTimeRaw * 0.0156,
        minimumVoltage: minV * 0.005,
        maximumVoltage: maxV * 0.005,
        transitionTime_ms: transTimeRaw * 0.0156,
        rawHex: clean,
      });
    } else {
      // OBD-II data: only 2 bytes – max sensor voltage and transition time
      if (pos + 2 > clean.length) break;

      const maxV = parseInt(clean.substring(pos, pos + 2), 16);
      pos += 2;
      // The second byte encodes the short times; simplified here
      const shortTimeRaw = (sensorTypeByte & 0x0F);

      results.push({
        sensorNumber: i + 1,
        bank: i < 2 ? 1 : 2,
        manufacturer: 'OBD-II',
        richToLeanVoltage: 0,
        leanToRichVoltage: 0,
        richToLeanTime_ms: 0,
        leanToRichTime_ms: 0,
        minimumVoltage: 0,
        maximumVoltage: maxV * 0.005,
        transitionTime_ms: shortTimeRaw * 0.0156,
        rawHex: clean,
      });
    }
  }

  return {supportedSensors: sensorMask, sensorResults: results};
}

// ---------------------------------------------------------------------------
// MODE $06 – On-Board Monitor Test Results
// ---------------------------------------------------------------------------

/**
 * Parse a single Mode 06 response line.
 *
 * When you send "06" to the ELM327, the ECU returns multiple lines.
 * Each line has the format:
 *   46 <TID> <CID> <ResultType> <Data...>
 *
 * The data portion depends on the result-type byte (SAE J1979 §B.6):
 *   Type A: 1B value + 1B min + 1B max  = 3 data bytes
 *   Type B: 2B value + 2B min + 2B max  = 6 data bytes
 *   Type C: 2B value + 1B min + 1B max  = 4 data bytes
 *   Type D: 1B value + 2B min + 2B max  = 5 data bytes
 *   (Type E/F: manufacturer-specific with scaling info embedded)
 */
export function parseMode06Line(line: string): Mode06TestResult | null {
  const clean = line.replace(/\s/g, '');
  if (!clean.startsWith('46') || clean.length < 12) return null;

  const tid = parseInt(clean.substring(2, 4), 16);
  const cid = parseInt(clean.substring(4, 6), 16);
  if (isNaN(tid) || isNaN(cid)) return null;

  const resultType = parseInt(clean.substring(6, 8), 16);
  if (isNaN(resultType)) return null;

  // Determine scaling from result-type byte
  const typeCode = resultType & 0xc0; // high 2 bits
  let scalingType: 'A' | 'B' | 'C' | 'D' | 'unknown' = 'unknown';
  let valueBytes = 2, limitBytes = 2;

  if (resultType <= 0x3f) { scalingType = 'A'; valueBytes = 1; limitBytes = 1; }
  else if (resultType >= 0x40 && resultType <= 0x7f) { scalingType = 'B'; valueBytes = 2; limitBytes = 2; }
  else if (resultType >= 0x80 && resultType <= 0xbf) { scalingType = 'C'; valueBytes = 2; limitBytes = 1; }
  else if (resultType >= 0xc0 && resultType <= 0xff) { scalingType = 'D'; valueBytes = 1; limitBytes = 2; }

  const totalDataBytes = valueBytes + limitBytes * 2;
  if (clean.length < 8 + (totalDataBytes * 2)) return null;

  let pos = 8;

  function readBytes(n: number): number {
    const hex = clean.substring(pos, pos + n * 2);
    pos += n * 2;
    return parseInt(hex, 16) || 0;
  }

  const valueRaw = readBytes(valueBytes);
  const minLimitRaw = readBytes(limitBytes);
  const maxLimitRaw = readBytes(limitBytes);

  // Apply generic scaling – real values depend on TID/CID manufacturer DB
  const scaling = detectScaling(tid, cid);
  const valueScaled = valueRaw * scaling.factor + scaling.offset;
  const minLimitScaled = minLimitRaw * scaling.factor + scaling.offset;
  const maxLimitScaled = maxLimitRaw * scaling.factor + scaling.offset;

  // A test "passes" when measured value is within [min, max]
  // If both min and max are 0, the monitor hasn't run (pass = null)
  const limitsAreZero = minLimitRaw === 0 && maxLimitRaw === 0;
  const pass = limitsAreZero ? true : (valueRaw >= minLimitRaw && valueRaw <= maxLimitRaw);

  const tidName = TID_NAMES[tid] || `Unknown TID $${tid.toString(16).toUpperCase().padStart(2, '0')}`;
  const cidKey = `${tid.toString(16).toUpperCase().padStart(2, '0')}_${cid.toString(16).toUpperCase().padStart(2, '0')}`;
  const cidName = CID_NAMES[cidKey] || `Component $${cid.toString(16).toUpperCase().padStart(2, '0')}`;

  return {
    tid,
    tidName,
    cid,
    cidName,
    valueRaw,
    minLimitRaw,
    maxLimitRaw,
    valueScaled,
    minLimitScaled,
    maxLimitScaled,
    unit: scaling.unit,
    pass,
    passed: limitsAreZero ? null : pass,
    scalingType,
    rawHex: clean,
  };
}

/**
 * Parse a full Mode 06 response (all lines combined).
 * The ELM327 returns multiple "46 XX YY ..." lines.
 */
export function parseMode06(response: string): Mode06Results {
  const results: Mode06TestResult[] = [];
  const grouped = new Map<string, Mode06TestResult[]>();

  // Split by newlines or '46' markers
  const lines = response.split(/[\r\n]+/).filter(Boolean);
  // Also handle single-string responses with multiple 46 prefixes
  const allSegments: string[] = [];
  const raw = response.replace(/\s/g, '');
  let idx = 0;
  while (idx < raw.length) {
    const next46 = raw.indexOf('46', idx + 1);
    if (next46 === -1) {
      allSegments.push(raw.substring(idx));
      break;
    }
    allSegments.push(raw.substring(idx, next46));
    idx = next46;
  }

  for (const segment of allSegments) {
    const result = parseMode06Line(segment);
    if (!result) continue;

    results.push(result);

    // Group by monitor category using upper nibble of TID
    const groupKey = getMonitorGroupName(result.tid);
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey)!.push(result);
  }

  return {results, grouped};
}

function getMonitorGroupName(tid: number): string {
  const hi = (tid >> 4) & 0x0f;
  const groups: Record<number, string> = {
    0x0: 'Catalyst',
    0x1: 'Oxygen Sensor',
    0x2: 'EGR / VVT',
    0x3: 'EVAP System',
    0x4: 'Secondary Air',
    0x5: 'Heated Catalyst',
    0x6: 'Misfire',
    0x7: 'Fuel System',
    0x8: 'Comprehensive / NMHC',
    0x9: 'Engine Cooling / VVT',
    0xA: 'A/C / PCV',
  };
  return groups[hi] || `Group 0x${hi.toString(16).toUpperCase()}`;
}

/**
 * Handy function to determine if a $06 test is "failing" in the way that
 * would trigger a pending DTC. Mirrors Torque Pro's logic:
 *   - If passed === false AND passed !== null → FAIL
 *   - If passed === null → NOT RUN / INCOMPLETE
 *   - If passed === true → PASS
 */
export function classifyMode06Test(test: Mode06TestResult): 'PASS' | 'FAIL' | 'NOT_RUN' {
  if (test.passed === null) return 'NOT_RUN';
  return test.passed ? 'PASS' : 'FAIL';
}

/**
 * Format Mode 06 results as Torque Pro / Car Scanner would display them.
 */
export function formatMode06Table(results: Mode06Results): string {
  const lines: string[] = [];
  lines.push('TID | CID | Description                | Value       | Min         | Max         | Result');
  lines.push('----+-----+----------------------------+-------------+-------------+-------------+-------');

  for (const r of results.results) {
    const tidHex = r.tid.toString(16).toUpperCase().padStart(2, '0');
    const cidHex = r.cid.toString(16).toUpperCase().padStart(2, '0');
    const status = classifyMode06Test(r);
    const statusIcon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '?';
    lines.push(
      `$${tidHex} | $${cidHex} | ${r.cidName.padEnd(26)} | ${String(r.valueRaw).padStart(11)} | ${String(r.minLimitRaw).padStart(11)} | ${String(r.maxLimitRaw).padStart(11)} | ${statusIcon} ${status}`,
    );
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// MODE $08 – Evaporative System Test Control
// ---------------------------------------------------------------------------

/**
 * Mode $08 controls the EVAP system leak-test.
 *
 * On modern cars (2005+), many ECUs still support Mode 08 but the test
 * may be inhibited unless specific conditions are met:
 *   - Engine off, ignition on
 *   - Fuel level 15-85%
 *   - Coolant temp near ambient
 *   - No DTCs present
 *
 * The command '08' (no sub-PID) requests the ECU to seal the EVAP system
 * and run the leak detection pump. The response indicates whether the
 * test started or was rejected.
 *
 * For CAN vehicles, you may need to use Service 0x31 (UDS Routine Control)
 * via functional addressing instead of Mode $08.
 */

export interface Mode08Result {
  /** True if the ECU accepted the test request */
  accepted: boolean;
  /** Raw response hex */
  responseHex: string;
  /** Human-readable status */
  status: string;
}

/**
 * Send Mode $08 command to initiate EVAP leak test.
 * Response: "48" = accepted, "7F 08 XX" = rejected with NRC
 */
export function parseMode08(response: string): Mode08Result {
  const clean = response.replace(/\s/g, '');

  if (clean.startsWith('48')) {
    return {
      accepted: true,
      responseHex: clean,
      status: 'EVAP test started. Wait for completion (may take 2-10 minutes).',
    };
  }

  if (clean.startsWith('7F08')) {
    const nrc = clean.substring(4, 6);
    const nrcMsgs: Record<string, string> = {
      '12': 'Sub-function not supported',
      '22': 'Conditions not correct (engine running, fuel level out of range, etc.)',
      '31': 'Request out of range',
      '78': 'Response pending (test in progress, wait)',
    };
    return {
      accepted: false,
      responseHex: clean,
      status: nrcMsgs[nrc] || `Rejected (NRC 0x${nrc})`,
    };
  }

  return {
    accepted: false,
    responseHex: clean,
    status: 'No response or unexpected reply',
  };
}

// ---------------------------------------------------------------------------
// MODE $09 – Vehicle Information
// ---------------------------------------------------------------------------

/**
 * Mode $09 PIDs beyond the standard VIN (0902):
 *
 *   0901 – VIN Message Count (CAN only: 09 01 = how many CAN frames needed)
 *   0902 – VIN (17 chars, ASCII encoded in hex)
 *   0903 – Cal ID Message Count (CAN)
 *   0904 – Calibration ID(s) – multiple lines of ASCII
 *   0905 – CVN Message Count (CAN)
 *   0906 – Calibration Verification Number(s) – hex values
 *   0907 – Performance Tracking Message Count (CAN)
 *   0908 – ECU Name (ASCII)
 *   0909 – ECU Name Message Count (CAN)
 *   090A – In-use Performance Tracking – many lines of hex data
 *
 * Flow when ECU doesn't support a specific Mode 09 PID:
 *   - ELM327 returns "NO DATA" or "?"
 *   - Some ELM clones return empty string
 *   - CAN response: 7F 09 12 (serviceNotSupported) or 7F 09 31 (requestOutOfRange)
 *   - Implement a fallback: try the PID, if it fails, try with
 *     ATSH + function addressing, or just mark as unsupported.
 */

export interface Mode09VehicleInfo {
  vin: string;
  calibrationIDs: string[];
  cvns: string[];
  ecuNames: string[];
  performanceTracking: Uint8Array | null;
  rawResponses: Map<string, string>;
}

/**
 * Parse VIN from 0902 response.
 * Response format: 49 02 01 <ASCII hex bytes...>
 * The "01" after 4902 is the number of data items (always 1 for VIN).
 */
export function parse0902VIN(response: string): string {
  const clean = response.replace(/[\s\r\n>]/g, '');
  const idx = clean.indexOf('4902');
  if (idx < 0) return '';

  // Skip 4902 + sub-item count byte
  let pos = idx + 4;
  // On some ECUs the next byte = item count; on others it's the first VIN byte.
  // Heuristic: if next byte looks like a count (0x01), skip it
  const maybeCount = clean.substring(pos, pos + 2);
  if (maybeCount === '01') pos += 2;

  let vin = '';
  for (let i = pos; i < clean.length; i += 2) {
    const code = parseInt(clean.substring(i, i + 2), 16);
    if (isNaN(code)) break;
    // Stop at null terminator (0x00) or non-ASCII
    if (code === 0x00) break;
    if (code >= 0x20 && code <= 0x7e) {
      vin += String.fromCharCode(code);
    } else {
      break;
    }
  }
  return vin.trim();
}

/**
 * Parse Calibration ID(s) from 0904 response.
 * Response format: 49 04 <count> <data...>
 * Multiple cal IDs may be concatenated with null terminators.
 */
export function parse0904CalibrationIDs(response: string): string[] {
  const clean = response.replace(/[\s\r\n>]/g, '');
  const idx = clean.indexOf('4904');
  if (idx < 0) return [];

  let pos = idx + 4;
  const count = parseInt(clean.substring(pos, pos + 2), 16) || 1;
  pos += 2;

  const ids: string[] = [];
  let current = '';
  for (let i = pos; i < clean.length; i += 2) {
    const code = parseInt(clean.substring(i, i + 2), 16);
    if (isNaN(code)) break;
    if (code === 0x00) {
      if (current) { ids.push(current.trim()); current = ''; }
      if (ids.length >= count) break;
    } else if (code >= 0x20 && code <= 0x7e) {
      current += String.fromCharCode(code);
    } else {
      break;
    }
  }
  if (current) ids.push(current.trim());
  return ids;
}

/**
 * Parse CVN(s) from 0906 response.
 * Response format: 49 06 <count> <CVN hex bytes...>
 * Each CVN is typically 4 bytes (8 hex chars). Some ECUs use 2 bytes.
 */
export function parse0906CVNs(response: string): string[] {
  const clean = response.replace(/[\s\r\n>]/g, '');
  const idx = clean.indexOf('4906');
  if (idx < 0) return [];

  let pos = idx + 4;
  const count = parseInt(clean.substring(pos, pos + 2), 16) || 1;
  pos += 2;

  const cvns: string[] = [];
  // Each CVN is typically 4 bytes read as big-endian hex
  for (let c = 0; c < count; c++) {
    if (pos + 8 > clean.length) break;
    const rawHex = clean.substring(pos, pos + 8);
    const cvn = rawHex.match(/.{2}/g)?.reverse().join('') || rawHex;
    cvns.push(cvn);
    pos += 8;
  }
  return cvns;
}

/**
 * Parse ECU Name from 0908 response.
 * Response format: 49 08 <count> <ASCII hex...>
 * Similar to VIN but without null padding convention.
 */
export function parse0908ECUName(response: string): string {
  const clean = response.replace(/[\s\r\n>]/g, '');
  const idx = clean.indexOf('4908');
  if (idx < 0) return '';

  let pos = idx + 4;
  const maybeCount = clean.substring(pos, pos + 2);
  if (maybeCount === '01') pos += 2; // skip item count if present

  let name = '';
  for (let i = pos; i < clean.length; i += 2) {
    const code = parseInt(clean.substring(i, i + 2), 16);
    if (isNaN(code)) break;
    if (code === 0x00) break;
    if (code >= 0x20 && code <= 0x7e) {
      name += String.fromCharCode(code);
    } else {
      break;
    }
  }
  return name.trim();
}

/**
 * Parse In-use Performance Tracking from 090A response.
 * Response format: 49 0A <count> <tracking data...>
 *
 * This is a complex multi-record structure. Each record is:
 *   <PID (2B)> <CTR (1B)> <value> <min> <max>
 *
 * In practice this is manufacturer-specific and rarely used
 * by consumer-level tools. Torque Pro does not parse 090A.
 * Car Scanner ELM OBD2 displays a raw hex dump.
 */
export function parse090APerformanceTracking(response: string): {
  pid: number;
  counter: number;
  value: number;
  min: number;
  max: number;
}[] {
  const clean = response.replace(/[\s\r\n>]/g, '');
  const idx = clean.indexOf('490A');
  if (idx < 0) return [];

  let pos = idx + 4;
  const count = parseInt(clean.substring(pos, pos + 2), 16) || 0;
  pos += 2;

  const records: {pid: number; counter: number; value: number; min: number; max: number}[] = [];
  // Each record is minimum 5 bytes: PID(2B), CTR(1B), Value(1B), Min(1B), Max(1B)
  const recordSize = 6; // 2 + 1 + 1 + 1 + 1 bytes
  for (let r = 0; r < count; r++) {
    if (pos + recordSize * 2 > clean.length) break;
    const pid = parseInt(clean.substring(pos, pos + 4), 16);
    pos += 4;
    const ctr = parseInt(clean.substring(pos, pos + 2), 16);
    pos += 2;
    const value = parseInt(clean.substring(pos, pos + 2), 16);
    pos += 2;
    const min = parseInt(clean.substring(pos, pos + 2), 16);
    pos += 2;
    const max = parseInt(clean.substring(pos, pos + 2), 16);
    pos += 2;
    records.push({pid, counter: ctr, value, min, max});
  }
  return records;
}

/**
 * Main Mode 09 parser – tries multiple PIDs and collects results.
 * Call this from OBD2Service with a sendCommand function reference.
 */
export async function collectMode09Info(
  sendCommand: (cmd: string) => Promise<string>,
): Promise<Mode09VehicleInfo> {
  const info: Mode09VehicleInfo = {
    vin: '',
    calibrationIDs: [],
    cvns: [],
    ecuNames: [],
    performanceTracking: null,
    rawResponses: new Map(),
  };

  // --- VIN (0902) ---
  const vinResp = await sendCommand('0902');
  info.rawResponses.set('0902', vinResp);
  info.vin = parse0902VIN(vinResp);

  // --- Calibration IDs (0904) ---
  const calResp = await sendCommand('0904');
  info.rawResponses.set('0904', calResp);
  info.calibrationIDs = parse0904CalibrationIDs(calResp);

  // --- CVN (0906) ---
  const cvnResp = await sendCommand('0906');
  info.rawResponses.set('0906', cvnResp);
  info.cvns = parse0906CVNs(cvnResp);

  // --- ECU Name (0908) ---
  const ecuResp = await sendCommand('0908');
  info.rawResponses.set('0908', ecuResp);
  const ecuName = parse0908ECUName(ecuResp);
  if (ecuName) info.ecuNames = [ecuName];

  // --- Try additional ECU names via 0909 message count on CAN ---
  const cntResp = await sendCommand('0909');
  info.rawResponses.set('0909', cntResp);
  const cntMatch = cntResp.replace(/\s/g, '').match(/4909(\w{2})/);
  if (cntMatch) {
    const msgCount = parseInt(cntMatch[1], 16);
    for (let m = 1; m < msgCount && m < 10; m++) {
      // Multi-line ECU name retrieval via flow control would need
      // 3000 / 3001 flow control frames — left as a manufacturer-specific extension
    }
  }

  // --- Performance Tracking (090A) – optional heavy call ---
  try {
    const perfResp = await sendCommand('090A');
    info.rawResponses.set('090A', perfResp);
    if (perfResp && !perfResp.includes('NO DATA') && !perfResp.includes('7F09')) {
      const records = parse090APerformanceTracking(perfResp);
      // Convert to Uint8Array for raw storage
      const bytes = new Uint8Array(perfResp.replace(/\s/g, '').length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(perfResp.replace(/\s/g, '').substring(i * 2, i * 2 + 2), 16);
      }
      info.performanceTracking = bytes.length > 0 ? bytes : null;
    }
  } catch (_) {}

  return info;
}

// ---------------------------------------------------------------------------
// UNIT TESTS (can be converted to Jest/React Native Testing Library)
// ---------------------------------------------------------------------------

// These are exportable test helpers. Use them in __tests__/DiagnosticModes.test.ts

export function _testHelpers() {
  return {
    parseMode05,
    parseMode06Line,
    parseMode06,
    parse0902VIN,
    parse0904CalibrationIDs,
    parse0906CVNs,
    parse0908ECUName,
    parse090APerformanceTracking,
    parseMode08,
    classifyMode06Test,
    formatMode06Table,
  };
}
