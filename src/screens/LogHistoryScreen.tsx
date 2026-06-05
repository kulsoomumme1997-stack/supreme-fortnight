import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ALLERGEN_MAP } from '../constants/allergens';
import { loadFoodLogs, deleteFoodLog } from '../storage';
import { FoodLogEntry } from '../types';
import { RootStackParamList } from '../navigation';

type HistoryNavProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const SEVERITY_COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

function SeverityBadge({ severity }: { severity: 0 | 1 | 2 | 3 }) {
  return (
    <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[severity] }]}>
      <Text style={styles.severityBadgeText}>{SEVERITY_LABELS[severity]}</Text>
    </View>
  );
}

function AllergenChip({ allergenId }: { allergenId: string }) {
  const a = ALLERGEN_MAP[allergenId];
  if (!a) return null;
  return (
    <View style={[styles.allergenChip, { backgroundColor: a.color }]}>
      <Text style={styles.allergenChipText}>{a.name}</Text>
    </View>
  );
}

function EntryDetailModal({
  entry,
  visible,
  onClose,
  onDelete,
}: {
  entry: FoodLogEntry | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  if (!entry) return null;
  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  function confirmDelete() {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food log entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(entry.id);
            onClose();
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Meal Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{MEAL_ICONS[entry.mealType] ?? '🍽️'}</Text>
            <View>
              <Text style={styles.detailMealType}>
                {entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}
              </Text>
              <Text style={styles.detailDate}>{dateStr}</Text>
              <Text style={styles.detailTime}>{timeStr}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Foods Eaten</Text>
            <Text style={styles.detailSectionText}>{entry.foods}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Reaction Severity</Text>
            <SeverityBadge severity={entry.severity} />
          </View>

          {entry.symptoms.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Symptoms</Text>
              <View style={styles.symptomsWrap}>
                {entry.symptoms.map((sym) => (
                  <View key={sym} style={styles.symptomTag}>
                    <Text style={styles.symptomTagText}>{sym}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {entry.flaggedAllergens.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Flagged Allergens</Text>
              <View style={styles.allergenWrap}>
                {entry.flaggedAllergens.map((id) => (
                  <AllergenChip key={id} allergenId={id} />
                ))}
              </View>
              {entry.flaggedAllergens.map((id) => {
                const a = ALLERGEN_MAP[id];
                if (!a) return null;
                return (
                  <View key={id} style={[styles.allergenDetail, { borderLeftColor: a.color }]}>
                    <Text style={styles.allergenDetailName}>{a.name}</Text>
                    <Text style={styles.allergenDetailDesc}>{a.description}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {entry.notes.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Notes</Text>
              <Text style={styles.detailSectionText}>{entry.notes}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteBtnText}>Delete Entry</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function LogHistoryScreen() {
  const navigation = useNavigation<HistoryNavProp>();
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FoodLogEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadFoodLogs().then((data) => {
        if (active) setLogs(data);
      });
      return () => { active = false; };
    }, [])
  );

  async function handleDelete(id: string) {
    await deleteFoodLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  function renderItem({ item }: { item: FoodLogEntry }) {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={styles.logCard}
        onPress={() => {
          setSelectedEntry(item);
          setModalVisible(true);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.logCardTop}>
          <View style={styles.logCardLeft}>
            <Text style={styles.logCardIcon}>{MEAL_ICONS[item.mealType] ?? '🍽️'}</Text>
            <View>
              <Text style={styles.logCardMeal}>
                {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}
              </Text>
              <Text style={styles.logCardDate}>{dateStr} · {timeStr}</Text>
            </View>
          </View>
          <SeverityBadge severity={item.severity} />
        </View>

        <Text style={styles.logCardFoods} numberOfLines={2}>{item.foods}</Text>

        {item.symptoms.length > 0 && (
          <Text style={styles.logCardSymptoms} numberOfLines={1}>
            🩺 {item.symptoms.join(', ')}
          </Text>
        )}

        {item.flaggedAllergens.length > 0 && (
          <View style={styles.logCardAllergens}>
            {item.flaggedAllergens.slice(0, 4).map((id) => (
              <AllergenChip key={id} allergenId={id} />
            ))}
            {item.flaggedAllergens.length > 4 && (
              <Text style={styles.moreText}>+{item.flaggedAllergens.length - 4}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No food logs yet</Text>
          <Text style={styles.emptySubtitle}>Start logging your meals to track how food affects you.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('FoodLog')}
          >
            <Text style={styles.emptyBtnText}>Log Your First Meal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('FoodLog')}>
                <Text style={styles.addNewBtn}>+ Log Meal</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <EntryDetailModal
        entry={selectedEntry}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listHeaderText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  addNewBtn: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 15,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logCardIcon: {
    fontSize: 26,
  },
  logCardMeal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  logCardDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logCardFoods: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 6,
  },
  logCardSymptoms: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  logCardAllergens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  allergenChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  allergenChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  moreText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 48,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  detailIcon: {
    fontSize: 40,
  },
  detailMealType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  detailDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  detailTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailSectionText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
  },
  symptomsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  symptomTagText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 13,
  },
  allergenWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  allergenDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  allergenDetailName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  allergenDetailDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  deleteBtn: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
