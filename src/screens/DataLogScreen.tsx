import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DataLogScreen(props: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Data Log (Geçici Olarak Devre Dışı)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#fff' }
});
