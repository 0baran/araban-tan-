import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {obd2Service, OBD2Data} from '../services/OBD2Service';
import {getSettings} from '../services/AppSettings';
import {useTheme} from '../services/ThemeContext';

export default function GaugesContainer() {
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [speedWarnActive, setSpeedWarnActive] = useState(false);
  const {colors} = useTheme();

  useEffect(() => {
    let lastUiUpdate = 0;
    const unsub = obd2Service.onDataUpdate((data: OBD2Data) => {
      const now = Date.now();
      if (now - lastUiUpdate > 100) {
        lastUiUpdate = now;
        const s = getSettings();
        setSpeedWarnActive(
          s.speedWarningEnabled && data.speed >= s.speedWarningThreshold,
        );
        setRpm(data.rpm);
        setSpeed(data.speed);
      }
    });
    return unsub;
  }, []);

  const styles = getStyles(colors);

  return (
    <View style={styles.gaugesContainer}>
      <View
        style={[
          styles.glassCard,
          styles.gaugeCard,
          {backgroundColor: colors.card},
        ]}>
        <Text style={[styles.gaugeLabel, {color: colors.textDim}]}>
          MOTOR DEVRİ
        </Text>
        <Text style={[styles.gaugeValue, {color: colors.accent}]}>{rpm}</Text>
        <Text style={[styles.gaugeUnit, {color: colors.textMuted}]}>RPM</Text>
      </View>
      <View
        style={[
          styles.glassCard,
          styles.gaugeCard,
          {backgroundColor: colors.card},
        ]}>
        <Text style={[styles.gaugeLabel, {color: colors.textDim}]}>HIZ</Text>
        <Text
          style={[
            styles.gaugeValue,
            {color: speedWarnActive ? '#ff4757' : '#2ed573'},
          ]}>
          {speed}
        </Text>
        <Text style={[styles.gaugeUnit, {color: colors.textMuted}]}>KM/H</Text>
      </View>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    gaugesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    gaugeCard: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 5,
      paddingVertical: 35,
    },
    glassCard: {
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      marginBottom: 20,
      borderColor: colors.cardBorder,
    },
    gaugeLabel: {
      color: colors.textDim,
      fontSize: 12,
      fontWeight: 'bold',
      letterSpacing: 1,
      marginBottom: 20,
    },
    gaugeValue: {fontSize: 44, fontWeight: '900'},
    gaugeUnit: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      marginTop: 5,
    },
  });
