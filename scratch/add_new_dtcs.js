const fs = require('fs');

const codes = `
  // --- YENİ B (GÖVDE/BODY) KODLARI ARŞİVİ ---
  B0001: { cause: 'Sürücü Hava Yastığı 1. Kademe Ateşleme Devresi Açık.', advice: '1. Direksiyon zembereğini kontrol edin. 2. Airbag sargısında kopukluk olabilir.' },
  B0002: { cause: 'Sürücü Hava Yastığı 2. Kademe Ateşleme Devresi Açık.', advice: '1. Direksiyon zembereği ve sarı airbag fişini kontrol edin.' },
  B0010: { cause: 'Yolcu Ön Hava Yastığı Ateşleme Devresi Açık.', advice: '1. Yolcu airbag fişi ve kablolarını kontrol edin.' },
  B0020: { cause: 'Sol Yan Hava Yastığı Ateşleme Devresi Arızası.', advice: '1. Sürücü koltuk altındaki fişleri kontrol edin (genellikle sarı fiş temassızlığı).' },
  B0028: { cause: 'Sağ Yan Hava Yastığı Ateşleme Devresi Arızası.', advice: '1. Yolcu koltuk altı fiş bağlantılarında gevşeme kontrolü.' },
  B0091: { cause: 'Sol Yan Çarpışma Sensörü Arızası.', advice: '1. Kapı içi veya B sütunu altındaki çarpışma sensörünü (impact sensor) kontrol edin.' },
  B0092: { cause: 'Sağ Yan Çarpışma Sensörü Arızası.', advice: '1. B sütunu altındaki çarpışma sensörü kablolarını ve soketini kontrol edin.' },
  B1000: { cause: 'Airbag/SRS Kontrol Modülü Donanım Arızası veya Çarpışma Kaydı.', advice: '1. Araç daha önce kaza yaptıysa airbag beyni kilitlenmiş olabilir. 2. Modülü değiştirin veya çarpışma datası (crash data) sıfırlayın.' },
  B1325: { cause: 'Kontrol Modülü Güç Devresi Voltaj Hatası.', advice: '1. Akü voltajını kontrol edin. 2. Şasi (toprak) bağlantılarını kontrol edin.' },
  B1440: { cause: 'Klima Güneş Işığı Sensörü Devre Arızası.', advice: '1. Ön konsol üstündeki sensörü kontrol edin (kapalı garajda bu arıza yanıltıcı olabilir).' },

  // --- YENİ C (ŞASİ/FREN) KODLARI ARŞİVİ ---
  C0035: { cause: 'Sol Ön Tekerlek Hız Sensörü Devre Arızası.', advice: '1. ABS sensörünü ve porya manyetik okuyucusunu temizleyin. 2. Sensör kablosu kopukluk kontrolü yapın.' },
  C0040: { cause: 'Sağ Ön Tekerlek Hız Sensörü Devre Arızası.', advice: '1. Sağ ön ABS sensörünü kontrol edin. 2. Sensör direncini ölçün.' },
  C0045: { cause: 'Sol Arka Tekerlek Hız Sensörü Devresi Açık/Kısa Devre.', advice: '1. Sol arka sensörü değiştirin veya kablolarda sürtünme kaynaklı kopukluk arayın.' },
  C0050: { cause: 'Sağ Arka Tekerlek Hız Sensörü Devresi Açık.', advice: '1. Sağ arka teker porya rulmanı boşluk yapmış olabilir, okuma hatalı olabilir.' },
  C0082: { cause: 'Fren Sistemi Arıza Göstergesi Devre Arızası.', advice: '1. Gösterge tablosundaki ABS/Fren lambası led devresini kontrol edin.' },
  C0110: { cause: 'ABS Pompa Motoru Devre Arızası.', advice: '1. ABS beyni üzerindeki kalın besleme kablosunu ve büyük sigortayı kontrol edin. 2. Pompa motoru kömürleri bitmiş olabilir.' },
  C0131: { cause: 'ABS/ESP Basınç Sensörü Devre Arızası.', advice: '1. ESP modülü içindeki basınç sensörü hatalı olabilir, fren müşürünü kontrol edin.' },
  C0242: { cause: 'Motor Kontrol Modülünden (ECM) Gelen Tork Kontrol Sinyali Hatalı.', advice: '1. ABS beyni ile Motor beyni arasındaki iletişim sorunlu. CAN hattını kontrol edin.' },
  C0561: { cause: 'Sistem Kapatıldı - Geçersiz Veri Nedeniyle.', advice: '1. Bu arıza genellikle motor arızası (örn: MAF sensörü) nedeniyle ESP/TCS sisteminin kendini kapatmasıdır. Önce motor arızalarını çözün.' },
  C0800: { cause: 'Cihaz Güç Devresi Voltajı Düşük/Yüksek.', advice: '1. Akü zayıf veya alternatör voltajı dalgalı.' },

  // --- YENİ U (AĞ/İLETİŞİM) KODLARI ARŞİVİ ---
  U0001: { cause: 'Yüksek Hızlı CAN İletişim Veriyolu (CAN-Bus) Arızası.', advice: '1. CAN High ve CAN Low kabloları arasında 60 Ohm direnç ölçülmeli. 2. Kablolarda kısa devre kontrolü.' },
  U0073: { cause: 'İletişim Veriyolu A Kapalı (Bus Off).', advice: '1. Bir modül CAN hattını çökertiyor olabilir. Modülleri tek tek fişten çekip hattın düzelip düzelmediğine bakın.' },
  U0100: { cause: 'Motor Kontrol Modülü (ECM/PCM) İle İletişim Kesildi.', advice: '1. ECM fişini, şasi kablolarını ve ECM rölesini kontrol edin.' },
  U0101: { cause: 'Şanzıman Kontrol Modülü (TCM) İle İletişim Kesildi.', advice: '1. Otomatik şanzıman beyni besleme sigortasını kontrol edin.' },
  U0121: { cause: 'ABS Kontrol Modülü İle İletişim Kesildi.', advice: '1. ABS pompası fişindeki oksitlenmeyi temizleyin.' },
  U0140: { cause: 'Gövde Kontrol Modülü (BCM) İle İletişim Kesildi.', advice: '1. BCM sigortalarını ve iç aydınlatma dalgalanmalarını kontrol edin.' },
  U0155: { cause: 'Gösterge Paneli Kontrol Modülü (IPC) İle İletişim Kesildi.', advice: '1. Gösterge soketini kontrol edin.' },
  U0300: { cause: 'Dahili Kontrol Modülü Yazılım Uyumsuzluğu.', advice: '1. Yeni takılan bir beyin araca kodlanmamış (adaptasyon yapılmamış) olabilir.' },
  U0401: { cause: 'ECM/PCM den Geçersiz Veri Alındı.', advice: '1. Genellikle ABS veya ESP modülü bu hatayı verir çünkü motorda bir arıza vardır. Motordaki ana arızayı giderin.' },
  U0415: { cause: 'ABS Modülünden Geçersiz Veri Alındı.', advice: '1. Hız sensörü kablosu kopukken ECM bu hatayı verebilir.' }
`;

const targetFile = 'src/services/DTCDatabase.ts';
let code = fs.readFileSync(targetFile, 'utf8');

// Sona ekleme yapıyoruz
code = code.replace(/};\s*$/, codes + '\n};\n');

fs.writeFileSync(targetFile, code);
console.log('Yeni DTC arşivi (B, C, U kodları) veritabanına başarıyla eklendi!');
