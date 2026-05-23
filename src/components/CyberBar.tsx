import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {rw, rh, rf} from '../utils/Responsive';

interface CyberBarProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  color?: string;
  valueFormatter?: (val: number) => string;
}

export default function CyberBar({
  label,
  value,
  max,
  unit,
  color = '#00ff7f',
  valueFormatter,
}: CyberBarProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min(Math.max(value, 0), max),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value, max]);

  const widthPercent = animatedValue.interpolate({
    inputRange: [0, max],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const displayValue = valueFormatter ? valueFormatter(value) : value;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valueText, {color, textShadowColor: color}]}>
          {displayValue} <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: widthPercent,
              shadowColor: color,
            },
          ]}
        />
        {/* Glow effect overlay */}
        <Animated.View
          style={[
            styles.fillGlow,
            {
              backgroundColor: color,
              width: widthPercent,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: rh(12),
    paddingHorizontal: rw(5),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: rh(8),
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: rf(12),
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: rf(24),
    fontWeight: '900',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
    fontFamily: 'monospace',
  },
  unit: {
    fontSize: rf(12),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 'normal',
    textShadowRadius: 0,
  },
  track: {
    height: rh(16),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: rh(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: rh(8),
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  fillGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    opacity: 0.5,
  },
});
