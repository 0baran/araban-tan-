import Tts from 'react-native-tts';
import type {OBD2Data} from './OBD2Service';

class VoiceAlertService {
  private lastAlertTimes: Record<string, number> = {};
  private COOLDOWN_MS = 5 * 60 * 1000; // 5 dakika

  constructor() {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultLanguage('tr-TR').catch(() => {
        Tts.setDefaultLanguage('en-US');
      });
      Tts.setDefaultRate(0.5); // Konuşma hızı (normal)
    }).catch(err => {
      if (err.code === 'no_engine') {
        Tts.requestInstallEngine();
      }
    });
  }

  public checkAlerts(data: OBD2Data) {
    const now = Date.now();

    // Düşük Akü Voltajı (11.5V altı)
    if (data.batteryVoltage > 0 && data.batteryVoltage < 11.5) {
      this.triggerAlert('battery', 'Dikkat, akü voltajı çok düşük. Elektrik arızası riski var.', now);
    }

    // Yüksek Motor Sıcaklığı (105 derece üstü)
    if (data.coolantTemp > 105) {
      this.triggerAlert('coolant', 'Dikkat, motor harareti çok yüksek. Lütfen motoru dinlendirin.', now);
    }
    
    // Aşırı Hız Uyarısı
    if (data.speed > 120) {
      this.triggerAlert('speed', 'Aşırı hız uyarısı. Lütfen hız sınırlarına uyun.', now, 3 * 60 * 1000); // 3 dk cooldown
    }
  }

  private triggerAlert(key: string, message: string, now: number, cooldown = this.COOLDOWN_MS) {
    const lastTime = this.lastAlertTimes[key] || 0;
    if (now - lastTime > cooldown) {
      this.lastAlertTimes[key] = now;
      Tts.speak(message);
    }
  }
}

export const voiceAlertService = new VoiceAlertService();
