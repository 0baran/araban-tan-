export type VersionEntry = {
  version: string;
  date: string;
  items: string[];
};

export const CHANGELOG: VersionEntry[] = [
  {
    version: '2.2.20260521.1224',
    date: '21 Mayıs 2026',
    items: [
      'Markaya ozel protokoller eklendi (VAG, BMW, Mercedes, Ford, Toyota, Hyundai, Renault, Opel, PSA, Fiat)',
      'Her marka icin CAN modul adresleri ve genisletilmis PID listeleri',
      'Guncelleme kontrolu duzeltildi: ekranda gorunur uyari, 8sn zaman asimi',
      "'01' komut hatası duzeltildi (0101 olmaliydi)",
    ],
  },
  {
    version: '2.2.20260521.1144',
    date: '21 Mayıs 2026',
    items: [
      'Sürüm çakışması düzeltildi (Gradle version.json okur)',
      'Logo: sarı motor ışığı (MIL) eklendi',
      'Otomatik veri kaydı (OBD2 bağlanınca kayıt başlasın)',
      'Kapsamlı DTC veritabanı (400+ kod, Türkçe açıklama)',
      'DTC kategorileri ve alt kategoriler (P/C/B/U)',
      'Gizli özellikler yenilendi: DPF izleme, boğaz kalibrasyonu, servis sıfırlama',
      'Ekstra sensör PID\'leri eklendi (short/long term fuel trim, fuel pressure)',
      'ErrorCodesScreen: kategori özet kartları, badge gösterimi',
      'SettingsScreen: Otomatik Kayıt aç/kapa',
      'build-and-push.ps1 otomatik scripti',
    ],
  },
  {
    version: '2.2.20260521.1121',
    date: '21 Mayıs 2026',
    items: [
      'Bluetooth bağlantı hatası düzeltildi (onDataReceived try-catch)',
      'Simülasyon recursive setTimeout ile yenilendi',
      'Güncelleme spam\'i düzeltildi (AsyncStorage ile 1 kere bildirim)',
      'Polling optimize edildi: kritik 3 sensör her döngü, genişletilmiş her 6 döngü',
      'Gauge daireler kaldırıldı, düz metin gösterim',
      'Saatlik versiyon formatı (2.2.YYYYMMDD.SSdd)',
      'Logo yenilendi (çift renkli gauge arkı + araç silueti)',
      'Gereksiz sensörler polling\'den çıkarıldı',
      'Hız ve hararet uyarı bannerları kaldırıldı',
    ],
  },
  {
    version: '2.2.20260521',
    date: '21 Mayıs 2026',
    items: [
      'Tüm ekranlara tema desteği (ana sayfa, canlı veri, performans)',
      'Tek ThemeProvider ile tema state kaybı düzeltildi',
      'sendCommand bağlantı kontrolü eklendi, hata baskılaması düzeltildi',
      'Bluetooth tarama izinleri tab geçişinde de istenir oldu',
      'Güncelleme kontrolü eklendi (Ayarlar)',
      'Hata log ekranı (📋 HATA LOG)',
      'Sürüm notları ekranı (📝 SÜRÜM NOTLARI)',
      'Veri Kaydı düzeltildi (onDataUpdate ezme sorunu çözüldü)',
      'Yakıt maliyeti TL bazında (canlı veri, performans, veri kaydı)',
      'getLastData() eklendi',
      'Sürüm build number ile arttı (2.2.yyyyMMdd.X)',
      'Ana ekran kartları, gauge, hızlı işlemler temaya duyarlı',
      'LiveDataScreen kategori filtreleri temaya duyarlı',
      'Modal (BT/WiFi/USB) tema renkleri',
      'gaugeBg tema rengi eklendi',
      'Ana sayfada DTC arıza rozeti (dtcCount > 0 ise kırmızı sayı)',
      'Bluetooth kapalıysa açma isteği + uyarı',
      'startDiscovery() ile keşif taraması + eşleşmiş cihaz yedeği',
      'ErrorCodesScreen: her kod başında ⚠️ simgesi',
      'Cihaz listesi önce cihazlar, sonra simülasyon',
      'openBluetoothSettings() eklendi',
    ],
  },
  {
    version: '2.2.20260520',
    date: '20 Mayıs 2026',
    items: [
      'Canlı veri grid/list görünüm toggle',
      'Protokol tarama (SP3-SPC) + manuel protokol seçimi',
      'Speed/coolant uyarı ayarları (eşik + aç/kapa)',
      'Sabitlenen sensörler (tap-to-pin)',
      '10 yeni PID eklendi (runTime, oilTemp, fuelRate, vb.)',
      '44 OBD2 PID toplam',
      'UDS gizli özellikler 11 marka + universal + custom komut',
      'USB transport (CP210x/CH340/FTDI)',
      'Donanım geri butonu anasayfaya döner',
    ],
  },
  {
    version: '2.2.20260519',
    date: '19 Mayıs 2026',
    items: [
      'İlk sürüm: OBD2 bağlantı (BT/WiFi/Simülasyon)',
      'Canlı veri göstergeleri',
      'DTC okuma + Google arama',
      'Performans ölçer (0-100 km/h + HP)',
      'Araç bilgisi (VIN, Monitör durumu)',
      'Freeze frame',
      'VAG grup gizli özellikler',
    ],
  },
];
