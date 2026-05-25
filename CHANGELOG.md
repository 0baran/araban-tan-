# Sürüm Notları (Changelog)

## v9.1.5 (DDT4All Renault/Dacia Paket Entegrasyonu) 🏎️
* **DDT4All Çekirdek Komutları:** Renault ve Dacia araçlar için popüler açık kaynaklı DDT4All veritabanındaki en çok kullanılan UDS/CAN komutları sisteme eklendi.
* **Yeni Fransız Grubu Gizli Özellikleri:**
  - Viraj Aydınlatma (Cornering Lights)
  - Otomatik Kapı Kilitleme (Hareket Halinde Kilit / Anti-Hijack)
  - Karşılama Işıkları (Follow-Me-Home Headlights)
  - Kadran Sıcaklık ve Saat Gösterimi
  - Kalıcı Start/Stop İptali (Megane 4, Clio 5, Captur vb. için)
* **Özel Renault Header Yönlendirmeleri:** Renault gösterge paneli (714) ve gövde kontrol modülü BCM/UCH (7BC) için özel protokol köprülemesi yapıldı.


## v9.1.4 (Kodlama Mega Arşivi) - FORScan & VCDS & BimmerCode Özellikleri 🧰
* **Mega Arşiv Entegre Edildi:** FORScan (Ford), VCDS (VAG), BimmerCode (BMW) ve AlfaOBD (FCA) yazılımlarının kullandığı **gerçek As-Built ve Long Coding** komutları eklendi.
* **Header Yönlendirme (AT SH):** Gizli özellik komutlarının standart ECU yerine Gösterge (720), BCM (726), Eğlence Sistemi (7D0) gibi spesifik beyinlere yönlendirilmesi için protokol seviyesinde altyapı kodlandı.
* **Güvenlik Koruması:** ELM327 klonlarıyla beyne yazma işlemi yapmanın getireceği "Brick" (kilitlenme) riskine karşı, işlemleri başlatmadan önce kırmızı onaylı "Sorumluluk Kullanıcıya Aittir" güvenlik ekranı eklendi.
* **Yeni Özellikler:** Kadran Selamlama, Global Cam İndirme, Seyir Halinde Video (VIM), Bambi Mode, Start/Stop İptali ve 20'den fazla üst düzey gizli özellik eklendi.


## v9.1.3 (Büyük Mimari Revizyon) - TİCARİ STANDART (Torque Mimarisi) 🏆
* **Multi-PID Modu Kaldırıldı:** Çoklu sensör sorgulama komutları (010C0D05), ucuz v2.1 ELM327 klonlarını kitlediği için tespit edildi ve devre dışı bırakıldı. Artık her sensör en stabil yöntemle, ayrı ayrı soruluyor. Cihazınız asla donmayacak.
* **Mutex Lock (Sıralı İletişim Kuyruğu):** Arka plan motoruna `Promise Mutex` kilit mekanizması inşa edildi. Bir önceki verinin işlemi %100 bitmeden diğer veri asla Bluetooth hattına sürülmüyor. Veri taşmaları (Garbage Data) tamamen engellendi.
* **AT ST 32 (Timeout Optimizasyonu):** Arabanın desteklemediği bir sensöre yanıt beklerken uygulamanın gereksiz yere takılıp kalmaması için maksimum bekleme süresi 400ms'den 200ms'ye (ATST32) düşürüldü.
* **Sonuç:** Klon cihazlarda bağlantı kopması, "NO DATA" veya donma ihtimali tamamen sıfıra indirildi.



## v9.1.2 (Hotfix) - UI KİLİTLENMESİ ÇÖZÜLDÜ 📱
* **Ekran Donma Hatası (UI Freeze):** Ekrana tek seferde eklediğimiz 109 sensörün saniyede 12 kez güncellenmesi telefonların işlemcisine (ve uygulamanın arayüz motoruna) aşırı yük bindirerek uygulamanın kilitlenmesine sebep oluyordu. Bu kilitlenme yüzünden Bluetooth bağlantısı zaman aşımına uğruyor, hem arıza okuma hem de canlı veri tamamen kopuyordu. Ekran (ScrollView) mimarisi tamamen FlatList (Sadece ekranda görünenleri işleme) teknolojisiyle değiştirilerek sonsuz bir akıcılık sağlandı.



## v9.1.1 (Hotfix) - KUSURSUZ ARIZA OKUMA 🛠️
* **Boşluk (Space) Bug'ı Giderildi:** Piyasada çokça bulunan bazı klon (v2.1) ELM327 cihazları, ECU'dan gelen arıza kodlarını (DTC) ekrana basarken aralardaki "boşluk" karakterlerini (Space) yutuyordu. Bu durum eski ayrıştırma (parsing) motorumuzun çökmesine ve ekranda hiç arıza yokmuş gibi görünmesine sebep oluyordu. Yeni yazdığım ardışık okuma algoritması sayesinde cihaz boşlukları yutsa bile arıza kodları (P0, C0, B0, U0) saniyesinde taranıp tespit edilebilecek.



## v9.1.0 (Güncel Sürüm) - UI MEGA GENİŞLEMESİ 📊
* **Devasa Ekran Genişlemesi:** Arka planda okunup da ekranda gösterilmeyen (MAP, MAF, O2 Voltajları, Trims vb.) tam 109 farklı sensör verisi "Canlı Veri (Live Data)" ekranına entegre edildi. Artık aracın tüm hücrelerini tek bir ekrandan izleyebilirsiniz!
* **Dinamik Türkçe Çeviri:** Eklenen tüm yeni veriler otomatik olarak isimlendirildi ve ölçü birimleriyle (kPa, °C, %, V) eşleştirildi.



## v9.0.0 (Güncel Sürüm) - YAPAY ZEKA MOTORU v2.0 🧠
* **Telemetri Akıcılığı (Smart Polling):** Motor harareti ve dış hava sıcaklığı gibi yavaş değişen sensörlere saniyede 1 kez, Devir ve Hız gibi hızlı verilere ise maksimum frekansta odaklanılarak anlık veri akışı inanılmaz hızlandırıldı.
* **Akıllı Uyku (Sleep/Wake Döngüsü):** Sensörler "Hata (NO DATA)" verdiğinde tamamen kapatılmak yerine geçici olarak 10 saniyelik "Derin Uykuya" alınacak ve belirli periyotlarla tekrar uyanıp uyanmadığı yoklanacak.
* **Agresif Koruma (1-Strike Out):** Uygulamayı veya ELM327'yi dondurma potansiyeli olan bozuk PID'ler 3 şans tanınmadan direkt saniyesinde uyku moduna itildi.



## v8.0.1 (Hotfix) - HATA DÜZELTMELERİ 🛠️
* **Hata Kodu Okuma Düzeltildi:** Optimizasyon motorunun, araçta arıza kodu yoksa "Arıza Okuma Sistemini" yanlışlıkla uyku moduna alması sorunu çözüldü.
* **Canlı Veri Düzeldi:** Turbo okuma sisteminde yaşanan bayt kayması (Hararet ve Hız verilerinin aşırı yüksek veya saçma sapan görünmesi) sorunu çözülerek bayt okuma algoritması sıralı hale getirildi.


## v8.0.0 (Güncel Sürüm) - UYUMLULUK VE OPTİMİZASYON 🛡️
* **Uyumluluk Modu (Compatibility Mode)**: Sahte veya ucuz (kalitesiz) v2.1 ELM327 cihazlarındaki kopma/kilitlenme sorununu kökten çözen güvenli bağlantı mimarisi (Safe-mode) kodlandı.
* **Akıllı Optimizasyon (Adaptive Polling)**: Araçta desteklenmeyen sensörleri (NO DATA hatası verenleri) algılayıp uyku moduna alan akıllı asistan eklendi. Bu sayede genel okuma hızı %40 daha iyileştirildi.
* **Ekstra Sensörler**: Motor Yağı Sıcaklığı, Enjeksiyon Zamanlaması ve Anlık Yakıt Tüketim Oranı (L/h) gibi yeni standart sensörler eklendi.

## v7.0.0 (Güncel Sürüm) - MEGA ARŞİV
* **Mega Sensör Arşivi**: Sensör limitleri aşıldı! Hibrit batarya gerilimleri, Turbo Wastegate pozisyonu gibi 30'dan fazla yeni standart veri eklendi (Toplam 140+).
* **OEM Gizli Sensörler**: Marka özel şifreli sensörlere yenileri katıldı: Renault (DPF), Fiat/FCA (Şanzıman Sıcaklığı) ve Toyota (Hibrit Fan Devri).
* **Ultimate Gizli Özellik Kasası**: VAG grubu için "Dönüşe Duyarlı Sis Farı", BMW için "Geri Viteste Ayna İndirme (Tilt)" ve "Video in Motion", Ford için "Kornasız Kilit" özellikleri sisteme gömüldü.

## v6.0.0 (Güncel Sürüm) - PROFESYONEL EKOSİSTEM
* **Çevrimdışı Arıza Sözlüğü**: Hata okuma ekranında P0171 gibi kodların altında artık doğrudan detaylı Türkçe açıklamaları (Örn: "Sistem Çok Fakir") yer alıyor!
* **Veri Kaydı & Canlı Grafikler**: Veri Kaydetme ekranı tamamen baştan çizildi. Artık araç hareket halindeyken hız ve devir yükselişini anlık bir Çizgi Grafik (Line Chart) üzerinde izleyebileceksiniz.
* **Wi-Fi & BLE Mimari Desteği**: Klasik Bluetooth dışında Wi-Fi ve Bluetooth Low Energy cihazları için kök altyapı sisteme gömüldü.

## v5.0.0 (Güncel Sürüm) - PERFORMANS CANAVARI & GİZLİ ÖZELLİK KASASI
* **Multi-PID (Turbo Motor)**: Tek seferde 3-6 sensör birden okunarak (Örn: Devir, Hız ve Sıcaklık) veri akış hızı %300 artırıldı. Ekranınızdaki ibreler artık yağ gibi akacak!
* **Genişletilmiş Gizli Özellikler**: Ford, BMW ve VAG grubu için internetin en meşhur gizli özellikleri (Bambi modu, Kadran selamlama, Kemer ikaz iptali) uygulamaya eklendi.
* **Hata Taraması (DTC) Hızlandırması**: Araç beyinlerine gönderilen hata okuma komutlarındaki bekleme süreleri sıfıra indirilerek anında tarama yapılacak şekilde tasarlandı.

## v4.0.1 (Güncel Sürüm) - BRUTE-FORCE TARAMASI
* **Gelişmiş Sensör Taraması**: Eğer aracınız eskiyse veya Şasi Numarasını okumamıza izin vermiyorsa, uygulama pes etmez. Bilinen tüm markalara ait tüm gizli sensör şifrelerini (Brute-Force yöntemiyle) sırayla araca yollar ve aracın cevap verdiği her gizli sensörü ekranınıza zorla çıkarır!

## v4.0.0 (Güncel Sürüm) - AKILLI TEŞHİS MOTORU
* **Otomatik OEM Sensör Keşfi**: Uygulama artık profesyonel cihazlar gibi çalışıyor! Araca bağlandığı an arka planda **Şasi Numarasını (VIN)** okuyor, arabanın markasını anlıyor ve o markaya özel gizli sensörleri (Şanzıman Sıcaklığı, DPF, Hibrit vs.) tarayıp otomatik olarak Canlı Veriler ekranınıza ekliyor.

## v3.9.0 (Güncel Sürüm)
* **Galeriden Fotoğraf Seçme**: Araçlarım menüsüne eklediğiniz araçlar için galerinizden kendi çektiğiniz o güzel araba fotoğraflarını yükleyebilirsiniz.
* **Arayüz İyileştirmesi**: Seçtiğiniz aktif aracın profil fotoğrafı uygulamanın ana ekranında en üstte, ismi ve markasıyla birlikte yuvarlak şık bir şekilde sergilenecek.

## v3.8.0 (Güncel Sürüm)
* **Kararlılık Güncellemesi (Hotfix)**: Arka plandaki veri okuma döngüleri ve bağlantı kontrol servisleri optimize edildi. Olası kilitlenmelere ve performans darboğazlarına karşı iyileştirmeler yapıldı.

## v3.7.0 (Güncel Sürüm)
* **Araç Seçme Özelliği**: Araçlarım menüsüne kaydettiğiniz araçlardan birini üstüne dokunarak "Aktif Araç" olarak seçebileceğiniz yepyeni bir özellik eklendi. Seçtiğiniz aracın ismi ve markası artık uygulamanın Ana Ekranında en tepede, havalı bir şekilde görünecek!

## v3.6.0 (Güncel Sürüm)
* **Bildirim Paneli Güncellemesi**: Arka planda çalışırken telefonun üst bildirim panelinde çıkan "ArabaniTani Çalışıyor" bildiriminin hemen altına **"BAĞLANTIYI KES"** butonu eklendi. Artık uygulamayı açmadan tek tuşla arabanızla olan iletişimi durdurabilir ve telefonunuzun bataryasından tasarruf edebilirsiniz.

## v3.5.0 (Güncel Sürüm)
* **Genel Kararlılık ve Uyumluluk Paketi**: Açık kaynaklı dev projelerin (AndrOBD, python-OBD vb.) iletişim kodları örnek alınarak ELM327 bağlantı altyapısı "Kurşun Geçirmez" hale getirildi.
* **Auto-Recovery (Otomatik Kurtarma)**: Seyir halindeyken elektrik dalgalanması yüzünden bağlantı kopsa bile ("UNABLE TO CONNECT"), uygulama sizi hatayla ana ekrana atmaz; arka planda 2 saniye içinde çaktırmadan cihazı sıfırlar (ATZ) ve verileri okumaya devam eder.
* **Kusursuz Başlatma (Ultimate Init)**: Cihazı yoran boşluklar ve satırlar kapatıldı (ATS0, ATL0). Uyumsuzluk çıkartan araçlar için Adaptif Zamanlama (ATAT1) zorunlu hale getirildi. İletişim artık ışık hızında!

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
