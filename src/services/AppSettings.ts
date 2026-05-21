import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  speedWarningEnabled: '@arabanitani/speed_warning_enabled',
  speedWarningThreshold: '@arabanitani/speed_warning_threshold',
  coolantWarningEnabled: '@arabanitani/coolant_warning_enabled',
  coolantWarningThreshold: '@arabanitani/coolant_warning_threshold',
  pinnedSensors: '@arabanitani/pinned_sensors',
  fuelPricePerLiter: '@arabanitani/fuel_price_per_liter',
};

export type AppSettings = {
  speedWarningEnabled: boolean;
  speedWarningThreshold: number;
  coolantWarningEnabled: boolean;
  coolantWarningThreshold: number;
  pinnedSensors: string[];
  fuelPricePerLiter: number;
  darkMode: boolean;
  autoRecord: boolean;
};

const DEFAULTS: AppSettings = {
  speedWarningEnabled: false,
  speedWarningThreshold: 130,
  coolantWarningEnabled: false,
  coolantWarningThreshold: 100,
  pinnedSensors: [],
  fuelPricePerLiter: 0,
  darkMode: true,
  autoRecord: false,
};

let cached: AppSettings = {...DEFAULTS};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const s = await AsyncStorage.getItem('@arabanitani/settings');
    if (s) {
      const parsed = JSON.parse(s);
      cached = {...DEFAULTS, ...parsed};
    }
  } catch {}
  return cached;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  cached = {...cached, ...settings};
  try {
    await AsyncStorage.setItem('@arabanitani/settings', JSON.stringify(cached));
  } catch {}
}

export function getSettings(): AppSettings {
  return cached;
}
