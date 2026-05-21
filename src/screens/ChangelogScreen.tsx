import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {CHANGELOG} from '../services/Changelog';
import {useTheme} from '../services/ThemeContext';

interface Props {
  onBack: () => void;
}

export default function ChangelogScreen({onBack}: Props) {
  const {colors} = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={[s.backText, {color: colors.accent}]}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[s.title, {color: colors.text}]}>SÜRÜM NOTLARI</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView style={s.list}>
        {CHANGELOG.map((v, i) => (
          <View key={i} style={[s.card, {backgroundColor: colors.card, borderColor: colors.cardBorder}]}>
            <View style={s.versionRow}>
              <Text style={[s.version, {color: colors.accent}]}>v{v.version}</Text>
              <Text style={[s.date, {color: colors.textMuted}]}>{v.date}</Text>
            </View>
            {v.items.map((item, j) => (
              <View key={j} style={s.itemRow}>
                <Text style={[s.bullet, {color: colors.accent}]}>•</Text>
                <Text style={[s.itemText, {color: colors.text}]}>{item}</Text>
              </View>
            ))}
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
  list: {flex: 1, paddingHorizontal: 16},
  card: {borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1},
  versionRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center'},
  version: {fontSize: 15, fontWeight: '900', letterSpacing: 0.5},
  date: {fontSize: 11, fontWeight: '600'},
  itemRow: {flexDirection: 'row', marginBottom: 6},
  bullet: {fontSize: 12, marginRight: 8, marginTop: 1},
  itemText: {fontSize: 12, lineHeight: 17, flex: 1},
});
