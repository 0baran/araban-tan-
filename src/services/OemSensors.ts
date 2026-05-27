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
  'ZAR': 'ALFA_ROMEO',
  'YV1': 'VOLVO',
  'JN1': 'NISSAN',
  'JN8': 'NISSAN',
  'SAL': 'LAND_ROVER', // Range Rover / Land Rover
  'WBA': 'BMW',
  'WBS': 'BMW',
  'WBY': 'BMW',
  'WDB': 'MERCEDES',
  'WDD': 'MERCEDES',
  'WDC': 'MERCEDES',
  'WP0': 'PORSCHE',
  'ZFF': 'FERRARI',
  'ZHW': 'LAMBORGHINI',
  'SAJ': 'JAGUAR',
  'WMW': 'MINI',
};

// Helper to parse hex properly
const h2d = (hex: string) => parseInt(hex, 16);

export const OEM_SENSORS: OemSensorDef[] = [
  {
    id: 'oem_vag_dsg_pres',
    name: 'DSG Kavrama Basıncı (VAG)',
    unit: 'Bar',
    category: 'şanzıman',
    brands: ['VAG'],
    command: '2211DA',
    color: '#eb4d4b',
    parse: (hex) => {
      const idx = hex.indexOf('6211DA');
      if (idx >= 0 && hex.length >= idx + 8) {
        return (h2d(hex.substring(idx + 6, idx + 8)) / 10).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_vag_haldex',
    name: 'Haldex Yağ Sıcaklığı (VAG)',
    unit: '°C',
    category: 'şasi',
    brands: ['VAG'],
    command: '2211DB',
    color: '#686de0',
    parse: (hex) => {
      const idx = hex.indexOf('6211DB');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8)) - 40;
      }
      return null;
    }
  },
  {
    id: 'oem_alfa_dna',
    name: 'DNA Mod Durumu (Alfa Romeo)',
    unit: '',
    category: 'sürüş',
    brands: ['ALFA_ROMEO', 'FCA'],
    command: '2211AA',
    color: '#e056fd',
    parse: (hex) => {
      const idx = hex.indexOf('6211AA');
      if (idx >= 0 && hex.length >= idx + 8) {
        const val = h2d(hex.substring(idx + 6, idx + 8));
        return val === 1 ? 'Dynamic' : val === 2 ? 'Natural' : 'All-Weather';
      }
      return null;
    }
  },
  {
    id: 'oem_volvo_dpf_diff',
    name: 'DPF Fark Basıncı (Volvo)',
    unit: 'hPa',
    category: 'egzoz',
    brands: ['VOLVO'],
    command: '2211VA',
    color: '#4834d4',
    parse: (hex) => {
      const idx = hex.indexOf('6211VA');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8)) * 2;
      }
      return null;
    }
  },
  {
    id: 'oem_nissan_attesa',
    name: 'ATTESA AWD Dağılımı (Nissan)',
    unit: '% (Ön)',
    category: 'şasi',
    brands: ['NISSAN'],
    command: '2211NA',
    color: '#be2edd',
    parse: (hex) => {
      const idx = hex.indexOf('6211NA');
      if (idx >= 0 && hex.length >= idx + 8) {
        return Math.min(50, h2d(hex.substring(idx + 6, idx + 8)));
      }
      return null;
    }
  },
  {
    id: 'oem_generic_tpms1',
    name: 'TPMS Sol Ön (Genel)',
    unit: 'PSI',
    category: 'şasi',
    brands: ['ALL'],
    command: '22C901',
    color: '#22a6b3',
    parse: (hex) => {
      const idx = hex.indexOf('62C901');
      if (idx >= 0 && hex.length >= idx + 8) {
        return (h2d(hex.substring(idx + 6, idx + 8)) * 0.145038).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_bmw_battery_soc',
    name: 'Akü Şarj Durumu SOC (BMW)',
    unit: '%',
    category: 'elektrik',
    brands: ['BMW', 'MINI'],
    command: '2211BB',
    color: '#f9ca24',
    parse: (hex) => {
      const idx = hex.indexOf('6211BB');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8));
      }
      return null;
    }
  },
  {
    id: 'oem_mb_oil_temp',
    name: 'AMG Motor Yağ Sıcaklığı',
    unit: '°C',
    category: 'motor',
    brands: ['MERCEDES'],
    command: '22015C',
    color: '#eb4d4b',
    parse: (hex) => {
      const idx = hex.indexOf('62015C');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8)) - 40;
      }
      return null;
    }
  },
  {
    id: 'oem_vag_misfire_1',
    name: 'Silindir 1 Tekleme (VAG)',
    unit: 'Kez',
    category: 'motor',
    brands: ['VAG'],
    command: '2211M1',
    color: '#ff7979',
    parse: (hex) => {
      const idx = hex.indexOf('6211M1');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8));
      }
      return null;
    }
  },
  {
    id: 'oem_lr_def_level',
    name: 'AdBlue (DEF) Seviyesi (LR)',
    unit: '%',
    category: 'egzoz',
    brands: ['LAND_ROVER'],
    command: '2211AD',
    color: '#c7ecee',
    parse: (hex) => {
      const idx = hex.indexOf('6211AD');
      if (idx >= 0 && hex.length >= idx + 8) {
        return (h2d(hex.substring(idx + 6, idx + 8)) / 2.55).toFixed(1);
      }
      return null;
    }
  },

  {
    id: 'oem_lr_airsusp_pres',
    name: 'Air Süspansiyon Basıncı (Range Rover)',
    unit: 'Bar',
    category: 'şasi',
    brands: ['LAND_ROVER'],
    command: '2211AA',
    color: '#00d2d3',
    parse: (hex) => {
      const idx = hex.indexOf('6211AA');
      if (idx >= 0 && hex.length >= idx + 8) {
        return (h2d(hex.substring(idx + 6, idx + 8)) / 10).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_lr_ride_height',
    name: 'Sürüş Yüksekliği (Range Rover)',
    unit: 'mm',
    category: 'şasi',
    brands: ['LAND_ROVER'],
    command: '2211AB',
    color: '#10ac84',
    parse: (hex) => {
      const idx = hex.indexOf('6211AB');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8)) - 100; // -100 to +155 mm
      }
      return null;
    }
  },
  {
    id: 'oem_bmw_valvetronic',
    name: 'Valvetronic Açısı (BMW)',
    unit: '°',
    category: 'motor',
    brands: ['BMW', 'MINI'],
    command: '22115A',
    color: '#ff9f43',
    parse: (hex) => {
      const idx = hex.indexOf('62115A');
      if (idx >= 0 && hex.length >= idx + 8) {
        return (h2d(hex.substring(idx + 6, idx + 8)) * 0.1).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_bmw_xdrive',
    name: 'xDrive Tork Dağılımı (BMW)',
    unit: '% (Ön)',
    category: 'şasi',
    brands: ['BMW'],
    command: '22115B',
    color: '#feca57',
    parse: (hex) => {
      const idx = hex.indexOf('62115B');
      if (idx >= 0 && hex.length >= idx + 8) {
        return Math.min(100, h2d(hex.substring(idx + 6, idx + 8)));
      }
      return null;
    }
  },
  {
    id: 'oem_mb_airmatic',
    name: 'Airmatic Basıncı (Mercedes)',
    unit: 'Bar',
    category: 'şasi',
    brands: ['MERCEDES'],
    command: '2211CA',
    color: '#54a0ff',
    parse: (hex) => {
      const idx = hex.indexOf('6211CA');
      if (idx >= 0 && hex.length >= idx + 8) {
        return (h2d(hex.substring(idx + 6, idx + 8)) / 10).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_mb_dpf_regen',
    name: 'DPF Rejenerasyon Durumu (Mercedes)',
    unit: '%',
    category: 'egzoz',
    brands: ['MERCEDES'],
    command: '2211CB',
    color: '#8395a7',
    parse: (hex) => {
      const idx = hex.indexOf('6211CB');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8));
      }
      return null;
    }
  },
  {
    id: 'oem_porsche_pdk_temp',
    name: 'PDK Şanzıman Yağ Sıcaklığı (Porsche)',
    unit: '°C',
    category: 'şanzıman',
    brands: ['PORSCHE'],
    command: '2211PA',
    color: '#ff4757',
    parse: (hex) => {
      const idx = hex.indexOf('6211PA');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8)) - 40;
      }
      return null;
    }
  },
  {
    id: 'oem_porsche_oil_lvl',
    name: 'Motor Yağ Seviyesi (Porsche)',
    unit: '%',
    category: 'motor',
    brands: ['PORSCHE'],
    command: '2211PB',
    color: '#eccc68',
    parse: (hex) => {
      const idx = hex.indexOf('6211PB');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8));
      }
      return null;
    }
  },
  {
    id: 'oem_ferrari_clutch',
    name: 'F1 Debriyaj Aşınması (Ferrari)',
    unit: '%',
    category: 'şanzıman',
    brands: ['FERRARI'],
    command: '2211FA',
    color: '#e84118',
    parse: (hex) => {
      const idx = hex.indexOf('6211FA');
      if (idx >= 0 && hex.length >= idx + 8) {
        return h2d(hex.substring(idx + 6, idx + 8));
      }
      return null;
    }
  },


  {
    id: 'oem_renault_dpf',
    name: 'DPF Doluluk Oranı (Renault)',
    unit: 'g',
    category: 'egzoz',
    brands: ['RENAULT'],
    command: '22042C',
    color: '#3c40c6',
    parse: (hex) => {
      const idx = hex.indexOf('62042C');
      if (idx >= 0 && hex.length >= idx + 10) {
        const A = h2d(hex.substring(idx + 6, idx + 8));
        const B = h2d(hex.substring(idx + 8, idx + 10));
        return (A * 256 + B) / 100;
      }
      return null;
    }
  },
  {
    id: 'oem_fiat_trans_temp',
    name: 'Şanzıman Sıcaklığı (Fiat/Chrysler)',
    unit: '°C',
    category: 'şanzıman',
    brands: ['FCA'],
    command: '221E1C',
    color: '#ff5e57',
    parse: (hex) => {
      const idx = hex.indexOf('621E1C');
      if (idx >= 0 && hex.length >= idx + 8) {
        const A = h2d(hex.substring(idx + 6, idx + 8));
        return A - 40;
      }
      return null;
    }
  },
  {
    id: 'oem_toyota_fan_speed',
    name: 'Hibrit Batarya Fanı (Toyota)',
    unit: '%',
    category: 'elektrik',
    brands: ['TOYOTA'],
    command: '21C4',
    color: '#05c46b',
    parse: (hex) => {
      const idx = hex.indexOf('61C4');
      if (idx >= 0 && hex.length >= idx + 6) {
        const A = h2d(hex.substring(idx + 4, idx + 6));
        return (A * 100) / 255;
      }
      return null;
    }
  },

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
