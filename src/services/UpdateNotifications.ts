import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {Linking} from 'react-native';

const CHANNEL_ID = 'app_updates';
const CHANNEL_NAME = 'Uygulama Güncellemeleri';

export async function setupUpdateChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
  });
}

export async function showUpdateNotification(version: string, notes: string, url: string) {
  await notifee.displayNotification({
    title: `v${version} güncellemesi hazır`,
    body: notes.split('\n')[0],
    android: {
      channelId: CHANNEL_ID,
      pressAction: {id: 'download'},
      data: {url},
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
    },
  });
}

export function handleNotificationPress() {
  return notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS && detail.notification?.android?.data?.url) {
      Linking.openURL(detail.notification.android.data.url as string).catch(() => {});
    }
  });
}
