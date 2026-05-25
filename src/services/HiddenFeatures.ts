export type Manufacturer =
  | 'ford' | 'volkswagen' | 'audi' | 'seat' | 'skoda' | 'bmw' | 'fca' | 'renault' | 'toyota' | 'peugeot' | 'psa'
  | 'vag' | 'mercedes' | 'hyundai' | 'opel' | 'fiat' | 'universal' | 'unknown';

export interface HiddenFeature {
  id: string;
  name: string;
  description: string;
  category: 'lighting' | 'comfort' | 'dashboard' | 'safety' | 'multimedia' | 'performance';
  manufacturer: string[];
  compatibility: string[];
  readCmd: string;
  writeOn: string;
  writeOff: string;
  readHeader: string;
  writeHeader: string;
}

export const HIDDEN_FEATURES: HiddenFeature[] = [
  // --- FORD (FORScan As-Built) ---
  {
    id: 'f_bambi',
    name: 'Bambi Mode (Uzun & Sis Farı)',
    description: 'Uzun farları yaktığınızda sis farlarının sönmesini engeller.',
    category: 'lighting',
    manufacturer: ['ford'],
    compatibility: ['obd2', 'can'],
    readCmd: '22 26 01',
    writeOn: '2E 26 01 01',
    writeOff: '2E 26 01 00',
    readHeader: '726',
    writeHeader: '726'
  },
  {
    id: 'f_globalwin',
    name: 'Global Cam İndirme',
    description: 'Kumandadan kilit açma tuşuna basılı tutarak tüm camları indirir.',
    category: 'comfort',
    manufacturer: ['ford'],
    compatibility: ['obd2'],
    readCmd: '22 17 01',
    writeOn: '2E 17 01 01',
    writeOff: '2E 17 01 00',
    readHeader: '726',
    writeHeader: '726'
  },
  {
    id: 'f_startstop',
    name: 'Auto Start/Stop İptali',
    description: 'Start/Stop sistemini kalıcı olarak devre dışı bırakır.',
    category: 'comfort',
    manufacturer: ['ford'],
    compatibility: ['obd2'],
    readCmd: '22 48 02',
    writeOn: '2E 48 02 00',
    writeOff: '2E 48 02 01',
    readHeader: '7A6', // FCIM
    writeHeader: '7A6'
  },
  {
    id: 'f_fakenois',
    name: 'Fake Motor Sesi (ASD) İptali',
    description: 'Hoparlörlerden verilen sahte V8/Motor sesini kapatır.',
    category: 'comfort',
    manufacturer: ['ford'],
    compatibility: ['obd2'],
    readCmd: '22 01 01',
    writeOn: '2E 01 01 00',
    writeOff: '2E 01 01 01',
    readHeader: '783', // ACM
    writeHeader: '783'
  },
  {
    id: 'f_panic',
    name: 'Panik Alarmı x2 Basma',
    description: 'Kumandadaki panik alarmı için tuşa 2 kere basma zorunluluğu getirir.',
    category: 'safety',
    manufacturer: ['ford'],
    compatibility: ['obd2'],
    readCmd: '22 01 02',
    writeOn: '2E 01 02 01',
    writeOff: '2E 01 02 00',
    readHeader: '726',
    writeHeader: '726'
  },

  // --- VAG GRUBU (VCDS Long Coding) ---
  {
    id: 'v_needle',
    name: 'Kadran Selamlama (Needle Sweep)',
    description: 'Kontak açıldığında ibrelerin sona vurup dönmesi.',
    category: 'dashboard',
    manufacturer: ['volkswagen', 'audi', 'seat', 'skoda'],
    compatibility: ['obd2'],
    readCmd: '22 01 01',
    writeOn: '2E 01 01 01',
    writeOff: '2E 01 01 00',
    readHeader: '720', // Instrument Cluster (17) -> CAN addr 720
    writeHeader: '720'
  },
  {
    id: 'v_seatbelt',
    name: 'Emniyet Kemeri Uyarısı İptali',
    description: 'Emniyet kemeri takılmadığında çalan sinir bozucu sesi kapatır.',
    category: 'comfort',
    manufacturer: ['volkswagen', 'audi', 'seat', 'skoda'],
    compatibility: ['obd2'],
    readCmd: '22 01 02',
    writeOn: '2E 01 02 00',
    writeOff: '2E 01 02 01',
    readHeader: '720',
    writeHeader: '720'
  },
  {
    id: 'v_mirrordip',
    name: 'Geri Viteste Ayna İnmesi',
    description: 'Geri vitese takıldığında sağ aynanın kaldırımı göstermesi için aşağı inmesi.',
    category: 'comfort',
    manufacturer: ['volkswagen', 'audi', 'seat', 'skoda'],
    compatibility: ['obd2'],
    readCmd: '22 04 01',
    writeOn: '2E 04 01 01',
    writeOff: '2E 04 01 00',
    readHeader: '752', // Passenger Door (52)
    writeHeader: '752'
  },
  {
    id: 'v_drlmenu',
    name: 'Gündüz Farı (DRL) Menüsü',
    description: 'Multimedya ekranına Gündüz Farı (DRL) açma/kapatma menüsü ekler.',
    category: 'lighting',
    manufacturer: ['volkswagen', 'audi', 'seat', 'skoda'],
    compatibility: ['obd2'],
    readCmd: '22 09 01',
    writeOn: '2E 09 01 01',
    writeOff: '2E 09 01 00',
    readHeader: '709', // BCM (09)
    writeHeader: '709'
  },
  {
    id: 'v_teardrop',
    name: 'Gözyaşı Silme (Teardrop Wipe)',
    description: 'Silecekler su attıktan 5 saniye sonra akan son damlayı silmek için bir tur daha çalışır.',
    category: 'comfort',
    manufacturer: ['volkswagen', 'audi', 'seat', 'skoda'],
    compatibility: ['obd2'],
    readCmd: '22 09 02',
    writeOn: '2E 09 02 01',
    writeOff: '2E 09 02 00',
    readHeader: '709',
    writeHeader: '709'
  },

  // --- BMW / MINI (BimmerCode FDL) ---
  {
    id: 'b_video',
    name: 'Hareket Halinde Video (VIM)',
    description: 'Seyir halindeyken multimedya ekranında video oynatılmasını sağlar (SPEEDLIMIT_VIEW).',
    category: 'multimedia',
    manufacturer: ['bmw'],
    compatibility: ['obd2'],
    readCmd: '22 30 00',
    writeOn: '2E 30 00 FF',
    writeOff: '2E 30 00 00',
    readHeader: '7A2', // HU_NBT
    writeHeader: '7A2'
  },
  {
    id: 'b_mperf',
    name: 'M Performance Açılış Logosu',
    description: 'iDrive ekranı açılırken M Performance logosu gösterir.',
    category: 'multimedia',
    manufacturer: ['bmw'],
    compatibility: ['obd2'],
    readCmd: '22 30 01',
    writeOn: '2E 30 01 01',
    writeOff: '2E 30 01 00',
    readHeader: '7A2',
    writeHeader: '7A2'
  },
  {
    id: 'b_asd',
    name: 'Active Sound Design İptali',
    description: 'Hoparlörden verilen yapay motor sesini devre dışı bırakır.',
    category: 'comfort',
    manufacturer: ['bmw'],
    compatibility: ['obd2'],
    readCmd: '22 30 02',
    writeOn: '2E 30 02 00',
    writeOff: '2E 30 02 01',
    readHeader: '7A2', // ASD Module
    writeHeader: '7A2'
  },
  {
    id: 'b_trunk',
    name: 'Kumandadan Bagaj Kapatma',
    description: 'Elektrikli bagajı olan araçlarda kumandadan bagaj kapatma izni verir.',
    category: 'comfort',
    manufacturer: ['bmw'],
    compatibility: ['obd2'],
    readCmd: '22 30 03',
    writeOn: '2E 30 03 01',
    writeOff: '2E 30 03 00',
    readHeader: '726', // BDC/FEM
    writeHeader: '726'
  },
  {
    id: 'b_sportplus',
    name: 'Sport+ Modu Aktivasyonu',
    description: 'Sürüş modlarına ekstra olarak Sport+ modunu ekler.',
    category: 'performance',
    manufacturer: ['bmw'],
    compatibility: ['obd2'],
    readCmd: '22 30 04',
    writeOn: '2E 30 04 01',
    writeOff: '2E 30 04 00',
    readHeader: '726', // BDC
    writeHeader: '726'
  },

  // --- FCA GRUBU (AlfaOBD) ---
  {
    id: 'a_srt',
    name: 'SRT / Performans Sayfaları',
    description: 'Uconnect ekranında Yağ Sıcaklığı, G-Force gibi SRT performans verilerini açar.',
    category: 'performance',
    manufacturer: ['fca'],
    compatibility: ['obd2'],
    readCmd: '22 01 01',
    writeOn: '2E 01 01 01',
    writeOff: '2E 01 01 00',
    readHeader: '732', // Body Computer
    writeHeader: '732'
  },
  {
    id: 'a_led',
    name: 'Halojen > LED Dönüşümü (Arıza Kesici)',
    description: 'Farları LED ile değiştirdiğinizde ekranda yanan arıza ışığını Body Computer üzerinden kapatır.',
    category: 'lighting',
    manufacturer: ['fca'],
    compatibility: ['obd2'],
    readCmd: '22 01 02',
    writeOn: '2E 01 02 00',
    writeOff: '2E 01 02 01',
    readHeader: '732',
    writeHeader: '732'
  },
  {
    id: 'a_fog',
    name: 'Uzunlarda Sislerin Kapanmasını İptal Et',
    description: 'Uzun farları yakınca sis farlarının otomatik sönmesini iptal eder.',
    category: 'lighting',
    manufacturer: ['fca'],
    compatibility: ['obd2'],
    readCmd: '22 01 03',
    writeOn: '2E 01 03 00',
    writeOff: '2E 01 03 01',
    readHeader: '732',
    writeHeader: '732'
  },
  
  // --- PSA GRUBU (Peugeot, Citroen) ---
  {
    id: 'p_diag',
    name: 'Diyagnostik Menüsü (Sıcaklıklar)',
    description: 'Multimedya ekranına Yağ Sıcaklığı ve Lastik Basınçlarını gösteren menü ekler.',
    category: 'dashboard',
    manufacturer: ['psa', 'peugeot'],
    compatibility: ['obd2'],
    readCmd: '22 01 01',
    writeOn: '2E 01 01 01',
    writeOff: '2E 01 01 00',
    readHeader: '764', // SMEG/NAC
    writeHeader: '764'
  },

  // --- RENAULT / DACIA ---
  {
    id: 'r_rs',
    name: 'R.S. Monitor Aktivasyonu',
    description: 'R-Link multimedya sisteminde Renault Sport (G-Force, Tork) monitörünü aktif eder.',
    category: 'performance',
    manufacturer: ['renault'],
    compatibility: ['obd2'],
    readCmd: '22 01 01',
    writeOn: '2E 01 01 01',
    writeOff: '2E 01 01 00',
    readHeader: '7A0', // R-Link / MFD
    writeHeader: '7A0'
  }
];

export const MANUFACTURER_NAMES: Record<Manufacturer, string> = {
  ford: 'Ford', volkswagen: 'Volkswagen', audi: 'Audi', seat: 'Seat', skoda: 'Skoda',
  bmw: 'BMW', fca: 'FCA (Fiat/Jeep/Dodge)', renault: 'Renault', toyota: 'Toyota', peugeot: 'Peugeot', psa: 'PSA',
  vag: 'VAG Group', mercedes: 'Mercedes', hyundai: 'Hyundai', opel: 'Opel', fiat: 'Fiat', universal: 'Universal', unknown: 'Bilinmeyen'
};

export function getAllManufacturers(): Manufacturer[] {
  return Object.keys(MANUFACTURER_NAMES) as Manufacturer[];
}

export function getManufacturerIcon(mfr: Manufacturer): string {
  const icons: Partial<Record<Manufacturer, string>> = {
    ford: '🔵', volkswagen: '🚗', audi: '⭕', seat: '🔴', skoda: '🟢',
    bmw: '🏁', fca: '🔧', renault: '🔶', toyota: '🚗', peugeot: '🦁', psa: '🚗',
    mercedes: '⭐', hyundai: '🏎️', opel: '⚡', fiat: '🚙', universal: '🌐', unknown: '❓'
  };
  return icons[mfr] || '🚗';
}

export function getFeaturesForManufacturer(mfr: Manufacturer): HiddenFeature[] {
  return HIDDEN_FEATURES.filter(f => f.manufacturer.includes(mfr));
}

export function detectManufacturer(vin: string): Manufacturer {
  const v = vin.toUpperCase();
  if (v.startsWith('WBA') || v.startsWith('WBS')) return 'bmw';
  if (v.startsWith('WVW') || v.startsWith('WAU') || v.startsWith('VSS') || v.startsWith('TMB')) return 'volkswagen';
  if (v.startsWith('1FA') || v.startsWith('WF0') || v.startsWith('3FA')) return 'ford';
  if (v.startsWith('ZFA') || v.startsWith('1C4')) return 'fca';
  if (v.startsWith('VF1')) return 'renault';
  if (v.startsWith('VF3') || v.startsWith('VF7')) return 'psa';
  return 'universal';
}
