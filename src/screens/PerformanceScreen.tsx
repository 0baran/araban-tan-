import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
import {obd2Service, OBD2Data} from '../services/OBD2Service';
import {loadSettings, getSettings} from '../services/AppSettings';
import {useTheme} from '../services/ThemeContext';

interface Props {
  onBack: () => void;
}

type TimerState = 'idle' | 'ready' | 'running' | 'done';

export default function PerformanceScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [data, setData] = useState<OBD2Data | null>(null);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [peakSpeed, setPeakSpeed] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [hp, setHp] = useState({whp: 0, bhp: 0});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const stateRef = useRef(timerState);
  const peakSpeedRef = useRef(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [fuelUsed, setFuelUsed] = useState(0);
  const fuelPriceRef = useRef(0);
  const fuelConsumedRef = useRef(0);
  const fuelLastUpdateRef = useRef(0);

  stateRef.current = timerState;

  useEffect(() => {
    loadSettings().then(() => {
      fuelPriceRef.current = getSettings().fuelPricePerLiter;
    });

    obd2Service.onDataUpdate(d => {
      setData({...d});
      const now = Date.now();
      if (fuelLastUpdateRef.current > 0 && d.fuelRate > 0) {
        const dt = (now - fuelLastUpdateRef.current) / 1000;
        const l = d.fuelRate * dt / 3600;
        fuelConsumedRef.current += l;
        setFuelUsed(fuelConsumedRef.current);
        setFuelCost(fuelConsumedRef.current * fuelPriceRef.current);
      }
      fuelLastUpdateRef.current = now;
      const s = d.speed;
      if (s > peakSpeedRef.current) {
        peakSpeedRef.current = s;
        setPeakSpeed(s);
      }
      const st = stateRef.current;
      if (st === 'idle' && s < 5) {
        setTimerState('ready');
      }
      if (st === 'ready' && s >= 5) {
        startTimer();
      }
      if (st === 'running' && s >= 100) {
        stopTimer();
      }
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (data && data.maf > 0) {
      setHp(obd2Service.calculateHP(data.maf));
    }
  }, [data?.maf]);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setTimerState('running');
    timerRef.current = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 50);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalTime = (Date.now() - startTimeRef.current) / 1000;
    setElapsed(finalTime);
    setTimerState('done');
    setBestTime(prev => (prev === null || finalTime < prev ? finalTime : prev));
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    setTimerState('idle');
    setPeakSpeed(0);
    peakSpeedRef.current = 0;
  };

  const formatTime = (t: number) => {
    const min = Math.floor(t / 60);
    const sec = t % 60;
    return min > 0
      ? `${min}:${sec.toFixed(1).padStart(4, '0')}`
      : `${sec.toFixed(1)}s`;
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, {color: colors.accent}]}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>PERFORMANS</Text>
        <View style={{width: 60}} />
      </View>

      {/* 0-100 TIMER */}
      <View style={styles.glassCard}>
        <Text style={styles.cardLabel}>0-100 KM/H SÜRE</Text>

        <View style={styles.timerRow}>
          <Text style={[styles.timerValue, timerState === 'running' && styles.timerRunning]}>
            {timerState === 'idle' ? '—' : formatTime(elapsed)}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, statusStyle(timerState)]}>
            <Text style={styles.statusText}>
              {timerState === 'idle' ? 'DURAKLAMA' :
               timerState === 'ready' ? 'HAZIR' :
               timerState === 'running' ? 'ÖLÇÜM AKTİF' : 'TAMAMLANDI'}
            </Text>
          </View>
          {bestTime !== null && (
            <Text style={styles.bestTime}>En iyi: {formatTime(bestTime)}</Text>
          )}
        </View>

        <View style={{flexDirection: 'row', gap: 8, marginTop: 14}}>
          {timerState === 'done' && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
              <Text style={styles.resetBtnText}>TEKRAR</Text>
            </TouchableOpacity>
          )}
          {timerState === 'done' || timerState === 'ready' ? (
            <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
              <Text style={styles.resetBtnText}>SIFIRLA</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.helpText}>
          {timerState === 'idle' ? '💡 5 km/s altına düşünce otomatik hazır olur.' :
           timerState === 'ready' ? '⚡ Gaza basınca süre başlar!' :
           timerState === 'running' ? '⏱️ 100 km/h görülünce durur...' :
           '✅ Süre kaydedildi. Tekrar dene!'}
        </Text>
      </View>

      {/* HP CARD */}
      <View style={[styles.glassCard, {flexDirection: 'row', justifyContent: 'space-around'}]}>
        <View style={{alignItems: 'center'}}>
          <Text style={styles.hpLabel}>Tekerlek BG</Text>
          <Text style={[styles.hpValue, {color: '#00bfff'}]}>{hp.whp}</Text>
          <Text style={styles.hpUnit}>WHP</Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Text style={styles.hpLabel}>Motor BG</Text>
          <Text style={[styles.hpValue, {color: '#00ff7f'}]}>{hp.bhp}</Text>
          <Text style={styles.hpUnit}>BHP</Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Text style={styles.hpLabel}>MAF</Text>
          <Text style={[styles.hpValue, {color: '#feca57'}]}>
            {data?.maf.toFixed(1) || '0.0'}
          </Text>
          <Text style={styles.hpUnit}>g/s</Text>
        </View>
      </View>

      {/* SPEED + RPM */}
      <View style={styles.gaugesRow}>
        <View style={[styles.glassCard, styles.gaugeCardSmall]}>
          <Text style={styles.gaugeLabelSmall}>HIZ</Text>
          <Text style={[styles.gaugeVal, {color: '#00ff7f'}]}>{data?.speed || 0}</Text>
          <Text style={styles.gaugeUnitSmall}>KM/H</Text>
        </View>
        <View style={[styles.glassCard, styles.gaugeCardSmall]}>
          <Text style={styles.gaugeLabelSmall}>MAKS HIZ</Text>
          <Text style={[styles.gaugeVal, {color: '#ff9ff3'}]}>{peakSpeed}</Text>
          <Text style={styles.gaugeUnitSmall}>KM/H</Text>
        </View>
        <View style={[styles.glassCard, styles.gaugeCardSmall]}>
          <Text style={styles.gaugeLabelSmall}>DEVİR</Text>
          <Text style={[styles.gaugeVal, {color: '#00bfff'}]}>{data?.rpm || 0}</Text>
          <Text style={styles.gaugeUnitSmall}>RPM</Text>
        </View>
      </View>

      {/* FUEL COST */}
      {fuelPriceRef.current > 0 && fuelUsed > 0 && (
        <View style={[styles.glassCard, {flexDirection: 'row', justifyContent: 'space-around'}]}>
          <View style={{alignItems: 'center'}}>
            <Text style={styles.hpLabel}>⛽ Yakıt</Text>
            <Text style={[styles.hpValue, {color: '#e9c46a'}]}>{fuelUsed.toFixed(2)}</Text>
            <Text style={styles.hpUnit}>L</Text>
          </View>
          <View style={{alignItems: 'center'}}>
            <Text style={styles.hpLabel}>💰 Maliyet</Text>
            <Text style={[styles.hpValue, {color: '#ffa502'}]}>₺{fuelCost.toFixed(1)}</Text>
            <Text style={styles.hpUnit}>TL</Text>
          </View>
          <View style={{alignItems: 'center'}}>
            <Text style={styles.hpLabel}>₺/L</Text>
            <Text style={[styles.hpValue, {color: '#fff'}]}>{fuelPriceRef.current}</Text>
            <Text style={styles.hpUnit}>TL</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const statusStyle = (s: TimerState) => {
  switch (s) {
    case 'ready': return {backgroundColor: 'rgba(0, 255, 127, 0.15)', borderColor: '#00ff7f'};
    case 'running': return {backgroundColor: 'rgba(0, 191, 255, 0.15)', borderColor: '#00bfff'};
    case 'done': return {backgroundColor: 'rgba(255, 165, 0, 0.15)', borderColor: '#ffa502'};
    default: return {backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)'};
  }
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0b10'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 40,
  },
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  glassCard: {
    backgroundColor: 'rgba(30,33,40,0.7)', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16, marginBottom: 16,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold',
    letterSpacing: 1, marginBottom: 10,
  },
  timerRow: {alignItems: 'center', marginVertical: 10},
  timerValue: {
    color: '#fff', fontSize: 52, fontWeight: '900', fontFamily: 'monospace',
    textShadowColor: 'rgba(0,191,255,0.5)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 15,
  },
  timerRunning: {
    color: '#00bfff',
    textShadowColor: 'rgba(0,191,255,0.5)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 20,
  },
  statusRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  statusBadge: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1},
  bestTime: {color: '#ffa502', fontSize: 13, fontWeight: '700'},
  resetBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  resetBtnText: {color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1},
  helpText: {
    color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 16, textAlign: 'center',
  },
  hpLabel: {color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8},
  hpValue: {fontSize: 32, fontWeight: '900'},
  hpUnit: {color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2},
  gaugesRow: {flexDirection: 'row', marginHorizontal: 12},
  gaugeCardSmall: {flex: 1, marginHorizontal: 4, alignItems: 'center', paddingVertical: 20},
  gaugeLabelSmall: {
    color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8,
  },
  gaugeVal: {fontSize: 28, fontWeight: '900'},
  gaugeUnitSmall: {color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2},
});
