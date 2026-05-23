/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Service remains active infinitely until notifee.stopForegroundService is called
  });
});

AppRegistry.registerComponent(appName, () => App);
