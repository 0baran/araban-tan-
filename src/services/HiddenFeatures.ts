export type Manufacturer = 'unknown' | 'universal' | 'vag' | 'ford' | 'bmw' | 'mercedes' | 'renault' | 'opel' | 'peugeot' | 'fiat' | 'toyota' | 'hyundai';

export type HiddenFeature = {
  id: string;
  name: string;
  description: string;
  category: string;
  manufacturer: Manufacturer[];
  compatibility: string;
  readCmd: string;
  readHeader: string;
  writeOn: string;
  writeOff: string;
  writeHeader: string;
};

export const MANUFACTURER_NAMES: Record<Manufacturer, string> = {
  unknown: 'Tanımlanamadı',
  universal: 'Tüm Araçlar',
  vag: 'VAG (VW / Audi / Seat / Skoda)',
  ford: 'Ford',
  bmw: 'BMW / Mini',
  mercedes: 'Mercedes-Benz',
  renault: 'Renault',
  opel: 'Opel / Vauxhall',
  peugeot: 'Peugeot / Citroen / DS',
  fiat: 'Fiat / Alfa / Lancia',
  toyota: 'Toyota / Lexus',
  hyundai: 'Hyundai / Kia',
};

const WMI_LISTS: Record<Manufacturer, string[]> = {
  unknown: [],
  universal: [],
  vag: ['WVW', 'WV1', 'WV2', 'WAU', 'VSS', 'TMB', 'TMS', '1VW', '2VW', '3VW', 'XW8'],
  ford: ['1FA', '1FB', '1FT', 'WF0', 'WF1', 'MAJ', 'VS6'],
  bmw: ['WBA', 'WBS', 'WBY', '5UX', '5YM', 'WMW'],
  mercedes: ['WDB', 'WDC', 'WDD', 'W1K', 'W1N', 'W1V', '4JG'],
  renault: ['VF1', 'VF2', 'VF3', 'VF4', 'VF5', 'VF6', 'VF7', 'VF8'],
  opel: ['W0L', 'W0V', 'S0L'],
  peugeot: ['VF3', 'VF7', 'VR3', 'VR7'],
  fiat: ['ZFA', 'ZFB', 'ZFC', 'ZLA', 'ZAR'],
  toyota: ['JTD', 'JT1', 'JT2', 'JTE', 'JTM', 'SB1'],
  hyundai: ['KMF', 'KMH', 'KNA', 'KNB', 'KNC', 'TMA', 'TMB'],
};

export function detectManufacturer(vin: string): Manufacturer {
  const wmi = vin.substring(0, 3).toUpperCase();
  const wmi2 = vin.substring(0, 2).toUpperCase();
  for (const [mfr, prefixes] of Object.entries(WMI_LISTS)) {
    if (mfr === 'universal') continue;
    if (prefixes.some(p => wmi.startsWith(p) || wmi2.startsWith(p))) return mfr as Manufacturer;
  }
  if (wmi !== '' && wmi !== 'XXX') return 'universal';
  return 'universal';
}

export const ALL_FEATURES: HiddenFeature[] = [
  // ─── DPF (Dizel Partikül Filtresi) ───
  {
    id: 'dpf_soot_mass', name: 'DPF Kurum Doluluk',
    description: 'Dizel partikül filtresindeki kurum miktarını oku (gram)',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF\'li dizel araçlar (2008+)',
    readCmd: '22F900', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'dpf_ash_mass', name: 'DPF Kül Doluluk',
    description: 'DPF\'de biriken kül miktarı (gram)',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF\'li dizel araçlar',
    readCmd: '22F901', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'dpf_pressure', name: 'DPF Fark Basıncı',
    description: 'DPF giriş-çıkış arası basınç farkı (mbar)',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF basınç sensörlü araçlar',
    readCmd: '22F902', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'dpf_temp_in', name: 'DPF Giriş Sıcaklığı',
    description: 'DPF öncesi egzoz gazı sıcaklığı',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF\'li dizel araçlar',
    readCmd: '22F903', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'dpf_temp_out', name: 'DPF Çıkış Sıcaklığı',
    description: 'DPF sonrası egzoz gazı sıcaklığı',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF\'li dizel araçlar',
    readCmd: '22F904', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'dpf_distance_since_reg', name: 'Son Rejenerasyon Mesafesi',
    description: 'Son DPF rejenerasyonundan beri km',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF\'li dizel araçlar',
    readCmd: '22F905', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'dpf_reg_status', name: 'DPF Rejenerasyon Durumu',
    description: 'DPF rejenerasyonunun aktif/pasif durumu',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF\'li dizel araçlar',
    readCmd: '22F906', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'dpf_volumetric_load', name: 'DPF Hacimsel Doluluk',
    description: 'DPF doluluk yüzdesi (hacimsel)',
    category: 'DPF', manufacturer: ['universal'],
    compatibility: 'DPF\'li dizel araçlar',
    readCmd: '22F907', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },

  // ─── BOĞAZ KALİBRASYONU (Throttle) ───
  {
    id: 'throttle_adaptation', name: 'Gaz Kelebeği Adaptasyonu',
    description: 'Gaz kelebeği sıfırlama ve yeniden öğrenme (TPS adaptasyon)',
    category: 'Kalibrasyon', manufacturer: ['universal'],
    compatibility: 'Elektronik gaz kelebeğine sahip araçlar',
    readCmd: '22F910', readHeader: '7E0', writeOn: '31F9100303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'throttle_position_learn', name: 'Gaz Kelebeği Pozisyon Öğrenme',
    description: 'Kelebek açısı sıfır ve tam açık pozisyonlarını öğret',
    category: 'Kalibrasyon', manufacturer: ['universal'],
    compatibility: 'Drive-by-wire araçlar',
    readCmd: '22F911', readHeader: '7E0', writeOn: '31F9110303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'throttle_reset_adaption', name: 'Adaptasyon Değerlerini Sıfırla',
    description: 'ECU adaptasyon değerlerini fabrika ayarlarına döndür',
    category: 'Kalibrasyon', manufacturer: ['universal'],
    compatibility: 'Elektronik gaz kelebeğine sahip araçlar',
    readCmd: '22F912', readHeader: '7E0', writeOn: '31F9120303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'idle_speed_learn', name: 'Rölanti Devri Öğrenme',
    description: 'Rölanti hava kontrolünü yeniden kalibre et',
    category: 'Kalibrasyon', manufacturer: ['universal'],
    compatibility: 'Elektronik gaz kelebeğine sahip araçlar',
    readCmd: '22F913', readHeader: '7E0', writeOn: '31F9130303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'accelerator_pedal_cal', name: 'Gaz Pedalı Kalibrasyonu',
    description: 'Gaz pedalı konum sensörünü kalibre et',
    category: 'Kalibrasyon', manufacturer: ['universal'],
    compatibility: 'Elektronik gaz pedalına sahip araçlar',
    readCmd: '22F914', readHeader: '7E0', writeOn: '31F9140303', writeOff: '', writeHeader: '7E0',
  },

  // ─── SERVIS SIFIRLAMA ───
  {
    id: 'service_reset_oil', name: 'Yağ Servisi Sıfırlama',
    description: 'Yağ değişim uyarısını sıfırla (service light)',
    category: 'Servis', manufacturer: ['universal'],
    compatibility: 'UDS destekli araçlar (2010+)',
    readCmd: '22F920', readHeader: '7E0', writeOn: '31F9200303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'service_reset_inspection', name: 'Bakım Uyarısı Sıfırlama',
    description: 'Periyodik bakım uyarısını sıfırla (inspection light)',
    category: 'Servis', manufacturer: ['universal'],
    compatibility: 'UDS destekli araçlar (2010+)',
    readCmd: '22F921', readHeader: '7E0', writeOn: '31F9210303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'service_reset_vag', name: 'VAG Servis Sıfırlama',
    description: 'VAG grubu araçlarda yağ/bakım uyarılarını sıfırla',
    category: 'Servis', manufacturer: ['vag'],
    compatibility: 'VW Golf 5+, Audi A3 8P+, Seat Leon 2+, Skoda Octavia 2+',
    readCmd: '22F922', readHeader: '7E0', writeOn: '31F9220303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'service_reset_bmw', name: 'BMW CBS Servis Sıfırlama',
    description: 'BMW Condition Based Servis uyarılarını sıfırla',
    category: 'Servis', manufacturer: ['bmw'],
    compatibility: 'BMW E90+, F20+, Mini R56+',
    readCmd: '22F923', readHeader: '7E0', writeOn: '31F9230303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'service_reset_ford', name: 'Ford Servis Sıfırlama',
    description: 'Ford araçlarda yağ değişim uyarısını sıfırla',
    category: 'Servis', manufacturer: ['ford'],
    compatibility: 'Ford Focus 2+, Mondeo 4+, Kuga 1+',
    readCmd: '22F924', readHeader: '7E0', writeOn: '31F9240303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'service_reset_mercedes', name: 'Mercedes Servis Sıfırlama',
    description: 'Mercedes araçlarda servis uyarısını sıfırla (ASSYST)',
    category: 'Servis', manufacturer: ['mercedes'],
    compatibility: 'Mercedes W204+, W212+, C180+',
    readCmd: '22F925', readHeader: '7E0', writeOn: '31F9250303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'service_reset_toyota', name: 'Toyota Servis Sıfırlama',
    description: 'Toyota/Lexus araçlarda bakım uyarısını sıfırla',
    category: 'Servis', manufacturer: ['toyota'],
    compatibility: 'Toyota Corolla 10+, Auris 2+, Avensis 3+',
    readCmd: '22F926', readHeader: '7E0', writeOn: '31F9260303', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'service_reset_hyundai', name: 'Hyundai Servis Sıfırlama',
    description: 'Hyundai/Kia araçlarda bakım uyarısını sıfırla',
    category: 'Servis', manufacturer: ['hyundai'],
    compatibility: 'Hyundai i30+, Tucson+, Kia Ceed+',
    readCmd: '22F927', readHeader: '7E0', writeOn: '31F9270303', writeOff: '', writeHeader: '7E0',
  },

  // ─── EK DIAGNOSTIK ───
  {
    id: 'diag_extended_session', name: 'Genişletilmiş Oturum',
    description: 'ECU genişletilmiş diagnostik oturumuna geç (kodlama/servis için)',
    category: 'Diagnostik', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '1003', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'diag_programming_session', name: 'Programlama Oturumu',
    description: 'ECU programlama oturumuna geç',
    category: 'Diagnostik', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '1002', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'diag_tester_present', name: 'TesterPresent Gönder',
    description: 'ECU bağlantısını canlı tut (3sn aralıkla)',
    category: 'Diagnostik', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '3E00', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'diag_vin_uds', name: 'VIN Oku (UDS)',
    description: 'UDS protokolü ile VIN sorgula',
    category: 'Diagnostik', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '22F190', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  
  // ─── GİZLİ ÖZELLİKLER (KODLAMA) ───
  {
    id: 'vag_needle_sweep', name: 'Kadran Selamlama',
    description: 'Kontak açıldığında ibrelerin sona vurup dönmesi (Needle Sweep)',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['vag'],
    compatibility: 'VW Golf, Seat Leon, Skoda Octavia (Gösterge Paneli)',
    readCmd: '221701', readHeader: '714', writeOn: '2E170101', writeOff: '2E170100', writeHeader: '714',
  },
  {
    id: 'vag_seatbelt_warning', name: 'Emniyet Kemeri Uyarısı İptali',
    description: 'Gösterge panelindeki emniyet kemeri uyarı sesini kapatır',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['vag'],
    compatibility: 'VAG Grubu (Gösterge Paneli)',
    readCmd: '221702', readHeader: '714', writeOn: '2E170200', writeOff: '2E170201', writeHeader: '714',
  },
  {
    id: 'bmw_start_stop_mem', name: 'Start/Stop Hafızası',
    description: 'Aracı yeniden çalıştırdığınızda Start/Stop ayarını hatırlar',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['bmw'],
    compatibility: 'BMW F ve G Serisi (BDC/FEM)',
    readCmd: '222001', readHeader: '700', writeOn: '2E200101', writeOff: '2E200100', writeHeader: '700',
  },
  {
    id: 'bmw_digital_speedo', name: 'Dijital Hız Göstergesi',
    description: 'Yol bilgisayarında anlık dijital hız gösterimini aktif eder',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['bmw'],
    compatibility: 'BMW E90, F20, F30 (Kombi)',
    readCmd: '222002', readHeader: '700', writeOn: '2E200201', writeOff: '2E200200', writeHeader: '700',
  },
  {
    id: 'ford_auto_lock', name: 'Otomatik Kapı Kilitleme',
    description: 'Araç 15 km/s hızı geçince kapıları otomatik kilitler',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['ford'],
    compatibility: 'Ford Focus, Fiesta, Mondeo (BCM)',
    readCmd: '223001', readHeader: '726', writeOn: '2E300101', writeOff: '2E300100', writeHeader: '726',
  },
  {
    id: 'ford_cornering_fog', name: 'Viraj Aydınlatması',
    description: 'Sinyal verildiğinde veya direksiyon çevrildiğinde sis farı yanar',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['ford', 'vag', 'renault'],
    compatibility: 'BCM Destekli Araçlar',
    readCmd: '223002', readHeader: '726', writeOn: '2E300201', writeOff: '2E300200', writeHeader: '726',
  },
  {
    id: 'renault_rs_monitor', name: 'R.S. Monitor Aktifleştirme',
    description: 'R-Link ekranında spor RS Monitor uygulamasını açar',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['renault'],
    compatibility: 'Renault Megane 4, Clio 4 (R-Link)',
    readCmd: '224001', readHeader: '7A0', writeOn: '2E400101', writeOff: '2E400100', writeHeader: '7A0',
  },
  {
    id: 'opel_opc_theme', name: 'OPC Ekran Teması',
    description: 'Gösterge ekranında OPC spor temasını aktifleştirir',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['opel'],
    compatibility: 'Opel Astra K, Insignia',
    readCmd: '225001', readHeader: '760', writeOn: '2E500101', writeOff: '2E500100', writeHeader: '760',
  },
  {
    id: 'mercedes_amg_logo', name: 'AMG Karşılama Logosu',
    description: 'Teyp açılışında AMG logosunu gösterir',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['mercedes'],
    compatibility: 'Mercedes Audio 20 / COMAND',
    readCmd: '226001', readHeader: '7E0', writeOn: '2E600101', writeOff: '2E600100', writeHeader: '7E0',
  },
  {
    id: 'fiat_seatbelt_chime', name: 'Emniyet Kemeri Ses İptali',
    description: 'Fiat araçlarda kemer ikaz sesini kapatır',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['fiat'],
    compatibility: 'Fiat Egea / Tipo / Punto',
    readCmd: '227001', readHeader: '732', writeOn: '2E700100', writeOff: '2E700101', writeHeader: '732',
  },
  {
    id: 'toyota_window_remote', name: 'Kumandadan Cam İndirme',
    description: 'Kumandadaki açma tuşuna basılı tutunca tüm camlar iner',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['toyota'],
    compatibility: 'Toyota Corolla, C-HR (BCM)',
    readCmd: '228001', readHeader: '750', writeOn: '2E800101', writeOff: '2E800100', writeHeader: '750',
  },
  {
    id: 'bmw_seatbelt_chime', name: 'BMW Kemer İkaz İptali',
    description: 'BMW araçlarda emniyet kemeri sesini (Gong) kalıcı olarak susturur.',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['bmw'],
    compatibility: 'BMW F ve G Serisi',
    readCmd: '222003', readHeader: '700', writeOn: '2E200300', writeOff: '2E200301', writeHeader: '700',
  },
  {
    id: 'ford_st_logo', name: 'Ford ST/RS Ekran Logosu',
    description: 'SYNC ekranında veya kadranda açılışta ST/RS logosunu gösterir.',
    category: 'Gizli Özellik (Kodlama)', manufacturer: ['ford'],
    compatibility: 'Ford Focus 3/4, Fiesta MK8',
    readCmd: '223003', readHeader: '726', writeOn: '2E300301', writeOff: '2E300300', writeHeader: '726',
  },
];

export function getFeaturesForManufacturer(mfr: Manufacturer): HiddenFeature[] {
  return ALL_FEATURES.filter(
    f => f.manufacturer.includes(mfr) || f.manufacturer.includes('universal'),
  );
}

export function getManufacturerIcon(mfr: Manufacturer): string {
  const icons: Record<Manufacturer, string> = {
    unknown: '❓', universal: '🔧', vag: '🏎️', ford: '🐎', bmw: '🌀', mercedes: '⭐',
    renault: '💎', opel: '⚡', peugeot: '🦁', fiat: '🔴', toyota: '🌐', hyundai: '🔷',
  };
  return icons[mfr] || '🔧';
}

export function getAllManufacturers(): Manufacturer[] {
  return ['universal', 'vag', 'ford', 'bmw', 'mercedes', 'renault', 'opel', 'peugeot', 'fiat', 'toyota', 'hyundai'];
}
