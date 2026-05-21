import { SafeAreaView } from 'react-native-safe-area-context';
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Share} from 'react-native';
import {getLogs, clearLogs} from '../services/AppLog';
import {useTheme} from '../services/ThemeContext';

interface Props {
  onBack: () => void;
}

export default function LogScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [logs, setLogs] = useState(getLogs());

  useEffect(() => {
    const id = setInterval(() => setLogs(getLogs()), 1000);
    return () => clearInterval(id);
  }, []);

  const levelColor = (lvl: string) => {
    if (lvl === 'ERROR') return '#ff4757';
    if (lvl === 'WARN') return '#ffa502';
    return colors.textMuted;
  };

  const handleClear = () => {
    clearLogs();
    setLogs([]);
  };

  const handleShare = async () => {
    const text = logs.map(l => `[${l.time}] [${l.level}] ${l.message}`).join('\n');
    await Share.share({message: text || '(boş)'});
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={[s.backText, {color: colors.accent}]}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[s.title, {color: colors.text}]}>HATA LOG</Text>
        <View style={{width: 60}} />
      </View>

      <View style={s.btnRow}>
        <TouchableOpacity style={s.btn} onPress={handleClear}>
          <Text style={{color: '#ff4757', fontWeight: '800', fontSize: 12}}>TEMİZLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btn} onPress={handleShare}>
          <Text style={{color: colors.accent, fontWeight: '800', fontSize: 12}}>📤 PAYLAŞ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.list}>
        {logs.length === 0 && (
          <Text style={[s.empty, {color: colors.textMuted}]}>Henüz log kaydı yok.</Text>
        )}
        {logs.map((l, i) => (
          <View key={i} style={s.logRow}>
            <Text style={[s.logTime, {color: colors.textMuted}]}>{l.time}</Text>
            <Text style={[s.logLevel, {color: levelColor(l.level)}]}>{l.level}</Text>
            <Text style={[s.logMsg, {color: colors.text}]} numberOfLines={2}>{l.message}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40},
  backBtn: {padding: 8},
  backText: {fontSize: 16, fontWeight: '700'},
  title: {fontSize: 18, fontWeight: '900', letterSpacing: 1},
  btnRow: {flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12},
  btn: {flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  list: {flex: 1, marginHorizontal: 16},
  logRow: {flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', alignItems: 'flex-start'},
  logTime: {fontSize: 9, fontFamily: 'monospace', width: 60},
  logLevel: {fontSize: 9, fontWeight: '700', width: 40},
  logMsg: {fontSize: 10, flex: 1, fontFamily: 'monospace'},
  empty: {textAlign: 'center', marginVertical: 40, fontSize: 13},
});
