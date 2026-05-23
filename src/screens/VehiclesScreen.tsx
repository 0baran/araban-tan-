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
} from 'react-native';
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

interface Props {
  onBack: () => void;
}

export default function VehiclesScreen({onBack}: Props) {
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

  const refresh = useCallback(async () => {
    await loadVehicles();
    setList([...getVehicles()]);
    setActiveId(await getActiveVehicleId());
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
    setShowForm(true);
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
      <ScrollView contentContainerStyle={styles.list}>
        {list.length === 0 && (
          <Text style={[styles.emptyText, {color: colors.textMuted}]}>
            Kayıtlı araç yok. + EKLE ile ekleyin.
          </Text>
        )}
        {list.map(v => (
          <TouchableOpacity
            key={v.id}
            style={[
              styles.card,
              {backgroundColor: colors.card, borderColor: activeId === v.id ? colors.accent : colors.cardBorder},
              activeId === v.id && {borderWidth: 2}
            ]}
            onPress={() => selectVehicle(v.id)}
            onLongPress={() => remove(v.id)}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardBrand, {color: colors.text}]}>
                {v.name}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                {v.plate ? (
                  <Text style={[styles.cardPlate, {color: colors.accent}]}>
                    {v.plate}
                  </Text>
                ) : null}
                <TouchableOpacity onPress={() => openEdit(v)}>
                  <Text style={{fontSize: 16}}>✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
            {v.brand || v.model || v.year ? (
              <Text style={[styles.cardDetail, {color: colors.textMuted}]}>
                {[v.brand, v.model, v.year].filter(Boolean).join(' / ')}
              </Text>
            ) : null}
            {v.vin ? (
              <Text style={[styles.cardVin, {color: colors.textMuted}]}>
                VIN: {v.vin}
              </Text>
            ) : null}
            {v.lastConnected ? (
              <Text style={[styles.cardConnected, {color: colors.textDim}]}>
                Son: {v.lastConnected}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.bg}]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{paddingBottom: 20}}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {editId ? 'ARACI DÜZENLE' : 'YENİ ARAÇ'}
              </Text>
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
});
