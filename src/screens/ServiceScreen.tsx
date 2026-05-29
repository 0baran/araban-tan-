import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {obd2Service} from '../services/OBD2Service';
import {useTheme} from '../services/ThemeContext';

interface Props {
  onBack: () => void;
}

export default function ServiceScreen({onBack}: Props) {
  const {theme} = useTheme();
  
  const [activeCommand, setActiveCommand] = useState('');

  const runCommand = async (name: string, command: string, warning: string) => {
    Alert.alert(
      'DİKKAT: AKTİF SERVİS KOMUTU',
      warning + '\\n\\nBu işlemi onaylıyor musunuz?',
      [
        {text: 'İptal', style: 'cancel'},
        {
          text: 'ONAYLIYORUM',
          style: 'destructive',
          onPress: async () => {
            setActiveCommand(name);
            try {
              // Send the command directly
              const resp = await obd2Service.sendCommandFast(command);
              Alert.alert('Sonuç', resp || 'Yanıt alınamadı (No Data).');
            } catch (e: any) {
              Alert.alert('Hata', e.message);
            }
            setActiveCommand('');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>{'< GERİ'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: theme.text}]}>AKTİF SERVİS (VAG/FCA)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ RİSK UYARISI</Text>
          <Text style={styles.warningText}>
            Aşağıdaki komutlar aracın ECU'suna (Beyin) doğrudan çift yönlü (bi-directional) yazma/tetikleme komutları gönderir. Sadece motor çalışıyorken ve Park halindeyken kullanın.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>FREN SİSTEMİ</Text>
          
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => runCommand('EPB Aç', '04042', 'Elektronik Park Freni (EPB) pistonları arka balata değişimi için GERİ ÇEKİLECEKTİR. Frenler boşalır!')}
          >
            <Text style={styles.actionBtnText}>EPB Servis Modu (Pistonları Çek)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#2980b9'}]} 
            onPress={() => runCommand('EPB Kapat', '04043', 'Elektronik Park Freni pistonları normal çalışma pozisyonuna İLERİ İTİLECEKTİR.')}
          >
            <Text style={styles.actionBtnText}>EPB Normal Mod (Pistonları Kapat)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>EGZOZ & EMİSYON</Text>
          
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#e67e22'}]} 
            onPress={() => runCommand('DPF Regen', '221234', 'Dizel Partikül Filtresi (DPF) ZORLA REJENERASYON işlemi başlatılacak. Egzoz sıcaklığı 600°C üzerine çıkabilir. Aracı açık alanda tutun!')}
          >
            <Text style={styles.actionBtnText}>DPF Zorla Rejenerasyon Başlat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>MOTOR & ADAPTASYON</Text>
          
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#8e44ad'}]} 
            onPress={() => runCommand('Throttle', '04060', 'Gaz kelebeği (Throttle Body) adaptasyonu başlatılacak. Motor çalışmıyorken sadece kontak açıkken (Key ON Engine OFF) yapın.')}
          >
            <Text style={styles.actionBtnText}>Gaz Kelebeği Adaptasyonu</Text>
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
  warningBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningTitle: { color: '#e74c3c', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  warningText: { color: '#ff7979', fontSize: 12, lineHeight: 18 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  cardTitle: { color: '#00d2d3', fontSize: 16, fontFamily: 'Courier', fontWeight: 'bold', marginBottom: 16 },
  actionBtn: {
    backgroundColor: '#c0392b',
    padding: 15,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontFamily: 'Courier' }
});
