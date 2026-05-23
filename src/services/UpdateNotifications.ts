import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {Linking} from 'react-native';

const CHANNEL_ID = 'app_updates';
const CHANNEL_NAME = 'Uygulama Guncellemeleri';

function openUpdateUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS && detail.notification?.data?.url) {
    openUpdateUrl(detail.notification.data.url as string);
  }
});

export async function setupUpdateChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
  });
}

export async function showUpdateNotification(
  version: string,
  notes: string,
  url: string,
) {
  await notifee.displayNotification({
    title: `v${version} guncellemesi hazir`,
    body: notes.split('\n')[0],
    data: {url},
    android: {
      channelId: CHANNEL_ID,
      pressAction: {id: 'download'},
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
    },
  });
}

export function handleNotificationPress() {
  return notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS && detail.notification?.data?.url) {
      openUpdateUrl(detail.notification.data.url as string);
    }
  });
}
