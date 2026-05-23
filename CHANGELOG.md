# Sürüm Notları (Changelog)

## v3.1.19 (Güncel Sürüm)
* **Karakter Kodlaması Düzeltmesi**: Bildirim çubuğunda (uyarılar ve bildirimler) görünen Türkçe karakterlerin (ı, ş, ğ vb.) bozuk gözükmesine sebep olan yazılımsal kodlama hatası (encoding) giderildi. Artık bildirimler düzgün ve okunaklı çıkacak.

## v3.1.18
* **Navigasyon Çubuğu (Navigation Bar) Uyumu**: Yeni nesil (Android 10+) cihazlar için navigasyon çubuğu artık uygulamanın Açık/Karanlık temasına göre dinamik olarak renk değiştiriyor (Edge-to-Edge hissiyatı).
* **OTA (Uygulama İçi Güncelleme) Düzeltmesi**: İndirilen güncellemelerin "Paket ayrıştırma hatası" vermesi sorunu, Android sisteminin yerleşik DownloadManager API'sine geçilerek tamamen çözüldü.
* **Ana Ekran Performansı**: Göstergeler alt bileşenlere (Gauges, FeaturesGrid) bölündü; saniyede 10 kez gelen OBD verisi artık tüm ekranı dondurmadan sadece ilgili sayıları güncelliyor.

## v3.1.7
* **Performans İyileştirmesi (Hızlı Okuma Yaması)**: ELM327 çipiyle iletişim kurarken gönderilen okuma komutları arası bekleme süreleri (FAST_WRITE_DELAY) 5ms'ye ve döngü okuma süresi (FAST_POLL_INTERVAL) 15ms'ye düşürüldü. Canlı veriler artık çok daha hızlı ve akıcı şekilde ekrana yansıyacak.
* **Tema Düzeltmeleri**: Ayarlar ve Araç Bilgisi sayfalarındaki açık/karanlık mod geçişlerinde yazıların görünmez olma veya renklerin uyumsuz olma sorunları giderildi. 
* **UI İyileştirmeleri**: Araç Bilgisi ekranındaki Emisyon Testi tablosundaki taşmalar düzeltildi.
* **Arka Plan Stabilizasyonu**: Veri kesilince veya araçtan veri gelmediğinde (3 saniye gecikme) RPM ve Hız gibi göstergelerin otomatik olarak sıfırlanması sağlandı.

## v3.1.6
* **Arka Plan Servisleri (Foreground Service)**: Uygulama arka plana alındığında veya ekran kapatıldığında OBD2 iletişiminin kopmaması için Android Foreground Service eklendi.
* **Build Sistemi**: Yeni sürümlerin derlenip Github'a otomatik atılması için Powershell Script sistemi eklendi.
