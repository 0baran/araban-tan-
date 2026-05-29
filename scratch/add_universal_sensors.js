const fs = require('fs');

const oemSensorsPath = 'src/services/OemSensors.ts';
let code = fs.readFileSync(oemSensorsPath, 'utf8');

const universalSensors = `
  // --- UNIVERSAL COMPATIBILITY SENSOR PACKAGE (ALL VEHICLE GROUPS) ---
  {
    id: 'oem_toyota_atf',
    name: 'ATF Sıcaklığı (Toyota/Lexus)',
    unit: '°C',
    category: 'şanzıman',
    brands: ['TOYOTA'],
    command: '2182',
    color: '#e17055',
    parse: (hex) => {
      const idx = hex.indexOf('6182');
      if (idx >= 0 && hex.length >= idx + 8) {
        const A = parseInt(hex.substring(idx + 4, idx + 6), 16);
        const B = parseInt(hex.substring(idx + 6, idx + 8), 16);
        return ((((A * 256) + B) * (5/256)) - 40).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_honda_misfire',
    name: 'Tekleme Sayacı (Honda)',
    unit: 'Kez',
    category: 'motor',
    brands: ['HONDA'],
    command: '221102',
    color: '#ff7675',
    parse: (hex) => {
      const idx = hex.indexOf('621102');
      if (idx >= 0 && hex.length >= idx + 6) {
        return parseInt(hex.substring(idx + 4, idx + 6), 16);
      }
      return null;
    }
  },
  {
    id: 'oem_hyundai_cvvt',
    name: 'CVVT Yağ Sıcaklığı (Hyundai/Kia)',
    unit: '°C',
    category: 'motor',
    brands: ['HYUNDAI', 'KIA'],
    command: '220106',
    color: '#fdcb6e',
    parse: (hex) => {
      const idx = hex.indexOf('620106');
      if (idx >= 0 && hex.length >= idx + 6) {
        return parseInt(hex.substring(idx + 4, idx + 6), 16) - 40;
      }
      return null;
    }
  },
  {
    id: 'oem_psa_fap',
    name: 'FAP (DPF) Tıkanıklık (PSA)',
    unit: '%',
    category: 'egzoz',
    brands: ['PSA', 'PEUGEOT', 'CITROEN'],
    command: '221155',
    color: '#6c5ce7',
    parse: (hex) => {
      const idx = hex.indexOf('621155');
      if (idx >= 0 && hex.length >= idx + 6) {
        return (parseInt(hex.substring(idx + 4, idx + 6), 16) * 100 / 255).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_renault_inj_pres',
    name: 'Enjektör Basıncı (Renault/Dacia)',
    unit: 'Bar',
    category: 'motor',
    brands: ['RENAULT', 'DACIA'],
    command: '222430',
    color: '#0984e3',
    parse: (hex) => {
      const idx = hex.indexOf('622430');
      if (idx >= 0 && hex.length >= idx + 8) {
        const A = parseInt(hex.substring(idx + 4, idx + 6), 16);
        const B = parseInt(hex.substring(idx + 6, idx + 8), 16);
        return (A * 256 + B) * 10;
      }
      return null;
    }
  },
  {
    id: 'oem_gm_knock',
    name: 'Vuruntu Geciktirme (GM/Chevy)',
    unit: '°',
    category: 'motor',
    brands: ['GM', 'CHEVROLET', 'OPEL'],
    command: '2211A6',
    color: '#d63031',
    parse: (hex) => {
      const idx = hex.indexOf('6211A6');
      if (idx >= 0 && hex.length >= idx + 6) {
        return parseInt(hex.substring(idx + 4, idx + 6), 16) * 0.5;
      }
      return null;
    }
  },
  {
    id: 'oem_fca_oil_life',
    name: 'Yağ Ömrü Kalan (FCA/Jeep)',
    unit: '%',
    category: 'motor',
    brands: ['FCA', 'JEEP', 'FIAT', 'DODGE'],
    command: '221503',
    color: '#00b894',
    parse: (hex) => {
      const idx = hex.indexOf('621503');
      if (idx >= 0 && hex.length >= idx + 6) {
        return parseInt(hex.substring(idx + 4, idx + 6), 16);
      }
      return null;
    }
  },
  {
    id: 'oem_mazda_afr',
    name: 'Geniş Bant AFR (Mazda)',
    unit: 'AFR',
    category: 'egzoz',
    brands: ['MAZDA'],
    command: '221111',
    color: '#00cec9',
    parse: (hex) => {
      const idx = hex.indexOf('621111');
      if (idx >= 0 && hex.length >= idx + 8) {
        const A = parseInt(hex.substring(idx + 4, idx + 6), 16);
        const B = parseInt(hex.substring(idx + 6, idx + 8), 16);
        return (((A * 256 + B) / 32768) * 14.7).toFixed(2);
      }
      return null;
    }
  },
  {
    id: 'oem_subaru_boost',
    name: 'Turbo Basıncı (Subaru)',
    unit: 'PSI',
    category: 'motor',
    brands: ['SUBARU'],
    command: '221200',
    color: '#81ecec',
    parse: (hex) => {
      const idx = hex.indexOf('621200');
      if (idx >= 0 && hex.length >= idx + 6) {
        return ((parseInt(hex.substring(idx + 4, idx + 6), 16) - 128) * 0.145038).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_universal_batt_temp',
    name: 'Akü Sıcaklığı (Universal EV/HEV)',
    unit: '°C',
    category: 'elektrik',
    brands: ['ALL', 'TESLA', 'TOYOTA', 'HONDA'],
    command: '224028',
    color: '#e84393',
    parse: (hex) => {
      const idx = hex.indexOf('624028');
      if (idx >= 0 && hex.length >= idx + 6) {
        return parseInt(hex.substring(idx + 4, idx + 6), 16) - 40;
      }
      return null;
    }
  },
  {
    id: 'oem_universal_cat_temp1',
    name: 'Katalitik Konvertör Sıcaklığı Bank 1',
    unit: '°C',
    category: 'egzoz',
    brands: ['ALL'],
    command: '013C',
    color: '#ff9f43',
    parse: (hex) => {
      const idx = hex.indexOf('413C');
      if (idx >= 0 && hex.length >= idx + 8) {
        const A = parseInt(hex.substring(idx + 4, idx + 6), 16);
        const B = parseInt(hex.substring(idx + 6, idx + 8), 16);
        return (((A * 256) + B) / 10 - 40).toFixed(1);
      }
      return null;
    }
  },
  {
    id: 'oem_universal_dpf_regen',
    name: 'DPF Rejenerasyon Durumu',
    unit: '',
    category: 'egzoz',
    brands: ['ALL', 'VAG', 'BMW', 'PSA', 'RENAULT', 'FORD'],
    command: '018B',
    color: '#feca57',
    parse: (hex) => {
      const idx = hex.indexOf('418B');
      if (idx >= 0 && hex.length >= idx + 6) {
        const A = parseInt(hex.substring(idx + 4, idx + 6), 16);
        return (A & 0x01) ? 'Aktif' : 'Pasif';
      }
      return null;
    }
  },
`;

if (!code.includes('oem_toyota_atf')) {
  // Find the end of the OEM_SENSORS array
  const insertionPoint = code.indexOf('export const OEM_SENSORS: OemSensorDef[] = [');
  if (insertionPoint !== -1) {
    code = code.replace(
      'export const OEM_SENSORS: OemSensorDef[] = [',
      'export const OEM_SENSORS: OemSensorDef[] = [' + universalSensors
    );
    
    // Add mapping for brands
    const wmiMapping = `
  'JHL': 'HONDA',
  'JHM': 'HONDA',
  'KM8': 'HYUNDAI',
  'KNA': 'KIA',
  'JM1': 'MAZDA',
  'JF1': 'SUBARU',
  'JA3': 'MITSUBISHI',
  'KL1': 'CHEVROLET',
  '1G1': 'CHEVROLET',
  '1C3': 'CHRYSLER',
  '1C4': 'JEEP',
  '2C4': 'DODGE',
  '5YJ': 'TESLA',
  '7SA': 'TESLA',`;
    
    code = code.replace(
      "'WMW': 'MINI',",
      "'WMW': 'MINI'," + wmiMapping
    );

    fs.writeFileSync(oemSensorsPath, code);
    console.log('Universal compatibility sensor package loaded successfully!');
  } else {
    console.log('Failed to find OEM_SENSORS array');
  }
} else {
  console.log('Sensors already exist!');
}
