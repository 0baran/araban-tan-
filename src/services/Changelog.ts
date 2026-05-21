export type VersionEntry = {
  version: string;
  date: string;
  items: string[];
};

export const CHANGELOG: VersionEntry[] = [
  {
    version: '2.5.0',
    date: '21 Mayıs 2026',
    items: [
      'Tüm ekran boyutları (çentikli, kavisli vs.) için SafeArea tam uyumluluğu.',
      'WiFi OBD2 (V-Gate vb.) cihazlarına bağlanamama sorunu giderildi (tcp-socket eklentisi).',
      'Uygulama temel mimarisi %100 Saf (Bare) React Native seviyesine çekilerek optimize edildi.',
      'Yeni ve hızlı cihaz tarama algoritması eklendi.'
    ],
  },
  {
    version: '2.3.20260521.1300',
    date: '21 Mayıs 2026',
    items: [
      'Gelişmiş protokol desteği: buffer temizleme, yeniden deneme, hızlı tarama',
      '16 eksik sensör polling döngüsüne eklendi (mutlak yük, etanol, O2 B1S2, trim B2)',
      '8 yeni sensör: EGR komutu/hatası, Evap purje, Lambda B1S1/B1S2, EGR oranı',
      'LiveData ekranına 8 yeni sensör eklendi',
      'Pil tasarrufu: arka planda polling durduruluyor',
      'Logo yeniden tasarlandı (konturlu, canlı sarı)',
    ],
  },
  {
    version: '2.2.20260521.1237',
    date: '21 Mayıs 2026',
    items: [
      '4 yeni sensör: mutlak yakıt basıncı, egzoz sıcaklığı, evap basıncı, rel. gaz pedalı',
      'Otomatik DTC kontrolü (30sn aralıklarla)',
      'Başlık "ARAÇLARIM" olarak değiştirildi',
      'Tüm ekranlar tema desteğine kavuştu',
      'Logo yeniden tasarlandı (sade sarı motor ışığı)',
    ],
  },
  {
    version: '2.2.20260521.1236',
    date: '21 Mayıs 2026',
    items: [
      'Araclarim eklendi (kayitli araclari listele/ekle/sil)',
      'USB veri dinleyicisi eklendi (USB baglanti calisir)',
      'Freeze frame DTC duzeltildi (42 prefix)',
      'Protokol taramada poll durdurma (command karismasi onlendi)',
      'Baglanti adres kontrolu (undefined adres korumasi)',
      'DataLogService cift intakeTemp kaldirildi',
      'HiddenFeature unknown tipi eklendi',
    ],
  },
  {
    version: '2.2.20260521.1235',
    date: '21 Mayıs 2026',
    items: [
      'Baglanti duzeltildi: _isConnected init oncesi true, sendCommand calisir',
      'Logo: sadece sari motor isigi (MIL) ikonu (yeniden tasarlandi)',
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
