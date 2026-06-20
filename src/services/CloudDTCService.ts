import AsyncStorage from '@react-native-async-storage/async-storage';
import {getDtcDescription} from './DtcDictionary';
import {DTC_DESCRIPTIONS} from './DTCDatabase';

const CLOUD_CACHE_KEY = '@cloud_dtc_cache';

export interface CloudDTCResult {
  code: string;
  description: string;
  source: 'LOCAL' | 'CLOUD' | 'UNKNOWN';
}

export const CloudDTCService = {
  /**
   * Hem yerel veritabanını hem de bulutu sorgulayarak DTC bilgisini getirir.
   */
  async lookupDTC(code: string): Promise<CloudDTCResult> {
    const upperCode = code.toUpperCase().trim();

    // 1. Yerel veritabanında var mı?
    const localDesc = DTC_DESCRIPTIONS[upperCode] || getDtcDescription(upperCode);
    if (localDesc) {
      return {code: upperCode, description: localDesc, source: 'LOCAL'};
    }

    // 2. Önbellekte var mı?
    try {
      const cachedData = await AsyncStorage.getItem(CLOUD_CACHE_KEY);
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        if (cache[upperCode]) {
          return {code: upperCode, description: cache[upperCode], source: 'CLOUD'};
        }
      }
    } catch (e) {
      console.warn('Cloud DTC cache okuma hatası', e);
    }

    // 3. Buluttan getir (Web scraping veya API simülasyonu)
    try {
      // Not: Gerçek bir üretim ortamında kendi backend API'niz kullanılmalıdır.
      // Burada DDG HTML arama üzerinden obd-codes.com başlığını çekmeye çalışıyoruz.
      const searchUrl = `https://html.duckduckgo.com/html/?q=site:obd-codes.com+${upperCode}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });
      const html = await response.text();

      // Basit bir regex ile başlığı ayıklamaya çalış (örn: "P0001 Fuel Volume Regulator Control Circuit/Open")
      const titleMatch = html.match(/<a class="result__url" href="[^"]+obd-codes\.com\/p\d+[^"]*">([^<]+)<\/a>/i) ||
                         html.match(/<h2 class="result__title">.*?<a[^>]*>(.*?)<\/a>.*?<\/h2>/is);

      if (titleMatch && titleMatch[1]) {
        let desc = titleMatch[1]
          .replace(/<[^>]+>/g, '') // strip HTML
          .replace(new RegExp(`^${upperCode}\\s*-?\\s*`, 'i'), '') // remove code from start
          .replace(/OBD-II Trouble Code:\s*/i, '')
          .trim();
        
        // Türkçe değil ama en azından bir açıklama var
        if (desc && desc.length > 5) {
          desc = `[BULUT] ${desc}`;
          await this.saveToCache(upperCode, desc);
          return {code: upperCode, description: desc, source: 'CLOUD'};
        }
      }
    } catch (e) {
      console.warn('Bulut DTC sorgulama hatası', e);
    }

    // Bulunamadı
    return {code: upperCode, description: 'Bilinmeyen Hata Kodu', source: 'UNKNOWN'};
  },

  async saveToCache(code: string, description: string) {
    try {
      const cachedData = await AsyncStorage.getItem(CLOUD_CACHE_KEY);
      const cache = cachedData ? JSON.parse(cachedData) : {};
      cache[code] = description;
      await AsyncStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Cloud DTC cache yazma hatası', e);
    }
  },
  
  async getCachedCodes(): Promise<Record<string, string>> {
     try {
      const cachedData = await AsyncStorage.getItem(CLOUD_CACHE_KEY);
      return cachedData ? JSON.parse(cachedData) : {};
    } catch (e) {
      return {};
    }
  }
};
