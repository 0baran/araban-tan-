import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import {useTheme} from '../services/ThemeContext';
import {getDtcDescription} from '../services/DtcDictionary';
import {obd2Service, DTC} from '../services/OBD2Service';
import {
  getDTCCategory,
  getDTCCategoryColor,
  getDTCSubCategory,
  DTC_AI_ADVICE,
  DTC_DESCRIPTIONS,
} from '../services/DTCDatabase';
import {getActiveVehicleId} from '../services/VehicleStorage';
import {
  saveDTCScan,
  getDTCHistory,
  deleteDTCScan,
  type DTCScan,
} from '../services/DTCHistory';

interface Props {
  onBack: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  P: '#ff4757',
  U: '#ff6348',
  C: '#ffa502',
  B: '#ff9ff3',
};

const SEVERITY_LABELS: Record<string, string> = {
  P: 'Güç Aktarma',
  U: 'İletişim',
  C: 'Şasi',
  B: 'Gövde',
};

const KNOWN_CODES: Record<string, string> = {
  P0300: 'Rastgele / Çoklu Silindir Ateşleme Hatası',
  P0301: 'Silindir 1 Ateşleme Hatası',
  P0302: 'Silindir 2 Ateşleme Hatası',
  P0303: 'Silindir 3 Ateşleme Hatası',
  P0304: 'Silindir 4 Ateşleme Hatası',
  P0171: 'Fakir Karışım (Banka 1)',
  P0172: 'Zengin Karışım (Banka 1)',
  P0174: 'Fakir Karışım (Banka 2)',
  P0175: 'Zengin Karışım (Banka 2)',
  P0420: 'Katalitik Konvertör Verimliliği (Banka 1)',
  P0430: 'Katalitik Konvertör Verimliliği (Banka 2)',
  P0400: 'EGR Akış Hatası',
  P0401: 'Yetersiz EGR Akışı',
  P0500: 'Araç Hız Sensörü Arızası',
  P0505: 'Rölanti Kontrol Sistemi Arızası',
  P0100: 'MAF Sensörü Arızası',
  P0101: 'MAF Sensörü Sinyali / Performans',
  P0110: 'IAT Sensörü Arızası',
  P0115: 'EGT Sensörü Arızası',
  P0120: 'Gaz Kelebeği / Pedal Konum Sensörü',
  P0130: 'O2 Sensör Arızası (Banka 1, Sensör 1)',
  P0135: 'O2 Sensör Isıtıcı Arızası (Banka 1, Sensör 1)',
  P0140: 'O2 Sensör Arızası (Banka 1, Sensör 2)',
  P0201: 'Enjektör Devresi (Silindir 1)',
  P0202: 'Enjektör Devresi (Silindir 2)',
  P0203: 'Enjektör Devresi (Silindir 3)',
  P0204: 'Enjektör Devresi (Silindir 4)',
  P0325: 'Vuruntu Sensörü Arızası (Banka 1)',
  P0335: 'Krank Mili Pozisyon Sensörü',
  P0340: 'Eksantrik Mili Pozisyon Sensörü',
  P0440: 'Buhar Kontrol Sistemi Arızası',
  P0442: 'Buhar Kontrol Sistemi Küçük Sızıntı',
  P0455: 'Buhar Kontrol Sistemi Büyük Sızıntı',
  P0600: 'Seri İletişim Bağlantı Hatası',
  P0601: 'ECM ROM / Checksum Hatası',
  P0606: 'ECM İşlemci Hatası',
  P0700: 'Şanzıman Kontrol Sistemi',
  P0715: 'Türbin Giriş Hız Sensörü',
  P0720: 'Çıkış Hız Sensörü',
  P0730: 'Doğru Vites Oranı Bulunamadı',
};

export default function ErrorCodesScreen({onBack}: Props) {
  const {colors} = useTheme();
  const [dtcs, setDtcs] = useState<DTC[]>([]);
  const [pending, setPending] = useState<DTC[]>([]);
  const [permanent, setPermanent] = useState<DTC[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPermanent, setLoadingPermanent] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selected, setSelected] = useState<DTC | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<DTCScan[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualCode2, setManualCode2] = useState('');
  const [manualCode3, setManualCode3] = useState('');
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DTC[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    getActiveVehicleId().then(setActiveVehicleIdState);
  }, []);

  const fetchDTCs = useCallback(async () => {
    setLoading(true);
    const [codes, pendingCodes] = await Promise.all([
      obd2Service.readDTCs(),
      obd2Service.readPendingDTCs(),
    ]);
    setDtcs(codes);
    setPending(pendingCodes);
    setLoading(false);

    const vid = await getActiveVehicleId();
    if (vid) {
      setActiveVehicleIdState(vid);
      await saveDTCScan(vid, codes, pendingCodes, {isManual: false});
    }
  }, []);

  useEffect(() => {
    fetchDTCs();
  }, [fetchDTCs]);

  const openHistory = async () => {
    const vid = await getActiveVehicleId();
    if (!vid) {
      return;
    }
    setHistory(await getDTCHistory(vid));
    setShowHistory(true);
  };

  const handleDeleteScan = async (scanId: string) => {
    const vid = await getActiveVehicleId();
    if (!vid) {
      return;
    }
    await deleteDTCScan(vid, scanId);
    setHistory(await getDTCHistory(vid));
  };

  const handleManualAdd = async () => {
    const codes = [manualCode, manualCode2, manualCode3]
      .map(c => c.trim().toUpperCase())
      .filter(c => /^[PUCB]\d{4}$/.test(c));
    if (codes.length === 0) {
      return;
    }

    const vid = await getActiveVehicleId();
    if (!vid) {
      setShowManual(false);
      return;
    }

    const dtcList: DTC[] = codes.map(code => ({
      code,
      description:
        KNOWN_CODES[code] || getDtcDescription(code) || 'Bilinmiyor (manuel)',
    }));

    await saveDTCScan(vid, dtcList, [], {
      isManual: true,
      notes: 'Manuel giriş',
    });
    setManualCode('');
    setManualCode2('');
    setManualCode3('');
    setShowManual(false);
    setHistory(await getDTCHistory(vid));
  };

  useEffect(() => {
    if (showHistory) {
      openHistory();
    }
  }, [showHistory]);

  const fetchPermanentDTCs = useCallback(async () => {
    setLoadingPermanent(true);
    setPermanent(await obd2Service.readPermanentDTCs());
    setLoadingPermanent(false);
  }, []);

  const handleClear = async () => {
    setClearing(true);
    await obd2Service.clearDTCs();
    setDtcs([]);
    setPending([]);
    setClearing(false);
  };

  const handleDatabaseSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const upper = q.toUpperCase();
    const lowerTR = q.toLocaleLowerCase('tr');
    const isCodeSearch = /^[PUCB]\d{0,4}$/i.test(q);
    const seenCodes = new Set<string>();
    const matched: (DTC & {source: string})[] = [];

    // 1. DTC_DESCRIPTIONS (2852 kod)
    for (const [code, desc] of Object.entries(DTC_DESCRIPTIONS)) {
      if (isCodeSearch && code.startsWith(upper)) {
        matched.push({code, description: desc, source: 'VT'});
        seenCodes.add(code);
      } else if (
        !isCodeSearch &&
        desc.toLocaleLowerCase('tr').includes(lowerTR)
      ) {
        matched.push({code, description: desc, source: 'VT'});
        seenCodes.add(code);
      }
      if (matched.length >= 50) {
        break;
      }
    }

    // 2. DTC_AI_ADVICE (91 kayıt - cause/advice içinde ara)
    if (!isCodeSearch && matched.length < 50) {
      for (const [code, advice] of Object.entries(DTC_AI_ADVICE)) {
        if (seenCodes.has(code)) {
          continue;
        }
        const text = (advice.cause + ' ' + advice.advice).toLocaleLowerCase(
          'tr',
        );
        if (text.includes(lowerTR)) {
          const desc =
            DTC_DESCRIPTIONS[code] ||
            KNOWN_CODES[code] ||
            getDtcDescription(code) ||
            `${code} - Tanımlanmamış`;
          matched.push({
            code,
            description: desc + ' (AI tavsiye)',
            source: 'AI',
          });
          seenCodes.add(code);
        }
        if (matched.length >= 50) {
          break;
        }
      }
    }

    // 3. KNOWN_CODES (87 yaygın kod)
    if (matched.length < 50) {
      for (const [code, desc] of Object.entries(KNOWN_CODES)) {
        if (seenCodes.has(code)) {
          continue;
        }
        if (isCodeSearch && code.startsWith(upper)) {
          matched.push({code, description: desc, source: 'Bilinen'});
          seenCodes.add(code);
        } else if (
          !isCodeSearch &&
          desc.toLocaleLowerCase('tr').includes(lowerTR)
        ) {
          matched.push({code, description: desc, source: 'Bilinen'});
          seenCodes.add(code);
        }
        if (matched.length >= 50) {
          break;
        }
      }
    }

    setSearchResults(matched);
  }, []);

  const handleSearch = (code: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      code + ' OBD2 hata kodu',
    )}`;
    Linking.openURL(url).catch(() => {});
  };

  const groupedDTCs = dtcs.reduce<Record<string, DTC[]>>((acc, d) => {
    const cat = getDTCSubCategory(d.code);
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(d);
    return acc;
  }, {});

  const renderDTC = ({item}: {item: DTC}) => {
    const prefix = item.code.charAt(0);
    const color = getDTCCategoryColor(item.code);
    return (
      <TouchableOpacity
        style={[styles.dtcItem, {borderLeftColor: color}]}
        onPress={() => setSelected(item)}
        onLongPress={() => handleSearch(item.code)}>
        <View
          style={[
            styles.dtcHeader,
            {backgroundColor: color + '15', borderBottomColor: color + '30'},
          ]}>
          <Text style={[styles.dtcSeverity, {color}]}>
            ⚠️ {getDTCCategory(item.code)}
          </Text>
          <TouchableOpacity
            style={[styles.searchBtn, {borderColor: color + '44'}]}
            onPress={() => handleSearch(item.code)}>
            <Text style={[styles.searchBtnText, {color}]}>🔍</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.dtcCode, {color}]}>⚠️ {item.code}</Text>
        <Text style={[styles.dtcDesc, {color: colors.textDim}]}>
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.container, {backgroundColor: colors.bg}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={[styles.title, {color: colors.text}]}>HATA KODLARI</Text>
        <View style={{flexDirection: 'row', gap: 6}}>
          <TouchableOpacity
            style={{padding: 8}}
            onPress={() => {
              setShowSearch(s => !s);
              setSearchQuery('');
              setSearchResults([]);
            }}>
            <Text style={{fontSize: 18}}>🔎</Text>
          </TouchableOpacity>
          {activeVehicleId && (
            <TouchableOpacity style={styles.historyBtn} onPress={openHistory}>
              <Text style={styles.historyBtnText}>📋</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchDTCs}>
            <Text style={styles.refreshText}>YENİLE</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showSearch && (
        <View style={{paddingHorizontal: 20, marginBottom: 8}}>
          <TextInput
            style={[
              styles.manualInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.cardBorder,
                marginBottom: 0,
              },
            ]}
            value={searchQuery}
            onChangeText={txt => {
              setSearchQuery(txt);
              handleDatabaseSearch(txt);
            }}
            placeholder="Kod (P0299) veya kelime (turbo, egr, batarya)..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoFocus
          />
          {searchResults.length > 0 && (
            <Text
              style={{
                color: colors.textDim,
                fontSize: 11,
                paddingTop: 4,
                paddingBottom: 4,
              }}>
              {searchResults.length} sonuç bulundu
            </Text>
          )}
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          gap: 8,
          marginBottom: 8,
        }}>
        <TouchableOpacity
          style={[styles.manualBtn, {borderColor: colors.cardBorder}]}
          onPress={() => setShowManual(true)}>
          <Text style={[styles.manualBtnText, {color: colors.accent}]}>
            + MANUEL KOD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.manualBtn, {borderColor: colors.cardBorder}]}
          onPress={fetchPermanentDTCs}>
          <Text style={[styles.manualBtnText, {color: '#ff6b81'}]}>
            {loadingPermanent ? '...' : '🔴 KALICI'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#00bfff" style={{marginTop: 60}} />
      ) : (
        <FlatList
          data={dtcs}
          keyExtractor={item => item.code}
          contentContainerStyle={{padding: 16, paddingTop: 0}}
          ListHeaderComponent={() => (
            <>
              {pending.length > 0 && (
                <View style={styles.pendingCard}>
                  <Text style={styles.pendingTitle}>⏳ BEKLEYEN KODLAR</Text>
                  {pending.map(p => (
                    <TouchableOpacity
                      key={p.code}
                      style={styles.pendingItem}
                      onLongPress={() => handleSearch(p.code)}>
                      <View style={styles.pendingCodeRow}>
                        <Text style={styles.pendingCode}>{p.code}</Text>
                        <Text
                          style={[
                            styles.pendingBadge,
                            {
                              color: getDTCCategoryColor(p.code),
                              borderColor: getDTCCategoryColor(p.code),
                            },
                          ]}>
                          {getDTCCategory(p.code).split(' ')[0]}
                        </Text>
                      </View>
                      <Text
                        style={[styles.pendingDesc, {color: colors.textDim}]}>
                        {p.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {permanent.length > 0 && (
                <View
                  style={[
                    styles.pendingCard,
                    {
                      borderLeftColor: '#ff6b81',
                      backgroundColor: 'rgba(255,107,129,0.06)',
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <Text style={[styles.pendingTitle, {color: '#ff6b81'}]}>
                      🔴 KALICI KODLAR (Mode 0A)
                    </Text>
                    <TouchableOpacity onPress={fetchPermanentDTCs}>
                      <Text
                        style={{
                          color: '#ff6b81',
                          fontSize: 11,
                          fontWeight: '700',
                        }}>
                        YENİLE
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {permanent.map(p => (
                    <TouchableOpacity
                      key={p.code}
                      style={styles.pendingItem}
                      onLongPress={() => handleSearch(p.code)}>
                      <View style={styles.pendingCodeRow}>
                        <Text style={[styles.pendingCode, {color: '#ff6b81'}]}>
                          {p.code}
                        </Text>
                        <Text
                          style={[
                            styles.pendingBadge,
                            {
                              color: getDTCCategoryColor(p.code),
                              borderColor: getDTCCategoryColor(p.code),
                            },
                          ]}>
                          {getDTCCategory(p.code).split(' ')[0]}
                        </Text>
                      </View>
                      <Text
                        style={[styles.pendingDesc, {color: colors.textDim}]}>
                        {p.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, {color: colors.text}]}>
                  AKTİF KODLAR ({dtcs.length})
                </Text>
                {dtcs.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClear}
                    disabled={clearing}>
                    <Text style={styles.clearText}>
                      {clearing ? 'SİLİNİYOR...' : 'SİL'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {Object.keys(groupedDTCs).length > 1 && (
                <View style={styles.categorySummary}>
                  {Object.entries(groupedDTCs).map(([cat, codes]) => (
                    <View
                      key={cat}
                      style={[
                        styles.categoryBadge,
                        {
                          borderColor:
                            getDTCCategoryColor(codes[0].code) + '44',
                        },
                      ]}>
                      <Text
                        style={{
                          color: getDTCCategoryColor(codes[0].code),
                          fontSize: 10,
                          fontWeight: '800',
                        }}>
                        {cat}
                      </Text>
                      <Text
                        style={[
                          styles.badgeCount,
                          {color: getDTCCategoryColor(codes[0].code)},
                        ]}>
                        {codes.length}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {searchResults.length > 0 && (
                <>
                  <View style={[styles.cardHeader, {marginTop: 10}]}>
                    <Text style={[styles.sectionTitle, {color: colors.text}]}>
                      🔎 ARAMA: {searchQuery.toUpperCase()}
                    </Text>
                  </View>
                  {searchResults.map(item => (
                    <TouchableOpacity
                      key={item.code + (item as any).source}
                      style={[
                        styles.dtcItem,
                        {borderLeftColor: getDTCCategoryColor(item.code)},
                      ]}
                      onPress={() => setSelected(item)}
                      onLongPress={() => handleSearch(item.code)}>
                      <View
                        style={[
                          styles.dtcHeader,
                          {
                            backgroundColor:
                              getDTCCategoryColor(item.code) + '15',
                            borderBottomColor:
                              getDTCCategoryColor(item.code) + '30',
                          },
                        ]}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                          <Text
                            style={[
                              styles.dtcSeverity,
                              {color: getDTCCategoryColor(item.code)},
                            ]}>
                            {(item as any).source === 'AI'
                              ? '🤖'
                              : (item as any).source === 'Bilinen'
                              ? '✓'
                              : '📚'}{' '}
                            {getDTCCategory(item.code)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 8,
                              fontWeight: '700',
                              color:
                                (item as any).source === 'AI'
                                  ? '#00bfff'
                                  : (item as any).source === 'Bilinen'
                                  ? '#7bed9f'
                                  : '#ffa502',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              paddingHorizontal: 4,
                              paddingVertical: 1,
                              borderRadius: 3,
                            }}>
                            {(item as any).source}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.searchBtn,
                            {
                              borderColor:
                                getDTCCategoryColor(item.code) + '44',
                            },
                          ]}
                          onPress={() => handleSearch(item.code)}>
                          <Text
                            style={[
                              styles.searchBtnText,
                              {color: getDTCCategoryColor(item.code)},
                            ]}>
                            🔍
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text
                        style={[
                          styles.dtcCode,
                          {color: getDTCCategoryColor(item.code)},
                        ]}>
                        📖 {item.code}
                      </Text>
                      <Text style={[styles.dtcDesc, {color: colors.textDim}]}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}
          renderItem={renderDTC}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyText, {color: colors.textDim}]}>
              {loading ? '' : '✅ Aktif hata kodu bulunamadı.'}
            </Text>
          )}
        />
      )}

      {/* DTC Detail Modal */}
      <Modal visible={!!selected} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            {selected && (
              <>
                <Text
                  style={[
                    styles.modalCode,
                    {
                      color:
                        SEVERITY_COLORS[selected.code.charAt(0)] || '#ff4757',
                    },
                  ]}>
                  {selected.code}
                </Text>
                <Text style={[styles.modalDesc, {color: colors.textDim}]}>
                  {selected.description}
                </Text>
                {DTC_AI_ADVICE[selected.code] && (
                  <View style={styles.aiCard}>
                    <View style={styles.aiHeader}>
                      <Text style={styles.aiTitle}>
                        🤖 Yapay Zeka Arıza Asistanı
                      </Text>
                    </View>
                    <Text style={styles.aiCause}>
                      <Text style={styles.aiLabel}>Olası Sebep: </Text>
                      {DTC_AI_ADVICE[selected.code].cause}
                    </Text>
                    <Text style={styles.aiAdviceText}>
                      <Text style={styles.aiLabel}>Usta Tavsiyesi: </Text>
                      {DTC_AI_ADVICE[selected.code].advice}
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: 'rgba(0,191,255,0.15)',
                        borderColor: '#00bfff',
                      },
                    ]}
                    onPress={() => {
                      setSelected(null);
                      handleSearch(selected.code);
                    }}>
                    <Text style={[styles.modalBtnText, {color: '#00bfff'}]}>
                      🔍 Google'da Ara
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => setSelected(null)}>
                    <Text style={[styles.modalBtnText, {color: colors.text}]}>
                      KAPAT
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.historyModal, {backgroundColor: colors.bg}]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, {color: colors.text}]}>
                📋 GEÇMİŞ TARAMALAR
              </Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={[styles.historyClose, {color: colors.accent}]}>
                  KAPAT
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {history.length === 0 && (
                <Text style={[styles.emptyText, {color: colors.textDim}]}>
                  Henüz kayıtlı tarama yok.
                </Text>
              )}
              {history.map(scan => (
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
                        <Text style={[styles.manualBadge, {color: '#ffa502'}]}>
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
                    <>
                      <Text
                        style={[
                          styles.historyCode,
                          {color: '#ffa502', fontSize: 12, marginTop: 6},
                        ]}>
                        ⏳ Bekleyen:{' '}
                        {scan.pendingDTCs.map(p => p.code).join(', ')}
                      </Text>
                    </>
                  )}
                  {scan.dtcs.length === 0 && scan.pendingDTCs.length === 0 && (
                    <Text style={[styles.historyDesc, {color: '#00ff7f'}]}>
                      ✅ Hata kodu bulunamadı
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manual DTC Entry Modal */}
      <Modal visible={showManual} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <Text
              style={[styles.modalCode, {color: colors.text, fontSize: 22}]}>
              + MANUEL KOD GİR
            </Text>
            <Text
              style={[styles.modalDesc, {color: colors.textDim, fontSize: 13}]}>
              OBD2 hata kodunu elle girin (örn: P0301)
            </Text>
            <TextInput
              style={[
                styles.manualInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="P0301"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={5}
            />
            <TextInput
              style={[
                styles.manualInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={manualCode2}
              onChangeText={setManualCode2}
              placeholder="P0171 (opsiyonel)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={5}
            />
            <TextInput
              style={[
                styles.manualInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={manualCode3}
              onChangeText={setManualCode3}
              placeholder="P0420 (opsiyonel)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={5}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: 'rgba(0,191,255,0.15)',
                    borderColor: '#00bfff',
                  },
                ]}
                onPress={handleManualAdd}>
                <Text style={[styles.modalBtnText, {color: '#00bfff'}]}>
                  KAYDET
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setShowManual(false)}>
                <Text style={[styles.modalBtnText, {color: colors.text}]}>
                  İPTAL
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0b10'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
  },
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  refreshBtn: {padding: 8},
  refreshText: {
    color: '#00bfff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  historyBtn: {padding: 8},
  historyBtnText: {fontSize: 20},
  manualBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  manualBtnText: {fontSize: 12, fontWeight: '700', letterSpacing: 1},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {color: '#fff', fontSize: 16, fontWeight: '700'},
  clearButton: {
    backgroundColor: 'rgba(255,71,87,0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)',
  },
  clearText: {
    color: '#ff4757',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  pendingCard: {
    backgroundColor: 'rgba(255,165,0,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ffa502',
  },
  pendingTitle: {
    color: '#ffa502',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  pendingItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  pendingCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingCode: {
    color: '#ffa502',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pendingBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  pendingDesc: {color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2},
  dtcItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  dtcSeverity: {fontSize: 11, fontWeight: '800', letterSpacing: 1},
  searchBtn: {padding: 4, borderRadius: 6, borderWidth: 1},
  searchBtnText: {fontSize: 14},
  dtcCode: {fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 4},
  dtcDesc: {color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18},
  emptyText: {
    color: 'rgba(0,255,127,0.6)',
    textAlign: 'center',
    marginVertical: 60,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#1E2128',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalCode: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {gap: 10},
  modalBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  categorySummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeCount: {fontSize: 11, fontWeight: '900', marginLeft: 4},
  aiCard: {
    backgroundColor: 'rgba(0, 191, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.3)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 191, 255, 0.2)',
    paddingBottom: 8,
    marginBottom: 10,
  },
  aiTitle: {
    color: '#00bfff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiCause: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  aiAdviceText: {
    color: '#7bed9f',
    fontSize: 13,
    lineHeight: 20,
  },
  aiLabel: {
    fontWeight: 'bold',
    color: '#fff',
  },
  historyModal: {
    flex: 1,
    backgroundColor: '#0a0b10',
    marginTop: 60,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {fontSize: 18, fontWeight: '900', letterSpacing: 1},
  historyClose: {fontSize: 14, fontWeight: '700'},
  historyCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {fontSize: 12, fontWeight: '700', opacity: 0.7},
  manualBadge: {fontSize: 10, fontWeight: '800', letterSpacing: 1},
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 8,
  },
  historyCode: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    minWidth: 60,
  },
  historyDesc: {fontSize: 12, flex: 1},
  manualInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 2,
  },
});
