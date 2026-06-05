import { OBD2Data } from '../types/OBD2Types';
import { obd2Service } from './OBD2Service';

export interface AIInsight {
  id: string;
  category: 'engine' | 'fuel' | 'battery' | 'cooling' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  timestamp: number;
}

class AIDiagnosticService {
  private insights: AIInsight[] = [];
  private listeners: ((insights: AIInsight[]) => void)[] = [];

  private history: {
    ltft: number[];
    coolant: number[];
    battery: number[];
  } = { ltft: [], coolant: [], battery: [] };

  constructor() {
    obd2Service.onDataUpdate((data) => this.analyzeData(data));
  }

  public getInsights() {
    return this.insights;
  }

  public onInsightsChanged(cb: (insights: AIInsight[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.insights));
  }

  private addInsight(insight: Omit<AIInsight, 'timestamp'>) {
    if (!this.insights.find(i => i.id === insight.id)) {
      this.insights.push({ ...insight, timestamp: Date.now() });
      this.notify();
    }
  }

  private analyzeData(data: OBD2Data) {
    // 1. Vacuum Leak / Fuel Pump Heuristic
    if (data.longTermFuelTrim !== undefined) {
      this.history.ltft.push(Number(data.longTermFuelTrim));
      if (this.history.ltft.length > 50) this.history.ltft.shift();
      
      const avgLtft = this.history.ltft.reduce((a, b) => a + b, 0) / this.history.ltft.length;
      if (avgLtft > 12) {
         this.addInsight({
           id: 'lean_condition',
           category: 'fuel',
           severity: 'high',
           title: 'Sürekli Fakir Karışım (LTFT > 12%)',
           description: 'Motor beyni uzun süredir fakir karışıma müdahale ediyor. Olası vakum kaçağı veya yakıt pompası basıncı düşüklüğü.',
           action: 'Vakum hortumlarını kontrol edin, MAF sensörünü temizleyin.'
         });
      }
    }

    // 2. Battery Health Heuristic
    if (data.batteryVoltage !== undefined && data.rpm !== undefined) {
      if (Number(data.rpm) === 0 && Number(data.batteryVoltage) < 11.8) {
         this.addInsight({
           id: 'battery_low',
           category: 'battery',
           severity: 'medium',
           title: 'Akü Voltajı Zayıf',
           description: 'Motor kapalıyken akü voltajınız 11.8V altına düştü. Akü ömrünü tamamlıyor olabilir veya kaçak var.',
           action: 'Akünüzü şarj ettirin veya durumunu kontrol ettirin.'
         });
      }
    }

    // 3. Cooling System Heuristic
    if (data.coolantTemp !== undefined) {
      this.history.coolant.push(Number(data.coolantTemp));
      if (this.history.coolant.length > 100) this.history.coolant.shift();
      
      const avgTemp = this.history.coolant.reduce((a, b) => a + b, 0) / this.history.coolant.length;
      if (avgTemp > 105) {
         this.addInsight({
           id: 'overheating',
           category: 'cooling',
           severity: 'critical',
           title: 'Aşırı Isınma (Hararet) Riski',
           description: 'Motor soğutma sıvısı sürekli olarak 105°C bandının üzerinde seyrediyor. Termostat veya devirdaim pompası arızası yaklaşıyor olabilir.',
           action: 'Aracı güvenli bir yere çekip soğutma sıvısı seviyesini kontrol edin.'
         });
      }
    }
  }

  public getHealthScores() {
    let engine = 100, battery = 100, cooling = 100;
    this.insights.forEach(i => {
      const penalty = i.severity === 'critical' ? 30 : i.severity === 'high' ? 20 : i.severity === 'medium' ? 10 : 5;
      if (i.category === 'engine' || i.category === 'fuel') engine -= penalty;
      if (i.category === 'battery') battery -= penalty;
      if (i.category === 'cooling') cooling -= penalty;
    });
    return {
      engine: Math.max(0, engine),
      battery: Math.max(0, battery),
      cooling: Math.max(0, cooling),
      overall: Math.floor((Math.max(0, engine) + Math.max(0, battery) + Math.max(0, cooling)) / 3)
    };
  }
}

export const aiDiagnosticService = new AIDiagnosticService();
