import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator, Linking, Modal,
} from 'react-native';
import {obd2Service, DTC} from '../services/OBD2Service';

interface Props {
  onBack: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  P: '#ff4757', U: '#ff6348', C: '#ffa502', B: '#ff9ff3',
};

const SEVERITY_LABELS: Record<string, string> = {
  P: 'Güç Aktarma', U: 'İletişim', C: 'Şasi', B: 'Gövde',
};

export default function ErrorCodesScreen({onBack}: Props) {
  const [dtcs, setDtcs] = useState<DTC[]>([]);
  const [pending, setPending] = useState<DTC[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selected, setSelected] = useState<DTC | null>(null);

  const fetchDTCs = useCallback(async () => {
    setLoading(true);
    const [codes, pendingCodes] = await Promise.all([
      obd2Service.readDTCs(),
      obd2Service.readPendingDTCs(),
    ]);
    setDtcs(codes);
    setPending(pendingCodes);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDTCs();
  }, [fetchDTCs]);

  const handleClear = async () => {
    setClearing(true);
    await obd2Service.clearDTCs();
    setDtcs([]);
    setPending([]);
    setClearing(false);
  };

  const handleSearch = (code: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(code + ' OBD2 hata kodu')}`;
    Linking.openURL(url).catch(() => {});
  };

  const renderDTC = ({item}: {item: DTC}) => {
    const prefix = item.code.charAt(0);
    const color = SEVERITY_COLORS[prefix] || '#ff4757';
    return (
      <TouchableOpacity
        style={[styles.dtcItem, {borderLeftColor: color}]}
        onPress={() => setSelected(item)}
        onLongPress={() => handleSearch(item.code)}>
        <View style={[styles.dtcHeader, {backgroundColor: color + '15', borderBottomColor: color + '30'}]}>
          <Text style={[styles.dtcSeverity, {color}]}>⚠️ {SEVERITY_LABELS[prefix] || prefix}</Text>
          <TouchableOpacity
            style={[styles.searchBtn, {borderColor: color + '44'}]}
            onPress={() => handleSearch(item.code)}>
            <Text style={[styles.searchBtnText, {color}]}>🔍</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.dtcCode, {color}]}>⚠️ {item.code}</Text>
        <Text style={styles.dtcDesc}>{item.description}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← GERİ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HATA KODLARI</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchDTCs}>
          <Text style={styles.refreshText}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#00bfff" style={{marginTop: 60}} />
      ) : (
        <FlatList
          data={dtcs}
          keyExtractor={item => item.code}
          contentContainerStyle={{padding: 16}}
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
                      <Text style={styles.pendingCode}>{p.code}</Text>
                      <Text style={styles.pendingDesc}>{p.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>AKTİF KODLAR</Text>
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
            </>
          )}
          renderItem={renderDTC}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>
              {loading ? '' : '✅ Aktif hata kodu bulunamadı.'}
            </Text>
          )}
        />
      )}

      {/* DTC Detail Modal */}
      <Modal visible={!!selected} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selected && (
              <>
                <Text style={[styles.modalCode, {color: SEVERITY_COLORS[selected.code.charAt(0)] || '#ff4757'}]}>
                  {selected.code}
                </Text>
                <Text style={styles.modalDesc}>{selected.description}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, {backgroundColor: 'rgba(0,191,255,0.15)', borderColor: '#00bfff'}]}
                    onPress={() => { setSelected(null); handleSearch(selected.code); }}>
                    <Text style={[styles.modalBtnText, {color: '#00bfff'}]}>🔍 Google'da Ara</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => setSelected(null)}>
                    <Text style={styles.modalBtnText}>KAPAT</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0b10'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 40,
  },
  backButton: {padding: 8},
  backText: {color: '#00bfff', fontSize: 16, fontWeight: '700'},
  title: {color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1},
  refreshBtn: {padding: 8},
  refreshText: {color: '#00bfff', fontWeight: '700', fontSize: 12, letterSpacing: 1},
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {color: '#fff', fontSize: 16, fontWeight: '700'},
  clearButton: {
    backgroundColor: 'rgba(255,71,87,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)',
  },
  clearText: {color: '#ff4757', fontWeight: '700', fontSize: 12, letterSpacing: 1},
  pendingCard: {
    backgroundColor: 'rgba(255,165,0,0.08)', borderRadius: 16, padding: 16, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#ffa502',
  },
  pendingTitle: {color: '#ffa502', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 10},
  pendingItem: {
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  pendingCode: {color: '#ffa502', fontSize: 15, fontWeight: '800', letterSpacing: 1},
  pendingDesc: {color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2},
  dtcItem: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginBottom: 10,
    borderLeftWidth: 3,
  },
  dtcHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 8, borderRadius: 8, borderBottomWidth: 1},
  dtcSeverity: {fontSize: 11, fontWeight: '800', letterSpacing: 1},
  searchBtn: {padding: 4, borderRadius: 6, borderWidth: 1},
  searchBtnText: {fontSize: 14},
  dtcCode: {fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 4},
  dtcDesc: {color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18},
  emptyText: {
    color: 'rgba(0,255,127,0.6)', textAlign: 'center', marginVertical: 60, fontSize: 15,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#1E2128', borderRadius: 30, padding: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  modalCode: {fontSize: 32, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 12},
  modalDesc: {
    color: 'rgba(255,255,255,0.6)', fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  modalActions: {gap: 10},
  modalBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnText: {color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1},
});
