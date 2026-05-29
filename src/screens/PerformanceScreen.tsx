import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {accelerometer, setUpdateIntervalForType, SensorTypes} from 'react-native-sensors';
import {obd2Service} from '../services/OBD2Service';
import CyberBar from '../components/CyberBar';
import {useTheme} from '../services/ThemeContext';

const {width} = Dimensions.get('window');

interface Props {
  onBack: () => void;
}

export default function PerformanceScreen({onBack}: Props) {
  const {theme} = useTheme();
  
  const [speed, setSpeed] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [hp, setHp] = useState(0);
  const [torque, setTorque] = useState(0);

  // 0-100 Logic
  const [timerState, setTimerState] = useState<'IDLE' | 'READY' | 'RUNNING' | 'DONE'>('IDLE');
  const [timerMs, setTimerMs] = useState(0);
  const [startTime, setStartTime] = useState(0);

  // G-Force
  const [gForce, setGForce] = useState({x: 0, y: 0, z: 0});
  const [maxG, setMaxG] = useState(0);

  useEffect(() => {
    // Accelerometer setup
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);
    const sub = accelerometer.subscribe(({x, y, z}) => {
      // 1 G = 9.81 m/s^2
      const gx = x / 9.81;
      const gy = y / 9.81;
      const gz = z / 9.81;
      setGForce({x: gx, y: gy, z: gz});
      const currentG = Math.sqrt(gx*gx + gy*gy);
      if (currentG > maxG) {
        setMaxG(currentG);
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [maxG]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const obdSub = obd2Service.subscribe((data) => {
      const currentSpeed = typeof data.speed === 'number' ? data.speed : 0;
      const currentRpm = typeof data.rpm === 'number' ? data.rpm : 0;
      const maf = typeof data.maf === 'number' ? data.maf : 0;

      setSpeed(currentSpeed);
      setRpm(currentRpm);

      // Virtual Dyno (Rough estimation: HP ≈ MAF * 1.25)
      const estHp = maf > 0 ? maf * 1.25 : 0;
      setHp(Math.round(estHp));
      
      if (currentRpm > 0 && estHp > 0) {
        const estTorque = (estHp * 7120) / currentRpm; // 7120 instead of 5252 for metric Nm? Actually (HP * 7120) / RPM = Nm
        setTorque(Math.round(estTorque));
      } else {
        setTorque(0);
      }

      // 0-100 State Machine
      setTimerState(prev => {
        if (prev === 'IDLE' && currentSpeed === 0) {
          return 'READY';
        }
        if (prev === 'READY' && currentSpeed > 0) {
          setStartTime(Date.now());
          return 'RUNNING';
        }
        if (prev === 'RUNNING' && currentSpeed >= 100) {
          return 'DONE';
        }
        if (prev === 'DONE' && currentSpeed === 0) {
          return 'READY'; // reset
        }
        return prev;
      });
    });

    if (timerState === 'RUNNING') {
      interval = setInterval(() => {
        setTimerMs(Date.now() - startTime);
      }, 50);
    }

    return () => {
      obd2Service.unsubscribe(obdSub);
      if (interval) clearInterval(interval);
    };
  }, [timerState, startTime]);

  const resetMaxG = () => setMaxG(0);
  const resetTimer = () => {
    setTimerState('IDLE');
    setTimerMs(0);
  };

  const timerText = (timerMs / 1000).toFixed(2) + ' sn';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>{'< GERİ'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: theme.text}]}>PERFORMANS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* 0-100 TIMER */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>0-100 km/h TESTİ</Text>
          <View style={styles.timerDisplay}>
            <Text style={[styles.timerValue, {color: timerState === 'DONE' ? '#00E676' : '#FFD700'}]}>
              {timerState === 'IDLE' ? 'DURUN' : timerState === 'READY' ? 'HAZIR' : timerText}
            </Text>
          </View>
          <Text style={styles.timerSub}>Durum: {timerState}</Text>
          <Text style={styles.timerSub}>Hız: {speed} km/h</Text>
          <TouchableOpacity style={styles.btn} onPress={resetTimer}>
            <Text style={styles.btnText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>

        {/* G-FORCE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>G-KUVVETİ (G-FORCE)</Text>
          <View style={styles.gForceContainer}>
            <View style={styles.gForceCircle}>
              {/* Ball */}
              <View style={[styles.gForceBall, {
                transform: [
                  { translateX: gForce.x * 50 },
                  { translateY: -gForce.y * 50 } // invert Y
                ]
              }]} />
              <View style={styles.crosshairH} />
              <View style={styles.crosshairV} />
            </View>
          </View>
          <View style={styles.gForceRow}>
            <Text style={styles.gForceText}>Anlık: {Math.sqrt(gForce.x**2 + gForce.y**2).toFixed(2)} G</Text>
            <Text style={styles.gForceText}>Maks: {maxG.toFixed(2)} G</Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={resetMaxG}>
            <Text style={styles.btnText}>Maks Sıfırla</Text>
          </TouchableOpacity>
        </View>

        {/* VIRTUAL DYNO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SANAL DYNO</Text>
          <View style={styles.dynoRow}>
            <View style={styles.dynoBox}>
              <Text style={styles.dynoValue}>{hp}</Text>
              <Text style={styles.dynoLabel}>HP</Text>
            </View>
            <View style={styles.dynoBox}>
              <Text style={styles.dynoValue}>{torque}</Text>
              <Text style={styles.dynoLabel}>Nm</Text>
            </View>
          </View>
          <CyberBar value={rpm} max={8000} color="#FF3366" label="RPM" />
          <Text style={styles.dynoDisclaimer}>*Sadece MAF tabanlı tahmini veridir.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    paddingRight: 16,
  },
  backText: {
    color: '#00bfff',
    fontSize: 16,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  cardTitle: {
    color: '#00d2d3',
    fontSize: 16,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  timerSub: {
    color: '#ccc',
    fontFamily: 'Courier',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#e94560',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  gForceContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  gForceCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#4cd137',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crosshairH: {
    position: 'absolute',
    width: 150,
    height: 1,
    backgroundColor: 'rgba(76, 209, 55, 0.3)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: 150,
    backgroundColor: 'rgba(76, 209, 55, 0.3)',
  },
  gForceBall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e84118',
    position: 'absolute',
    zIndex: 10,
  },
  gForceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  gForceText: {
    color: '#fbc531',
    fontFamily: 'Courier',
    fontSize: 14,
  },
  dynoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dynoBox: {
    alignItems: 'center',
  },
  dynoValue: {
    color: '#00a8ff',
    fontSize: 40,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  dynoLabel: {
    color: '#7f8fa6',
    fontSize: 16,
    fontFamily: 'Courier',
  },
  dynoDisclaimer: {
    color: '#7f8fa6',
    fontSize: 10,
    fontFamily: 'Courier',
    marginTop: 10,
    textAlign: 'center',
  }
});
