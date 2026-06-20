import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {EngineHealthResult} from '../services/EngineHealthService';
import {useTheme} from '../services/ThemeContext';

interface Props {
  engineHealth: EngineHealthResult | null;
  onPress: () => void;
}

export function EngineHealthWidget({engineHealth, onPress}: Props) {
  const {colors} = useTheme();
  if (!engineHealth || engineHealth.overall === 0) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: engineHealth.color + '44',
        backgroundColor: engineHealth.color + '11',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 3,
          borderColor: engineHealth.color,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: engineHealth.color + '22',
        }}>
        <Text
          style={{
            color: engineHealth.color,
            fontSize: 20,
            fontWeight: '900',
          }}>
          {engineHealth.grade}
        </Text>
        <Text
          style={{
            color: engineHealth.color,
            fontSize: 10,
            fontWeight: '700',
          }}>
          {engineHealth.overall}
        </Text>
      </View>
      <View style={{flex: 1}}>
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: '800',
            marginBottom: 3,
          }}>
          MOTOR SAĞLIK SKORU
        </Text>
        <Text
          style={{
            color: engineHealth.color,
            fontSize: 12,
            fontWeight: '600',
          }}>
          {engineHealth.summary}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            marginTop: 4,
            flexWrap: 'wrap',
          }}>
          {engineHealth.categories.slice(0, 3).map(cat => (
            <View
              key={cat.name}
              style={{
                backgroundColor:
                  cat.status === 'excellent'
                    ? '#00e67622'
                    : cat.status === 'good'
                    ? '#7bed9f22'
                    : cat.status === 'warning'
                    ? '#ffa50222'
                    : '#ff475722',
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color:
                    cat.status === 'excellent'
                      ? '#00e676'
                      : cat.status === 'good'
                      ? '#7bed9f'
                      : cat.status === 'warning'
                      ? '#ffa502'
                      : '#ff4757',
                }}>
                {cat.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{color: colors.textMuted, fontSize: 16}}>›</Text>
    </TouchableOpacity>
  );
}
