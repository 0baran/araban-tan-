import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import {Transport, CONNECT_TIMEOUT} from '../../types/OBD2Types';

export class BluetoothTransport implements Transport {
  private device: BluetoothDevice | null = null;
  address: string;

  constructor(address: string) {
    this.address = address;
  }

  async connect(onProgress?: (msg: string) => void): Promise<boolean> {
    onProgress?.('Önceki bağlantılar temizleniyor...');
    try {
      await RNBluetoothClassic.disconnectFromDevice(this.address);
    } catch (_) {}
    await new Promise(r => setTimeout(r, 200));

    const attempts: {opts: any; label: string}[] = [
      {
        opts: {
          CONNECTOR_TYPE: 'rfcomm',
          DELIMITER: '\r',
          SECURE_SOCKET: false,
        } as any,
        label: 'Normal bağlantı',
      },
      {
        opts: {SECURE_SOCKET: true, DELIMITER: '\r'} as any,
        label: 'Güvenli bağlantı',
      },
    ];
    for (let i = 0; i < attempts.length; i++) {
      const label = `${i + 1}/${attempts.length} - ${attempts[i].label}`;
      onProgress?.(`${label} (en fazla ${CONNECT_TIMEOUT / 1000}sn)...`);
      try {
        this.device = await Promise.race([
          RNBluetoothClassic.connectToDevice(this.address, attempts[i].opts),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), CONNECT_TIMEOUT),
          ),
        ]);
        onProgress?.('Bağlantı başarılı');
        return !!this.device;
      } catch (e: any) {
        const reason = e?.message?.includes('Timeout') ? 'süre aşımı' : 'hata';
        console.log(`BT connect try ${i + 1} failed:`, e);
        onProgress?.(`${label} başarısız (${reason})`);
        try {
          await RNBluetoothClassic.disconnectFromDevice(this.address);
        } catch (_) {}
        await new Promise(r => setTimeout(r, 500));
      }
    }
    onProgress?.('Bağlantı denemeleri başarısız');
    return false;
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.disconnect();
      } catch (_) {}
      this.device = null;
    }
  }

  async write(data: string): Promise<void> {
    if (!this.device) {
      throw new Error('Device not connected');
    }
    await this.device.write(data);
  }

  async readAll(): Promise<string> {
    if (!this.device) {
      return '';
    }
    let data = '';
    try {
      while ((await this.device.available()) > 0) {
        const chunk = await this.device.read();
        if (!chunk) {
          break; // Sonsuz döngü koruması: available() > 0 ama read() boş döndürüyor
        }
        data += chunk;
      }
    } catch (_) {}
    return data;
  }

  async isAvailable(): Promise<number> {
    if (!this.device) {
      return 0;
    }
    try {
      return await this.device.available();
    } catch {
      return 0;
    }
  }
}
