import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {useTheme} from '../services/ThemeContext';
import {DTC_DESCRIPTIONS, DTC_AI_ADVICE, getDTCCategoryColor} from '../services/DTCDatabase';
import {CloudDTCService} from '../services/CloudDTCService';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export function GlobalSearchModal({visible, onClose, onNavigate}: GlobalSearchModalProps) {
  const {colors} = useTheme();
  const styles = getStyles(colors);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [isCloudSearching, setIsCloudSearching] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleGlobalSearch = useCallback((q: string) => {
    setSearchQ(q);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(async () => {
      const query = q.trim();
      if (!query) {
        setSearchRes([]);
        return;
      }
      const upper = query.toUpperCase();
      const lowerTR = query.toLocaleLowerCase('tr');
      const isCodeSearch = /^[PUCB]\d{0,4}$/i.test(query);
      const seenCodes = new Set<string>();
      const results: {code: string; description: string; source: string}[] = [];

      for (const [code, desc] of Object.entries(DTC_DESCRIPTIONS)) {
        if (isCodeSearch && code.startsWith(upper)) {
          results.push({code, description: desc, source: 'VT'});
          seenCodes.add(code);
        } else if (!isCodeSearch && desc.toLocaleLowerCase('tr').includes(lowerTR)) {
          results.push({code, description: desc, source: 'VT'});
          seenCodes.add(code);
        }
        if (results.length >= 30) { break; }
      }

      if (!isCodeSearch && results.length < 30) {
        for (const [code, advice] of Object.entries(DTC_AI_ADVICE)) {
          if (seenCodes.has(code)) { continue; }
          if ((advice.cause + ' ' + advice.advice).toLocaleLowerCase('tr').includes(lowerTR)) {
            results.push({
              code,
              description: (DTC_DESCRIPTIONS[code] || code) + ' (AI)',
              source: 'AI',
            });
            seenCodes.add(code);
          }
          if (results.length >= 30) { break; }
        }
      }

      // Bulut Araması Kontrolü (sadece kod aramaları için ve yerelde bulunmadıysa)
      if (results.length === 0 && isCodeSearch && query.length >= 5) {
        setIsCloudSearching(true);
        const cloudRes = await CloudDTCService.lookupDTC(query);
        setIsCloudSearching(false);
        if (cloudRes.source !== 'UNKNOWN') {
          results.push({code: cloudRes.code, description: cloudRes.description, source: cloudRes.source});
        }
      }

      setSearchRes(results);
    }, 300);
  }, []);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hata Kodu & Bilgi Ara</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{color: colors.textDim, fontSize: 16}}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Örn: P0171 veya Oksijen"
            placeholderTextColor={colors.textDim}
            value={searchQ}
            onChangeText={handleGlobalSearch}
            autoFocus
          />
          {searchRes.length > 0 && (
            <Text style={{color: colors.textDim, fontSize: 11, marginBottom: 10, textAlign: 'right'}}>
              {searchRes.length} sonuç bulundu
            </Text>
          )}
          {isCloudSearching && (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10}}>
              <ActivityIndicator color={colors.accent} />
              <Text style={{color: colors.textMuted}}>Bulut Veritabanında Aranıyor...</Text>
            </View>
          )}
          <ScrollView>
            {searchRes.map((item, idx) => (
              <TouchableOpacity
                key={item.code + idx}
                onPress={() => {
                  onNavigate('ErrorCodes');
                  onClose();
                }}
                onLongPress={() => {
                  Linking.openURL(
                    `https://www.google.com/search?q=${encodeURIComponent(
                      item.code + ' OBD2 hata kodu',
                    )}`,
                  ).catch(() => {});
                }}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: getDTCCategoryColor(item.code),
                }}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{
                    color: getDTCCategoryColor(item.code),
                    fontSize: 18,
                    fontWeight: '900',
                    letterSpacing: 1,
                  }}>
                    📖 {item.code}
                  </Text>
                  <Text style={{
                    fontSize: 9,
                    fontWeight: '700',
                    color: item.source === 'AI' ? '#00bfff' : item.source === 'CLOUD' ? '#ff4757' : '#ffa502',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    borderRadius: 3,
                  }}>
                    {item.source}
                  </Text>
                </View>
                <Text style={{color: colors.textDim, fontSize: 12, marginTop: 4, lineHeight: 16}}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
            {searchRes.length === 0 && searchQ.length >= 2 && !isCloudSearching && (
              <Text style={{color: colors.textDim, textAlign: 'center', marginTop: 40, fontSize: 14}}>
                Sonuç bulunamadı. Tam hata kodunu (örn: P0001) yazarsanız bulutta aranacaktır.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 30,
    minHeight: 300,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {color: colors.text, fontSize: 20, fontWeight: 'bold'},
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
});
