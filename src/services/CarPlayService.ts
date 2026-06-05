import { CarPlay, InformationTemplate } from 'react-native-carplay';
import { obd2Service, OBD2Data } from './OBD2Service';

class CarPlayService {
  private template: any;
  private unsubscribe: any;
  private isConnected = false;

  constructor() {
    CarPlay.registerOnConnect(() => {
      this.isConnected = true;
      this.initTemplate();
    });

    CarPlay.registerOnDisconnect(() => {
      this.isConnected = false;
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    });
  }

  private initTemplate() {
    // Create an Information Template to display live gauges as text
    this.template = new InformationTemplate({
      title: 'ProCarScanner Live',
      leading: true,
      items: [
        { title: 'Bağlantı', detail: obd2Service.isConnected ? 'Bağlı' : 'Bekleniyor...' },
        { title: 'RPM', detail: '0' },
        { title: 'Hız (km/h)', detail: '0' },
        { title: 'Hararet', detail: '0 °C' },
        { title: 'Yapay Zeka', detail: 'Sistem Aktif' },
      ],
      actions: [
        { id: 'connect', title: 'Bağlan' },
        { id: 'disconnect', title: 'Kes' }
      ],
      onActionButtonPressed: (e: any) => {
        if (e.id === 'connect') obd2Service.autoConnect();
        if (e.id === 'disconnect') obd2Service.disconnect();
      }
    });

    CarPlay.setRootTemplate(this.template);

    this.startListening();
  }

  private startListening() {
    this.unsubscribe = obd2Service.onDataUpdate((data: OBD2Data) => {
      if (!this.isConnected || !this.template) return;

      this.template.updateItems([
        { title: 'Bağlantı', detail: 'Bağlı' },
        { title: 'RPM', detail: data.rpm?.toString() || '0' },
        { title: 'Hız (km/h)', detail: data.speed?.toString() || '0' },
        { title: 'Hararet', detail: `${data.coolantTemp || 0} °C` },
        { title: 'Yapay Zeka', detail: 'Sistem Aktif' },
      ]);
    });
  }
}

export const carPlayService = new CarPlayService();
