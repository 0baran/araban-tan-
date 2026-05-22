export type VersionEntry = {
  version: string;
  date: string;
  items: string[];
};

export const CHANGELOG: VersionEntry[] = [
  {
    version: '2.9.28',
    date: '22 Mayıs 2026',
    items: [
      'HUD (Ayna) Modu: Gece sürüşlerinde verileri ön cama yansıtmak için Canlı Veri ekranına HUD modu eklendi.',
      'Akıllı Sesli Uyarı: Motor sıcaklığı (105°C), Akü voltajı (11.5V) ve Hız limiti (120km/h) aşıldığında telefon artık Türkçe konuşarak uyarıyor.',
      'Yapay Zeka Arıza Asistanı: Sık karşılaşılan hata kodlarına tıklandığında olası sebepleri ve tamirci tavsiyelerini gösteren akıllı asistan eklendi.'
    ],
  },
  {
    version: '2.9.26',
    date: '22 Mayıs 2026',
    items: [
      'Akıllı Filtreleme: Canlı veri ekranında artık sadece aracınızın beyninin desteklediği (okunabilen) veriler gösteriliyor. Boş sensörler gizleniyor.',
      'Ekstra PID Eklentisi: Google taraması sonucu daha nadir 5 sensör daha sisteme eklendi.',
      'Yeni Eklenenler: Yakıt Hattı Gösterge Basıncı, Enjeksiyon Zamanlaması, Motor Sürtünme Torku, Yüksek Çözünürlüklü Mesafe ve Gaz Kelebeği Pozisyonu G.'
    ],
  },
  {
    version: '2.9.25',
    date: '22 Mayıs 2026',
    items: [
      'Gelişmiş Sensör Eklentisi: Toplam 7 yeni gelişmiş PID eklendi.',
      'Yeni Okunan Değerler: Araç Kilometresi (Odometer), Hibrit Batarya Ömrü, DPF Fark Basıncı, DPF Sıcaklığı, Egzoz Basıncı, Turbo Devri (RPM) ve Intercooler Sıcaklığı.'
    ],
  },
  {
    version: '2.9.24',
    date: '22 Mayıs 2026',
    items: [
      'Gelişmiş Sensör Okuması: Akü voltajı ölçümü için araç motor beyni yerine direkt olarak OBD2 adaptörünün kendi pin voltajı okuma komutu (AT RV) eklendi. Artık eski veya yeni fark etmeksizin tüm araçlarda Akü Voltajı 100% kesinlikle çalışacak.'
    ],
  },
  {
    version: '2.9.23',
    date: '22 Mayıs 2026',
    items: [
      'Donanım Optimizasyonu: ELM327 adaptör çipine doğrudan AT komutları gönderilerek (ATS0, ATAT1, ATST32) çipin kendi yanıt süresi ve Bluetooth veri aktarım hızı donanımsal olarak maksimuma çıkarıldı.'
    ],
  },
  {
    version: '2.9.22',
    date: '22 Mayıs 2026',
    items: [
      'Performans Optimizasyonu: Veri okuma hızı (Polling) inanılmaz derecede artırıldı! Rölanti ve bekleme süreleri kısıtlamaları kaldırılarak 300ms olan döngü gecikmesi 25ms seviyesine düşürüldü.'
    ],
  },
  {
    version: '2.9.21',
    date: '22 Mayıs 2026',
    items: [
      'Bağlantı Optimizasyonu: Bluetooth timeout hataları nedeniyle uygulamanın askıda kalması çözüldü.',
      'Veri Çözümleme Hatası: Araca bağlandıktan sonra verilerin ekrana yansımama sorunu (ELM327 boşluk karakterleri sorunu) tamamen giderildi.'
    ],
  },
  {
    version: '2.9.20',
    date: '22 Mayıs 2026',
    items: [
      'Kritik Hata Çözümü: Önceki sürümde oluşan Bluetooth ile bağlanamama ve ELM327 başlatılamama sorunu (bağlantı bayrağı sırası) düzeltildi.'
    ],
  },
  {
    version: '2.9.18',
    date: '22 Mayıs 2026',
    items: [
      'Protokol taraması ve bağlantı hızlandırıldı (~%50 daha hızlı).',
      "PID range sorgulama zincirleme: sadece desteklenen range'ler taranır.",
      'readPidRanges() ile kod tekrarı azaltıldı, bakım kolaylaştı.',
    ],
  },
  {
    version: '2.9.17',
    date: '22 Mayıs 2026',
    items: [
      'Veri okuma sorunu kök neden çözüldü: ELM327 echo (ATE0) sorunu.',
      'sendCommand/sendCommandFast yanıt temizleme: 41XX prefix bulunup echo atılır.',
      'Tüm sensörler (RPM, Speed, MAF, MAP, sıcaklık, vs.) artık güvenilir okunur.',
      'Klon ELM327 adaptörlerle tam uyumluluk.'
    ],
  },
  {
    version: '2.9.16',
    date: '22 Mayıs 2026',
    items: [
      'PID tespit aralığı genişletildi: 60, 80, A0 desteği eklendi — daha fazla sensör okunur.',
      'Araç kaydetme hatası düzeltildi: hata yönetimi eklendi, yeniden dene mekanizması.',
      'Veri okuma hızlandırıldı: polling aralığı 400ms → 300ms, FAST_INTERVAL 40ms → 25ms.',
      'Genel kararlılık iyileştirmeleri.'
    ],
  },
  {
    version: '2.9.15',
    date: '22 Mayıs 2026',
    items: [
      'Trip Özeti eklendi: mesafe, yakıt, ortalama tüketim, hız, maks. hız, yakıt maliyeti (TL).',
      'Trip verileri bağlantı anından itibaren otomatik kaydedilir.',
      'Ana sayfaya Trip Özeti butonu eklendi.'
    ],
  },
  {
    version: '2.9.14',
    date: '22 Mayıs 2026',
    items: [
      'Tip güvenliği iyileştirmeleri: Tüm TypeScript hataları giderildi.',
      'Bluetooth veri okuma iyileştirmesi: readAll() while döngüsü ile daha kararlı.',
      'Güncelleme bildirimi: notifee API düzeltildi, background event desteği eklendi.',
      'Genel kararlılık ve hata düzeltmeleri.'
    ],
  },
  {
    version: '2.9.13',
    date: '22 Mayıs 2026',
    items: [
      'Güncelleme kontrolü Hermes uyumlu hale getirildi (atob hatası giderildi).'
    ],
  },
  {
    version: '2.9.12',
    date: '22 Mayıs 2026',
    items: [
      'Güncelleme bildirimi eklendi: yeni sürüm geldiğinde sistem notification gönderir.',
      'Veri okuma sorunları giderildi: CAN çok parçalı yanıt desteği eklendi (modern araçlar artık veri gönderiyor).',
      'ELM327 zaman aşımı iyileştirildi (ATST32→ATST64) ve adaptif zamanlama kapatıldı (ATAT1→ATAT0).',
      'Rölantide sensör donması düzeltildi: extended sensörler periyodik okunmaya devam ediyor.',
      'Güncelleme kontrolü GitHub API üzerinden yapılıyor (cache sorunu giderildi).'
    ],
  },
  {
    version: '2.9.11',
    date: '22 Mayıs 2026',
    items: [
      'Veri okuma sorunları giderildi: CAN çok parçalı yanıt desteği eklendi (modern araçlar artık veri gönderiyor).',
      'ELM327 zaman aşımı iyileştirildi (ATST32→ATST64) ve adaptif zamanlama kapatıldı (ATAT1→ATAT0).',
      'Rölantide sensör donması düzeltildi: extended sensörler periyodik okunmaya devam ediyor.',
      'Güncelleme bildirimi eklendi: yeni sürüm geldiğinde sistem notification gönderir.'
    ],
  },
  {
    version: '2.9.10',
    date: '21 Mayıs 2026',
    items: [
      'Performans Güncellemesi: Ekrana veri basma frekansı (UI Throttling) optimize edildi. Kasma/donma sorunları çözülerek mükemmel akıcı bir deneyim sağlandı.',
      'Uygulamanın motor resmi (App Icon) yapay zeka ile kırpılarak sınırlarına kadar dev boyuta getirildi.'
    ],
  },
  {
    version: '2.9.9',
    date: '21 Mayıs 2026',
    items: [
      'Uygulama motor ikonu tasarımı büyütüldü ve Sürüm Notları (Changelog) sayfası güncellendi.',
      'Bağlantı ve OTA kararlılığı devam ediyor.'
    ],
  },
  {
    version: '2.9.8',
    date: '21 Mayıs 2026',
    items: [
      'Uygulama ikonu (motor resmi) daha büyük ve belirgin hale getirildi.',
      'Bağlantı ve OTA kararlılığı devam ediyor.'
    ],
  },
  {
    version: '2.9.7',
    date: '21 Mayıs 2026',
    items: [
      'Hata kodu (DTC) okuma algoritması iyileştirildi, tüm araç kodları sorunsuz okunuyor.',
      'Otomatik bağlantı izni sistemi eklendi.',
      'Kullanılmayan sensör sorguları tamamen iptal edilerek hız & RPM gecikmeleri ortadan kaldırıldı.'
    ],
  },
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
