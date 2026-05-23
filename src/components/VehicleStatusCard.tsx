import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {obd2Service, OBD2Data} from '../services/OBD2Service';
import {useTheme} from '../services/ThemeContext';

interface VehicleStatusCardProps {
  statusText: string;
  updateStatus: string;
  protocolLabel: string;
  isConnected: boolean;
}

export default function VehicleStatusCard({
  statusText,
  updateStatus,
  protocolLabel,
  isConnected,
}: VehicleStatusCardProps) {
  const [batteryVoltage, setBatteryVoltage] = useState(0);
  const [map, setMap] = useState(0);
  const {colors} = useTheme();

  useEffect(() => {
    let lastUiUpdate = 0;
    const unsub = obd2Service.onDataUpdate((data: OBD2Data) => {
      const now = Date.now();
      if (now - lastUiUpdate > 100) {
        lastUiUpdate = now;
        setBatteryVoltage(data.batteryVoltage);
        setMap(data.map);
      }
    });
    return unsub;
  }, []);

  const styles = getStyles(colors);

  return (
    <View style={[styles.glassCard, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
      <Text style={[styles.cardLabel, {color: colors.textDim}]}>ARAÇ DURUMU</Text>
      <Text style={[styles.vehicleText, {color: colors.text}, isConnected && styles.textNeonGreen]}>
        {statusText}
      </Text>
      {updateStatus ? (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6}}>
          <ActivityIndicator size="small" color="#00bfff" />
          <Text style={[styles.protocolText, {color: '#00bfff'}]}>{updateStatus}</Text>
        </View>
      ) : null}
      {isConnected && (
        <Text style={[styles.protocolText, {color: colors.textMuted}]}>
          Protokol: {protocolLabel}
        </Text>
      )}
      {!isConnected && !updateStatus && (
        <Text style={[styles.protocolText, {color: colors.textMuted}]}>
          Bluetooth / WiFi / Simülasyon ile bağlanın.
        </Text>
      )}
      {isConnected && (
        <View style={styles.vehicleInfoRow}>
          <Text style={[styles.vehicleInfoItem, {color: colors.textDim}]}>
            ⚡ {batteryVoltage.toFixed(1)}V
          </Text>
          <Text style={[styles.vehicleInfoItem, {color: colors.textDim}]}>
            🌬️ {map} kPa
          </Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  glassCard: {
    borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20,
  },
  cardLabel: {color: colors.textDim, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10},
  vehicleText: {color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 5},
  textNeonGreen: {color: '#00ff7f'},
  protocolText: {color: colors.textMuted, fontSize: 14},
  vehicleInfoRow: {flexDirection: 'row', gap: 16, marginTop: 10},
  vehicleInfoItem: {color: colors.textDim, fontSize: 13, fontWeight: '600'},
});
