import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import {obd2Service, OBD2Data} from '../services/OBD2Service';
import {loadSettings, saveSettings, getSettings} from '../services/AppSettings';
import {useTheme} from '../services/ThemeContext';

interface Props {
  onBack: () => void;
}

const PARAM_META: {
  key: keyof OBD2Data;
  label: string;
  unit: string;
  color: string;
  category: string;
}[] = [
  {key: 'rpm', label: 'Motor Devri', unit: 'RPM', color: '#00bfff', category: 'motor'},
  {key: 'speed', label: 'Hız', unit: 'KM/H', color: '#00ff7f', category: 'sürüş'},
  {key: 'coolantTemp', label: 'Soğutma Sıvısı', unit: '°C', color: '#ff9ff3', category: 'motor'},
  {key: 'engineLoad', label: 'Motor Yükü', unit: '%', color: '#feca57', category: 'motor'},
  {key: 'map', label: 'MAP Emme Basıncı', unit: 'kPa', color: '#ff4757', category: 'hava'},
  {key: 'barometricPressure', label: 'Barometrik Basınç', unit: 'kPa', color: '#f72585', category: 'hava'},
  {key: 'intakeTemp', label: 'Emme Havası', unit: '°C', color: '#ff6348', category: 'hava'},
  {key: 'maf', label: 'MAF Sensörü', unit: 'g/s', color: '#7bed9f', category: 'hava'},
  {key: 'absoluteLoad', label: 'Mutlak Motor Yükü', unit: '%', color: '#7209b7', category: 'motor'},
  {key: 'throttlePos', label: 'Gaz Kelebeği', unit: '%', color: '#70a1ff', category: 'hava'},
  {key: 'relativeThrottlePos', label: 'Rel. Gaz Kelebeği', unit: '%', color: '#3a0ca3', category: 'hava'},
  {key: 'timingAdvance', label: 'Ateşleme Avansı', unit: '°', color: '#2ed573', category: 'motor'},
  {key: 'fuelSystemStatus', label: 'Yakıt Sistemi', unit: '', color: '#4cc9f0', category: 'yakıt'},
  {key: 'shortTermFuelTrim', label: 'ST Yakıt Düz. B1', unit: '%', color: '#ffafcc', category: 'yakıt'},
  {key: 'longTermFuelTrim', label: 'LT Yakıt Düz. B1', unit: '%', color: '#cdb4db', category: 'yakıt'},
  {key: 'shortTermFuelTrim2', label: 'ST Yakıt Düz. B2', unit: '%', color: '#ffc8dd', category: 'yakıt'},
  {key: 'longTermFuelTrim2', label: 'LT Yakıt Düz. B2', unit: '%', color: '#bde0fe', category: 'yakıt'},
  {key: 'commandedAFR', label: 'Hedef Hava/Yakıt', unit: 'λ', color: '#a2d2ff', category: 'yakıt'},
  {key: 'o2Sensor1Voltage', label: 'O2 Sensör 1 (B1S1)', unit: 'V', color: '#f94144', category: 'egzoz'},
  {key: 'o2Sensor2Voltage', label: 'O2 Sensör 2 (B1S2)', unit: 'V', color: '#f3722c', category: 'egzoz'},
  {key: 'catalystTempBank1', label: 'Katalitik Konv. Sıcak', unit: '°C', color: '#f8961e', category: 'egzoz'},
  {key: 'fuelPressure', label: 'Yakıt Basıncı (Mutlak)', unit: 'kPa', color: '#e056fd', category: 'yakıt'},
  {key: 'fuelRailPressureRelative', label: 'Yakıt Basıncı (Rel.)', unit: 'kPa', color: '#c77dff', category: 'yakıt'},
  {key: 'ethanolPercent', label: 'Etanol Oranı', unit: '%', color: '#4361ee', category: 'yakıt'},
  {key: 'fuelLevel', label: 'Yakıt Seviyesi', unit: '%', color: '#ffa502', category: 'yakıt'},
  {key: 'batteryVoltage', label: 'Akü Voltajı', unit: 'V', color: '#8ecae6', category: 'elektrik'},
  {key: 'ambientTemp', label: 'Dış Hava Sıcaklığı', unit: '°C', color: '#48cae4', category: 'çevre'},
  {key: 'distanceSinceDTCClear', label: 'DTC Sonrası Mesafe', unit: 'km', color: '#52b788', category: 'diğer'},
  {key: 'runTime', label: 'Motor Çalışma Süresi', unit: 'sn', color: '#00b4d8', category: 'motor'},
  {key: 'engineOilTemp', label: 'Motor Yağı Sıcaklığı', unit: '°C', color: '#e63946', category: 'motor'},
  {key: 'fuelRate', label: 'Yakıt Tüketimi', unit: 'L/h', color: '#e9c46a', category: 'yakıt'},
  {key: 'distanceWithMIL', label: 'MIL Açık Mesafe', unit: 'km', color: '#f4a261', category: 'diğer'},
  {key: 'timeSinceDTCClear', label: 'DTC Sonrası Süre', unit: 'dk', color: '#264653', category: 'diğer'},
  {key: 'absoluteThrottleB', label: 'Gaz Kelebeği B', unit: '%', color: '#2a9d8f', category: 'hava'},
  {key: 'absoluteThrottleC', label: 'Gaz Kelebeği C', unit: '%', color: '#8338ec', category: 'hava'},
  {key: 'commandedThrottleActuator', label: 'Komuta Edilen Gaz', unit: '%', color: '#fb5607', category: 'hava'},
  {key: 'acceleratorPosD', label: 'Gaz Pedalı (Poz D)', unit: '%', color: '#ff006e', category: 'sürüş'},
  {key: 'warmUpsSinceDTCClear', label: 'DTC Sonrası Isınma', unit: 'adet', color: '#3a86ff', category: 'diğer'},
  {key: 'fuelType', label: 'Yakıt Tipi', unit: '', color: '#ffbe0b', category: 'yakıt'},
  {key: 'timeWithMIL', label: 'MIL Süresi', unit: 'dk', color: '#d00000', category: 'diğer'},
  {key: 'injectionTiming', label: 'Enjeksiyon Zamanlaması', unit: '°', color: '#6a040f', category: 'motor'},
  {key: 'catalystTempBank2', label: 'Katalitik Konv. B2 Sıcak', unit: '°C', color: '#e85d04', category: 'egzoz'},
  {key: 'wideRangeO2B1S1', label: 'Geniş Bant O2 B1S1', unit: 'λ', color: '#008000', category: 'egzoz'},
  {key: 'acceleratorPosE', label: 'Gaz Pedalı (Poz E)', unit: '%', color: '#9d4edd', category: 'sürüş'},
  {key: 'acceleratorPosF', label: 'Gaz Pedalı (Poz F)', unit: '%', color: '#7b2cbf', category: 'sürüş'},
];

const CATEGORIES = [
  {key: '', label: 'TÜMÜ'},
  {key: 'motor', label: 'Motor'},
  {key: 'sürüş', label: 'Sürüş'},
  {key: 'hava', label: 'Hava'},
  {key: 'yakıt', label: 'Yakıt'},
  {key: 'egzoz', label: 'Egzoz'},
  {key: 'elektrik', label: 'Elektrik'},
  {key: 'çevre', label: 'Çevre'},
  {key: 'diğer', label: 'Diğer'},
];

export default function LiveDataScreen({onBack}: Props) {
  const {colors, darkMode} = useTheme();
  const [data, setData] = useState<OBD2Data>({
    rpm: 0, speed: 0, coolantTemp: 0, engineLoad: 0, intakeTemp: 0,
    maf: 0, throttlePos: 0, fuelLevel: 0, fuelPressure: 0, timingAdvance: 0,
    map: 0, batteryVoltage: 0, ambientTemp: 0, shortTermFuelTrim: 0,
    longTermFuelTrim: 0, commandedAFR: 0, barometricPressure: 0, absoluteLoad: 0,
    relativeThrottlePos: 0, ethanolPercent: 0, fuelSystemStatus: '', o2Sensor1Voltage: 0,
    o2Sensor2Voltage: 0, catalystTempBank1: 0, shortTermFuelTrim2: 0, longTermFuelTrim2: 0,
    distanceSinceDTCClear: 0, fuelRailPressureRelative: 0,
    runTime: 0, engineOilTemp: 0, fuelRate: 0, distanceWithMIL: 0,
    timeSinceDTCClear: 0, absoluteThrottleB: 0, absoluteThrottleC: 0,
    commandedThrottleActuator: 0, acceleratorPosD: 0, warmUpsSinceDTCClear: 0,
    fuelType: '',
    timeWithMIL: 0, injectionTiming: 0, catalystTempBank2: 0,
    wideRangeO2B1S1: 0, acceleratorPosE: 0, acceleratorPosF: 0,
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [pinned, setPinned] = useState<string[]>([]);
  const [listView, setListView] = useState(false);
  const [fuelCost, setFuelCost] = useState(0);
  const [fuelUsed, setFuelUsed] = useState(0);
  const fuelPriceRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const fuelConsumedRef = useRef(0);

  useEffect(() => {
    loadSettings().then(() => {
      const s = getSettings();
      setPinned(s.pinnedSensors);
      fuelPriceRef.current = s.fuelPricePerLiter;
    });
    obd2Service.onDataUpdate(d => {
      setData({...d});
      const now = Date.now();
      if (lastUpdateRef.current > 0 && d.fuelRate > 0) {
        const dt = (now - lastUpdateRef.current) / 1000;
        const l = d.fuelRate * dt / 3600;
        fuelConsumedRef.current += l;
        setFuelUsed(fuelConsumedRef.current);
        setFuelCost(fuelConsumedRef.current * fuelPriceRef.current);
      }
      lastUpdateRef.current = now;
    });
  }, []);

  const togglePin = useCallback(async (key: string) => {
    setPinned(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      saveSettings({pinnedSensors: next});
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PARAM_META.filter(p => {
      if (category && p.category !== category) return false;
      if (q && !p.label.toLowerCase().includes(q) && !p.key.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, category]);

  const pinnedMeta = useMemo(() => pinned.map(k => PARAM_META.find(p => p.key === k)).filter(Boolean) as typeof PARAM_META, [pinned]);

  const fmt = (p: typeof PARAM_META[0]): string => {
    const val = data[p.key];
    if (p.key === 'fuelSystemStatus' || p.key === 'fuelType') return String(val);
    if (['maf','batteryVoltage','commandedAFR','o2Sensor1Voltage','o2Sensor2Voltage','fuelRailPressureRelative','fuelRate','wideRangeO2B1S1','injectionTiming'].includes(p.key)) {
      return (val as number).toFixed(1);
    }
    if (p.key.includes('FuelTrim') || p.key.includes('shortTerm') || p.key.includes('longTerm')) {
      const n = val as number;
      return (n > 0 ? '+' : '') + n;
    }
    return String(val);
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, {color: colors.accent}]}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>CANLI VERİ</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setListView(v => !v)} style={styles.viewToggle}>
            <Text style={styles.viewToggleText}>{listView ? '📰' : '📱'}</Text>
          </TouchableOpacity>
          <Text style={[styles.countText, {color: colors.textMuted}]}>{filtered.length}</Text>
        </View>
      </View>

      {fuelPriceRef.current > 0 && fuelUsed > 0 && (
        <View style={[styles.fuelCostRow, {backgroundColor: colors.card, borderColor: 'rgba(255,165,2,0.2)'}]}>
          <Text style={[styles.fuelCostLabel, {color: colors.textDim}]}>⛽ Toplam Yakıt</Text>
          <Text style={styles.fuelCostValue}>
            <Text style={{color:'#e9c46a', fontWeight:'900'}}>{fuelUsed.toFixed(2)} L</Text>
            <Text style={{color:'rgba(255,255,255,0.3)'}}> / </Text>
            <Text style={{color:'#ffa502', fontWeight:'900'}}>₺{fuelCost.toFixed(1)}</Text>
          </Text>
        </View>
      )}

      {pinnedMeta.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pinnedRow}>
          {pinnedMeta.map(p => (
            <TouchableOpacity key={p.key} style={[styles.pinnedCard, {borderColor: p.color}]} onPress={() => togglePin(p.key)}>
              <Text style={[styles.pinnedVal, {color: p.color}]}>{fmt(p)}</Text>
              <Text style={[styles.pinnedUnit, {color: colors.textMuted}]}>{p.unit}</Text>
              <Text style={[styles.pinnedLabel, {color: colors.textDim}]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TextInput
        style={[styles.searchInput, {backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder}]}
        placeholder="Sensör ara..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.catRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.catBtn, {backgroundColor: colors.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}, category === c.key && {backgroundColor: colors.accent + '33'}]}
            onPress={() => setCategory(category === c.key ? '' : c.key)}>
            <Text style={[styles.catText, {color: colors.textDim}, category === c.key && {color: colors.accent}]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={listView ? styles.list : styles.grid} nestedScrollEnabled>
        {filtered.map(p => {
          const val = fmt(p);
          const isPinned = pinned.includes(p.key);
          if (listView) {
            return (
              <TouchableOpacity key={p.key} style={[styles.listCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}, isPinned && {borderColor: p.color, borderWidth: 1.5}]} onPress={() => togglePin(p.key)} activeOpacity={0.6}>
                <View style={styles.listLeft}>
                  <Text style={[styles.listLabel, {color: colors.text}]}>{p.label}</Text>
                  <Text style={[styles.listUnit, {color: colors.textMuted}]}>{p.unit}</Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={[styles.listValue, {color: p.color}]}>{val}</Text>
                  {isPinned && <Text style={styles.listPin}>📌</Text>}
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={p.key} style={[styles.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}, isPinned && {borderColor: p.color, borderWidth: 2}]} onPress={() => togglePin(p.key)} activeOpacity={0.6}>
              <Text style={[styles.value, {color: p.color}]}>{val}</Text>
              <Text style={[styles.unit, {color: colors.textMuted}]}>{p.unit}</Text>
              <Text style={[styles.label, {color: colors.textDim}]}>{p.label}</Text>
              {isPinned && <Text style={styles.pinBadge}>📌</Text>}
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <Text style={[styles.noResult, {color: colors.textMuted}]}>Eşleşen sensör bulunamadı.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0b10'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40},
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  countText: {color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '700'},
  pinnedRow: {paddingHorizontal: 16, marginBottom: 8, maxHeight: 90},
  pinnedCard: {backgroundColor: 'rgba(30,33,40,0.9)', borderRadius: 14, padding: 10, marginRight: 10, borderWidth: 1, minWidth: 80, alignItems: 'center'},
  pinnedVal: {fontSize: 20, fontWeight: '900'},
  pinnedUnit: {color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold'},
  pinnedLabel: {color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center'},
  searchInput: {backgroundColor: 'rgba(30,33,40,0.7)', borderRadius: 16, marginHorizontal: 16, marginBottom: 8, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  catRow: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 8, gap: 6},
  catBtn: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)'},
  catBtnActive: {backgroundColor: 'rgba(0,191,255,0.2)'},
  catText: {color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5},
  catTextActive: {color: '#00bfff'},
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  viewToggle: {padding: 4},
  viewToggleText: {fontSize: 18},
  noResult: {color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginVertical: 60, fontSize: 14, width: '100%'},
  list: {padding: 10, paddingBottom: 40},
  listCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,33,40,0.7)', borderRadius: 16, padding: 16, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  listLeft: {flex: 1},
  listLabel: {color: '#fff', fontSize: 14, fontWeight: '600'},
  listUnit: {color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2},
  listRight: {flexDirection: 'row', alignItems: 'center', gap: 6},
  listValue: {fontSize: 20, fontWeight: '900'},
  listPin: {fontSize: 14},
  grid: {flexDirection: 'row', flexWrap: 'wrap', padding: 10, paddingBottom: 40},
  card: {width: '46%', margin: '2%', backgroundColor: 'rgba(30,33,40,0.7)', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  value: {fontSize: 28, fontWeight: '900'},
  unit: {color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 'bold', marginTop: 2},
  label: {color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 8, textAlign: 'center'},
  pinBadge: {position: 'absolute', top: 6, right: 8, fontSize: 12},
  fuelCostRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(30,33,40,0.8)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,165,2,0.2)'},
  fuelCostLabel: {color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700'},
  fuelCostValue: {fontSize: 16, fontWeight: '700'},
});
