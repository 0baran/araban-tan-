import React from 'react';
import {View, Text} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {ThemeProvider} from './src/services/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import {initLogCapture} from './src/services/AppLog';

initLogCapture();

class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {hasError: boolean; errorMsg: string}
> {
  state = {hasError: false, errorMsg: ''};
  static getDerivedStateFromError(error: Error) {
    return {hasError: true, errorMsg: error.message || String(error)};
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#0a0b10',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}>
          <Text
            style={{
              color: '#FFD700',
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
            Beklenmeyen Hata
          </Text>
          <Text
            style={{
              color: '#aaa',
              fontSize: 14,
              marginTop: 10,
              textAlign: 'center',
            }}>
            Hata Detayı:
          </Text>
          <Text
            style={{
              color: '#ff4757',
              fontSize: 12,
              marginTop: 5,
              textAlign: 'center',
              fontFamily: 'monospace',
            }}>
            {this.state.errorMsg}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
