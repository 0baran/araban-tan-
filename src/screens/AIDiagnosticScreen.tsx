import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../services/ThemeContext';
import { aiDiagnosticService, AIInsight } from '../services/AIDiagnosticService';
import { useNavigation } from '@react-navigation/native';

export function AIDiagnosticScreen() {
  const { colors: theme } = useTheme();
  const navigation = useNavigation<any>();
  const [insights, setInsights] = useState<AIInsight[]>(aiDiagnosticService.getInsights());
  const [scores, setScores] = useState(aiDiagnosticService.getHealthScores());

  useEffect(() => {
    const unsub = aiDiagnosticService.onInsightsChanged((newInsights) => {
      setInsights([...newInsights]);
      setScores(aiDiagnosticService.getHealthScores());
    });
    return unsub;
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#00ff88'; // green
    if (score >= 70) return '#ffaa00'; // yellow
    return '#ff3366'; // red
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'< GERİ'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>AI Check-Up</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.scoresContainer}>
          <View style={[styles.scoreCard, { borderColor: getScoreColor(scores.overall) }]}>
            <Text style={[styles.scoreValue, { color: getScoreColor(scores.overall) }]}>{scores.overall}%</Text>
            <Text style={[styles.scoreLabel, { color: theme.textDim }]}>Genel Sağlık</Text>
          </View>
          <View style={styles.subScores}>
            <View style={styles.subScoreItem}>
              <Text style={[styles.subScoreText, { color: getScoreColor(scores.engine) }]}>{scores.engine}%</Text>
              <Text style={[styles.subScoreLabel, { color: theme.textDim }]}>Motor/Yakıt</Text>
            </View>
            <View style={styles.subScoreItem}>
              <Text style={[styles.subScoreText, { color: getScoreColor(scores.cooling) }]}>{scores.cooling}%</Text>
              <Text style={[styles.subScoreLabel, { color: theme.textDim }]}>Soğutma</Text>
            </View>
            <View style={styles.subScoreItem}>
              <Text style={[styles.subScoreText, { color: getScoreColor(scores.battery) }]}>{scores.battery}%</Text>
              <Text style={[styles.subScoreLabel, { color: theme.textDim }]}>Akü/Elektrik</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Yapay Zeka Tespitleri</Text>

        {insights.length === 0 ? (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: '#00ff88' }]}>✅ Her Şey Yolunda!</Text>
            <Text style={[styles.cardDesc, { color: theme.textDim }]}>Yapay zeka analiz motoru şu ana kadar aracınızda şüpheli bir veri dalgalanması tespit etmedi. Yola devam!</Text>
          </View>
        ) : (
          insights.map(insight => (
            <View key={insight.id} style={[styles.card, { backgroundColor: theme.card, borderLeftColor: insight.severity === 'critical' ? '#ff3366' : insight.severity === 'high' ? '#ff5500' : '#ffaa00', borderLeftWidth: 4 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{insight.title}</Text>
              <Text style={[styles.cardDesc, { color: theme.textDim }]}>{insight.description}</Text>
              <Text style={[styles.cardAction, { color: theme.accent }]}>Öneri: {insight.action}</Text>
            </View>
          ))
        )}
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: { marginRight: 16 },
  backText: { color: '#00bfff', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: 16 },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  scoreCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginRight: 16,
  },
  scoreValue: { fontSize: 36, fontWeight: '900' },
  scoreLabel: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  subScores: {
    flex: 1,
    justifyContent: 'space-between',
  },
  subScoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  subScoreText: { fontSize: 18, fontWeight: 'bold' },
  subScoreLabel: { fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, opacity: 0.8 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  cardAction: { fontSize: 13, fontWeight: 'bold' },
});
