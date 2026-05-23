# Sürüm Notları (Changelog)

## v3.4.1 (Güncel Sürüm)
* **Hata Düzeltmesi**: Araçlarım menüsünde kendi belirlediğiniz araç isminin (Örn: "Benim Arabam") yerine markanın (Örn: "Ford") gösterilme sorunu giderildi. Artık kendi koyduğunuz isim kocaman puntolarla en tepede yazacak. Altında ise Marka/Model/Yıl detayları görünecek.

## v3.4.0 (Güncel Sürüm)
* **Ultimate Gizli Özellik Paketi (All-in-One)**: Piyasada yer alan dev uygulamaların (BimmerCode, Carista, AlfaOBD vs.) paralı olarak sunduğu marka spesifik gizli özellikler sisteme eklendi.
* **Neler Eklendi?**: BMW için M Performance logosu, Angel parlaklığı ve emniyet kemeri susturma; Toyota için tek dokunuşla 5'li sinyal ve geri vites bip iptali; FCA (Jeep/Fiat) için Proxi hizalama ve SRT menüsü; PSA (Peugeot) için GT Line teması tek tuşla aktifleştirilebilir duruma getirildi.

## v3.3.0 (Güncel Sürüm)
* **Gizli Özellik Mega Paketi**: Volkswagen, Audi, Seat, Skoda, Ford, Renault ve Dacia araçları için en çok talep edilen gizli özellik kodlamaları (UDS ve CAN Payload) sisteme eklendi.
* **Yeni Özellikler Neler?**: Kadran Selamlama (Needle Sweep), Amerikan Park, Korna ile Kilit Onayı, Video in Motion, Otomatik Kapı Kilitleme, Eko Mod Menüsü, Start-Stop İptali ve R-Link CarPlay aktivasyonu gibi profesyonel kodlamaları artık tek tuşla yapabilirsiniz.

## v3.2.0 (Güncel Sürüm)
* **Mega Sensör Paketi**: Piyasada standart SAE J1979 protokolü ile desteklenen **30'dan fazla yeni sensör** uygulamaya gömüldü. Artık araç destekliyorsa Yakıt Basıncı, Motor Yağı Sıcaklığı, Tork Verileri (Referans ve Güncel), Anlık Yakıt Tüketimi (L/h), Katalizör Sıcaklığı gibi profesyonel verileri canlı olarak görebileceksiniz.
* **Genel Uyumluluk Paketi**: Kullanıcı talebi üzerine, ucuz ELM327 klon cihazlarındaki kronik hatalar ve kitlenmeleri önlemek amacıyla agresif bir arka plan filtreleyici (Compatibility Module) geliştirildi. Cihaz kopmaları minimuma indirildi.

## v3.1.30 (Güncel Sürüm)
* **Özel Gösterge Eklentisi**: Artık sabitlediğiniz (favoriye aldığınız) tüm sensörler, büyük gösterge (PANEL/HUD) modunun altında kocaman rakamlarla listeleniyor. Böylece size özel bir HUD ekranı yaratabilirsiniz.

## v3.1.29 (Güncel Sürüm)
* **HUD ve PANEL Seçeneği**: Sağ üste eklenen "PANEL" tuşu ile Cyberpunk gösterge tablosunu ekranı ters çevirmeden (düz haliyle) açabilirsiniz. "HUD" tuşu ise cama yansıtmak için ekranı ters çevirmeye devam eder.
* **Sensör Engeli Kaldırıldı**: Uygulamanın ucuz klon cihazlarda kendini kilit altına alıp sadece 6 temel sensörü okuması (diğer sensörleri yoksayması) sorunu giderildi. Araç ne destekliyorsa anında ekranda!

## v3.1.28 (Güncel Sürüm)
* **HUD Düzeltmesi**: Ekranın yarısını kaplayan büyük gösterge paneli artık standart görünümde kapalı. Sadece sağ üstteki "HUD" tuşuna basınca (Cama yansıtma modu) açılıyor.
* **Klon Cihaz Uyumluluğu 2.0**: Ucuz klon cihazların ilk tarama (0100 sorgusu) aşamasında çökmesi veya sessiz kalması durumunda tüm verilerin ekrandan kaybolması (beyaz sayfa) sorunu tamamen çözüldü. Sistem akıllıca varsayılan sensörlere geri dönüyor.

## v3.1.26 (Güncel Sürüm)
* **Arayüz Düzeltmesi**: Canlı Veri ekranında "Liste" görünümüne geçildiğinde sayfanın aşağıya kaydırılamaması (ve en alttaki sensörlerin gizli kalması) sorunu çözüldü. Artık tüm listeyi kesintisiz kaydırabilirsiniz.

## v3.1.25 (Güncel Sürüm)
* **Geliştirilmiş Klon Düzeltmesi**: Uygulama artık önce aracın hangi sensörleri desteklediğini tarar ve sadece desteklenenleri okur. Bu sayede ucuz ELM327 klonları kilitlenmez ve çok daha fazla sensör okunur.
* **Yakıt Tüketimi (L/100km)**: Araç doğrudan yakıt verisi vermese bile MAF/MAP sensörleri üzerinden İdeal Gaz Yasası kullanılarak anlık yakıt tüketimi hesaplanır.
* **Performans Artışı**: Desteklenmeyen sensörlere gereksiz soru sorulmadığı için ekran yenileme hızı ve kararlılığı artırıldı.

## v3.1.241 (Güncel Sürüm)
* **Tam Ekran Sıfırlama**: Veri akışı kesildiğinde (veya kontak kapatıldığında) ekrandaki göstergelerin ve sıcaklıkların donup kalması sorunu çözüldü; artık bağlantı kopsa bile 3 saniye içinde tüm veriler anında sıfırlanıyor.
* **Arka Plan ve Widget Düzeltmesi**: Android 14 ve üzeri (Android 15-16) yeni nesil cihazlarda, uygulama arka plana atıldığında sistemin veri akışını kesmesi sorunu (ve Widget'ın donması) giderildi. Yeni "Veri Senkronizasyonu" arka plan servisi eklendi.

## v3.1.19
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
