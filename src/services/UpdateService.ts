import {Alert, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {showUpdateNotification} from './UpdateNotifications';

const UPDATE_URL =
  'https://raw.githubusercontent.com/0baran/araban-tan-/main/version.json';
const SKIPPED_KEY = '@update_skipped_version';

type UpdateInfo = {
  version: string;
  url: string;
  notes: string;
};

export type CheckResult =
  | {found: true; info: UpdateInfo}
  | {found: false; reason: 'uptodate' | 'skipped' | 'network'};

export let downloadProgress = 0;
export let downloadActive = false;
type ProgressListener = (pct: number) => void;
let progressListeners: ProgressListener[] = [];
export function onDownloadProgress(fn: ProgressListener) {
  progressListeners.push(fn);
  return () => { progressListeners = progressListeners.filter(l => l !== fn); };
}
function setProgress(pct: number) {
  downloadProgress = pct;
  progressListeners.forEach(l => l(pct));
}

export async function checkForUpdate(
  currentVersion: string,
  signal?: AbortSignal,
): Promise<CheckResult> {
  try {
    const ts = Date.now();
    const resp = await fetch(`${UPDATE_URL}?t=${ts}`, {
      method: 'GET',
      cache: 'no-cache',
      signal,
    });
    if (!resp.ok) {
      return {found: false, reason: 'network'};
    }
    const info: UpdateInfo = await resp.json();
    if (compareVersions(info.version, currentVersion) <= 0) {
      return {found: false, reason: 'uptodate'};
    }
    const skipped = await AsyncStorage.getItem(SKIPPED_KEY);
    if (skipped === info.version) {
      return {found: false, reason: 'skipped'};
    }
    return {found: true, info};
  } catch {
    return {found: false, reason: 'network'};
  }
}

let _lastNotificationVersion = '';

export function promptUpdate(info: UpdateInfo) {
  showUpdateNotification(info.version, info.notes, info.url);

  if (AppState.currentState !== 'active') {
    return;
  }
  if (_lastNotificationVersion === info.version) {
    return;
  }
  _lastNotificationVersion = info.version;

  Alert.alert('Güncelleme Mevcut', `v${info.version}\n\n${info.notes}`, [
    {text: 'Şimdi Güncelle', onPress: () => downloadAndInstall(info.url, info.version)},
    {
      text: 'Daha Sonra',
      style: 'cancel',
      onPress: () => AsyncStorage.setItem(SKIPPED_KEY, info.version),
    },
  ]);
}

export async function downloadAndInstall(url: string, version: string): Promise<boolean> {
  if (downloadActive) {
    Alert.alert('İndirme Devam Ediyor', 'Mevcut indirme tamamlanana kadar bekleyin.');
    return false;
  }
  downloadActive = true;
  setProgress(0);

  try {
    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      appendExt: 'apk',
    })
      .fetch('GET', url)
      .progress((received: number, total: number) => {
        const pct = total > 0 ? Math.round((received / total) * 100) : 0;
        setProgress(pct);
      });

    setProgress(100);

    ReactNativeBlobUtil.android.actionViewIntent(res.path(), 'application/vnd.android.package-archive');

    downloadActive = false;
    setTimeout(() => setProgress(0), 2000);
    return true;
  } catch (err: any) {
    downloadActive = false;
    setProgress(0);
    const msg = String(err.message || err).toLowerCase();
    if (msg.includes('cancel') || msg.includes('timeout')) {
      return false;
    }
    Alert.alert('İndirme Hatası', 'APK indirilemedi.');
    return false;
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) {
      return 1;
    }
    if (na < nb) {
      return -1;
    }
  }
  return 0;
}
