export type OemSensorDef = {
  id: string;
  name: string;
  unit: string;
  category: string;
  brands: string[]; // e.g. ['FORD', 'BMW', 'VAG', 'TOYOTA', 'ALL']
  command: string; // The Mode 22 command, e.g. '221E1C'
  header?: string; // Optional ECU header, e.g. '7E0'
  parse: (hex: string) => number | string | null;
  color: string;
};

// Common WMI prefixes to Brand
export const WMI_MAP: Record<string, string> = {
  'WBA': 'BMW',
  'WBS': 'BMW',
  'WVG': 'VAG', // VW
  'WVW': 'VAG',
  'WAU': 'VAG', // Audi
  'TRU': 'VAG',
  'WP0': 'VAG', // Porsche
  'WF0': 'FORD',
  '1FA': 'FORD',
  'JTD': 'TOYOTA',
  'JT1': 'TOYOTA',
  'JT2': 'TOYOTA',
  'VF1': 'RENAULT',
  'VF3': 'PSA', // Peugeot
  'VF7': 'PSA', // Citroen
  'ZFA': 'FCA', // Fiat
  '1G': 'GM',
  '2G': 'GM',
  '3G': 'GM',
};

// Helper to parse hex properly
const h2d = (hex: string) => parseInt(hex, 16);

export const OEM_SENSORS: OemSensorDef[] = [
  {
    id: 'oem_ford_trans_temp',
    name: 'Şanzıman Sıcaklığı (Ford)',
    unit: '°C',
    category: 'şanzıman',
    brands: ['FORD'],
    command: '221E1C',
    header: '7E0',
    color: '#ff5e57',
    parse: (hex) => {
      // 62 1E 1C A B
      const idx = hex.indexOf('621E1C');
      if (idx >= 0 && hex.length >= idx + 10) {
        const A = h2d(hex.substring(idx + 6, idx + 8));
        const B = h2d(hex.substring(idx + 8, idx + 10));
        return Math.floor((((A * 256) + B) * 0.1) - 40);
      }
      return null;
    }
  },
  {
    id: 'oem_vag_dpf_soot',
    name: 'DPF Kurum (VAG)',
    unit: 'g',
    category: 'egzoz',
    brands: ['VAG'],
    command: '22115C', // Hypothetical VAG DPF PID
    color: '#3c40c6',
    parse: (hex) => {
      const idx = hex.indexOf('62115C');
      if (idx >= 0 && hex.length >= idx + 8) {
        const A = h2d(hex.substring(idx + 6, idx + 8));
        return A;
      }
      return null;
    }
  },
  {
    id: 'oem_toyota_hybrid_bat',
    name: 'Hibrit Batarya (Toyota)',
    unit: '%',
    category: 'elektrik',
    brands: ['TOYOTA'],
    command: '21C3',
    color: '#05c46b',
    parse: (hex) => {
      const idx = hex.indexOf('61C3');
      if (idx >= 0 && hex.length >= idx + 6) {
        const A = h2d(hex.substring(idx + 4, idx + 6));
        return (A * 100) / 255;
      }
      return null;
    }
  },
  {
    id: 'oem_gm_trans_temp',
    name: 'Şanzıman Sıcaklığı (GM)',
    unit: '°C',
    category: 'şanzıman',
    brands: ['GM'],
    command: '221940',
    color: '#ffdd59',
    parse: (hex) => {
      const idx = hex.indexOf('621940');
      if (idx >= 0 && hex.length >= idx + 8) {
        const A = h2d(hex.substring(idx + 6, idx + 8));
        return A - 40;
      }
      return null;
    }
  },
  {
    // Generic Mode 01 PID for Transmission Temp (some cars support it on 01 B4 but usually 01 00-5F)
    // Actually, let's add a generic brute force Transmission Temp
    id: 'generic_trans_temp',
    name: 'Genel Şanzıman Sıcaklığı',
    unit: '°C',
    category: 'şanzıman',
    brands: ['ALL'],
    command: '01B4',
    color: '#ef5777',
    parse: (hex) => {
      const idx = hex.indexOf('41B4');
      if (idx >= 0 && hex.length >= idx + 6) {
        const A = h2d(hex.substring(idx + 4, idx + 6));
        return A - 40;
      }
      return null;
    }
  }
];

export function detectBrandFromVIN(vin: string): string {
  if (!vin || vin.length < 3) return 'UNKNOWN';
  const wmi3 = vin.substring(0, 3).toUpperCase();
  if (WMI_MAP[wmi3]) return WMI_MAP[wmi3];
  
  const wmi2 = vin.substring(0, 2).toUpperCase();
  if (WMI_MAP[wmi2]) return WMI_MAP[wmi2];

  return 'UNKNOWN';
}
