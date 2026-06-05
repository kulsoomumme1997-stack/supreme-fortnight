import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { detectAllergens, ALLERGEN_MAP } from '../constants/allergens';
import { saveFoodLog } from '../storage';
import { FoodLogEntry } from '../types';
import { RootStackParamList } from '../navigation';

type FoodLogNavProp = StackNavigationProp<RootStackParamList, 'FoodLog'>;

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const SYMPTOMS_LIST = [
  'Bloating',
  'Gas',
  'Stomach pain / cramps',
  'Nausea',
  'Diarrhea',
  'Constipation',
  'Hives / rash',
  'Eczema / itchy skin',
  'Headache / migraine',
  'Brain fog',
  'Fatigue / tiredness',
  'Runny / blocked nose',
  'Sneezing',
  'Itchy eyes',
  'Swelling (face, lips)',
  'Difficulty breathing',
];

const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const SEVERITY_COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];
const SEVERITY_BG = ['#ECFDF5', '#FFFBEB', '#FFF7ED', '#FEF2F2'];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function FoodLogScreen() {
  const navigation = useNavigation<FoodLogNavProp>();

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [foods, setFoods] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<0 | 1 | 2 | 3>(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const flaggedAllergens = foods.trim() ? detectAllergens(foods) : [];

  function toggleSymptom(sym: string) {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  }

  async function handleSave() {
    if (!foods.trim()) {
      Alert.alert('Missing info', 'Please describe what you ate before saving.');
      return;
    }
    setSaving(true);
    const entry: FoodLogEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      mealType,
      foods: foods.trim(),
      symptoms,
      severity,
      notes: notes.trim(),
      flaggedAllergens,
    };
    await saveFoodLog(entry);
    setSaving(false);
    Alert.alert('Saved!', 'Your meal has been logged.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Meal Type */}
        <Text style={styles.label}>Meal Type</Text>
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.mealTypeBtn, mealType === type && styles.mealTypeBtnActive]}
              onPress={() => setMealType(type)}
              activeOpacity={0.75}
            >
              <Text style={styles.mealTypeIcon}>{MEAL_ICONS[type]}</Text>
              <Text style={[styles.mealTypeLabel, mealType === type && styles.mealTypeLabelActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Foods eaten */}
        <Text style={styles.label}>What did you eat?</Text>
        <TextInput
          style={styles.textArea}
          value={foods}
          onChangeText={setFoods}
          placeholder="e.g. Pasta with tomato sauce, parmesan cheese, garlic bread..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Allergen detection */}
        {flaggedAllergens.length > 0 && (
          <View style={styles.allergenAlert}>
            <Text style={styles.allergenAlertTitle}>Allergens detected in your meal:</Text>
            <View style={styles.chipRow}>
              {flaggedAllergens.map((id) => {
                const a = ALLERGEN_MAP[id];
                if (!a) return null;
                return (
                  <View key={id} style={[styles.allergenChip, { backgroundColor: a.color }]}>
                    <Text style={styles.allergenChipText}>{a.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Symptoms */}
        <Text style={styles.label}>Symptoms experienced (if any)</Text>
        <View style={styles.symptomsGrid}>
          {SYMPTOMS_LIST.map((sym) => (
            <TouchableOpacity
              key={sym}
              style={[styles.symptomChip, symptoms.includes(sym) && styles.symptomChipActive]}
              onPress={() => toggleSymptom(sym)}
              activeOpacity={0.75}
            >
              <Text style={[styles.symptomChipText, symptoms.includes(sym) && styles.symptomChipTextActive]}>
                {sym}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Severity */}
        <Text style={styles.label}>Reaction Severity</Text>
        <View style={styles.severityRow}>
          {SEVERITY_LABELS.map((label, idx) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.severityBtn,
                { backgroundColor: severity === idx ? SEVERITY_COLORS[idx] : SEVERITY_BG[idx] },
                severity === idx && styles.severityBtnActive,
              ]}
              onPress={() => setSeverity(idx as 0 | 1 | 2 | 3)}
              activeOpacity={0.8}
            >
              <Text style={[styles.severityBtnText, severity === idx && styles.severityBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.label}>Additional Notes (optional)</Text>
        <TextInput
          style={[styles.textArea, { height: 80 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any other observations or context..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Meal Log'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 20,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mealTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  mealTypeBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  mealTypeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  mealTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  mealTypeLabelActive: {
    color: '#4F46E5',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    lineHeight: 22,
  },
  allergenAlert: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  allergenAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allergenChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  symptomChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  symptomChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  symptomChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severityBtnActive: {
    borderColor: 'transparent',
  },
  severityBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  severityBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 28,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
