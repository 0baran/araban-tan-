import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {useTheme} from '../services/ThemeContext';
import {obd2Service} from '../services/OBD2Service';
import {dataLogService} from '../services/DataLogService';

interface Props {
  onBack?: () => void;
}

interface LogFile {
  name: string;
  path: string;
  size: number;
  modified: number;
}

interface LogRow {
  timestamp: string;
  rpm: string;
  speed: string;
  coolant: string;
  load: string;
  maf: string;
}

export default function DataLogScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  const loadFiles = useCallback(async () => {
    try {
      const dir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
      const files = await ReactNativeBlobUtil.fs.ls(dir);
      const logFileNames = files.filter(
        f => f.startsWith('ArabanTani_Log') && f.endsWith('.csv'),
      );
      const fileDetails: LogFile[] = await Promise.all(
        logFileNames.map(async name => {
          const path = `${dir}/${name}`;
          const stat = await ReactNativeBlobUtil.fs.stat(path);
          return {
            name,
            path,
            size: Number(stat.size),
            modified: Number(stat.lastModified),
          };
        }),
      );
      fileDetails.sort((a, b) => b.modified - a.modified);
      setLogFiles(fileDetails);
    } catch (e) {
      setLogFiles([]);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Canlı kayıt sayacı
  useEffect(() => {
    if (!isRecording) {return;}
    const unsub = obd2Service.onDataUpdate(() => {
      setRecordCount(c => c + 1);
    });
    return unsub;
  }, [isRecording]);

  const openFile = async (file: LogFile) => {
    setLoading(true);
    setSelectedFile(file);
    try {
      const content = await ReactNativeBlobUtil.fs.readFile(file.path, 'utf8');
      const lines = content.trim().split('\n');
      // Skip header
      const dataLines = lines.slice(1);
      const parsed: LogRow[] = dataLines
        .slice(-200) // Son 200 satır göster (performans için)
        .map(line => {
          const parts = line.split(',');
          return {
            timestamp: parts[0]
              ? new Date(parts[0]).toLocaleTimeString('tr-TR')
              : '--',
            rpm: parts[1] || '--',
            speed: parts[2] || '--',
            coolant: parts[4] || '--',
            load: parts[3] || '--',
            maf: parts[5] || '--',
          };
        })
        .reverse(); // En yeni üstte
      setRows(parsed);
    } catch (e) {
      Alert.alert('Hata', 'Dosya okunamadı');
    }
    setLoading(false);
  };

  const shareFile = async (file: LogFile) => {
    try {
      await Share.share({
        title: file.name,
        url: `file://${file.path}`,
        message: `ArabanTanı OBD2 Log: ${file.name}`,
      });
    } catch (e) {
      Alert.alert('Hata', 'Paylaşılamadı');
    }
  };

  const deleteFile = (file: LogFile) => {
    Alert.alert('Sil', `"${file.name}" silinsin mi?`, [
      {text: 'İptal', style: 'cancel'},
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await ReactNativeBlobUtil.fs.unlink(file.path).catch(() => {});
          if (selectedFile?.path === file.path) {
            setSelectedFile(null);
            setRows([]);
          }
          loadFiles();
        },
      },
    ]);
  };

  const toggleRecording = () => {
    if (isRecording) {
      dataLogService.stop();
      setIsRecording(false);
      Alert.alert(
        '✅ Kayıt Durduruldu',
        'Log dosyası "İndirilenler" klasörüne kaydedildi.',
        [{text: 'Tamam', onPress: loadFiles}],
      );
    } else {
      if (!obd2Service.isConnected) {
        Alert.alert(
          'Bağlı Değil',
          'Kayıt başlatmak için önce OBD2 cihazına bağlanın.',
        );
        return;
      }
      dataLogService.start();
      setIsRecording(true);
      setRecordCount(0);
      Alert.alert(
        '🔴 Kayıt Başladı',
        'Arka planda OBD2 verisi kaydediliyor...',
      );
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {return `${bytes} B`;}
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const styles = getStyles(colors);

  // Dosya listesi ekranı
  if (!selectedFile) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.bg}]}
        edges={['top', 'bottom']}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>← GERİ</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.title, {color: colors.text}]}>DATA LOG</Text>
          <TouchableOpacity onPress={loadFiles} style={{padding: 8}}>
            <Text style={{color: colors.accent, fontSize: 16}}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Kayıt Kontrol */}
        <View
          style={[
            styles.recordCard,
            {
              backgroundColor: isRecording
                ? 'rgba(255,71,87,0.1)'
                : colors.card,
              borderColor: isRecording ? '#ff4757' : colors.cardBorder,
            },
          ]}>
          <View style={{flex: 1}}>
            <Text style={[styles.recordTitle, {color: colors.text}]}>
              {isRecording ? '🔴 KAYIT DEVAM EDİYOR' : '⚪ KAYIT DURDURULDU'}
            </Text>
            {isRecording && (
              <Text style={{color: colors.textMuted, fontSize: 12}}>
                {recordCount} satır kaydedildi
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.recordBtn,
              {backgroundColor: isRecording ? '#ff4757' : '#00e676'},
            ]}
            onPress={toggleRecording}>
            <Text
              style={[
                styles.recordBtnText,
                {color: isRecording ? '#fff' : '#000'},
              ]}>
              {isRecording ? 'DURDUR' : 'BAŞLAT'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>
          KAYITLI LOG DOSYALARI ({logFiles.length})
        </Text>

        {logFiles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{fontSize: 40}}>📭</Text>
            <Text style={[styles.emptyText, {color: colors.textMuted}]}>
              Henüz log dosyası yok.
            </Text>
            <Text style={[styles.emptyText, {color: colors.textMuted}]}>
              Kayıt başlatarak veri toplayabilirsiniz.
            </Text>
          </View>
        ) : (
          <FlatList
            data={logFiles}
            keyExtractor={f => f.path}
            contentContainerStyle={{padding: 16, paddingTop: 8}}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.fileCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => openFile(item)}>
                <View style={{flex: 1}}>
                  <Text
                    style={[styles.fileName, {color: colors.text}]}
                    numberOfLines={1}>
                    📄 {item.name}
                  </Text>
                  <Text style={[styles.fileMeta, {color: colors.textMuted}]}>
                    {formatSize(item.size)} •{' '}
                    {new Date(item.modified).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.fileActions}>
                  <TouchableOpacity
                    onPress={() => shareFile(item)}
                    style={styles.iconBtn}>
                    <Text style={{fontSize: 18}}>📤</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteFile(item)}
                    style={styles.iconBtn}>
                    <Text style={{fontSize: 18}}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Dosya içeriği ekranı
  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.bg}]}
      edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setSelectedFile(null);
            setRows([]);
          }}
          style={styles.backBtn}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text
          style={[styles.title, {color: colors.text, fontSize: 13}]}
          numberOfLines={1}>
          {selectedFile.name}
        </Text>
        <TouchableOpacity
          onPress={() => shareFile(selectedFile)}
          style={{padding: 8}}>
          <Text style={{fontSize: 18}}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Tablo başlığı */}
      <View
        style={[
          styles.tableHeader,
          {backgroundColor: colors.card, borderColor: colors.cardBorder},
        ]}>
        {['Saat', 'Hız', 'RPM', 'Su°C', 'Yük%', 'MAF'].map(h => (
          <Text key={h} style={[styles.colHeader, {color: colors.accent}]}>
            {h}
          </Text>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.accent}
          size="large"
          style={{marginTop: 60}}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => i.toString()}
          initialNumToRender={30}
          getItemLayout={(_, index) => ({
            length: 38,
            offset: 38 * index,
            index,
          })}
          renderItem={({item, index}) => (
            <View
              style={[
                styles.tableRow,
                {
                  backgroundColor:
                    index % 2 === 0 ? colors.card : colors.inputBg,
                },
              ]}>
              <Text style={[styles.cell, {color: colors.textDim}]}>
                {item.timestamp}
              </Text>
              <Text style={[styles.cell, {color: '#00e676'}]}>
                {item.speed}
              </Text>
              <Text style={[styles.cell, {color: '#00bfff'}]}>{item.rpm}</Text>
              <Text style={[styles.cell, {color: '#ff9ff3'}]}>
                {item.coolant}
              </Text>
              <Text style={[styles.cell, {color: '#feca57'}]}>
                {item.load}
              </Text>
              <Text style={[styles.cell, {color: '#7bed9f'}]}>{item.maf}</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text
              style={[
                styles.emptyText,
                {color: colors.textMuted, textAlign: 'center', marginTop: 40},
              ]}>
              Dosyada veri bulunamadı
            </Text>
          )}
          ListFooterComponent={() => (
            <Text
              style={[
                styles.fileMeta,
                {color: colors.textMuted, textAlign: 'center', padding: 16},
              ]}>
              Son 200 kayıt gösteriliyor • {formatSize(selectedFile.size)} toplam
            </Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {flex: 1},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      gap: 8,
    },
    backBtn: {paddingRight: 8},
    backText: {color: colors.accent, fontSize: 14, fontWeight: '700'},
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.text,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    recordCard: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 16,
      marginBottom: 8,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      gap: 12,
    },
    recordTitle: {fontSize: 13, fontWeight: '800', letterSpacing: 0.5},
    recordBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    recordBtnText: {fontSize: 12, fontWeight: '900', letterSpacing: 0.5},
    fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 8,
      gap: 8,
    },
    fileName: {fontSize: 13, fontWeight: '700', marginBottom: 3},
    fileMeta: {fontSize: 11},
    fileActions: {flexDirection: 'row', gap: 6},
    iconBtn: {padding: 6},
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
    },
    colHeader: {
      flex: 1,
      fontSize: 10,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    cell: {flex: 1, fontSize: 11, textAlign: 'center'},
    emptyBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 60,
    },
    emptyText: {fontSize: 13, textAlign: 'center'},
  });
}
