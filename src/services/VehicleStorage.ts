import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@arabanitani/vehicles';

export type Vehicle = {
  id: string;
  name: string;
  plate?: string;
  vin?: string;
  brand?: string;
  model?: string;
  year?: string;
  notes?: string;
  lastConnected?: string;
  deviceAddress?: string;
  deviceName?: string;
  connectionType?: 'bluetooth' | 'wifi' | 'usb';
  imageUri?: string;
};

let vehicles: Vehicle[] = [];
let activeVehicleId: string | null = null;
const ACTIVE_KEY = '@arabanitani/active_vehicle';

export async function getActiveVehicleId(): Promise<string | null> {
  return activeVehicleId;
}

export async function setActiveVehicleId(id: string | null): Promise<void> {
  activeVehicleId = id;
  if (id) await AsyncStorage.setItem(ACTIVE_KEY, id);
  else await AsyncStorage.removeItem(ACTIVE_KEY);
}

export async function loadVehicles(): Promise<Vehicle[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    vehicles = data ? JSON.parse(data) : [];
    activeVehicleId = await AsyncStorage.getItem(ACTIVE_KEY);
  } catch {
    vehicles = [];
  }
  return vehicles;
}

export async function saveVehicles(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error('VehicleStorage: save failed, retrying...', e);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  }
}

export function getVehicles(): Vehicle[] {
  return vehicles;
}

export async function addVehicle(v: Vehicle): Promise<void> {
  vehicles.push(v);
  await saveVehicles();
}

export async function updateVehicle(
  id: string,
  updates: Partial<Vehicle>,
): Promise<void> {
  const idx = vehicles.findIndex(v => v.id === id);
  if (idx >= 0) {
    vehicles[idx] = {...vehicles[idx], ...updates};
    await saveVehicles();
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  vehicles = vehicles.filter(v => v.id !== id);
  if (activeVehicleId === id) await setActiveVehicleId(null);
  await saveVehicles();
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}
