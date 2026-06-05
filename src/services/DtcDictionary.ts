export const DTC_DICTIONARY: Record<string, string> = {
  P0100: 'Kütle veya Hacim Hava Akışı (MAF) Devresi Arızası',
  P0101: 'Kütle veya Hacim Hava Akışı (MAF) Devresi Sınır/Performans Sorunu',
  P0102: 'Kütle veya Hacim Hava Akışı (MAF) Devresi Düşük Giriş',
  P0103: 'Kütle veya Hacim Hava Akışı (MAF) Devresi Yüksek Giriş',
  P0110: 'Emme Havası Sıcaklık (IAT) Devresi Arızası',
  P0115: 'Motor Soğutma Suyu Sıcaklık (ECT) Devresi Arızası',
  P0120: 'Gaz Kelebeği/Pedal Konum Sensörü A Devresi Arızası',
  P0130: 'O2 Sensörü Devresi Arızası (Sıra 1 Sensör 1)',
  P0131: 'O2 Sensörü Devresi Düşük Voltaj (Sıra 1 Sensör 1)',
  P0132: 'O2 Sensörü Devresi Yüksek Voltaj (Sıra 1 Sensör 1)',
  P0133: 'O2 Sensörü Devresi Yavaş Tepki (Sıra 1 Sensör 1)',
  P0171:
    'Sistem Çok Fakir (Sıra 1) - Hava fazla veya yakıt az. (Oksijen sensörü, vakum kaçağı veya MAF sensörü kontrol edilmeli)',
  P0172:
    'Sistem Çok Zengin (Sıra 1) - Yakıt fazla. (Enjektör sızıntısı veya hava filtresi tıkanıklığı)',
  P0300:
    'Rastgele/Çoklu Silindir Teklemesi Tespit Edildi (Bujiler, bobinler veya yakıt pompası kontrol edilmeli)',
  P0301: 'Silindir 1 Teklemesi Tespit Edildi',
  P0302: 'Silindir 2 Teklemesi Tespit Edildi',
  P0303: 'Silindir 3 Teklemesi Tespit Edildi',
  P0304: 'Silindir 4 Teklemesi Tespit Edildi',
  P0325: 'Vuruntu Sensörü 1 Devre Arızası (Sıra 1)',
  P0340: 'Eksantrik Mili Konum Sensörü A Devresi Arızası',
  P0400: 'Egzoz Gazı Geri Çevrimi (EGR) Akış Arızası',
  P0401: 'EGR Akışı Yetersiz Tespit Edildi',
  P0420:
    'Katalizör Sistemi Verimliliği Eşik Değerin Altında (Sıra 1) - Katalitik Konvertör veya Oksijen Sensörü arızası',
  P0430: 'Katalizör Sistemi Verimliliği Eşik Değerin Altında (Sıra 2)',
  P0442: 'Buharlaşma Emisyon (EVAP) Sistemi Küçük Kaçak Tespit Edildi',
  P0455: 'Buharlaşma Emisyon (EVAP) Sistemi Büyük Kaçak Tespit Edildi',
  P0500: 'Araç Hız Sensörü Arızası',
  P0505: 'Rölanti Kontrol Sistemi Arızası',
  P0600: 'Seri İletişim Bağlantısı Arızası',
  P0601: 'İç Kontrol Modülü Bellek (Checksum) Hatası',
  P0700: 'Şanzıman Kontrol Sistemi Arızası',
  U0100: 'Motor Kontrol Modülü (ECM/PCM) ile İletişim Kaybı',
  B0001: 'Sürücü Hava Yastığı Tetikleme Devresi Arızası',
  C0035: 'Sol Ön Tekerlek Hız Sensörü Devre Arızası',
  // Daha yüzlerce eklenebilir, bu örnek bir kasadır.
};

export function getDtcDescription(code: string): string {
  const cleanCode = code.trim().toUpperCase();
  return (
    DTC_DICTIONARY[cleanCode] ||
    'Bilinmeyen Hata Kodu. Çevrimiçi kontrol edilmesi önerilir.'
  );
}
