import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useTheme} from '../services/ThemeContext';
import {
  loadVehicles,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getActiveVehicleId,
  setActiveVehicleId,
  type Vehicle,
  generateId,
} from '../services/VehicleStorage';
import {getDTCCategoryColor} from '../services/DTCDatabase';
import {
  getDTCScanCounts,
  getDTCHistory,
  getAllDTCHistory,
  deleteDTCScan,
  clearDTCHistory,
  getDTCStats,
  type DTCScan,
} from '../services/DTCHistory';

interface Props {
  onBack: () => void;
  onNavigate?: (screen: string | null) => void;
}

export default function VehiclesScreen({onBack, onNavigate}: Props) {
  const {colors} = useTheme();
  const [list, setList] = useState<Vehicle[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({});
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);
  const [historyScans, setHistoryScans] = useState<DTCScan[]>([]);
  const [historyStats, setHistoryStats] = useState<{
    totalScans: number;
    totalCodes: number;
    uniqueCodes: number;
    mostCommon: {code: string; count: number}[];
  } | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareData, setCompareData] = useState<
    {vehicleId: string; scans: DTCScan[]}[]
  >([]);

  const refresh = useCallback(async () => {
    await loadVehicles();
    const vlist = getVehicles();
    setList([...vlist]);
    setActiveId(await getActiveVehicleId());
    setScanCounts(await getDTCScanCounts());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectVehicle = async (id: string) => {
    await setActiveVehicleId(id);
    setActiveId(id);
  };

  const openNew = () => {
    setEditId(null);
    setName('');
    setPlate('');
    setVin('');
    setBrand('');
    setModel('');
    setYear('');
    setImageUri(null);
    setShowForm(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditId(v.id);
    setName(v.name);
    setPlate(v.plate || '');
    setVin(v.vin || '');
    setBrand(v.brand || '');
    setModel(v.model || '');
    setYear(v.year || '');
    setImageUri(v.imageUri || null);
    setShowForm(true);
  };

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        Alert.alert('Hata', result.errorMessage || 'Resim seçilemedi');
        return;
      }
      if (result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Uyarı', 'Araç adı gerekli');
      return;
    }
    try {
      if (editId) {
        await updateVehicle(editId, {
          name: name.trim(),
          plate: plate.trim(),
          vin: vin.trim(),
          brand: brand.trim(),
          model: model.trim(),
          year: year.trim(),
          imageUri: imageUri || undefined,
        });
      } else {
        await addVehicle({
          id: generateId(),
          name: name.trim(),
          plate: plate.trim(),
          vin: vin.trim(),
          brand: brand.trim(),
          model: model.trim(),
          year: year.trim(),
          imageUri: imageUri || undefined,
        });
      }
      setShowForm(false);
      refresh();
    } catch (e) {
      Alert.alert('Hata', 'Araç kaydedilemedi: ' + String(e));
    }
  };

  const remove = (id: string) => {
    Alert.alert('Sil', 'Bu aracı silmek istediğinize emin misiniz?', [
      {text: 'İptal', style: 'cancel'},
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteVehicle(id);
          refresh();
        },
      },
    ]);
  };

  const openDtcHistory = async (v: Vehicle) => {
    setHistoryVehicle(v);
    setHistoryScans(await getDTCHistory(v.id));
    setHistoryStats(await getDTCStats(v.id));
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!historyVehicle) {
      return;
    }
    await deleteDTCScan(historyVehicle.id, scanId);
    setHistoryScans(await getDTCHistory(historyVehicle.id));
    setHistoryStats(await getDTCStats(historyVehicle.id));
    setScanCounts(await getDTCScanCounts());
  };

  const handleClearAllHistory = () => {
    if (!historyVehicle) {
      return;
    }
    Alert.alert('Tüm Geçmişi Sil', 'Bu aracın tüm DTC geçmişi silinecek?', [
      {text: 'İptal', style: 'cancel'},
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await clearDTCHistory(historyVehicle.id);
          setHistoryScans([]);
          setHistoryStats(null);
          setScanCounts(await getDTCScanCounts());
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setShowForm(false);
            onBack();
          }}>
          <Text style={[styles.backBtn, {color: colors.accent}]}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>ARAÇLARIM</Text>
        <TouchableOpacity onPress={openNew}>
          <Text style={[styles.addBtn, {color: colors.accent}]}>+ EKLE</Text>
        </TouchableOpacity>
      </View>
      {list.length >= 2 && (
        <TouchableOpacity
          style={[
            styles.compareBtn,
            {backgroundColor: colors.card, borderColor: colors.cardBorder},
          ]}
          onPress={async () => {
            setCompareData(await getAllDTCHistory());
            setShowCompare(true);
          }}>
          <Text style={[styles.compareBtnText, {color: colors.accent}]}>
            🔄 TÜM ARAÇLARI KARŞILAŞTIR
          </Text>
        </TouchableOpacity>
      )}
      <ScrollView contentContainerStyle={styles.list}>
        {list.length === 0 && (
          <Text style={[styles.emptyText, {color: colors.textMuted}]}>
            Kayıtlı araç yok. + EKLE ile ekleyin.
          </Text>
        )}
        {list.map(v => {
          const scanCount = scanCounts[v.id] || 0;
          return (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    activeId === v.id ? colors.accent : colors.cardBorder,
                },
                activeId === v.id && {borderWidth: 2},
              ]}
              onPress={() => selectVehicle(v.id)}
              onLongPress={() => remove(v.id)}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {v.imageUri ? (
                  <Image
                    source={{uri: v.imageUri}}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      marginRight: 15,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.inputBg,
                      marginRight: 15,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text style={{fontSize: 24}}>🚗</Text>
                  </View>
                )}
                <View style={{flex: 1}}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardBrand, {color: colors.text}]}>
                      {v.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      {v.plate ? (
                        <Text
                          style={[styles.cardPlate, {color: colors.accent}]}>
                          {v.plate}
                        </Text>
                      ) : null}
                      <TouchableOpacity onPress={() => openEdit(v)}>
                        <Text style={{fontSize: 16}}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {v.brand || v.model || v.year ? (
                    <Text
                      style={[styles.cardDetail, {color: colors.textMuted}]}>
                      {[v.brand, v.model, v.year].filter(Boolean).join(' / ')}
                    </Text>
                  ) : null}
                  {v.vin ? (
                    <Text style={[styles.cardVin, {color: colors.textMuted}]}>
                      VIN: {v.vin}
                    </Text>
                  ) : null}
                  {v.lastConnected ? (
                    <Text
                      style={[styles.cardConnected, {color: colors.textDim}]}>
                      Son: {v.lastConnected}
                    </Text>
                  ) : null}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[
                        styles.dtcHistoryBtn,
                        {borderColor: colors.cardBorder},
                      ]}
                      onPress={() => openDtcHistory(v)}>
                      <Text
                        style={[
                          styles.dtcHistoryBtnText,
                          {color: colors.accent},
                        ]}>
                        🔧 DTC {scanCount > 0 ? `(${scanCount})` : ''}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Vehicle Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.bg}]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{paddingBottom: 20}}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {editId ? 'ARACI DÜZENLE' : 'YENİ ARAÇ'}
              </Text>

              <View style={{alignItems: 'center', marginVertical: 15}}>
                <TouchableOpacity
                  onPress={handleSelectImage}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.inputBg,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: colors.cardBorder,
                    overflow: 'hidden',
                  }}>
                  {imageUri ? (
                    <Image
                      source={{uri: imageUri}}
                      style={{width: 100, height: 100}}
                    />
                  ) : (
                    <Text style={{fontSize: 30}}>📸</Text>
                  )}
                </TouchableOpacity>
                <Text
                  style={{color: colors.textMuted, fontSize: 11, marginTop: 8}}>
                  Fotoğraf Seç (İsteğe Bağlı)
                </Text>
              </View>
              <Text style={[styles.label, {color: colors.textDim}]}>
                Araç Adı *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Örn: Arabam"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.label, {color: colors.textDim}]}>Plaka</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={plate}
                onChangeText={setPlate}
                placeholder="34 AB 123"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />
              <Text style={[styles.label, {color: colors.textDim}]}>Marka</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={brand}
                onChangeText={setBrand}
                placeholder="Ford"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.label, {color: colors.textDim}]}>Model</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={model}
                onChangeText={setModel}
                placeholder="Focus"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.label, {color: colors.textDim}]}>Yıl</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={year}
                onChangeText={setYear}
                placeholder="2020"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
              <Text style={[styles.label, {color: colors.textDim}]}>VIN</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={vin}
                onChangeText={setVin}
                placeholder="17 haneli VIN"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                maxLength={17}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={() => setShowForm(false)}>
                  <Text style={[styles.btnText, {color: colors.textMuted}]}>
                    İPTAL
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    {
                      backgroundColor: colors.accent + '22',
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={save}>
                  <Text style={[styles.btnText, {color: colors.accent}]}>
                    KAYDET
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DTC History Modal */}
      <Modal visible={!!historyVehicle} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.dtcHistoryModal, {backgroundColor: colors.bg}]}>
            <View style={styles.historyModalHeader}>
              <View>
                <Text style={[styles.historyModalTitle, {color: colors.text}]}>
                  🔧 DTC GEÇMİŞİ
                </Text>
                <Text style={[styles.historyModalSub, {color: colors.textDim}]}>
                  {historyVehicle?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryVehicle(null)}>
                <Text style={[styles.historyClose, {color: colors.accent}]}>
                  KAPAT
                </Text>
              </TouchableOpacity>
            </View>

            {historyStats && historyStats.totalScans > 0 && (
              <View style={[styles.statsCard, {backgroundColor: colors.card}]}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: '#00bfff'}]}>
                      {historyStats.totalScans}
                    </Text>
                    <Text style={[styles.statLabel, {color: colors.textDim}]}>
                      Tarama
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: '#ffa502'}]}>
                      {historyStats.totalCodes}
                    </Text>
                    <Text style={[styles.statLabel, {color: colors.textDim}]}>
                      Toplam Kod
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: '#7bed9f'}]}>
                      {historyStats.uniqueCodes}
                    </Text>
                    <Text style={[styles.statLabel, {color: colors.textDim}]}>
                      Farklı Kod
                    </Text>
                  </View>
                </View>
                {historyStats.mostCommon.length > 0 && (
                  <View style={styles.commonCodes}>
                    <Text style={[styles.commonTitle, {color: colors.textDim}]}>
                      Sık Görülen Kodlar:
                    </Text>
                    {historyStats.mostCommon.map(mc => (
                      <View key={mc.code} style={styles.commonItem}>
                        <Text
                          style={[
                            styles.commonCode,
                            {color: getDTCCategoryColor(mc.code)},
                          ]}>
                          {mc.code}
                        </Text>
                        <Text
                          style={[
                            styles.commonCount,
                            {color: colors.textMuted},
                          ]}>
                          {mc.count}x
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <ScrollView style={{flex: 1}}>
              {(!historyScans || historyScans.length === 0) && (
                <Text style={[styles.emptyText, {color: colors.textDim}]}>
                  Henüz kayıtlı DTC taraması yok.
                </Text>
              )}
              {historyScans.map(scan => (
                <View
                  key={scan.id}
                  style={[styles.historyCard, {backgroundColor: colors.card}]}>
                  <View style={styles.historyCardHeader}>
                    <Text style={[styles.historyDate, {color: colors.text}]}>
                      {new Date(scan.timestamp).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <View style={{flexDirection: 'row', gap: 6}}>
                      {scan.isManual && (
                        <Text
                          style={{
                            color: '#ffa502',
                            fontSize: 10,
                            fontWeight: '800',
                          }}>
                          MANUEL
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteScan(scan.id)}>
                        <Text style={{fontSize: 14}}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {scan.dtcs.map(d => (
                    <View key={d.code} style={styles.historyItem}>
                      <Text
                        style={[
                          styles.historyCode,
                          {color: getDTCCategoryColor(d.code)},
                        ]}>
                        {d.code}
                      </Text>
                      <Text
                        style={[styles.historyDesc, {color: colors.textDim}]}
                        numberOfLines={1}>
                        {d.description}
                      </Text>
                    </View>
                  ))}
                  {scan.pendingDTCs.length > 0 && (
                    <Text
                      style={{color: '#ffa502', fontSize: 11, marginTop: 4}}>
                      ⏳ Bekleyen:{' '}
                      {scan.pendingDTCs.map(p => p.code).join(', ')}
                    </Text>
                  )}
                  {scan.dtcs.length === 0 && scan.pendingDTCs.length === 0 && (
                    <Text style={{color: '#00ff7f', fontSize: 12}}>
                      ✅ Hata kodu bulunamadı
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>

            {historyScans.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={handleClearAllHistory}>
                <Text style={styles.clearAllText}>TÜM GEÇMİŞİ SİL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      {/* Comparison Modal */}
      <Modal visible={showCompare} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.dtcHistoryModal, {backgroundColor: colors.bg}]}>
            <View style={styles.historyModalHeader}>
              <Text style={[styles.historyModalTitle, {color: colors.text}]}>
                🔄 KARŞILAŞTIRMA
              </Text>
              <TouchableOpacity onPress={() => setShowCompare(false)}>
                <Text style={[styles.historyClose, {color: colors.accent}]}>
                  KAPAT
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {compareData.length === 0 && (
                <Text style={[styles.emptyText, {color: colors.textDim}]}>
                  Karşılaştırma yapılacak veri yok.
                </Text>
              )}
              {compareData.map(({vehicleId, scans}) => {
                const allCodes = new Set<string>();
                const allPending = new Set<string>();
                for (const s of scans) {
                  for (const d of s.dtcs) {
                    allCodes.add(d.code);
                  }
                  for (const d of s.pendingDTCs) {
                    allPending.add(d.code);
                  }
                }
                const v = list.find(x => x.id === vehicleId);
                return (
                  <View
                    key={vehicleId}
                    style={[
                      styles.historyCard,
                      {backgroundColor: colors.card},
                    ]}>
                    <Text
                      style={[
                        styles.historyModalSub,
                        {
                          color: colors.text,
                          fontWeight: '800',
                          marginBottom: 6,
                        },
                      ]}>
                      {v?.name || vehicleId} {v?.plate ? `(${v.plate})` : ''}
                    </Text>
                    <Text
                      style={[
                        styles.historyDate,
                        {color: colors.textMuted, marginBottom: 4},
                      ]}>
                      {scans.length} tarama • {allCodes.size + allPending.size}{' '}
                      farklı kod
                    </Text>
                    {allCodes.size > 0 && (
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 4,
                        }}>
                        {[...allCodes].sort().map(code => (
                          <View
                            key={code}
                            style={{
                              backgroundColor: getDTCCategoryColor(code) + '22',
                              borderRadius: 4,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}>
                            <Text
                              style={{
                                color: getDTCCategoryColor(code),
                                fontSize: 10,
                                fontWeight: '800',
                              }}>
                              {code}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {allPending.size > 0 && (
                      <Text
                        style={{color: '#ffa502', fontSize: 10, marginTop: 4}}>
                        ⏳ Bekleyen: {[...allPending].sort().join(', ')}
                      </Text>
                    )}
                    {allCodes.size === 0 && allPending.size === 0 && (
                      <Text style={{color: '#00ff7f', fontSize: 11}}>
                        ✅ Hata kodu yok
                      </Text>
                    )}
                  </View>
                );
              })}
              {compareData.length >= 2 && (
                <View
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: 'rgba(0,191,255,0.06)',
                      borderLeftWidth: 3,
                      borderLeftColor: '#00bfff',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.historyModalSub,
                      {color: '#00bfff', fontWeight: '800', marginBottom: 6},
                    ]}>
                    📊 ORTAK KODLAR
                  </Text>
                  {(() => {
                    const allVehicleCodes = compareData.map(({scans}) => {
                      const codes = new Set<string>();
                      for (const s of scans) {
                        for (const d of s.dtcs) {
                          codes.add(d.code);
                        }
                      }
                      return codes;
                    });
                    if (allVehicleCodes.length < 2) {
                      return (
                        <Text style={{color: colors.textDim, fontSize: 12}}>
                          Yeterli veri yok
                        </Text>
                      );
                    }
                    const common = [...allVehicleCodes[0]].filter(c =>
                      allVehicleCodes.slice(1).every(s => s.has(c)),
                    );
                    if (common.length === 0) {
                      return (
                        <Text style={{color: '#00ff7f', fontSize: 12}}>
                          ✅ Ortak hata kodu bulunamadı
                        </Text>
                      );
                    }
                    return (
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 4,
                        }}>
                        {common.sort().map(code => (
                          <View
                            key={code}
                            style={{
                              backgroundColor: getDTCCategoryColor(code) + '33',
                              borderRadius: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}>
                            <Text
                              style={{
                                color: getDTCCategoryColor(code),
                                fontSize: 11,
                                fontWeight: '800',
                              }}>
                              {code}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  backBtn: {fontSize: 14, fontWeight: '800', letterSpacing: 1},
  title: {fontSize: 20, fontWeight: '900', letterSpacing: 1.5},
  addBtn: {fontSize: 14, fontWeight: '800', letterSpacing: 1},
  list: {padding: 20, paddingTop: 0},
  emptyText: {textAlign: 'center', marginTop: 60, fontSize: 14, opacity: 0.5},
  card: {borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {fontSize: 16, fontWeight: '800'},
  cardPlate: {fontSize: 14, fontWeight: '700', letterSpacing: 1},
  cardDetail: {fontSize: 13, marginTop: 4},
  cardVin: {fontSize: 11, marginTop: 4, letterSpacing: 0.5},
  cardConnected: {fontSize: 11, marginTop: 6},
  cardActions: {flexDirection: 'row', marginTop: 8, gap: 8},
  dtcHistoryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dtcHistoryBtnText: {fontSize: 11, fontWeight: '800', letterSpacing: 0.5},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  modalButtons: {flexDirection: 'row', gap: 12, marginTop: 24},
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnPrimary: {},
  btnText: {fontWeight: '800', fontSize: 14, letterSpacing: 1},
  dtcHistoryModal: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  historyModalTitle: {fontSize: 18, fontWeight: '900'},
  historyModalSub: {fontSize: 13, marginTop: 2},
  historyClose: {fontSize: 14, fontWeight: '700'},
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {alignItems: 'center'},
  statValue: {fontSize: 24, fontWeight: '900'},
  statLabel: {fontSize: 11, fontWeight: '700', marginTop: 2},
  commonCodes: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  commonTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  commonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  commonCode: {fontSize: 12, fontWeight: '800', letterSpacing: 0.5},
  commonCount: {fontSize: 12, fontWeight: '700'},
  historyCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {fontSize: 11, fontWeight: '700', opacity: 0.7},
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  historyCode: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    minWidth: 55,
  },
  historyDesc: {fontSize: 11, flex: 1},
  clearAllBtn: {
    backgroundColor: 'rgba(255,71,87,0.15)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)',
  },
  clearAllText: {
    color: '#ff4757',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  compareBtn: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  compareBtnText: {fontSize: 12, fontWeight: '800', letterSpacing: 1},
});
