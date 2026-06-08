import {Transport} from '../../types/OBD2Types';

export class UsbTransport implements Transport {
  private RNSerialport: any = null;
  private buffer = '';
  private _subscription: any = null;

  async connect(_onProgress?: (msg: string) => void): Promise<boolean> {
    try {
      const mod = require('react-native-usb-serialport');
      this.RNSerialport = mod?.RNSerialport ?? mod?.default?.RNSerialport ?? null;
    } catch {
      this.RNSerialport = null;
    }
    if (!this.RNSerialport) {
      throw new Error('USB OBD2 desteklenmiyor. Lütfen Bluetooth veya WiFi kullanın.');
    }
    const devices = await this.RNSerialport.listDevices();
    if (!devices || devices.length === 0) {
      throw new Error('USB ELM327 cihazı bulunamadı');
    }
    const dev = devices[0];
    const devId = dev.deviceId || dev.path || dev.name || dev.vendorId;
    if (!devId) {
      throw new Error('USB cihaz ID alınamadı');
    }
    await this.RNSerialport.openDevice(devId);
    await this.RNSerialport.setParams(38400, 8, 1, 0, 0);
    if (this.RNSerialport.onReceived) {
      this._subscription = this.RNSerialport.onReceived((data: string) => {
        this.buffer += data;
      });
    }
    return true;
  }

  async disconnect(): Promise<void> {
    if (this._subscription) {
      try {
        this._subscription.remove();
      } catch {}
      this._subscription = null;
    }
    if (this.RNSerialport) {
      try {
        await this.RNSerialport.closeDevice();
      } catch {}
      this.RNSerialport = null;
    }
    this.buffer = '';
  }

  async write(data: string): Promise<void> {
    if (!this.RNSerialport) {
      throw new Error('USB not connected');
    }
    await this.RNSerialport.sendData(data);
  }

  async readAll(): Promise<string> {
    const d = this.buffer;
    this.buffer = '';
    return d;
  }

  async isAvailable(): Promise<number> {
    return this.buffer.length;
  }
}
