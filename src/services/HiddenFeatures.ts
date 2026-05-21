export type Manufacturer = 'vag' | 'ford' | 'renault' | 'bmw' | 'mercedes' | 'opel' | 'peugeot' | 'fiat' | 'toyota' | 'hyundai' | 'dacia' | 'universal' | 'unknown';

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
  vag: 'VAG (VW / Audi / Seat / Skoda)',
  ford: 'Ford',
  renault: 'Renault',
  bmw: 'BMW / Mini',
  mercedes: 'Mercedes-Benz',
  opel: 'Opel / Vauxhall',
  peugeot: 'Peugeot / Citroen / DS',
  fiat: 'Fiat / Alfa / Lancia',
  toyota: 'Toyota / Lexus',
  hyundai: 'Hyundai / Kia',
  dacia: 'Dacia',
  universal: 'Tüm Araçlar',
  unknown: 'Bilinmeyen',
};

const WMI_LISTS: Record<Manufacturer, string[]> = {
  vag: ['WVW', 'WV1', 'WV2', 'WV3', 'WAU', 'WUA', 'TRU', 'WA1', 'WAB', 'VSS', 'TMB', 'TMS', 'TMP', '1VW', '2VW', '3VW', 'XW8', 'XW9'],
  ford: ['1FA', '1FB', '1FC', '1FD', '1FE', '1FF', '1FT', '2FA', '2FB', '3FA', 'WF0', 'WF1', '8XD', '9FA', 'MAJ', 'VS6', 'LJ2'],
  renault: ['VF1', 'VF2', 'VF3', 'VF4', 'VF5', 'VF6', 'VF7', 'VF8', 'VAB', 'VAC'],
  bmw: ['WBA', 'WBS', 'WBY', 'WBW', 'WBX', 'WBZ', 'WDA', 'WDD', 'WDF', '5UX', '5YM', '5YD', '5YJ', '4US', '5GA', 'WMW', 'WMF'],
  mercedes: ['WDB', 'WDC', 'WDD', 'WDF', 'WDP', 'WDU', 'WDZ', '4JG', '4M2', 'W1K', 'W1N', 'W1V', 'W1W', 'W1X', 'W1Y'],
  opel: ['W0L', 'W0V', 'S0L', 'Y6J', 'W0LA'],
  peugeot: ['VF3', 'VF7', 'VF9', 'VR3', 'VR7'],
  fiat: ['ZFA', 'ZFB', 'ZFC', 'ZFD', 'ZFF', 'ZLA', 'ZAR', 'NLE'],
  toyota: ['JTD', 'JT1', 'JT2', 'JTE', 'JTM', 'JTN', 'JTS', 'JTK', 'JTH', 'SB1', 'LN1', 'W05'],
  hyundai: ['KMF', 'KMH', 'KNA', 'KNB', 'KNC', 'KND', 'KNE', 'KNF', 'KNG', 'KNH', 'KMJ', 'TMA', 'TMB', 'TMC', 'X7M', 'LBE'],
  dacia: ['U5Y', 'UU1', 'VAB'],
  universal: [],
  unknown: [],
};

export function detectManufacturer(vin: string): Manufacturer {
  const wmi = vin.substring(0, 3).toUpperCase();
  const wmi2 = vin.substring(0, 2).toUpperCase();
  for (const [mfr, prefixes] of Object.entries(WMI_LISTS)) {
    if (mfr === 'universal' || mfr === 'unknown') continue;
    if (prefixes.some(p => wmi.startsWith(p) || wmi2.startsWith(p))) return mfr as Manufacturer;
  }
  if (wmi !== '' && wmi !== 'XXX') return 'universal';
  return 'unknown';
}

export const ALL_FEATURES: HiddenFeature[] = [
  // ─── EVRENSEL (Tüm Araçlar) ───
  {
    id: 'uni_dtc_read', name: 'UDS Hata Kodlarını Oku',
    description: 'ECU\'dan tüm hata kodlarını UDS protokolü ile oku',
    category: 'Teşhis', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar (2008+)',
    readCmd: '1902', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'uni_dtc_clear', name: 'UDS Hata Kodlarını Sil',
    description: 'ECU\'daki tüm hata kodlarını temizle',
    category: 'Teşhis', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '14FFFFFF', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'uni_ecu_scan', name: 'ECU Tarama (Tüm Adresler)',
    description: 'Olası tüm CAN ID\'lerini tara ve yanıt veren ECU\'ları bul',
    category: 'Teşhis', manufacturer: ['universal'],
    compatibility: 'CAN/UDS araçlar',
    readCmd: 'ATZ', readHeader: '', writeOn: '', writeOff: '', writeHeader: '',
  },
  {
    id: 'uni_session_ext', name: 'Genişletilmiş Diyagnostik Oturumu',
    description: 'ECU\'yu genişletilmiş oturuma geçir (kodlama için)',
    category: 'Teşhis', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '1003', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'uni_session_prog', name: 'Programlama Oturumu',
    description: 'ECU\'yu programlama oturumuna geçir',
    category: 'Teşhis', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '1002', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'uni_vin_read', name: 'VIN Oku (UDS)',
    description: 'UDS protokolü ile VIN sorgula',
    category: 'Teşhis', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '22F190', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },
  {
    id: 'uni_tester_present', name: 'TesterPresent (Canlı Tut)',
    description: 'ECU bağlantısını canlı tut (3 saniyede bir gönder)',
    category: 'Teşhis', manufacturer: ['universal'],
    compatibility: 'UDS destekli tüm araçlar',
    readCmd: '3E00', readHeader: '7E0', writeOn: '', writeOff: '', writeHeader: '7E0',
  },

  // ─── VAG ───
  {
    id: 'vag_needle_sweep', name: 'Needle Sweep (Gösterge Testi)',
    description: 'Açılışta göstergelerin tam tur atması',
    category: 'Gösterge Paneli', manufacturer: ['vag'],
    compatibility: 'VW Golf 6+, Audi A3 8P+, Seat Leon 2+, Skoda Octavia 3+',
    readCmd: '22F00C', readHeader: '7E0', writeOn: '2EF00C0101', writeOff: '2EF00C0100', writeHeader: '7E0',
  },
  {
    id: 'vag_comfort_blinker', name: 'Kompakt Sinyal Sayısı',
    description: 'Tek dokunuşta sinyal yanıp sönme sayısı (3 veya 5)',
    category: 'Aydınlatma', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar (2005+)',
    readCmd: '22F00D', readHeader: '7E4', writeOn: '2EF00D0105', writeOff: '2EF00D0103', writeHeader: '7E4',
  },
  {
    id: 'vag_coming_home', name: 'Coming Home Süresi',
    description: 'Kapı kapandıktan sonra farların açık kalma süresi (sn)',
    category: 'Aydınlatma', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar (2005+)',
    readCmd: '22F00E', readHeader: '7E4', writeOn: '2EF00E0A', writeOff: '2EF00E00', writeHeader: '7E4',
  },
  {
    id: 'vag_leaving_home', name: 'Leaving Home',
    description: 'Uzaktan kumanda ile farların otomatik yanması',
    category: 'Aydınlatma', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar (2005+)',
    readCmd: '22F00F', readHeader: '7E4', writeOn: '2EF00F0101', writeOff: '2EF00F0100', writeHeader: '7E4',
  },
  {
    id: 'vag_corner_fog', name: 'Köşe Sis Farları (Corner)',
    description: 'Dönüşlerde sis farlarının otomatik yanması',
    category: 'Aydınlatma', manufacturer: ['vag'],
    compatibility: 'Sis farlı VAG araçlar',
    readCmd: '22F010', readHeader: '7E4', writeOn: '2EF0100101', writeOff: '2EF0100100', writeHeader: '7E4',
  },
  {
    id: 'vag_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: '15 km/s üzerinde kapıların otomatik kilitlenmesi',
    category: 'Konfor', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar',
    readCmd: '22F011', readHeader: '7E4', writeOn: '2EF0110101', writeOff: '2EF0110100', writeHeader: '7E4',
  },
  {
    id: 'vag_auto_unlock', name: 'Otomatik Kilit Açma',
    description: 'Kontağı kapatınca kapıların otomatik açılması',
    category: 'Konfor', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar',
    readCmd: '22F012', readHeader: '7E4', writeOn: '2EF0120101', writeOff: '2EF0120100', writeHeader: '7E4',
  },
  {
    id: 'vag_mirror_fold', name: 'Kumandadan Ayna Katlama',
    description: 'Kilitlerken yan aynaların katlanması',
    category: 'Konfor', manufacturer: ['vag'],
    compatibility: 'Katlanabilir elektrikli ayna olanlar',
    readCmd: '22F013', readHeader: '7E4', writeOn: '2EF0130101', writeOff: '2EF0130100', writeHeader: '7E4',
  },
  {
    id: 'vag_window_remote', name: 'Kumandadan Cam Açma/Kapama',
    description: 'Uzaktan kumanda ile camların kontrolü',
    category: 'Konfor', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar',
    readCmd: '22F014', readHeader: '7E4', writeOn: '2EF0140101', writeOff: '2EF0140100', writeHeader: '7E4',
  },
  {
    id: 'vag_beep_lock', name: 'Korna ile Kilit Onayı',
    description: 'Kilitleme sırasında kornanın kısa ötmesi',
    category: 'Konfor', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar',
    readCmd: '22F015', readHeader: '7E4', writeOn: '2EF0150101', writeOff: '2EF0150100', writeHeader: '7E4',
  },
  {
    id: 'vag_tear_wiping', name: 'Tear Wiping (Silecek Sıyırma)',
    description: 'Cam suyundan sonra sileceğin fazladan bir kez sıyırması',
    category: 'Konfor', manufacturer: ['vag'],
    compatibility: 'VAG CAN araçlar',
    readCmd: '22F016', readHeader: '7E4', writeOn: '2EF0160101', writeOff: '2EF0160100', writeHeader: '7E4',
  },
  {
    id: 'vag_drl_menu', name: 'Gündüz Farları Menüsü',
    description: 'Gündüz farlarının menüden kapatılabilmesi',
    category: 'Aydınlatma', manufacturer: ['vag'],
    compatibility: 'LED/M gündüz farlı VAG araçlar',
    readCmd: '22F017', readHeader: '7E4', writeOn: '2EF0170101', writeOff: '2EF0170100', writeHeader: '7E4',
  },
  {
    id: 'vag_rain_closing', name: 'Yağmurda Cam Kapatma',
    description: 'Yağmur sensörü camları otomatik kapatması',
    category: 'Konfor', manufacturer: ['vag'],
    compatibility: 'Yağmur sensörlü VAG araçlar',
    readCmd: '22F018', readHeader: '7E4', writeOn: '2EF0180101', writeOff: '2EF0180100', writeHeader: '7E4',
  },
  {
    id: 'vag_tire_pressure', name: 'Lastik Basınç Göstergesi',
    description: 'Dolaylı TPMS aktif etme',
    category: 'Sürüş', manufacturer: ['vag'],
    compatibility: 'ABS sensörlü VAG araçlar',
    readCmd: '22F019', readHeader: '7E2', writeOn: '2EF0190101', writeOff: '2EF0190100', writeHeader: '7E2',
  },
  {
    id: 'vag_hill_hold', name: 'Hill Hold (Yokuş Kalkış Desteği)',
    description: 'Yokuşta aracın geri kaçmasını önler',
    category: 'Sürüş', manufacturer: ['vag'],
    compatibility: 'ESP\'li VAG araçlar',
    readCmd: '22F01A', readHeader: '7E2', writeOn: '2EF01A0101', writeOff: '2EF01A0100', writeHeader: '7E2',
  },
  {
    id: 'vag_lane_assist', name: 'Şerit Takip Asistanı',
    description: 'Lane Assist etkinleştirme/devre dışı bırakma',
    category: 'Sürüş', manufacturer: ['vag'],
    compatibility: 'Ön kameralı VAG araçlar',
    readCmd: '22F01B', readHeader: '7E0', writeOn: '2EF01B0101', writeOff: '2EF01B0100', writeHeader: '7E0',
  },

  // ─── FORD ───
  {
    id: 'ford_auto_lock', name: 'Otomatik Kapı Kilidi (Autolock)',
    description: 'Hız 10 km/s üzerinde otomatik kilit',
    category: 'Konfor', manufacturer: ['ford'],
    compatibility: 'Ford Focus 2+, Kuga 1+, Mondeo 4+',
    readCmd: '22F101', readHeader: '7E4', writeOn: '2EF1010101', writeOff: '2EF1010100', writeHeader: '7E4',
  },
  {
    id: 'ford_global_window', name: 'Global Cam Açma/Kapama',
    description: 'Kumandadan tüm camların açılıp kapanması',
    category: 'Konfor', manufacturer: ['ford'],
    compatibility: 'Ford Focus 3+, Kuga 2+, Mondeo 4+',
    readCmd: '22F102', readHeader: '7E4', writeOn: '2EF1020101', writeOff: '2EF1020100', writeHeader: '7E4',
  },
  {
    id: 'ford_daytime_lights', name: 'Gündüz Farları (DRL)',
    description: 'Gündüz farlarının açık/kapalı ayarı',
    category: 'Aydınlatma', manufacturer: ['ford'],
    compatibility: 'Ford CAN araçlar (2008+)',
    readCmd: '22F103', readHeader: '7E4', writeOn: '2EF1030101', writeOff: '2EF1030100', writeHeader: '7E4',
  },
  {
    id: 'ford_esc_mode', name: 'ESP Modu (Spor)',
    description: 'ESP/ESC\'nin spor modu',
    category: 'Sürüş', manufacturer: ['ford'],
    compatibility: 'ESP\'li Ford araçlar',
    readCmd: '22F104', readHeader: '7E2', writeOn: '2EF1040101', writeOff: '2EF1040100', writeHeader: '7E2',
  },
  {
    id: 'ford_coming_home', name: 'Coming Home/Leaving Home',
    description: 'Far gecikme süresi ayarı',
    category: 'Aydınlatma', manufacturer: ['ford'],
    compatibility: 'Ford CAN araçlar (2010+)',
    readCmd: '22F105', readHeader: '7E4', writeOn: '2EF1050A', writeOff: '2EF10500', writeHeader: '7E4',
  },
  {
    id: 'ford_auto_wipers', name: 'Otomatik Silecek Hassasiyeti',
    description: 'Yağmur sensörü hassasiyet ayarı',
    category: 'Konfor', manufacturer: ['ford'],
    compatibility: 'Yağmur sensörlü Ford araçlar',
    readCmd: '22F106', readHeader: '7E4', writeOn: '2EF10602', writeOff: '2EF10601', writeHeader: '7E4',
  },
  {
    id: 'ford_bambi_mode', name: 'Bambi Modu (Sis+Uzun Far)',
    description: 'Sis farları ve uzun farların birlikte yanması',
    category: 'Aydınlatma', manufacturer: ['ford'],
    compatibility: 'Sis farlı Ford araçlar',
    readCmd: '22F107', readHeader: '7E4', writeOn: '2EF1070101', writeOff: '2EF1070100', writeHeader: '7E4',
  },
  {
    id: 'ford_double_honk', name: 'Çift Korna Uyarısını Kapatma',
    description: 'Motor çalışırken kapı açılınca korna uyarısını kapatma',
    category: 'Konfor', manufacturer: ['ford'],
    compatibility: 'Ford CAN araçlar',
    readCmd: '22F108', readHeader: '7E4', writeOn: '2EF1080100', writeOff: '2EF1080101', writeHeader: '7E4',
  },

  // ─── RENAULT ───
  {
    id: 'renault_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: '10 km/s üzerinde otomatik kilit',
    category: 'Konfor', manufacturer: ['renault'],
    compatibility: 'Renault Clio 3+, Megane 2+, Laguna 2+',
    readCmd: '22F201', readHeader: '7E4', writeOn: '2EF2010101', writeOff: '2EF2010100', writeHeader: '7E4',
  },
  {
    id: 'renault_coming_home', name: 'Coming Home Aydınlatma',
    description: 'Kapı kapandıktan sonra far süresi',
    category: 'Aydınlatma', manufacturer: ['renault'],
    compatibility: 'Renault CAN araçlar (2006+)',
    readCmd: '22F202', readHeader: '7E4', writeOn: '2EF2020A', writeOff: '2EF20200', writeHeader: '7E4',
  },
  {
    id: 'renault_welcome_light', name: 'Karşılama Işıkları',
    description: 'Uzaktan kumanda ile farların yanması',
    category: 'Aydınlatma', manufacturer: ['renault'],
    compatibility: 'Renault CAN araçlar',
    readCmd: '22F203', readHeader: '7E4', writeOn: '2EF2030101', writeOff: '2EF2030100', writeHeader: '7E4',
  },
  {
    id: 'renault_tpms', name: 'Lastik Basınç Sensörleri',
    description: 'TPMS aktif/devre dışı',
    category: 'Sürüş', manufacturer: ['renault'],
    compatibility: 'TPMS\'li Renault araçlar',
    readCmd: '22F204', readHeader: '7E4', writeOn: '2EF2040101', writeOff: '2EF2040100', writeHeader: '7E4',
  },
  {
    id: 'renault_auto_wipers', name: 'Otomatik Silecek Hassasiyeti',
    description: 'Yağmur sensörü hassasiyet seviyesi',
    category: 'Konfor', manufacturer: ['renault'],
    compatibility: 'Yağmur sensörlü Renault araçlar',
    readCmd: '22F205', readHeader: '7E4', writeOn: '2EF20502', writeOff: '2EF20501', writeHeader: '7E4',
  },
  {
    id: 'renault_auto_lights', name: 'Otomatik Far Hassasiyeti',
    description: 'Far sensörü hassasiyet ayarı',
    category: 'Aydınlatma', manufacturer: ['renault'],
    compatibility: 'Otomatik farlı Renault araçlar',
    readCmd: '22F206', readHeader: '7E4', writeOn: '2EF20602', writeOff: '2EF20601', writeHeader: '7E4',
  },
  {
    id: 'renault_drl_config', name: 'Gündüz Farları (DRL)',
    description: 'Gündüz farlarını açma/kapama',
    category: 'Aydınlatma', manufacturer: ['renault'],
    compatibility: 'Renault CAN araçlar (2008+)',
    readCmd: '22F207', readHeader: '7E4', writeOn: '2EF2070101', writeOff: '2EF2070100', writeHeader: '7E4',
  },
  {
    id: 'renault_reversing_beep', name: 'Geri Vites Uyarı Sesi',
    description: 'Geri viteste bip sesi',
    category: 'Konfor', manufacturer: ['renault'],
    compatibility: 'Park sensörlü Renault araçlar',
    readCmd: '22F208', readHeader: '7E4', writeOn: '2EF2080101', writeOff: '2EF2080100', writeHeader: '7E4',
  },
  {
    id: 'renault_eco_mode', name: 'Eco Modu Varsayılan',
    description: 'Her çalıştırmada Eco modunun kapalı olması',
    category: 'Sürüş', manufacturer: ['renault'],
    compatibility: 'Eco modlu Renault araçlar',
    readCmd: '22F209', readHeader: '7E4', writeOn: '2EF2090100', writeOff: '2EF2090101', writeHeader: '7E4',
  },
  {
    id: 'renault_windows_remote', name: 'Kumandadan Cam Açma',
    description: 'Uzaktan kumanda ile cam açma/kapama',
    category: 'Konfor', manufacturer: ['renault'],
    compatibility: 'Elektrikli camlı Renault araçlar',
    readCmd: '22F20A', readHeader: '7E4', writeOn: '2EF20A0101', writeOff: '2EF20A0100', writeHeader: '7E4',
  },

  // ─── BMW ───
  {
    id: 'bmw_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: '15 km/s üzerinde kapıların otomatik kilitlenmesi',
    category: 'Konfor', manufacturer: ['bmw'],
    compatibility: 'BMW E90+, F20+, Mini R56+',
    readCmd: '22F301', readHeader: '7E4', writeOn: '2EF3010101', writeOff: '2EF3010100', writeHeader: '7E4',
  },
  {
    id: 'bmw_mirror_fold', name: 'Kumandadan Ayna Katlama',
    description: 'Kilitlerken yan aynaların otomatik katlanması',
    category: 'Konfor', manufacturer: ['bmw'],
    compatibility: 'Katlanabilir aynalı BMW/Mini',
    readCmd: '22F302', readHeader: '7E0', writeOn: '2EF3020101', writeOff: '2EF3020100', writeHeader: '7E0',
  },
  {
    id: 'bmw_welcome_lights', name: 'Karşılama Işıkları',
    description: 'Uzaktan kumanda ile angel eyes/farların yanması',
    category: 'Aydınlatma', manufacturer: ['bmw'],
    compatibility: 'BMW E90+, F30+ (FRM/REM modül)',
    readCmd: '22F303', readHeader: '7E0', writeOn: '2EF3030101', writeOff: '2EF3030100', writeHeader: '7E0',
  },
  {
    id: 'bmw_drl', name: 'Gündüz Farları (DRL) Ayarı',
    description: 'LED angel eyes / gündüz farları açma/kapama',
    category: 'Aydınlatma', manufacturer: ['bmw'],
    compatibility: 'LED DRL\'li BMW (2006+)',
    readCmd: '22F304', readHeader: '7E0', writeOn: '2EF3040101', writeOff: '2EF3040100', writeHeader: '7E0',
  },
  {
    id: 'bmw_corner_light', name: 'Köşe Farları (CORNERING)',
    description: 'Dönüşlerde sis/ek far aydınlatması',
    category: 'Aydınlatma', manufacturer: ['bmw'],
    compatibility: 'Sis farlı BMW',
    readCmd: '22F305', readHeader: '7E0', writeOn: '2EF3050101', writeOff: '2EF3050100', writeHeader: '7E0',
  },

  // ─── MERCEDES ───
  {
    id: 'mb_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: 'Sürüş sırasında otomatik kilit',
    category: 'Konfor', manufacturer: ['mercedes'],
    compatibility: 'Mercedes W204+, W212+, C180+',
    readCmd: '22F401', readHeader: '7E4', writeOn: '2EF4010101', writeOff: '2EF4010100', writeHeader: '7E4',
  },
  {
    id: 'mb_coming_home', name: 'Coming Home Süresi',
    description: 'Kapatma sonrası far süresi ayarı',
    category: 'Aydınlatma', manufacturer: ['mercedes'],
    compatibility: 'Mercedes CAN araçlar (2008+)',
    readCmd: '22F402', readHeader: '7E4', writeOn: '2EF4020A', writeOff: '2EF40200', writeHeader: '7E4',
  },
  {
    id: 'mb_drl', name: 'Gündüz Farları (DRL)',
    description: 'Gündüz farlarını açma/kapama',
    category: 'Aydınlatma', manufacturer: ['mercedes'],
    compatibility: 'Mercedes W204+',
    readCmd: '22F403', readHeader: '7E4', writeOn: '2EF4030101', writeOff: '2EF4030100', writeHeader: '7E4',
  },
  {
    id: 'mb_fold_mirror', name: 'Kumandadan Ayna Katlama',
    description: 'Kilitlemede ayna katlama',
    category: 'Konfor', manufacturer: ['mercedes'],
    compatibility: 'Elektrikli katlanabilir aynalı',
    readCmd: '22F404', readHeader: '7E4', writeOn: '2EF4040101', writeOff: '2EF4040100', writeHeader: '7E4',
  },

  // ─── OPEL ───
  {
    id: 'opel_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: 'Hız 10 km/s üzerinde otomatik kilit',
    category: 'Konfor', manufacturer: ['opel'],
    compatibility: 'Opel Astra H+, Corsa D+, Insignia A+',
    readCmd: '22F501', readHeader: '7E4', writeOn: '2EF5010101', writeOff: '2EF5010100', writeHeader: '7E4',
  },
  {
    id: 'opel_drl', name: 'Gündüz Farları (DRL)',
    description: 'Gündüz farlarını açma/kapama',
    category: 'Aydınlatma', manufacturer: ['opel'],
    compatibility: 'Opel CAN araçlar (2008+)',
    readCmd: '22F502', readHeader: '7E4', writeOn: '2EF5020101', writeOff: '2EF5020100', writeHeader: '7E4',
  },
  {
    id: 'opel_coming_home', name: 'Coming Home Süresi',
    description: 'Kapama sonrası far süresi',
    category: 'Aydınlatma', manufacturer: ['opel'],
    compatibility: 'Opel CAN araçlar',
    readCmd: '22F503', readHeader: '7E4', writeOn: '2EF5030A', writeOff: '2EF50300', writeHeader: '7E4',
  },
  {
    id: 'opel_window_remote', name: 'Kumandadan Cam Açma',
    description: 'Uzaktan kumanda ile cam kontrolü',
    category: 'Konfor', manufacturer: ['opel'],
    compatibility: 'Elektrikli camlı Opel araçlar',
    readCmd: '22F504', readHeader: '7E4', writeOn: '2EF5040101', writeOff: '2EF5040100', writeHeader: '7E4',
  },

  // ─── PEUGEOT / CITROEN ───
  {
    id: 'psa_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: 'Hızdan bağımsız otomatik kilit',
    category: 'Konfor', manufacturer: ['peugeot'],
    compatibility: 'Peugeot 307+, Citroen C4+, DS4+',
    readCmd: '22F601', readHeader: '7E4', writeOn: '2EF6010101', writeOff: '2EF6010100', writeHeader: '7E4',
  },
  {
    id: 'psa_coming_home', name: 'Coming Home Aydınlatma',
    description: 'Kapı kapandıktan sonra far açık kalma süresi',
    category: 'Aydınlatma', manufacturer: ['peugeot'],
    compatibility: 'Peugeot/Citroen CAN araçlar',
    readCmd: '22F602', readHeader: '7E4', writeOn: '2EF6020A', writeOff: '2EF60200', writeHeader: '7E4',
  },
  {
    id: 'psa_drl', name: 'Gündüz Farları (DRL)',
    description: 'Gündüz farları açma/kapama',
    category: 'Aydınlatma', manufacturer: ['peugeot'],
    compatibility: 'Peugeot/Citroen (2008+)',
    readCmd: '22F603', readHeader: '7E4', writeOn: '2EF6030101', writeOff: '2EF6030100', writeHeader: '7E4',
  },
  {
    id: 'psa_window_remote', name: 'Kumandadan Cam Açma',
    description: 'Uzaktan kumandadan cam açma/kapama',
    category: 'Konfor', manufacturer: ['peugeot'],
    compatibility: 'Elektrikli camlı PSA araçlar',
    readCmd: '22F604', readHeader: '7E4', writeOn: '2EF6040101', writeOff: '2EF6040100', writeHeader: '7E4',
  },
  {
    id: 'psa_reversing_beep', name: 'Geri Vites Uyarı Sesi',
    description: 'Geri viteste bip sesi açma/kapama',
    category: 'Konfor', manufacturer: ['peugeot'],
    compatibility: 'Park sensörlü PSA araçlar',
    readCmd: '22F605', readHeader: '7E4', writeOn: '2EF6050100', writeOff: '2EF6050101', writeHeader: '7E4',
  },

  // ─── FIAT / ALFA ───
  {
    id: 'fiat_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: '20 km/s üzerinde otomatik kilit',
    category: 'Konfor', manufacturer: ['fiat'],
    compatibility: 'Fiat Grande Punto+, Alfa 147+, Lancia Delta+',
    readCmd: '22F701', readHeader: '7E4', writeOn: '2EF7010101', writeOff: '2EF7010100', writeHeader: '7E4',
  },
  {
    id: 'fiat_drl', name: 'Gündüz Farları (DRL)',
    description: 'Gündüz farlarını açma/kapama',
    category: 'Aydınlatma', manufacturer: ['fiat'],
    compatibility: 'Fiat/Alfa CAN araçlar',
    readCmd: '22F702', readHeader: '7E4', writeOn: '2EF7020101', writeOff: '2EF7020100', writeHeader: '7E4',
  },
  {
    id: 'fiat_coming_home', name: 'Coming Home Süresi',
    description: 'Kapatma sonrası far kalma süresi',
    category: 'Aydınlatma', manufacturer: ['fiat'],
    compatibility: 'Fiat CAN araçlar',
    readCmd: '22F703', readHeader: '7E4', writeOn: '2EF7030A', writeOff: '2EF70300', writeHeader: '7E4',
  },

  // ─── TOYOTA / LEXUS ───
  {
    id: 'toyota_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: 'Vites D\'ye alındığında otomatik kilit',
    category: 'Konfor', manufacturer: ['toyota'],
    compatibility: 'Toyota Corolla 10+, Auris 2+, Avensis 3+',
    readCmd: '22F801', readHeader: '7E4', writeOn: '2EF8010101', writeOff: '2EF8010100', writeHeader: '7E4',
  },
  {
    id: 'toyota_mirror_fold', name: 'Ayna Otomatik Katlama',
    description: 'Kilitlerken aynaları katla',
    category: 'Konfor', manufacturer: ['toyota'],
    compatibility: 'Elektrikli aynalı Toyota/Lexus',
    readCmd: '22F802', readHeader: '7E4', writeOn: '2EF8020101', writeOff: '2EF8020100', writeHeader: '7E4',
  },
  {
    id: 'toyota_window_remote', name: 'Kumandadan Cam Açma',
    description: 'Uzaktan kumanda ile cam açma',
    category: 'Konfor', manufacturer: ['toyota'],
    compatibility: 'Akıllı anahtarlı Toyota/Lexus',
    readCmd: '22F803', readHeader: '7E4', writeOn: '2EF8030101', writeOff: '2EF8030100', writeHeader: '7E4',
  },

  // ─── HYUNDAI / KIA ───
  {
    id: 'hyundai_auto_lock', name: 'Otomatik Kapı Kilidi',
    description: 'Hız 15 km/s üzerinde otomatik kilit',
    category: 'Konfor', manufacturer: ['hyundai'],
    compatibility: 'Hyundai i30+, Tucson+, Kia Ceed+',
    readCmd: '22F901', readHeader: '7E4', writeOn: '2EF9010101', writeOff: '2EF9010100', writeHeader: '7E4',
  },
  {
    id: 'hyundai_drl', name: 'Gündüz Farları (DRL)',
    description: 'Gündüz farlarını açma/kapama',
    category: 'Aydınlatma', manufacturer: ['hyundai'],
    compatibility: 'LED DRL\'li Hyundai/Kia',
    readCmd: '22F902', readHeader: '7E4', writeOn: '2EF9020101', writeOff: '2EF9020100', writeHeader: '7E4',
  },
  {
    id: 'hyundai_welcome', name: 'Karşılama Aydınlatması',
    description: 'Kumandada far/aydınlatma yanması',
    category: 'Aydınlatma', manufacturer: ['hyundai'],
    compatibility: 'Hyundai/Kia CAN araçlar (2010+)',
    readCmd: '22F903', readHeader: '7E4', writeOn: '2EF9030101', writeOff: '2EF9030100', writeHeader: '7E4',
  },
];

export function getFeaturesForManufacturer(mfr: Manufacturer): HiddenFeature[] {
  return ALL_FEATURES.filter(
    f => f.manufacturer.includes(mfr) || f.manufacturer.includes('universal'),
  );
}

export function getManufacturerIcon(mfr: Manufacturer): string {
  const icons: Record<Manufacturer, string> = {
    vag: '🏎️', ford: '🐎', renault: '💎', bmw: '🌀', mercedes: '⭐',
    opel: '⚡', peugeot: '🦁', fiat: '🔴', toyota: '🌐', hyundai: '🔷',
    dacia: '🟢', universal: '🔧', unknown: '❓',
  };
  return icons[mfr] || '❓';
}

export function getAllManufacturers(): Manufacturer[] {
  return ['vag', 'ford', 'renault', 'bmw', 'mercedes', 'opel', 'peugeot', 'fiat', 'toyota', 'hyundai', 'dacia', 'universal'];
}
