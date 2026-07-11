import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Platform,
  Vibration,
  Alert,
} from 'react-native';
import {obd2Service, OBD2Data} from '../services/OBD2Service';
import {OEM_SENSORS} from '../services/OemSensors';
import {loadSettings, saveSettings, getSettings} from '../services/AppSettings';
import {useTheme} from '../services/ThemeContext';
import {voiceAlertService} from '../services/VoiceAlertService';
import CyberBar from '../components/CyberBar';

interface Props {
  onBack: () => void;
}

const PARAM_META: {
  key: string;
  label: string;
  unit: string;
  color: string;
  category: string;
}[] = [
  {
    key: 'rpm',
    label: 'Motor Devri',
    unit: 'RPM',
    color: '#00bfff',
    category: 'motor',
  },
  {
    key: 'speed',
    label: 'Hız',
    unit: 'KM/H',
    color: '#00ff7f',
    category: 'sürüş',
  },
  {
    key: 'coolantTemp',
    label: 'Soğutma Sıvısı',
    unit: '°C',
    color: '#ff9ff3',
    category: 'motor',
  },
  {
    key: 'engineLoad',
    label: 'Motor Yükü',
    unit: '%',
    color: '#feca57',
    category: 'motor',
  },
  {
    key: 'map',
    label: 'MAP Emme Basıncı',
    unit: 'kPa',
    color: '#ff4757',
    category: 'hava',
  },
  {
    key: 'barometricPressure',
    label: 'Barometrik Basınç',
    unit: 'kPa',
    color: '#f72585',
    category: 'hava',
  },
  {
    key: 'intakeTemp',
    label: 'Emme Havası',
    unit: '°C',
    color: '#ff6348',
    category: 'hava',
  },
  {
    key: 'maf',
    label: 'MAF Sensörü',
    unit: 'g/s',
    color: '#7bed9f',
    category: 'hava',
  },
  {
    key: 'absoluteLoad',
    label: 'Mutlak Motor Yükü',
    unit: '%',
    color: '#7209b7',
    category: 'motor',
  },
  {
    key: 'throttlePos',
    label: 'Gaz Kelebeği',
    unit: '%',
    color: '#70a1ff',
    category: 'hava',
  },
  {
    key: 'relativeThrottlePos',
    label: 'Rel. Gaz Kelebeği',
    unit: '%',
    color: '#3a0ca3',
    category: 'hava',
  },
  {
    key: 'timingAdvance',
    label: 'Ateşleme Avansı',
    unit: '°',
    color: '#2ed573',
    category: 'motor',
  },
  {
    key: 'fuelSystemStatus',
    label: 'Yakıt Sistemi',
    unit: '',
    color: '#4cc9f0',
    category: 'yakıt',
  },
  {
    key: 'shortTermFuelTrim',
    label: 'ST Yakıt Düz. B1',
    unit: '%',
    color: '#ffafcc',
    category: 'yakıt',
  },
  {
    key: 'longTermFuelTrim',
    label: 'LT Yakıt Düz. B1',
    unit: '%',
    color: '#cdb4db',
    category: 'yakıt',
  },
  {
    key: 'shortTermFuelTrim2',
    label: 'ST Yakıt Düz. B2',
    unit: '%',
    color: '#ffc8dd',
    category: 'yakıt',
  },
  {
    key: 'longTermFuelTrim2',
    label: 'LT Yakıt Düz. B2',
    unit: '%',
    color: '#bde0fe',
    category: 'yakıt',
  },
  {
    key: 'commandedAFR',
    label: 'Hedef Hava/Yakıt',
    unit: 'λ',
    color: '#a2d2ff',
    category: 'yakıt',
  },
  {
    key: 'o2Sensor1Voltage',
    label: 'O2 Sensör 1 (B1S1)',
    unit: 'V',
    color: '#f94144',
    category: 'egzoz',
  },
  {
    key: 'o2Sensor2Voltage',
    label: 'O2 Sensör 2 (B1S2)',
    unit: 'V',
    color: '#f3722c',
    category: 'egzoz',
  },
  {
    key: 'catalystTempBank1',
    label: 'Katalitik Konv. Sıcak',
    unit: '°C',
    color: '#f8961e',
    category: 'egzoz',
  },
  {
    key: 'fuelPressure',
    label: 'Yakıt Basıncı (Mutlak)',
    unit: 'kPa',
    color: '#e056fd',
    category: 'yakıt',
  },
  {
    key: 'fuelRailPressureRelative',
    label: 'Yakıt Basıncı (Rel.)',
    unit: 'kPa',
    color: '#c77dff',
    category: 'yakıt',
  },
  {
    key: 'ethanolPercent',
    label: 'Etanol Oranı',
    unit: '%',
    color: '#4361ee',
    category: 'yakıt',
  },
  {
    key: 'fuelLevel',
    label: 'Yakıt Seviyesi',
    unit: '%',
    color: '#ffa502',
    category: 'yakıt',
  },
  {
    key: 'batteryVoltage',
    label: 'Akü Voltajı',
    unit: 'V',
    color: '#8ecae6',
    category: 'elektrik',
  },
  {
    key: 'ambientTemp',
    label: 'Dış Hava Sıcaklığı',
    unit: '°C',
    color: '#48cae4',
    category: 'çevre',
  },
  {
    key: 'distanceSinceDTCClear',
    label: 'DTC Sonrası Mesafe',
    unit: 'km',
    color: '#52b788',
    category: 'diğer',
  },
  {
    key: 'runTime',
    label: 'Motor Çalışma Süresi',
    unit: 'sn',
    color: '#00b4d8',
    category: 'motor',
  },
  {
    key: 'engineOilTemp',
    label: 'Motor Yağı Sıcaklığı',
    unit: '°C',
    color: '#e63946',
    category: 'motor',
  },
  {
    key: 'fuelRate',
    label: 'Yakıt Tüketimi',
    unit: 'L/h',
    color: '#e9c46a',
    category: 'yakıt',
  },
  {
    key: 'distanceWithMIL',
    label: 'MIL Açık Mesafe',
    unit: 'km',
    color: '#f4a261',
    category: 'diğer',
  },
  {
    key: 'timeSinceDTCClear',
    label: 'DTC Sonrası Süre',
    unit: 'dk',
    color: '#264653',
    category: 'diğer',
  },
  {
    key: 'absoluteThrottleB',
    label: 'Gaz Kelebeği B',
    unit: '%',
    color: '#2a9d8f',
    category: 'hava',
  },
  {
    key: 'absoluteThrottleC',
    label: 'Gaz Kelebeği C',
    unit: '%',
    color: '#8338ec',
    category: 'hava',
  },
  {
    key: 'commandedThrottleActuator',
    label: 'Komuta Edilen Gaz',
    unit: '%',
    color: '#fb5607',
    category: 'hava',
  },
  {
    key: 'acceleratorPosD',
    label: 'Gaz Pedalı (Poz D)',
    unit: '%',
    color: '#ff006e',
    category: 'sürüş',
  },
  {
    key: 'warmUpsSinceDTCClear',
    label: 'DTC Sonrası Isınma',
    unit: 'adet',
    color: '#3a86ff',
    category: 'diğer',
  },
  {
    key: 'fuelType',
    label: 'Yakıt Tipi',
    unit: '',
    color: '#ffbe0b',
    category: 'yakıt',
  },
  {
    key: 'timeWithMIL',
    label: 'MIL Süresi',
    unit: 'dk',
    color: '#d00000',
    category: 'diğer',
  },
  {
    key: 'injectionTiming',
    label: 'Enjeksiyon Zamanlaması',
    unit: '°',
    color: '#6a040f',
    category: 'motor',
  },
  {
    key: 'catalystTempBank2',
    label: 'Katalitik Konv. B2 Sıcak',
    unit: '°C',
    color: '#e85d04',
    category: 'egzoz',
  },
  {
    key: 'wideRangeO2B1S1',
    label: 'Geniş Bant O2 B1S1',
    unit: 'λ',
    color: '#008000',
    category: 'egzoz',
  },
  {
    key: 'acceleratorPosE',
    label: 'Gaz Pedalı (Poz E)',
    unit: '%',
    color: '#9d4edd',
    category: 'sürüş',
  },
  {
    key: 'acceleratorPosF',
    label: 'Gaz Pedalı (Poz F)',
    unit: '%',
    color: '#7b2cbf',
    category: 'sürüş',
  },
  {
    key: 'fuelRailPressureAbsolute',
    label: 'Yakıt Basıncı (Mutlak)',
    unit: 'kPa',
    color: '#e0aaff',
    category: 'yakıt',
  },
  {
    key: 'egtBank1',
    label: 'Egzoz Sıcaklığı B1',
    unit: '°C',
    color: '#ff6d00',
    category: 'egzoz',
  },
  {
    key: 'evapVaporPressure',
    label: 'Evap Buhar Basıncı',
    unit: 'Pa',
    color: '#80ffdb',
    category: 'yakıt',
  },
  {
    key: 'relativePedalPos',
    label: 'Rel. Gaz Pedalı',
    unit: '%',
    color: '#c77dff',
    category: 'sürüş',
  },
  {
    key: 'commandedEgr',
    label: 'EGR Komutu',
    unit: '%',
    color: '#2b9348',
    category: 'motor',
  },
  {
    key: 'egrError',
    label: 'EGR Hatası',
    unit: '%',
    color: '#d62828',
    category: 'motor',
  },
  {
    key: 'actualEgr',
    label: 'Gerçek EGR Oranı',
    unit: '%',
    color: '#55a630',
    category: 'motor',
  },
  {
    key: 'egrErrorDuty',
    label: 'EGR Hata Oranı',
    unit: '%',
    color: '#e63946',
    category: 'motor',
  },
  {
    key: 'commandedEvapPurge',
    label: 'Evap Purge Komutu',
    unit: '%',
    color: '#b5838d',
    category: 'yakıt',
  },
  {
    key: 'commandedEvapPurgeFlow',
    label: 'Evap Purge Akışı',
    unit: '%',
    color: '#6d597a',
    category: 'yakıt',
  },
  {
    key: 'o2B1S1EquivRatio',
    label: 'O2 Lambda B1S1',
    unit: 'λ',
    color: '#0077b6',
    category: 'egzoz',
  },
  {
    key: 'o2B1S2EquivRatio',
    label: 'O2 Lambda B1S2',
    unit: 'λ',
    color: '#0096c7',
    category: 'egzoz',
  },
  {
    key: 'secondaryAirStatus',
    label: 'İkincil Hava Sistemi',
    unit: '',
    color: '#48dbfb',
    category: 'hava',
  },
  {
    key: 'obdStandard',
    label: 'Araç OBD Standardı',
    unit: '',
    color: '#1dd1a1',
    category: 'diğer',
  },
  {
    key: 'evapVaporPressureAbsolute',
    label: 'Mutlak EVAP Basıncı',
    unit: 'kPa',
    color: '#ff9ff3',
    category: 'yakıt',
  },
  {
    key: 'egtBank2',
    label: 'Egzoz Sıcaklığı B2',
    unit: '°C',
    color: '#ff6b6b',
    category: 'egzoz',
  },
  {
    key: 'turboCompressorInletPressure',
    label: 'Turbo Giriş Basıncı',
    unit: 'kPa',
    color: '#5f27cd',
    category: 'hava',
  },
  {
    key: 'vgtControl',
    label: 'VGT Turbo Kontrolü',
    unit: '%',
    color: '#c8d6e5',
    category: 'hava',
  },
  {
    key: 'wastegateControl',
    label: 'Wastegate Kontrolü',
    unit: '%',
    color: '#54a0ff',
    category: 'hava',
  },
  {
    key: 'turboTemp',
    label: 'Turbo Sıcaklığı',
    unit: '°C',
    color: '#ff4757',
    category: 'motor',
  },
  {
    key: 'fuelPressureControl',
    label: 'Yakıt Basınç Kontrol',
    unit: '%',
    color: '#e1b12c',
    category: 'yakıt',
  },
  {
    key: 'injectionPressureControl',
    label: 'Enj. Basınç Kontrol',
    unit: '%',
    color: '#fbc531',
    category: 'yakıt',
  },
  {
    key: 'catalystTempBank1Sensor2',
    label: 'Kat. Konv. B1S2 Sıcaklık',
    unit: '°C',
    color: '#f39c12',
    category: 'egzoz',
  },
  {
    key: 'catalystTempBank2Sensor2',
    label: 'Kat. Konv. B2S2 Sıcaklık',
    unit: '°C',
    color: '#d35400',
    category: 'egzoz',
  },
  {
    key: 'boostPressureControl',
    label: 'Boost Basınç Kontrol',
    unit: 'kPa',
    color: '#2980b9',
    category: 'hava',
  },
  {
    key: 'dpfBypassPressure',
    label: 'DPF Bypass Basıncı',
    unit: 'kPa',
    color: '#8e44ad',
    category: 'egzoz',
  },
  {
    key: 'noxNTEControlStatus',
    label: 'NOx Kontrol Durumu',
    unit: '',
    color: '#16a085',
    category: 'çevre',
  },
  {
    key: 'pmNTEControlStatus',
    label: 'PM Kontrol Durumu',
    unit: '',
    color: '#27ae60',
    category: 'çevre',
  },
  {
    key: 'engineAuxiliarySupported',
    label: 'Motor Ek Donanım',
    unit: '',
    color: '#7f8c8d',
    category: 'motor',
  },
  {
    key: 'o2Sensor3Voltage',
    label: 'O2 Sensör 3 Voltajı',
    unit: 'V',
    color: '#c0392b',
    category: 'egzoz',
  },
  {
    key: 'o2Sensor4Voltage',
    label: 'O2 Sensör 4 Voltajı',
    unit: 'V',
    color: '#e74c3c',
    category: 'egzoz',
  },
  {
    key: 'o2Sensor5Voltage',
    label: 'O2 Sensör 5 Voltajı',
    unit: 'V',
    color: '#e67e22',
    category: 'egzoz',
  },
  {
    key: 'o2Sensor6Voltage',
    label: 'O2 Sensör 6 Voltajı',
    unit: 'V',
    color: '#f1c40f',
    category: 'egzoz',
  },
  {
    key: 'o2Sensor7Voltage',
    label: 'O2 Sensör 7 Voltajı',
    unit: 'V',
    color: '#f39c12',
    category: 'egzoz',
  },
  {
    key: 'o2Sensor8Voltage',
    label: 'O2 Sensör 8 Voltajı',
    unit: 'V',
    color: '#d35400',
    category: 'egzoz',
  },
  {
    key: 'shortTermO2TrimB1',
    label: 'Kısa O2 Trim B1',
    unit: '%',
    color: '#27ae60',
    category: 'yakıt',
  },
  {
    key: 'longTermO2TrimB1',
    label: 'Uzun O2 Trim B1',
    unit: '%',
    color: '#2ecc71',
    category: 'yakıt',
  },
  {
    key: 'mafSensorA',
    label: 'MAF Sensör A',
    unit: 'g/s',
    color: '#2980b9',
    category: 'hava',
  },
  {
    key: 'mafSensorB',
    label: 'MAF Sensör B',
    unit: 'g/s',
    color: '#3498db',
    category: 'hava',
  },
  {
    key: 'engineCoolantTemp2',
    label: 'Motor Suyu Sıcaklığı 2',
    unit: '°C',
    color: '#c0392b',
    category: 'motor',
  },
  {
    key: 'intakeAirTemp2',
    label: 'Emme Havası Sıcaklığı 2',
    unit: '°C',
    color: '#f39c12',
    category: 'hava',
  },

  {
    key: 'widebandO2S2',
    label: 'Geniş Bant O2 B1S2',
    unit: 'V',
    color: '#9b59b6',
    category: 'egzoz',
  },
  {
    key: 'widebandO2S3',
    label: 'Geniş Bant O2 B1S3',
    unit: 'V',
    color: '#16a085',
    category: 'egzoz',
  },
  {
    key: 'oem_vag_dsg_pres',
    label: 'DSG Kavrama Basıncı (VAG)',
    unit: 'Bar',
    color: '#eb4d4b',
    category: 'şanzıman',
  },
  {
    key: 'oem_vag_haldex',
    label: 'Haldex Yağ Sıcaklığı (VAG)',
    unit: '°C',
    color: '#686de0',
    category: 'şasi',
  },
  {
    key: 'oem_alfa_dna',
    label: 'DNA Mod Durumu (Alfa)',
    unit: '',
    color: '#e056fd',
    category: 'sürüş',
  },
  {
    key: 'oem_volvo_dpf_diff',
    label: 'DPF Fark Basıncı (Volvo)',
    unit: 'hPa',
    color: '#4834d4',
    category: 'egzoz',
  },
  {
    key: 'oem_nissan_attesa',
    label: 'ATTESA AWD (Nissan)',
    unit: '% (Ön)',
    color: '#be2edd',
    category: 'şasi',
  },
  {
    key: 'oem_generic_tpms1',
    label: 'TPMS Sol Ön (Genel)',
    unit: 'PSI',
    color: '#22a6b3',
    category: 'şasi',
  },
  {
    key: 'oem_bmw_battery_soc',
    label: 'Akü Şarj Durumu (BMW)',
    unit: '%',
    color: '#f9ca24',
    category: 'elektrik',
  },
  {
    key: 'oem_mb_oil_temp',
    label: 'AMG Motor Yağı',
    unit: '°C',
    color: '#eb4d4b',
    category: 'motor',
  },
  {
    key: 'oem_vag_misfire_1',
    label: 'Silindir 1 Tekleme (VAG)',
    unit: 'Kez',
    color: '#ff7979',
    category: 'motor',
  },
  {
    key: 'oem_lr_def_level',
    label: 'AdBlue Seviyesi (LR)',
    unit: '%',
    color: '#c7ecee',
    category: 'egzoz',
  },
  {
    key: 'fuelConsumption',
    label: 'Anlık Yakıt Tüketimi',
    unit: 'L/100km',
    color: '#e056fd',
    category: 'yakıt',
  },
  {
    key: 'turboBoostPressure',
    label: 'Turbo Basıncı',
    unit: 'kPa',
    color: '#f9ca24',
    category: 'motor',
  },
  {
    key: 'odometer',
    label: 'Odometre',
    unit: 'km',
    color: '#bdc3c7',
    category: 'sürüş',
  },
  {
    key: 'widebandO2S1',
    label: 'Geniş Bant O2 Sensör 1 (Lambda)',
    unit: 'EqRatio',
    color: '#ffbe76',
    category: 'egzoz',
  },
  {
    key: 'actualEngineTorque',
    label: 'Gerçek Motor Torku',
    unit: '%',
    color: '#eb4d4b',
    category: 'motor',
  },
  {
    key: 'driverDemandTorque',
    label: 'Sürücü Talep Torku',
    unit: '%',
    color: '#ff7979',
    category: 'motor',
  },
  {
    key: 'engineReferenceTorque',
    label: 'Referans Tork',
    unit: 'Nm',
    color: '#ff7979',
    category: 'motor',
  },
];

OEM_SENSORS.forEach(sensor => {
  PARAM_META.push({
    key: sensor.id as any,
    label: sensor.name,
    unit: sensor.unit,
    color: sensor.color || '#ffffff',
    category: sensor.category || 'diğer',
  });
});

const CATEGORIES = [
  {key: '', label: 'TÜMÜ'},
  {key: 'motor', label: 'Motor'},
  {key: 'sürüş', label: 'Sürüş'},
  {key: 'şasi', label: 'Şasi'},
  {key: 'şanzıman', label: 'Şanzıman'},
  {key: 'hava', label: 'Hava'},
  {key: 'yakıt', label: 'Yakıt'},
  {key: 'egzoz', label: 'Egzoz'},
  {key: 'elektrik', label: 'Elektrik'},
  {key: 'çevre', label: 'Çevre'},
  {key: 'diğer', label: 'Diğer'},
];

const SensorCard = React.memo(
  ({p, val, isPinned, togglePin, listView, colors}: any) => {
    if (listView) {
      return (
        <TouchableOpacity
          style={[
            styles.listCard,
            {backgroundColor: colors.card, borderColor: colors.cardBorder},
            isPinned && {borderColor: p.color, borderWidth: 1.5},
          ]}
          onPress={() => togglePin(p.key)}
          activeOpacity={0.6}>
          <View style={styles.listLeft}>
            <Text style={[styles.listLabel, {color: colors.text}]}>
              {p.label}
            </Text>
            <Text style={[styles.listUnit, {color: colors.textMuted}]}>
              {p.unit}
            </Text>
          </View>
          <View style={styles.listRight}>
            <Text style={[styles.listValue, {color: p.color}]}>{val}</Text>
            {isPinned && <Text style={styles.listPin}>📌</Text>}
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {backgroundColor: colors.card, borderColor: colors.cardBorder},
          isPinned && {borderColor: p.color, borderWidth: 2},
        ]}
        onPress={() => togglePin(p.key)}
        activeOpacity={0.6}>
        <Text style={[styles.value, {color: p.color}]}>{val}</Text>
        <Text style={[styles.unit, {color: colors.textMuted}]}>{p.unit}</Text>
        <Text style={[styles.label, {color: colors.textDim}]}>{p.label}</Text>
        {isPinned && <Text style={styles.pinBadge}>📌</Text>}
      </TouchableOpacity>
    );
  },
);

export default function LiveDataScreen({onBack}: Props) {
  const {colors, darkMode} = useTheme();
  const [showDashboard, setShowDashboard] = useState(false);
  const [data, setData] = useState<OBD2Data>({
    rpm: 0,
    speed: 0,
    coolantTemp: 0,
    engineLoad: 0,
    intakeTemp: 0,
    maf: 0,
    throttlePos: 0,
    fuelRate: 0,
    fuelConsumption: 0,
    fuelLevel: 0,
    fuelPressure: 0,
    timingAdvance: 0,
    map: 0,
    batteryVoltage: 0,
    ambientTemp: 0,
    shortTermFuelTrim: 0,
    longTermFuelTrim: 0,
    commandedAFR: 0,
    barometricPressure: 0,
    absoluteLoad: 0,
    relativeThrottlePos: 0,
    ethanolPercent: 0,
    fuelSystemStatus: '',
    o2Sensor1Voltage: 0,
    o2Sensor2Voltage: 0,
    catalystTempBank1: 0,
    shortTermFuelTrim2: 0,
    longTermFuelTrim2: 0,
    distanceSinceDTCClear: 0,
    fuelRailPressureRelative: 0,
    runTime: 0,
    engineOilTemp: 0,
    distanceWithMIL: 0,
    timeSinceDTCClear: 0,
    absoluteThrottleB: 0,
    absoluteThrottleC: 0,
    commandedThrottleActuator: 0,
    acceleratorPosD: 0,
    warmUpsSinceDTCClear: 0,
    fuelType: '',
    timeWithMIL: 0,
    injectionTiming: 0,
    catalystTempBank2: 0,
    wideRangeO2B1S1: 0,
    acceleratorPosE: 0,
    acceleratorPosF: 0,
    fuelRailPressureAbsolute: 0,
    egtBank1: 0,
    evapVaporPressure: 0,
    relativePedalPos: 0,
    commandedEgr: 0,
    egrError: 0,
    commandedEvapPurge: 0,
    o2B1S1EquivRatio: 0,
    o2B1S2EquivRatio: 0,
    actualEgr: 0,
    egrErrorDuty: 0,
    commandedEvapPurgeFlow: 0,
    milOn: false,
    dtcCount: 0,
    actualEngineTorque: 0,
    driverDemandTorque: 0,
    engineReferenceTorque: 0,
    turboBoostPressure: 0,
    odometer: 0,
    hybridBatteryLife: 0,
    dpfDifferentialPressure: 0,
    dpfTemp: 0,
    exhaustPressure: 0,
    turboRpm: 0,
    chargeAirCoolerTemp: 0,
    fuelRailGaugePressure: 0,
    engineFrictionTorque: 0,
    distanceSinceDTCClearHighRes: 0,
    throttlePositionG: 0,
    engineFuelRate: 0,

    secondaryAirStatus: '',
    obdStandard: '',
    evapVaporPressureAbsolute: 0,
    egtBank2: 0,
    turboCompressorInletPressure: 0,
    vgtControl: 0,
    wastegateControl: 0,
    turboTemp: 0,
    fuelPressureControl: 0,
    injectionPressureControl: 0,
    catalystTempBank1Sensor2: 0,
    catalystTempBank2Sensor2: 0,
    boostPressureControl: 0,
    dpfBypassPressure: 0,
    noxNTEControlStatus: 0,
    pmNTEControlStatus: 0,
    engineAuxiliarySupported: '',
    o2Sensor3Voltage: 0,
    o2Sensor4Voltage: 0,
    o2Sensor5Voltage: 0,
    o2Sensor6Voltage: 0,
    o2Sensor7Voltage: 0,
    o2Sensor8Voltage: 0,
    shortTermO2TrimB1: 0,
    longTermO2TrimB1: 0,
    mafSensorA: 0,
    mafSensorB: 0,
    engineCoolantTemp2: 0,
    intakeAirTemp2: 0,
    engineRunTime: 0,
    widebandO2S1: 0,
    widebandO2S2: 0,
    widebandO2S3: 0,
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [pinned, setPinned] = useState<string[]>([]);
  const [listView, setListView] = useState(false);
  const [isHudMode, setIsHudMode] = useState(false);
  const [fuelCost, setFuelCost] = useState(0);
  const [fuelUsed, setFuelUsed] = useState(0);
  const fuelPriceRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const fuelConsumedRef = useRef(0);

  // Hız Limiti Alarmı
  const [speedLimit, setSpeedLimit] = useState(120);
  const [speedAlertActive, setSpeedAlertActive] = useState(false);
  const [showSpeedLimitModal, setShowSpeedLimitModal] = useState(false);
  const [tempSpeedLimit, setTempSpeedLimit] = useState('120');
  const speedAlertRef = useRef(false);

  useEffect(() => {
    loadSettings().then(() => {
      const s = getSettings();
      setPinned(s.pinnedSensors);
      fuelPriceRef.current = s.fuelPricePerLiter;
    });
    const unsubscribe = obd2Service.onDataUpdate(d => {
      setData({...d});
      voiceAlertService.checkAlerts(d);
      const now = Date.now();
      if (lastUpdateRef.current > 0 && d.fuelRate > 0) {
        const dt = (now - lastUpdateRef.current) / 1000;
        const l = (d.fuelRate * dt) / 3600;
        fuelConsumedRef.current += l;
        setFuelUsed(fuelConsumedRef.current);
        setFuelCost(fuelConsumedRef.current * fuelPriceRef.current);
      }
      lastUpdateRef.current = now;

      // Hız limiti kontrolü
      const curSpeed = d.speed || 0;
      if (curSpeed > speedLimit && !speedAlertRef.current) {
        speedAlertRef.current = true;
        setSpeedAlertActive(true);
        Vibration.vibrate([0, 300, 200, 300]);
      } else if (curSpeed <= speedLimit && speedAlertRef.current) {
        speedAlertRef.current = false;
        setSpeedAlertActive(false);
      }
    });
    return () => unsubscribe();
  }, [speedLimit]);

  const togglePin = useCallback(async (key: string) => {
    setPinned(prev => {
      const next = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      saveSettings({pinnedSensors: next});
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PARAM_META.filter(p => {
      if (data._validKeys && !data._validKeys.includes(p.key as string)) {
        return false;
      }
      if (category && p.category !== category) {
        return false;
      }
      if (
        q &&
        !p.label.toLowerCase().includes(q) &&
        !p.key.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [search, category, data._validKeys]);

  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);

  const onViewableItemsChanged = useRef(({viewableItems}: any) => {
    setVisibleKeys(viewableItems.map((v: any) => v.item.key));
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;

  useEffect(() => {
    const cyberBarKeys = [
      'rpm',
      'speed',
      'coolantTemp',
      'engineLoad',
      'batteryVoltage',
    ];
    const toPrioritize = new Set([...cyberBarKeys, ...pinned, ...visibleKeys]);
    obd2Service.requestPriorityPids(Array.from(toPrioritize));
    return () => obd2Service.requestPriorityPids(pinned);
  }, [visibleKeys, pinned]);

  const pinnedMeta = useMemo(
    () =>
      pinned
        .map(k => PARAM_META.find(p => p.key === k))
        .filter(Boolean) as typeof PARAM_META,
    [pinned],
  );

  const fmt = (p: (typeof PARAM_META)[0]): string => {
    const val = data[p.key as keyof OBD2Data];
    if (p.key === 'fuelSystemStatus' || p.key === 'fuelType') {
      return String(val);
    }
    if (
      [
        'maf',
        'batteryVoltage',
        'commandedAFR',
        'o2Sensor1Voltage',
        'o2Sensor2Voltage',
        'fuelRailPressureRelative',
        'fuelRate',
        'wideRangeO2B1S1',
        'injectionTiming',
      ].includes(p.key)
    ) {
      return (val as number).toFixed(1);
    }
    if (
      p.key.includes('FuelTrim') ||
      p.key.includes('shortTerm') ||
      p.key.includes('longTerm')
    ) {
      const n = val as number;
      return (n > 0 ? '+' : '') + n;
    }
    return String(val);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[
        styles.container,
        {backgroundColor: isHudMode ? '#000000' : colors.bg},
      ]}>
      <View
        style={{flex: 1, transform: isHudMode ? [{scaleX: -1}] : undefined}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backText, {color: colors.accent}]}>
              ← GERİ
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, {color: colors.text}]}>CANLI VERİ</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              onPress={() => setShowDashboard(!showDashboard)}
              style={[styles.backButton, {marginRight: 10}]}>
              <Text style={{color: showDashboard ? '#00bfff' : colors.textDim}}>
                PANEL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsHudMode(!isHudMode)}
              style={[styles.backButton, {marginRight: 10}]}>
              <Text style={{color: isHudMode ? '#00bfff' : colors.textDim}}>
                HUD
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTempSpeedLimit(String(speedLimit));
                setShowSpeedLimitModal(true);
              }}
              style={[
                styles.backButton,
                {
                  marginRight: 8,
                  backgroundColor: speedAlertActive
                    ? 'rgba(255,71,87,0.2)'
                    : 'transparent',
                  borderRadius: 6,
                  paddingHorizontal: 6,
                },
              ]}>
              <Text
                style={{
                  color: speedAlertActive ? '#ff4757' : colors.textDim,
                  fontWeight: '800',
                  fontSize: 12,
                }}>
                {speedAlertActive ? `⚠️${data.speed}` : `🚧${speedLimit}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setListView(!listView)}
              style={styles.backButton}>
              <Text style={{color: colors.accent}}>
                {listView ? 'KUTULAR' : 'LİSTE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hız limiti aşıldı banner */}
        {speedAlertActive && (
          <View
            style={{
              backgroundColor: '#ff4757',
              paddingVertical: 8,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Text style={{color: '#fff', fontWeight: '900', fontSize: 13}}>
              {'⚠️ Hız Limiti Aşıldı! ' +
                data.speed +
                ' km/h > ' +
                speedLimit +
                ' km/h'}
            </Text>
          </View>
        )}

        {/* Hız limiti ayar modal */}
        {showSpeedLimitModal && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999,
            }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 24,
                width: 280,
                gap: 16,
                borderWidth: 1,
                borderColor: colors.accent + '44',
              }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '800',
                  textAlign: 'center',
                }}>
                🚧 Hız Limiti Alarmı
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                  textAlign: 'center',
                }}>
                Bu hızı aşınca titreme ve uyarı gösterilir.
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  padding: 12,
                  fontSize: 28,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
                value={tempSpeedLimit}
                onChangeText={setTempSpeedLimit}
                keyboardType="numeric"
                maxLength={3}
                placeholder="120"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: colors.inputBg,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowSpeedLimitModal(false)}>
                  <Text style={{color: colors.textMuted, fontWeight: '700'}}>
                    İPTAL
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const lim = parseInt(tempSpeedLimit, 10);
                    if (lim > 0 && lim <= 300) {
                      setSpeedLimit(lim);
                    }
                    setShowSpeedLimitModal(false);
                  }}>
                  <Text style={{color: '#fff', fontWeight: '900'}}>KAYDET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{paddingHorizontal: 16, paddingBottom: 10}}>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              textAlign: 'center',
            }}>
            {'💡 Sadece aracınızın desteklediği (' +
              filtered.length +
              ') sensör listeleniyor.'}
          </Text>
        </View>

        {fuelPriceRef.current > 0 && fuelUsed > 0 && (
          <View
            style={[
              styles.fuelCostRow,
              {
                backgroundColor: colors.card,
                borderColor: 'rgba(255,165,2,0.2)',
              },
            ]}>
            <Text style={[styles.fuelCostLabel, {color: colors.textDim}]}>
              ⛽ Toplam Yakıt
            </Text>
            <Text style={styles.fuelCostValue}>
              <Text style={{color: '#e9c46a', fontWeight: '900'}}>
                {fuelUsed.toFixed(2)} L
              </Text>
              <Text style={{color: 'rgba(255,255,255,0.3)'}}> / </Text>
              <Text style={{color: '#ffa502', fontWeight: '900'}}>
                ₺{fuelCost.toFixed(1)}
              </Text>
            </Text>
          </View>
        )}

        {/* CYBERPUNK DASHBOARD FOR KEY METRICS */}
        {(isHudMode || showDashboard) && (
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              marginHorizontal: 16,
              borderRadius: 16,
              padding: 10,
              marginBottom: 15,
              borderWidth: 1,
              borderColor: 'rgba(0,191,255,0.2)',
            }}>
            <CyberBar
              label="MOTOR DEVRİ"
              value={data.rpm}
              max={8000}
              unit="RPM"
              color="#00bfff"
            />
            <CyberBar
              label="HIZ"
              value={data.speed}
              max={240}
              unit="KM/H"
              color={data.speed > 120 ? '#ff4757' : '#00ff7f'}
            />
            <CyberBar
              label="SOĞUTMA"
              value={data.coolantTemp}
              max={130}
              unit="°C"
              color={data.coolantTemp > 105 ? '#ff4757' : '#ff9ff3'}
            />
            <CyberBar
              label="MOTOR YÜKÜ"
              value={data.engineLoad}
              max={100}
              unit="%"
              color="#feca57"
            />
            <CyberBar
              label="AKÜ VOLTAJI"
              value={data.batteryVoltage}
              max={16}
              unit="V"
              color="#8ecae6"
              valueFormatter={v => v.toFixed(1)}
            />

            {pinnedMeta.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginTop: 15,
                  borderTopWidth: 1,
                  borderColor: 'rgba(255,255,255,0.05)',
                  paddingTop: 15,
                }}>
                {pinnedMeta.map(p => (
                  <View
                    key={p.key}
                    style={{
                      width: '50%',
                      marginBottom: 15,
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        color: p.color,
                        fontSize: 32,
                        fontWeight: '900',
                        textShadowColor: p.color,
                        textShadowOffset: {width: 0, height: 0},
                        textShadowRadius: 10,
                      }}>
                      {fmt(p)}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                        fontWeight: '700',
                        marginTop: 4,
                      }}>
                      {p.label}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: 10,
                        fontWeight: '700',
                      }}>
                      {p.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {pinnedMeta.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pinnedRow}>
            {pinnedMeta.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[styles.pinnedCard, {borderColor: p.color}]}
                onPress={() => togglePin(p.key)}>
                <Text style={[styles.pinnedVal, {color: p.color}]}>
                  {fmt(p)}
                </Text>
                <Text style={[styles.pinnedUnit, {color: colors.textMuted}]}>
                  {p.unit}
                </Text>
                <Text style={[styles.pinnedLabel, {color: colors.textDim}]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderColor: colors.cardBorder,
            },
          ]}
          placeholder="Sensör ara..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[
                styles.catBtn,
                {
                  backgroundColor: darkMode
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                },
                category === c.key && {backgroundColor: colors.accent + '33'},
              ]}
              onPress={() => setCategory(category === c.key ? '' : c.key)}>
              <Text
                style={[
                  styles.catText,
                  {color: colors.textDim},
                  category === c.key && {color: colors.accent},
                ]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          style={{flex: 1}}
          contentContainerStyle={listView ? styles.list : styles.grid}
          data={filtered}
          key={listView ? 'list' : 'grid'}
          numColumns={listView ? 1 : 2}
          keyExtractor={p => p.key}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({item: p}) => (
            <SensorCard
              p={p}
              val={fmt(p)}
              isPinned={pinned.includes(p.key)}
              togglePin={togglePin}
              listView={listView}
              colors={colors}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.noResult, {color: colors.textMuted}]}>
              Eşleşen sensör bulunamadı.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0b10'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
  },
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  countText: {color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '700'},
  pinnedRow: {paddingHorizontal: 16, marginBottom: 8, maxHeight: 90},
  pinnedCard: {
    backgroundColor: 'rgba(30,33,40,0.9)',
    borderRadius: 14,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  pinnedVal: {fontSize: 20, fontWeight: '900'},
  pinnedUnit: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pinnedLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: 'rgba(30,33,40,0.7)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  catBtnActive: {backgroundColor: 'rgba(0,191,255,0.2)'},
  catText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catTextActive: {color: '#00bfff'},
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  viewToggle: {padding: 4},
  viewToggleText: {fontSize: 18},
  noResult: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginVertical: 60,
    fontSize: 14,
    width: '100%',
  },
  list: {padding: 10, paddingBottom: 40},
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,33,40,0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  listLeft: {flex: 1},
  listLabel: {color: '#fff', fontSize: 14, fontWeight: '600'},
  listUnit: {color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2},
  listRight: {flexDirection: 'row', alignItems: 'center', gap: 6},
  listValue: {fontSize: 20, fontWeight: '900'},
  listPin: {fontSize: 14},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    paddingBottom: 40,
  },
  card: {
    width: '46%',
    margin: '2%',
    backgroundColor: 'rgba(30,33,40,0.7)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  value: {fontSize: 28, fontWeight: '900'},
  unit: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  pinBadge: {position: 'absolute', top: 6, right: 8, fontSize: 12},
  fuelCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(30,33,40,0.8)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,165,2,0.2)',
  },
  fuelCostLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  fuelCostValue: {fontSize: 16, fontWeight: '700'},
});
