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
};

let vehicles: Vehicle[] = [];

export async function loadVehicles(): Promise<Vehicle[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    vehicles = data ? JSON.parse(data) : [];
  } catch { vehicles = []; }
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

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
  const idx = vehicles.findIndex(v => v.id === id);
  if (idx >= 0) {
    vehicles[idx] = {...vehicles[idx], ...updates};
    await saveVehicles();
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  vehicles = vehicles.filter(v => v.id !== id);
  await saveVehicles();
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}
