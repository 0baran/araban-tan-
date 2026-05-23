import type {Manufacturer} from './HiddenFeatures';

export interface CANModule {
  id: string;
  name: string;
  canId: string;
  respId: string;
  description: string;
  protocol: string;
}

export interface ExtendedPID {
  pid: string;
  name: string;
  unit: string;
  formula: string;
  bytes: number;
  header: string;
}

export interface DiagnosticSession {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface ManufacturerProtocol {
  manufacturer: Manufacturer;
  name: string;
  protocol: string;
  canBusType: string;
  modules: CANModule[];
  sessions: DiagnosticSession[];
  pids: ExtendedPID[];
}

const STANDARD_SESSIONS: DiagnosticSession[] = [
  {
    id: 'default',
    name: 'Varsayılan (Default)',
    code: '01',
    description: 'Standart diagnostik oturumu',
  },
  {
    id: 'extended',
    name: 'Genişletilmiş (Extended)',
    code: '03',
    description: 'Kodlama ve ek fonksiyonlar için',
  },
  {
    id: 'programming',
    name: 'Programlama',
    code: '02',
    description: 'ECU programlama/yazılım güncelleme',
  },
  {
    id: 'safety',
    name: 'Güvenlik Kilidi',
    code: '04',
    description: 'Güvenlik sistemi diagnostik',
  },
];

const STANDARD_MODULES: CANModule[] = [
  {
    id: 'engine',
    name: 'Motor ECU (ECM)',
    canId: '7E0',
    respId: '7E8',
    description: 'Motor kontrol ünitesi - standart OBD2/UDS',
    protocol: 'UDS',
  },
  {
    id: 'transmission',
    name: 'Şanzıman ECU (TCM)',
    canId: '7E1',
    respId: '7E9',
    description: 'Otomatik şanzıman kontrol ünitesi',
    protocol: 'UDS',
  },
  {
    id: 'abs',
    name: 'ABS / ESP',
    canId: '7E2',
    respId: '7EA',
    description: 'ABS, ESP, fren sistemi kontrol ünitesi',
    protocol: 'UDS',
  },
  {
    id: 'airbag',
    name: 'Hava Yastığı (SRS)',
    canId: '7E3',
    respId: '7EB',
    description: 'Hava yastığı ve emniyet kemeri sistemi',
    protocol: 'UDS',
  },
  {
    id: 'instrument',
    name: 'Gösterge Paneli (IC)',
    canId: '7E4',
    respId: '7EC',
    description: 'Enstrüman kümesi, uyarı ışıkları',
    protocol: 'UDS',
  },
  {
    id: 'climate',
    name: 'Klima (HVAC)',
    canId: '7E5',
    respId: '7ED',
    description: 'Isıtma, havalandırma, klima kontrolü',
    protocol: 'UDS',
  },
  {
    id: 'body',
    name: 'Gövde Kontrol (BCM)',
    canId: '7E6',
    respId: '7EE',
    description: 'Gövde kontrol modülü, kilitler, camlar',
    protocol: 'UDS',
  },
  {
    id: 'gateway',
    name: 'Gateway (GW)',
    canId: '7E7',
    respId: '7EF',
    description: 'CAN ağ geçidi, ağ yönetimi',
    protocol: 'UDS',
  },
  {
    id: 'fuel',
    name: 'Yakıt Sistemi',
    canId: '7E8',
    respId: '7F0',
    description: 'Yakıt pompası, enjektör kontrolü',
    protocol: 'UDS',
  },
  {
    id: 'steering',
    name: 'Direksiyon (EPS)',
    canId: '7E9',
    respId: '7F1',
    description: 'Elektrikli direksiyon kontrol ünitesi',
    protocol: 'UDS',
  },
  {
    id: 'suspension',
    name: 'Süspansiyon',
    canId: '7EA',
    respId: '7F2',
    description: 'Adaptif süspansiyon kontrolü',
    protocol: 'UDS',
  },
  {
    id: 'seats',
    name: 'Koltuk Kontrol',
    canId: '7EB',
    respId: '7F3',
    description: 'Elektrikli koltuk ve hafıza kontrolü',
    protocol: 'UDS',
  },
  {
    id: 'battery',
    name: 'Batarya Yönetimi (BMS)',
    canId: '7EC',
    respId: '7F4',
    description: 'Elektrikli/ hibrit batarya yönetimi',
    protocol: 'UDS',
  },
  {
    id: 'tpms',
    name: 'Lastik Basınç (TPMS)',
    canId: '7ED',
    respId: '7F5',
    description: 'Lastik basınç izleme sistemi',
    protocol: 'UDS',
  },
  {
    id: 'headlight',
    name: 'Far Kontrol (AFLS)',
    canId: '7EE',
    respId: '7F6',
    description: 'Adaptif far ve aydınlatma sistemi',
    protocol: 'UDS',
  },
];

const VAG_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Yazılım Numarası',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220011',
    name: 'ECU Donanım Numarası',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220012',
    name: 'ECU Kodlama (Coding)',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '22001A',
    name: 'ECU Üretici Bilgisi',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220080',
    name: 'VAG Motor Tanıtımı',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Enjeksiyon Miktarı',
    unit: 'mg/st',
    formula: 'val / 10',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Enjeksiyon Zamanlaması',
    unit: '°KW',
    formula: 'val / 10 - 60',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Rail Basıncı (Gerçek)',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Rail Basıncı (Hedef)',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'Turbo Basıncı (Gerçek)',
    unit: 'mbar',
    formula: 'val * 10',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Turbo Basıncı (Hedef)',
    unit: 'mbar',
    formula: 'val * 10',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220106',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220107',
    name: 'EGR Sıcaklık',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220108',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220109',
    name: 'Kıvılcım Ateşleme Avansı',
    unit: '°',
    formula: 'val * 0.1 - 60',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010A',
    name: 'Lambda O2 Sensör Değeri',
    unit: '-',
    formula: 'val / 1000',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010B',
    name: 'Katalitik Konvertör Sıcaklık',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010C',
    name: 'Partikül Filtre Kurum Miktarı',
    unit: 'g',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010D',
    name: 'Partikül Filtre Kül Miktarı',
    unit: 'g',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010E',
    name: 'Partikül Filtre Fark Basıncı',
    unit: 'mbar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010F',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220110',
    name: 'Yağ Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220111',
    name: 'Yakıt Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220112',
    name: 'Soğutma Suyu Sıcaklığı (Çıkış)',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220113',
    name: 'Hava Kütle Debisi',
    unit: 'g/s',
    formula: 'val * 0.01',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220114',
    name: 'Emme Havası Sıcaklığı (MAP)',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220115',
    name: 'Dış Hava Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220116',
    name: 'Akü Şarj Durumu (SOC)',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220117',
    name: 'MIL Uyarı Sayısı',
    unit: 'adet',
    formula: 'val',
    bytes: 1,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Vites Oranı',
    unit: '-',
    formula: 'val / 1000',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220201',
    name: 'Tork Dönüştürücü Kayması',
    unit: 'RPM',
    formula: 'val',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220202',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'ABS Sensör 1 Hız',
    unit: 'km/h',
    formula: 'val * 0.01',
    bytes: 2,
    header: '7E2',
  },
  {
    pid: '220301',
    name: 'ESP Fren Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E2',
  },
  {
    pid: '220302',
    name: 'Direksiyon Açısı',
    unit: '°',
    formula: 'val * 0.1 - 360',
    bytes: 2,
    header: '7E2',
  },
];

const BMW_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Tanımlama (HW/SW)',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220011',
    name: 'ECU Donanım Numarası',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220012',
    name: 'ECU Yazılım Numarası',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku (Gerçek)',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Motor Torku (Hedef)',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Turbo Basıncı (Gerçek)',
    unit: 'hPa',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'Turbo Basıncı (Hedef)',
    unit: 'hPa',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Lambda O2 (Banka 1)',
    unit: '-',
    formula: 'val / 1000',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220106',
    name: 'Lambda O2 (Banka 2)',
    unit: '-',
    formula: 'val / 1000',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220107',
    name: 'Enjeksiyon Miktarı',
    unit: 'mg/st',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220108',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220109',
    name: 'Yağ Basıncı',
    unit: 'kPa',
    formula: 'val * 10',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010A',
    name: 'VANOS Giriş Zamanlaması',
    unit: '°KW',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010B',
    name: 'VANOS Egzoz Zamanlaması',
    unit: '°KW',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010C',
    name: 'Valf Kaldırma (Valvetronic)',
    unit: 'mm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010D',
    name: 'EGR Vanası Açıklığı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010E',
    name: 'Akü Gerilimi',
    unit: 'V',
    formula: 'val / 100',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '22010F',
    name: 'Yakıt Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220201',
    name: 'Tork Dönüştürücü Kilidi',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'ABS Fren Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E2',
  },
  {
    pid: '220301',
    name: 'Direksiyon Açı Sensörü',
    unit: '°',
    formula: 'val * 0.1 - 720',
    bytes: 2,
    header: '7E2',
  },
];

const MERCEDES_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Yazılım Sürümü',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Turbo Basıncı',
    unit: 'mbar',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Rail Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'Enjeksiyon Miktarı',
    unit: 'mg/st',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Lambda O2',
    unit: '-',
    formula: 'val / 1000',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220106',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220107',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220108',
    name: 'Partikül Filtre Doluluk',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'ABS Sensör Hızları',
    unit: 'km/h',
    formula: 'val * 0.01',
    bytes: 4,
    header: '7E2',
  },
  {
    pid: '220400',
    name: 'Airmatic Süspansiyon Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7EA',
  },
  {
    pid: '220401',
    name: 'Airmatic Yükseklik',
    unit: 'mm',
    formula: 'val',
    bytes: 2,
    header: '7EA',
  },
];

const FORD_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Parça Numarası',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Gaz Kelebeği Pozisyonu',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Turbo Basıncı',
    unit: 'kPa',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Fuel Rail Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220106',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220107',
    name: 'Tork Dönüştürücü Kayması',
    unit: 'RPM',
    formula: 'val',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220200',
    name: 'ABS Fren Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E2',
  },
  {
    pid: '220201',
    name: 'Direksiyon Açısı',
    unit: '°',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E2',
  },
];

const TOYOTA_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Kalibrasyon ID',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Emme Havası Miktarı',
    unit: 'g/s',
    formula: 'val * 0.01',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'VVT Giriş Avansı',
    unit: '°KW',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'VVT Egzoz Avansı',
    unit: '°KW',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220106',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220107',
    name: 'Hibrit Batarya SOC',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E6',
  },
  {
    pid: '220108',
    name: 'Hibrit Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E6',
  },
  {
    pid: '220109',
    name: 'Hibrit Batarya Sıcaklık',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E6',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'ABS Çark Hızı',
    unit: 'km/h',
    formula: 'val * 0.01',
    bytes: 2,
    header: '7E2',
  },
];

const HYUNDAI_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Yazılım Sürümü',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku (Gerçek)',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Motor Torku (Hedef)',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Turbo Basıncı',
    unit: 'kPa',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'CVVT Giriş Açısı',
    unit: '°',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'CVVT Egzoz Açısı',
    unit: '°',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220106',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220107',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220108',
    name: 'Yakıt Debisi',
    unit: 'L/h',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'Direksiyon Açısı',
    unit: '°',
    formula: 'val * 0.1 - 360',
    bytes: 2,
    header: '7E2',
  },
];

const RENAULT_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Tanımlama',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Turbo Basıncı',
    unit: 'mbar',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Rail Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'Partikül Filtre Doluluk',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
];

const OPEL_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Parça Numarası',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Turbo Basıncı',
    unit: 'mbar',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Rail Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'ABS Direksiyon Açısı',
    unit: '°',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E2',
  },
];

const PEUGEOT_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Kalibrasyon ID',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Turbo Basıncı',
    unit: 'mbar',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Rail Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Partikül Filtre Doluluk',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220106',
    name: 'AdBlue Seviyesi',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220107',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'ABS Çark Hızı',
    unit: 'km/h',
    formula: 'val * 0.01',
    bytes: 2,
    header: '7E2',
  },
];

const FIAT_PIDS: ExtendedPID[] = [
  {
    pid: '220010',
    name: 'ECU Yazılım Sürümü',
    unit: '-',
    formula: 'hex',
    bytes: 16,
    header: '7E0',
  },
  {
    pid: '220100',
    name: 'Motor Torku',
    unit: 'Nm',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220101',
    name: 'Gaz Kelebeği Açısı',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220102',
    name: 'Turbo Basıncı',
    unit: 'mbar',
    formula: 'val',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220103',
    name: 'Rail Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220104',
    name: 'EGR Açıklık',
    unit: '%',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220105',
    name: 'Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E0',
  },
  {
    pid: '220200',
    name: 'Şanzıman Yağ Sıcaklığı',
    unit: '°C',
    formula: 'val - 40',
    bytes: 2,
    header: '7E1',
  },
  {
    pid: '220300',
    name: 'ABS Fren Basıncı',
    unit: 'bar',
    formula: 'val * 0.1',
    bytes: 2,
    header: '7E2',
  },
];

const PROTOCOLS: ManufacturerProtocol[] = [
  {
    manufacturer: 'vag',
    name: 'VAG (VW/Audi/Seat/Skoda)',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN (Driver CAN)',
    modules: [
      ...STANDARD_MODULES,
      {
        id: 'parking',
        name: 'Park Sensörü (PDC)',
        canId: '7EF',
        respId: '7F7',
        description: 'Park mesafe kontrol ünitesi',
        protocol: 'UDS',
      },
      {
        id: 'camera',
        name: 'Kamera Sistemi',
        canId: '7F0',
        respId: '7F8',
        description: 'Geri görüş kamerası',
        protocol: 'UDS',
      },
      {
        id: 'sound',
        name: 'Ses Sistemi',
        canId: '7F1',
        respId: '7F9',
        description: 'Amfi ve ses kontrolü',
        protocol: 'UDS',
      },
    ],
    sessions: STANDARD_SESSIONS,
    pids: VAG_PIDS,
  },
  {
    manufacturer: 'bmw',
    name: 'BMW / Mini',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'PT-CAN + F-CAN',
    modules: [
      ...STANDARD_MODULES,
      {
        id: 'dsc',
        name: 'DSC (Dinamik Stabilite)',
        canId: '7F0',
        respId: '7F8',
        description: 'Dinamik stabilite kontrolü',
        protocol: 'UDS',
      },
      {
        id: 'ehps',
        name: 'EPS (Direksiyon)',
        canId: '7F1',
        respId: '7F9',
        description: 'Elektrikli hidrolik direksiyon',
        protocol: 'UDS',
      },
      {
        id: 'ihka',
        name: 'IHKA (Klima)',
        canId: '7F2',
        respId: '7FA',
        description: 'Isıtma/klima kontrolü',
        protocol: 'UDS',
      },
      {
        id: 'cas',
        name: 'CAS (Giriş Sistemi)',
        canId: '7F3',
        respId: '7FB',
        description: 'Konfor giriş ve çalıştırma',
        protocol: 'UDS',
      },
    ],
    sessions: STANDARD_SESSIONS,
    pids: BMW_PIDS,
  },
  {
    manufacturer: 'mercedes',
    name: 'Mercedes-Benz',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'CAN-C (Engine CAN) + CAN-B (Comfort)',
    modules: [
      ...STANDARD_MODULES,
      {
        id: 'esp',
        name: 'ESP (Stabilite)',
        canId: '7F0',
        respId: '7F8',
        description: 'Elektronik stabilite programı',
        protocol: 'UDS',
      },
      {
        id: 'airmatic',
        name: 'AIRMATIC (Süspansiyon)',
        canId: '7F1',
        respId: '7F9',
        description: 'Havalı süspansiyon kontrolü',
        protocol: 'UDS',
      },
      {
        id: 'command',
        name: 'COMAND (Multimedya)',
        canId: '7F2',
        respId: '7FA',
        description: 'Navigasyon ve eğlence sistemi',
        protocol: 'UDS',
      },
      {
        id: 'psm',
        name: 'PSM (Güç Modülü)',
        canId: '7F3',
        respId: '7FB',
        description: 'Elektrik güç yönetimi',
        protocol: 'UDS',
      },
    ],
    sessions: STANDARD_SESSIONS,
    pids: MERCEDES_PIDS,
  },
  {
    manufacturer: 'ford',
    name: 'Ford',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN + MS-CAN',
    modules: [
      ...STANDARD_MODULES,
      {
        id: 'pam',
        name: 'Park Yardım Modülü',
        canId: '7F0',
        respId: '7F8',
        description: 'Park sensörü ve geri görüş',
        protocol: 'UDS',
      },
      {
        id: 'gps',
        name: 'GPS / Navigasyon',
        canId: '7F1',
        respId: '7F9',
        description: 'Navigasyon modülü',
        protocol: 'UDS',
      },
    ],
    sessions: STANDARD_SESSIONS,
    pids: FORD_PIDS,
  },
  {
    manufacturer: 'toyota',
    name: 'Toyota / Lexus',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN',
    modules: [
      ...STANDARD_MODULES,
      {
        id: 'hv',
        name: 'Hibrit Kontrol (HV ECU)',
        canId: '7F0',
        respId: '7F8',
        description: 'Hibrit motor ve batarya yönetimi',
        protocol: 'UDS',
      },
      {
        id: 'eps',
        name: 'EPS (Direksiyon)',
        canId: '7F1',
        respId: '7F9',
        description: 'Elektrikli direksiyon',
        protocol: 'UDS',
      },
    ],
    sessions: STANDARD_SESSIONS,
    pids: TOYOTA_PIDS,
  },
  {
    manufacturer: 'hyundai',
    name: 'Hyundai / Kia',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN',
    modules: [
      ...STANDARD_MODULES,
      {
        id: 'smart',
        name: 'Akıllı Park (SPAS)',
        canId: '7F0',
        respId: '7F8',
        description: 'Akıllı park yardım sistemi',
        protocol: 'UDS',
      },
    ],
    sessions: STANDARD_SESSIONS,
    pids: HYUNDAI_PIDS,
  },
  {
    manufacturer: 'renault',
    name: 'Renault / Dacia',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN',
    modules: [...STANDARD_MODULES],
    sessions: STANDARD_SESSIONS,
    pids: RENAULT_PIDS,
  },
  {
    manufacturer: 'opel',
    name: 'Opel / Vauxhall',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN + MS-CAN',
    modules: [...STANDARD_MODULES],
    sessions: STANDARD_SESSIONS,
    pids: OPEL_PIDS,
  },
  {
    manufacturer: 'peugeot',
    name: 'Peugeot / Citroen / DS',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN + Comfort CAN',
    modules: [...STANDARD_MODULES],
    sessions: STANDARD_SESSIONS,
    pids: PEUGEOT_PIDS,
  },
  {
    manufacturer: 'fiat',
    name: 'Fiat / Alfa / Lancia / Abarth',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'CAN-C',
    modules: [...STANDARD_MODULES],
    sessions: STANDARD_SESSIONS,
    pids: FIAT_PIDS,
  },
  {
    manufacturer: 'universal',
    name: 'Evrensel OBD2',
    protocol: 'ISO 15765-4 CAN (11 bit, 500k)',
    canBusType: 'HS-CAN',
    modules: STANDARD_MODULES.filter(
      m =>
        m.id === 'engine' ||
        m.id === 'transmission' ||
        m.id === 'abs' ||
        m.id === 'airbag',
    ),
    sessions: STANDARD_SESSIONS,
    pids: [],
  },
];

export function getProtocol(manufacturer: Manufacturer): ManufacturerProtocol {
  return (
    PROTOCOLS.find(p => p.manufacturer === manufacturer) ||
    PROTOCOLS[PROTOCOLS.length - 1]
  );
}

export function getModuleById(
  manufacturer: Manufacturer,
  moduleId: string,
): CANModule | undefined {
  return getProtocol(manufacturer).modules.find(m => m.id === moduleId);
}

export function getPIDsForManufacturer(
  manufacturer: Manufacturer,
): ExtendedPID[] {
  return getProtocol(manufacturer).pids;
}

export function getPIDsForModule(
  manufacturer: Manufacturer,
  header: string,
): ExtendedPID[] {
  return getProtocol(manufacturer).pids.filter(p => p.header === header);
}

export function parsePIDResponse(pid: ExtendedPID, response: string): string {
  const clean = response.replace(/[\s>]/g, '');
  const pidHex = pid.pid.substring(0, 4);
  const idx = clean.indexOf(pidHex);
  if (idx < 0) {
    return '(yanıt alınamadı)';
  }
  const dataStart = idx + pidHex.length;
  if (dataStart + pid.bytes * 2 > clean.length) {
    return '(eksik veri)';
  }
  const rawHex = clean.substring(dataStart, dataStart + pid.bytes * 2);
  if (pid.formula === 'hex') {
    return rawHex;
  }
  const values: number[] = [];
  for (let i = 0; i < rawHex.length; i += 2) {
    const v = parseInt(rawHex.substring(i, i + 2), 16);
    if (isNaN(v)) {
      return '(geçersiz)';
    }
    values.push(v);
  }
  let val = 0;
  if (pid.formula.startsWith('val')) {
    if (values.length <= 2) {
      val = (values[0] || 0) * 256 + (values[1] || 0);
    } else {
      val = values.reduce((a, b) => a * 256 + b, 0);
    }
  }
  try {
    const result = new Function('val', `return ${pid.formula};`)(val);
    return typeof result === 'number' ? result.toFixed(1) : String(result);
  } catch {
    return '(formül hatası)';
  }
}

export {PROTOCOLS};
