import {Alert, AppState, Linking} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {showUpdateNotification} from './UpdateNotifications';

const UPDATE_URL = 'https://api.github.com/repos/0baran/araban-tan-/contents/version.json';
const SKIPPED_KEY = '@update_skipped_version';

type UpdateInfo = {
  version: string;
  url: string;
  notes: string;
};

export type CheckResult =
  | {found: true; info: UpdateInfo}
  | {found: false; reason: 'uptodate' | 'skipped' | 'network'};

export async function checkForUpdate(currentVersion: string, signal?: AbortSignal): Promise<CheckResult> {
  try {
    const resp = await fetch(UPDATE_URL, {
      method: 'GET',
      signal,
      headers: {Accept: 'application/vnd.github.v3+json'},
    });
    if (!resp.ok) return {found: false, reason: 'network'};
    const body = await resp.json();
    const decoded = atob(body.content);
    const info: UpdateInfo = JSON.parse(decoded);
    if (compareVersions(info.version, currentVersion) <= 0) return {found: false, reason: 'uptodate'};
    const skipped = await AsyncStorage.getItem(SKIPPED_KEY);
    if (skipped === info.version) return {found: false, reason: 'skipped'};
    return {found: true, info};
  } catch {
    return {found: false, reason: 'network'};
  }
}

let _lastNotificationVersion = '';

export function promptUpdate(info: UpdateInfo) {
  showUpdateNotification(info.version, info.notes, info.url);

  if (AppState.currentState !== 'active') return;
  if (_lastNotificationVersion === info.version) return;
  _lastNotificationVersion = info.version;

  Alert.alert(
    'Güncelleme Mevcut',
    `v${info.version}\n\n${info.notes}`,
    [
      {text: 'Şimdi Güncelle', onPress: () => downloadAndInstall(info.url)},
      {text: 'Daha Sonra', style: 'cancel', onPress: () => AsyncStorage.setItem(SKIPPED_KEY, info.version)},
    ],
  );
}

async function downloadAndInstall(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Hata', 'İndirme bağlantısı açılamadı.');
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
