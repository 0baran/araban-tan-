/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Service remains active infinitely until notifee.stopForegroundService is called
  });
});

import {obd2Service} from './src/services/OBD2Service';

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'disconnect_obd') {
    await obd2Service.disconnectTransport();
  }
});

AppRegistry.registerComponent(appName, () => App);
