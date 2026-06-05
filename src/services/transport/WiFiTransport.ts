import {Transport} from '../../types/OBD2Types';

export class WiFiTransport implements Transport {
  private socket: any = null;
  private ip: string;
  private port: number;
  private buffer = '';
  private TcpSocket: any = null;

  constructor(ip: string, port: number = 35000) {
    this.ip = ip;
    this.port = port;
  }

  async connect(_onProgress?: (msg: string) => void): Promise<boolean> {
    try {
      this.TcpSocket = require('react-native-tcp-socket');
    } catch {
      throw new Error('react-native-tcp-socket modülü bulunamadı');
    }
    return new Promise((resolve, reject) => {
      try {
        const client = this.TcpSocket.createConnection(
          {
            host: this.ip,
            port: this.port,
            timeout: 10000,
          },
          () => {
            this.socket = client;
            resolve(true);
          },
        );
        client.on('error', (err: any) => {
          reject(err);
        });
        client.on('timeout', () => {
          client.destroy();
          reject(new Error('Timeout'));
        });
        client.on('data', (data: any) => {
          this.buffer += data.toString();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (_) {}
      this.socket = null;
    }
    this.buffer = '';
  }

  async write(data: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    return new Promise((resolve, reject) => {
      this.socket.write(data, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async readAll(): Promise<string> {
    const data = this.buffer;
    this.buffer = '';
    return data;
  }

  async isAvailable(): Promise<number> {
    return this.buffer.length;
  }
}
