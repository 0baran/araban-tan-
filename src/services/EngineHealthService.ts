/**
 * EngineHealthService — Motor sağlık skoru hesaplayıcı
 * DTC sayısı, sensör değerleri ve anormallikler üzerinden 0-100 puan üretir
 */

import {OBD2Data, DTC} from '../types/OBD2Types';

export type HealthCategory = {
  name: string;
  score: number; // 0-100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  detail: string;
};

export type EngineHealthResult = {
  overall: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  categories: HealthCategory[];
  summary: string;
};

function scoreStatus(score: number): HealthCategory['status'] {
  if (score >= 85) {return 'excellent';}
  if (score >= 65) {return 'good';}
  if (score >= 40) {return 'warning';}
  return 'critical';
}

export function calculateEngineHealth(
  data: OBD2Data,
  dtcs: DTC[],
  isConnected: boolean,
): EngineHealthResult {
  if (!isConnected) {
    return {
      overall: 0,
      grade: 'F',
      color: '#666',
      categories: [],
      summary: 'Bağlı değil',
    };
  }

  const categories: HealthCategory[] = [];

  // 1. DTC Puanı (en ağır) — her aktif kod -15 puan
  const dtcPenalty = Math.min(dtcs.length * 15, 100);
  const dtcScore = 100 - dtcPenalty;
  categories.push({
    name: 'Hata Kodları',
    score: dtcScore,
    status: scoreStatus(dtcScore),
    detail:
      dtcs.length === 0
        ? 'Aktif hata kodu yok ✓'
        : `${dtcs.length} aktif hata kodu`,
  });

  // 2. Soğutma Suyu Sıcaklığı
  const coolant = data.coolantTemp;
  let coolantScore = 100;
  if (coolant > 110) {coolantScore = 20;}
  else if (coolant > 100) {coolantScore = 50;}
  else if (coolant > 95) {coolantScore = 75;}
  else if (coolant < 60 && coolant > 0) {coolantScore = 80;} // çok soğuk
  const coolantDetail =
    coolant > 0
      ? `${coolant}°C ${coolant > 100 ? '⚠️ Yüksek!' : coolant < 60 ? '❄️ Soğuk' : '✓'}`
      : 'Veri yok';
  categories.push({
    name: 'Motor Isısı',
    score: coolantScore,
    status: scoreStatus(coolantScore),
    detail: coolantDetail,
  });

  // 3. Yakıt Trimi (uzun vadeli)
  const ltft = data.longTermFuelTrim;
  let ltftScore = 100;
  const ltftAbs = Math.abs(ltft);
  if (ltftAbs > 25) {ltftScore = 20;}
  else if (ltftAbs > 15) {ltftScore = 50;}
  else if (ltftAbs > 8) {ltftScore = 75;}
  categories.push({
    name: 'Yakıt Dengesi',
    score: ltftScore,
    status: scoreStatus(ltftScore),
    detail:
      ltft !== 0
        ? `LT Trim: ${ltft > 0 ? '+' : ''}${ltft}% ${ltftAbs > 10 ? '⚠️' : '✓'}`
        : 'Veri yok',
  });

  // 4. Akü Voltajı
  const batt = data.batteryVoltage;
  let battScore = 100;
  if (batt > 0) {
    if (batt < 11.5) {battScore = 20;}
    else if (batt < 12.0) {battScore = 50;}
    else if (batt < 12.4) {battScore = 75;}
    else if (batt > 15.0) {battScore = 60;} // şarj fazlası
  }
  categories.push({
    name: 'Akü',
    score: battScore,
    status: scoreStatus(battScore),
    detail:
      batt > 0
        ? `${batt}V ${batt < 12.0 ? '⚠️ Düşük' : batt > 15 ? '⚠️ Yüksek' : '✓'}`
        : 'Veri yok',
  });

  // 5. Motor Yükü (idle'da normal yük kontrolü)
  const load = data.engineLoad;
  const rpm = data.rpm;
  let loadScore = 100;
  // Rölantide (%0 hız) yük %40'ın üzerindeyse sorun var
  if (rpm > 0 && rpm < 1000 && data.speed === 0 && load > 50) {
    loadScore = 60;
  }
  categories.push({
    name: 'Motor Yükü',
    score: loadScore,
    status: scoreStatus(loadScore),
    detail:
      load > 0
        ? `${load}% yük @ ${rpm} RPM ${loadScore < 80 ? '⚠️' : '✓'}`
        : 'Veri yok',
  });

  // Genel skor: ağırlıklı ortalama
  const weights = [0.40, 0.20, 0.20, 0.10, 0.10];
  const scores = categories.map(c => c.score);
  const overall = Math.round(
    scores.reduce((sum, s, i) => sum + s * weights[i], 0),
  );

  let grade: EngineHealthResult['grade'];
  let color: string;
  let summary: string;

  if (overall >= 90) {
    grade = 'A';
    color = '#00e676';
    summary = 'Motor mükemmel durumda';
  } else if (overall >= 75) {
    grade = 'B';
    color = '#7bed9f';
    summary = 'Motor genel olarak iyi';
  } else if (overall >= 55) {
    grade = 'C';
    color = '#ffa502';
    summary = 'Bazı parametreler dikkat istiyor';
  } else if (overall >= 35) {
    grade = 'D';
    color = '#ff6348';
    summary = 'Servise gitmeniz önerilir';
  } else {
    grade = 'F';
    color = '#ff4757';
    summary = 'Kritik durum! Servise götürün';
  }

  return {overall, grade, color, categories, summary};
}
