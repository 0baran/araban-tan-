import {Alert, Linking, Platform} from 'react-native';
import {PermissionsAndroid} from 'react-native';

const UPDATE_URL = 'https://raw.githubusercontent.com/0baran/araban-tan-/main/version.json';

type UpdateInfo = {
  version: string;
  url: string;
  notes: string;
};

export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  try {
    const resp = await fetch(UPDATE_URL, {method: 'GET', cache: 'no-cache'});
    if (!resp.ok) return null;
    const info: UpdateInfo = await resp.json();
    if (compareVersions(info.version, currentVersion) > 0) return info;
    return null;
  } catch {
    return null;
  }
}

export function promptUpdate(info: UpdateInfo) {
  Alert.alert(
    'Güncelleme Mevcut',
    `v${info.version}\n\n${info.notes}`,
    [
      {text: 'Şimdi Güncelle', onPress: () => downloadAndInstall(info.url)},
      {text: 'Daha Sonra', style: 'cancel'},
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
