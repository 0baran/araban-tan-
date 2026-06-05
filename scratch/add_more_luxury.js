const fs = require('fs');

// 1. Add to OemSensors.ts
let oemFile = fs.readFileSync('src/services/OemSensors.ts', 'utf8');

const moreWmi = `
  'ZAR': 'ALFA_ROMEO',
  'YV1': 'VOLVO',
  'JN1': 'NISSAN',
  'JN8': 'NISSAN',`;

oemFile = oemFile.replace(/'3G': 'GM',/, "'3G': 'GM'," + moreWmi);

const moreOem = `
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
`;

oemFile = oemFile.replace(
  /export const OEM_SENSORS: OemSensorDef\[\] = \[/,
  'export const OEM_SENSORS: OemSensorDef[] = [' + moreOem,
);
fs.writeFileSync('src/services/OemSensors.ts', oemFile, 'utf8');

// 2. Add to LiveDataScreen.tsx
let uiFile = fs.readFileSync('src/screens/LiveDataScreen.tsx', 'utf8');

const moreUi = `
  {
    key: 'oem_vag_dsg_pres',
    label: 'DSG Kavrama Basıncı (VAG)',
    unit: 'Bar',
    color: '#eb4d4b',
    category: 'şanzıman'
  },
  {
    key: 'oem_vag_haldex',
    label: 'Haldex Yağ Sıcaklığı (VAG)',
    unit: '°C',
    color: '#686de0',
    category: 'şasi'
  },
  {
    key: 'oem_alfa_dna',
    label: 'DNA Mod Durumu (Alfa)',
    unit: '',
    color: '#e056fd',
    category: 'sürüş'
  },
  {
    key: 'oem_volvo_dpf_diff',
    label: 'DPF Fark Basıncı (Volvo)',
    unit: 'hPa',
    color: '#4834d4',
    category: 'egzoz'
  },
  {
    key: 'oem_nissan_attesa',
    label: 'ATTESA AWD (Nissan)',
    unit: '% (Ön)',
    color: '#be2edd',
    category: 'şasi'
  },
  {
    key: 'oem_generic_tpms1',
    label: 'TPMS Sol Ön (Genel)',
    unit: 'PSI',
    color: '#22a6b3',
    category: 'şasi'
  },
  {
    key: 'oem_bmw_battery_soc',
    label: 'Akü Şarj Durumu (BMW)',
    unit: '%',
    color: '#f9ca24',
    category: 'elektrik'
  },
  {
    key: 'oem_mb_oil_temp',
    label: 'AMG Motor Yağı',
    unit: '°C',
    color: '#eb4d4b',
    category: 'motor'
  },
  {
    key: 'oem_vag_misfire_1',
    label: 'Silindir 1 Tekleme (VAG)',
    unit: 'Kez',
    color: '#ff7979',
    category: 'motor'
  },
  {
    key: 'oem_lr_def_level',
    label: 'AdBlue Seviyesi (LR)',
    unit: '%',
    color: '#c7ecee',
    category: 'egzoz'
  }
`;

// Insert into PARAM_META in UI.
uiFile = uiFile.replace(/ {2}\},\n\];/, '  },' + moreUi + '\n];');
fs.writeFileSync('src/screens/LiveDataScreen.tsx', uiFile, 'utf8');

console.log('More luxury sensors added to OEM and UI!');
