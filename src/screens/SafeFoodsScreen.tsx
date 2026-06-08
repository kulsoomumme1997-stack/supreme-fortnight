import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSafeFoods, saveSafeFoods } from '../storage';

export default function SafeFoodsScreen() {
  const [foods, setFoods] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSafeFoods().then((f) => {
        if (active) {
          setFoods(f);
          setLoaded(true);
        }
      });
      return () => { active = false; };
    }, [])
  );

  async function addFood() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (foods.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      setDraft('');
      return;
    }
    const updated = [trimmed, ...foods];
    setFoods(updated);
    setDraft('');
    await saveSafeFoods(updated);
  }

  async function removeFood(food: string) {
    const updated = foods.filter((f) => f !== food);
    setFoods(updated);
    await saveSafeFoods(updated);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Safe Foods</Text>
        <Text style={styles.subheading}>
          Keep a running list of foods and meals you've confirmed are safe for you — handy to
          glance at when you're deciding what to eat or order.
        </Text>

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="e.g. Grilled chicken with rice"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={addFood}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, !draft.trim() && styles.addBtnDisabled]}
            onPress={addFood}
            disabled={!draft.trim()}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loaded && foods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🥗</Text>
            <Text style={styles.emptyStateText}>
              No safe foods added yet. Start building your list of go-to meals you know agree
              with you.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {foods.map((food) => (
              <View key={food} style={styles.foodRow}>
                <Text style={styles.foodIcon}>✅</Text>
                <Text style={styles.foodText}>{food}</Text>
                <TouchableOpacity onPress={() => removeFood(food)} style={styles.removeBtn} activeOpacity={0.7}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subheading: { fontSize: 14, color: '#6B7280', marginBottom: 18, lineHeight: 21 },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#A7F3D0' },
  addBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  list: { gap: 10 },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  foodIcon: { fontSize: 18 },
  foodText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  removeBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyStateIcon: { fontSize: 40, marginBottom: 10 },
  emptyStateText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
});
