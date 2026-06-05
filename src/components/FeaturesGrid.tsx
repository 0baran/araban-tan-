import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {obd2Service, OBD2Data} from '../services/OBD2Service';
import {getSettings} from '../services/AppSettings';
import {useTheme} from '../services/ThemeContext';

interface FeaturesGridProps {
  onNavigate: (screen: string) => void;
}

export default function FeaturesGrid({onNavigate}: FeaturesGridProps) {
  const [coolant, setCoolant] = useState(0);
  const [hp, setHp] = useState(0);
  const [dtcCount, setDtcCount] = useState(0);
  const [coolantWarnActive, setCoolantWarnActive] = useState(false);
  const {colors} = useTheme();

  useEffect(() => {
    let lastUiUpdate = 0;
    const unsub = obd2Service.onDataUpdate((data: OBD2Data) => {
      const now = Date.now();
      if (now - lastUiUpdate > 100) {
        lastUiUpdate = now;
        const s = getSettings();
        setCoolantWarnActive(
          s.coolantWarningEnabled &&
            data.coolantTemp >= s.coolantWarningThreshold,
        );
        setCoolant(data.coolantTemp);
        setHp(Math.round((data.maf / 0.73) * 1.15));
        setDtcCount(data.dtcCount);
      }
    });

    const dtcInterval = setInterval(async () => {
      if (obd2Service.isConnected) {
        const status = await obd2Service.readMonitorStatus();
        setDtcCount(status.dtcCount);
      }
    }, 30000);

    return () => {
      unsub();
      clearInterval(dtcInterval);
    };
  }, []);

  const styles = getStyles(colors);

  return (
    <View style={styles.featuresGrid}>
      <View
        style={[
          styles.glassCard,
          styles.featureCard,
          {
            backgroundColor: coolantWarnActive
              ? 'rgba(255,71,87,0.12)'
              : colors.card,
            borderColor: coolantWarnActive ? '#ff4757' : colors.cardBorder,
          },
        ]}>
        <Text
          style={[
            styles.featureIcon,
            {color: coolantWarnActive ? '#ff4757' : colors.accent},
          ]}>
          🌡️
        </Text>
        <Text
          style={[
            styles.featureValue,
            {color: coolantWarnActive ? '#ff4757' : colors.text},
          ]}>
          {coolant}°C
        </Text>
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          SOĞUTMA SIVISI
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('errorcodes')}>
        <Text style={[styles.featureIcon, dtcCount > 0 && {color: '#ff4757'}]}>
          ⚠️
        </Text>
        {dtcCount > 0 && (
          <View style={styles.dtcBadge}>
            <Text style={styles.dtcBadgeText}>{dtcCount}</Text>
          </View>
        )}
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          HATA KODLARI
        </Text>
        <Text style={[styles.featureHint, {color: colors.textMuted}]}>
          DTC Tara
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('performance')}>
        <Text style={styles.featureIcon}>🏁</Text>
        <Text style={[styles.featureValue, {fontSize: 22, color: colors.text}]}>
          {hp} BG
        </Text>
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          PERFORMANS
        </Text>
        <Text style={[styles.featureHint, {color: colors.textMuted}]}>
          0-100 Testi & HP
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('vehicleinfo')}>
        <Text style={styles.featureIcon}>🚗</Text>
        <Text style={[styles.featureValue, {fontSize: 20, color: colors.text}]}>
          BİLGİ
        </Text>
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          ARAÇ BİLGİSİ
        </Text>
        <Text style={[styles.featureHint, {color: colors.textMuted}]}>
          VIN / Mode 09
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card, borderColor: '#00ff88', borderWidth: 1},
        ]}
        onPress={() => onNavigate('aidiagnostic')}>
        <Text style={styles.featureIcon}>🧠</Text>
        <Text style={[styles.featureValue, {fontSize: 20, color: '#00ff88'}]}>
          AI TEST
        </Text>
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          YAPAY ZEKA
        </Text>
        <Text style={[styles.featureHint, {color: colors.textMuted}]}>
          Erken Uyarı
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('freezeframe')}>
        <Text style={styles.featureIcon}>❄️</Text>
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          DONMA NOKTASI
        </Text>
        <Text style={[styles.featureHint, {color: colors.textMuted}]}>
          Hata Anı Sensörler
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('trip')}>
        <Text style={styles.featureIcon}>📊</Text>
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          YOL BİLGİSAYARI
        </Text>
        <Text style={[styles.featureHint, {color: colors.textMuted}]}>
          Telemetri & Log
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('hiddenfeature')}>
        <Text style={styles.featureIcon}>🔧</Text>
        <Text style={[styles.featureLabel, {color: colors.textDim}]}>
          GİZLİ ÖZELLİK
        </Text>
        <Text style={[styles.featureHint, {color: colors.textMuted}]}>
          Kodlama
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('settings')}>
        <Text style={styles.featureIcon}>⚙️</Text>
        <Text style={styles.featureLabel}>AYARLAR</Text>
        <Text style={styles.featureHint}>Tercihler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.glassCard,
          styles.featureCard,
          {backgroundColor: colors.card},
        ]}
        onPress={() => onNavigate('service')}>
        <Text style={styles.featureIcon}>🛠️</Text>
        <Text style={[styles.featureLabel, {color: '#e74c3c'}]}>
          AKTİF SERVİS
        </Text>
        <Text style={styles.featureHint}>EPB & DPF Kodlama</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    featureCard: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: 25,
      position: 'relative',
    },
    glassCard: {
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      marginBottom: 20,
      borderColor: colors.cardBorder,
    },
    featureIcon: {fontSize: 32, marginBottom: 10},
    dtcBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: '#ff4757',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.bg,
    },
    dtcBadgeText: {color: '#fff', fontSize: 10, fontWeight: '900'},
    featureValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '900',
      marginBottom: 5,
    },
    featureLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: 'bold',
      letterSpacing: 1,
      textAlign: 'center',
    },
    featureHint: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
      letterSpacing: 1,
    },
  });
