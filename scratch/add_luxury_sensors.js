const fs = require('fs');
let file = fs.readFileSync('src/services/OemSensors.ts', 'utf8');

// 1. Add to WMI_MAP
const wmiAdditions = `
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
  'WMW': 'MINI',`;

file = file.replace(/'3G': 'GM',/, "'3G': 'GM'," + wmiAdditions);

// 2. Add to OEM_SENSORS
const oemAdditions = `
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
`;

file = file.replace(/export const OEM_SENSORS: OemSensorDef\[\] = \[/, "export const OEM_SENSORS: OemSensorDef[] = [" + oemAdditions);
fs.writeFileSync('src/services/OemSensors.ts', file, 'utf8');
console.log('Luxury sensors added!');
