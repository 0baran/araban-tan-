import AsyncStorage from '@react-native-async-storage/async-storage';
import type {DTC} from '../types/OBD2Types';

export type DTCScan = {
  id: string;
  timestamp: number;
  dtcs: DTC[];
  pendingDTCs: DTC[];
  mileage?: number;
  isManual: boolean;
  notes?: string;
};

const HISTORY_PREFIX = '@arabanitani/dtc_history_';

function scanKey(vehicleId: string): string {
  return HISTORY_PREFIX + vehicleId;
}

function scanIndexKey(): string {
  return '@arabanitani/dtc_scan_index';
}

export async function saveDTCScan(
  vehicleId: string,
  dtcs: DTC[],
  pendingDTCs: DTC[],
  options?: {mileage?: number; notes?: string; isManual?: boolean},
): Promise<void> {
  const scan: DTCScan = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
    dtcs,
    pendingDTCs,
    mileage: options?.mileage,
    isManual: options?.isManual ?? false,
    notes: options?.notes,
  };
  const key = scanKey(vehicleId);
  const existing = await AsyncStorage.getItem(key);
  const scans: DTCScan[] = existing ? JSON.parse(existing) : [];
  scans.unshift(scan);
  await AsyncStorage.setItem(key, JSON.stringify(scans.slice(0, 50)));

  const idxKey = scanIndexKey();
  const idxRaw = await AsyncStorage.getItem(idxKey);
  const index: Record<string, number> = idxRaw ? JSON.parse(idxRaw) : {};
  index[vehicleId] = (index[vehicleId] || 0) + 1;
  await AsyncStorage.setItem(idxKey, JSON.stringify(index));
}

export async function getDTCHistory(vehicleId: string): Promise<DTCScan[]> {
  try {
    const raw = await AsyncStorage.getItem(scanKey(vehicleId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteDTCScan(
  vehicleId: string,
  scanId: string,
): Promise<void> {
  const key = scanKey(vehicleId);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return;
  }
  const scans: DTCScan[] = JSON.parse(raw);
  const filtered = scans.filter(s => s.id !== scanId);
  await AsyncStorage.setItem(key, JSON.stringify(filtered));

  if (filtered.length === 0) {
    const idxKey = scanIndexKey();
    const idxRaw = await AsyncStorage.getItem(idxKey);
    if (idxRaw) {
      const index = JSON.parse(idxRaw);
      delete index[vehicleId];
      await AsyncStorage.setItem(idxKey, JSON.stringify(index));
    }
  }
}

export async function clearDTCHistory(vehicleId: string): Promise<void> {
  await AsyncStorage.removeItem(scanKey(vehicleId));
  const idxKey = scanIndexKey();
  const idxRaw = await AsyncStorage.getItem(idxKey);
  if (idxRaw) {
    const index = JSON.parse(idxRaw);
    delete index[vehicleId];
    await AsyncStorage.setItem(idxKey, JSON.stringify(index));
  }
}

export async function getDTCScanCounts(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(scanIndexKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getAllDTCHistory(): Promise<
  {vehicleId: string; scans: DTCScan[]}[]
> {
  try {
    const idxRaw = await AsyncStorage.getItem(scanIndexKey());
    if (!idxRaw) {
      return [];
    }
    const index: Record<string, number> = JSON.parse(idxRaw);
    const results: {vehicleId: string; scans: DTCScan[]}[] = [];
    for (const vehicleId of Object.keys(index)) {
      const scans = await getDTCHistory(vehicleId);
      if (scans.length > 0) {
        results.push({vehicleId, scans});
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function getDTCStats(vehicleId: string): Promise<{
  totalScans: number;
  totalCodes: number;
  uniqueCodes: number;
  mostCommon: {code: string; count: number}[];
}> {
  const scans = await getDTCHistory(vehicleId);
  const codeCount: Record<string, number> = {};
  let totalCodes = 0;
  for (const scan of scans) {
    for (const d of scan.dtcs) {
      codeCount[d.code] = (codeCount[d.code] || 0) + 1;
      totalCodes++;
    }
    for (const d of scan.pendingDTCs) {
      codeCount[d.code] = (codeCount[d.code] || 0) + 1;
      totalCodes++;
    }
  }
  const sorted = Object.entries(codeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({code, count}));
  return {
    totalScans: scans.length,
    totalCodes,
    uniqueCodes: Object.keys(codeCount).length,
    mostCommon: sorted,
  };
}
