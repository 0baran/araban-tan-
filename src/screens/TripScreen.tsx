import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {obd2Service} from '../services/OBD2Service';
import {useTheme} from '../services/ThemeContext';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface Props {
  onBack: () => void;
}

export default function TripScreen({onBack}: Props) {
  const {theme} = useTheme();
  
  const [isLogging, setIsLogging] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const [logPath, setLogPath] = useState('');

  // Trip Data
  const [distance, setDistance] = useState(0); // roughly calculated
  const [speed, setSpeed] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [tripTime, setTripTime] = useState(0); // seconds
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let logBuffer: string[] = [];
    
    // Init CSV
    const dirs = ReactNativeBlobUtil.fs.dirs;
    const path = `${dirs.DownloadDir}/ArabanTani_Log_${Date.now()}.csv`;
    setLogPath(path);

    const writeLog = async (dataStr: string) => {
      try {
        await ReactNativeBlobUtil.fs.appendFile(path, dataStr, 'utf8');
      } catch (e) {
        console.error('Log write error', e);
      }
    };

    if (isLogging) {
      // Write Header
      writeLog('Timestamp,RPM,Speed,Load,Temp,MAF,HP_Est\n');
      
      interval = setInterval(() => {
        setTripTime(t => t + 1);
        
        const d = obd2Service.currentData;
        const curSpeed = typeof d.speed === 'number' ? d.speed : 0;
        const curRpm = typeof d.rpm === 'number' ? d.rpm : 0;
        const curLoad = typeof d.engineLoad === 'number' ? d.engineLoad : 0;
        const curTemp = typeof d.coolantTemp === 'number' ? d.coolantTemp : 0;
        const curMaf = typeof d.maf === 'number' ? d.maf : 0;
        const hpEst = (curMaf * 1.25).toFixed(1);

        setSpeed(curSpeed);
        
        // Distance calculation (speed km/h to km/s)
        setDistance(prev => prev + (curSpeed / 3600));

        const csvRow = `${new Date().toISOString()},${curRpm},${curSpeed},${curLoad},${curTemp},${curMaf},${hpEst}\n`;
        writeLog(csvRow);
        setLogCount(c => c + 1);

      }, 1000); // 1 sec log rate
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLogging]);

  const toggleLogging = () => {
    if (isLogging) {
      Alert.alert('Loglama Durduruldu', `Dosya kaydedildi:\n${logPath}`);
    } else {
      Alert.alert('Loglama Başladı', 'Arka planda saniyede 1 kez veri kaydediliyor...');
    }
    setIsLogging(!isLogging);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}dk ${s}sn`;
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>{'< GERİ'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: theme.text}]}>YOL & TELEMETRİ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* TRIP INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOL BİLGİSAYARI</Text>
          <View style={styles.row}>
            <View style={styles.box}>
              <Text style={styles.value}>{distance.toFixed(2)}</Text>
              <Text style={styles.label}>Mesafe (km)</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.value}>{formatTime(tripTime)}</Text>
              <Text style={styles.label}>Süre</Text>
            </View>
          </View>
          <View style={[styles.row, {marginTop: 20}]}>
            <View style={styles.box}>
              <Text style={styles.value}>{speed}</Text>
              <Text style={styles.label}>Hız (km/h)</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.value}>{(tripTime > 0 ? (distance / (tripTime / 3600)) : 0).toFixed(1)}</Text>
              <Text style={styles.label}>Ort. Hız</Text>
            </View>
          </View>
        </View>

        {/* LOGGING */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DATALOGGING (CSV)</Text>
          <Text style={styles.logText}>Durum: {isLogging ? '🔴 KAYDEDİLİYOR' : '⚪ DURDURULDU'}</Text>
          <Text style={styles.logText}>Kaydedilen Satır: {logCount}</Text>
          <Text style={[styles.logText, {fontSize: 10, marginTop: 10}]}>Dosya: {logPath || 'Bekleniyor...'}</Text>
          
          <TouchableOpacity 
            style={[styles.btn, {backgroundColor: isLogging ? '#e84118' : '#4cd137'}]} 
            onPress={toggleLogging}
          >
            <Text style={styles.btnText}>
              {isLogging ? 'KAYDI DURDUR & KAYDET' : 'TELEMETRİ KAYDINI BAŞLAT'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: { paddingRight: 16 },
  backText: { color: '#00bfff', fontSize: 16, fontFamily: 'Courier', fontWeight: 'bold' },
  title: { fontSize: 20, fontFamily: 'Courier', fontWeight: 'bold', letterSpacing: 2 },
  scroll: { padding: 16 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  cardTitle: { color: '#00d2d3', fontSize: 16, fontFamily: 'Courier', fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  box: { alignItems: 'center' },
  value: { color: '#fbc531', fontSize: 32, fontFamily: 'Courier', fontWeight: 'bold' },
  label: { color: '#7f8fa6', fontSize: 14, fontFamily: 'Courier' },
  logText: { color: '#dcdde1', fontFamily: 'Courier', fontSize: 14, marginBottom: 5 },
  btn: { padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontFamily: 'Courier', fontWeight: 'bold', fontSize: 16 },
});
