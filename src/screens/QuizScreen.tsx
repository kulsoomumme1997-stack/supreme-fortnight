import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ALLERGENS, ALLERGEN_MAP } from '../constants/allergens';
import { saveSensitivities, loadSensitivities } from '../storage';
import { AllergenId } from '../types';
import { RootStackParamList } from '../navigation';

type QuizNavProp = StackNavigationProp<RootStackParamList, 'Quiz'>;

const SYMPTOMS = [
  'Bloating', 'Gas', 'Stomach pain / cramps', 'Nausea', 'Diarrhea',
  'Constipation', 'Hives / rash', 'Eczema / itchy skin', 'Headache / migraine',
  'Brain fog', 'Fatigue / tiredness', 'Runny / blocked nose', 'Sneezing',
  'Itchy eyes', 'Swelling (lips, tongue, face)', 'Difficulty breathing',
];

const FOOD_GROUPS = [
  { label: 'Bread & wheat products', allergenIds: ['gluten'] },
  { label: 'Milk & cheese', allergenIds: ['dairy'] },
  { label: 'Eggs & egg dishes', allergenIds: ['eggs'] },
  { label: 'Peanuts & peanut butter', allergenIds: ['peanuts'] },
  { label: 'Tree nuts (almonds, cashews, etc.)', allergenIds: ['tree_nuts'] },
  { label: 'Fish & fish products', allergenIds: ['fish'] },
  { label: 'Shrimp, crab & lobster', allergenIds: ['shellfish'] },
  { label: 'Oysters, mussels & squid', allergenIds: ['molluscs'] },
  { label: 'Soy products & tofu', allergenIds: ['soy'] },
  { label: 'Sesame & tahini', allergenIds: ['sesame'] },
  { label: 'Wine, beer & dried fruits', allergenIds: ['sulphites'] },
  { label: 'Corn & corn products', allergenIds: ['corn'] },
  { label: 'Tomatoes, peppers & eggplant', allergenIds: ['nightshades'] },
];

const ONSET_OPTIONS = [
  'Within 30 minutes',
  '30 minutes to 2 hours',
  '2 to 6 hours',
  'More than 6 hours',
  'Hard to tell / varies',
];

interface QuizState {
  knownAllergens: AllergenId[];
  symptoms: string[];
  badFoodGroups: string[];
  onsetTime: string;
}

type Step = 0 | 1 | 2 | 3 | 4; // 4 = results

const TOTAL_STEPS = 4;

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[styles.progressDot, i < step && styles.progressDotActive, i === step - 1 && styles.progressDotCurrent]}
        />
      ))}
      <Text style={styles.progressText}>{step}/{TOTAL_STEPS}</Text>
    </View>
  );
}

function MultiSelectChip({
  label,
  selected,
  color,
  onPress,
}: {
  label: string;
  selected: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: color ?? '#6366F1', borderColor: color ?? '#6366F1' },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function QuizScreen() {
  const navigation = useNavigation<QuizNavProp>();
  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    knownAllergens: [],
    symptoms: [],
    badFoodGroups: [],
    onsetTime: '',
  });
  const [suspectedResult, setSuspectedResult] = useState<AllergenId[]>([]);

  function toggleItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function computeSuspected(): AllergenId[] {
    const suspects = new Set<AllergenId>(quizState.knownAllergens);
    // From bad food groups
    for (const fg of FOOD_GROUPS) {
      if (quizState.badFoodGroups.includes(fg.label)) {
        fg.allergenIds.forEach((id) => suspects.add(id));
      }
    }
    // Symptom-based heuristics
    const s = quizState.symptoms;
    if (s.some((x) => ['Bloating', 'Gas', 'Stomach pain / cramps', 'Diarrhea', 'Constipation'].includes(x))) {
      ['gluten', 'dairy', 'soy'].forEach((id) => suspects.add(id));
    }
    if (s.some((x) => ['Hives / rash', 'Eczema / itchy skin', 'Itchy eyes', 'Sneezing'].includes(x))) {
      ['peanuts', 'tree_nuts', 'eggs', 'shellfish'].forEach((id) => suspects.add(id));
    }
    if (s.some((x) => ['Headache / migraine', 'Brain fog'].includes(x))) {
      ['gluten', 'dairy', 'sulphites', 'nightshades'].forEach((id) => suspects.add(id));
    }
    if (s.includes('Runny / blocked nose')) {
      ['dairy', 'eggs'].forEach((id) => suspects.add(id));
    }
    return Array.from(suspects);
  }

  async function handleFinish() {
    setSaving(true);
    const suspected = computeSuspected();
    setSuspectedResult(suspected);
    const existing = await loadSensitivities();
    await saveSensitivities({
      known: quizState.knownAllergens,
      suspected,
      quizCompleted: true,
      mode: existing.mode,
    });
    setSaving(false);
    setStep(5); // results step
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
    else navigation.goBack();
  }

  if (step === 5) {
    // Results screen
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultsTitle}>Your Sensitivity Profile</Text>
          <Text style={styles.resultsSubtitle}>
            Based on your answers, here are your identified and suspected sensitivities. Remember: this is not a medical diagnosis.
          </Text>

          {quizState.knownAllergens.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>Known / Confirmed</Text>
              <View style={styles.chipRow}>
                {quizState.knownAllergens.map((id) => {
                  const a = ALLERGEN_MAP[id];
                  return (
                    <View key={id} style={[styles.resultChip, { backgroundColor: a.color }]}>
                      <Text style={styles.resultChipText}>{a.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {suspectedResult.filter((id) => !quizState.knownAllergens.includes(id)).length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>Suspected Sensitivities</Text>
              <View style={styles.chipRow}>
                {suspectedResult
                  .filter((id) => !quizState.knownAllergens.includes(id))
                  .map((id) => {
                    const a = ALLERGEN_MAP[id];
                    if (!a) return null;
                    return (
                      <View key={id} style={[styles.resultChip, { backgroundColor: a.color + 'CC' }]}>
                        <Text style={styles.resultChipText}>{a.name}</Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          )}

          {suspectedResult.length === 0 && quizState.knownAllergens.length === 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.noResultsText}>
                No specific sensitivities identified from your answers. You can still use the Food Log and Ingredient Scanner to track how you feel after meals.
              </Text>
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              This quiz is for informational purposes only and does not replace professional medical advice. If you suspect a food allergy, please consult a healthcare provider.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ModeSelect')}
          >
            <Text style={styles.primaryButtonText}>Choose How You'd Like to Use the App →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <ProgressBar step={step} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View>
            <Text style={styles.questionTitle}>Do you have any diagnosed food allergies or intolerances?</Text>
            <Text style={styles.questionSubtitle}>Select all that apply. You can choose "None" if you have no confirmed diagnoses.</Text>
            <View style={styles.chipRow}>
              {ALLERGENS.map((a) => (
                <MultiSelectChip
                  key={a.id}
                  label={a.name}
                  selected={quizState.knownAllergens.includes(a.id)}
                  color={a.color}
                  onPress={() =>
                    setQuizState((prev) => ({
                      ...prev,
                      knownAllergens: toggleItem(prev.knownAllergens, a.id),
                    }))
                  }
                />
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.questionTitle}>Which symptoms do you regularly experience?</Text>
            <Text style={styles.questionSubtitle}>Select any that you often notice after eating.</Text>
            <View style={styles.chipRow}>
              {SYMPTOMS.map((sym) => (
                <MultiSelectChip
                  key={sym}
                  label={sym}
                  selected={quizState.symptoms.includes(sym)}
                  color="#6366F1"
                  onPress={() =>
                    setQuizState((prev) => ({
                      ...prev,
                      symptoms: toggleItem(prev.symptoms, sym),
                    }))
                  }
                />
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.questionTitle}>Which food groups make you feel unwell?</Text>
            <Text style={styles.questionSubtitle}>Select all food groups that tend to cause you discomfort or reactions.</Text>
            <View style={styles.chipRow}>
              {FOOD_GROUPS.map((fg) => (
                <MultiSelectChip
                  key={fg.label}
                  label={fg.label}
                  selected={quizState.badFoodGroups.includes(fg.label)}
                  color="#F59E0B"
                  onPress={() =>
                    setQuizState((prev) => ({
                      ...prev,
                      badFoodGroups: toggleItem(prev.badFoodGroups, fg.label),
                    }))
                  }
                />
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.questionTitle}>How soon after eating do your symptoms usually appear?</Text>
            <Text style={styles.questionSubtitle}>
              Timing can help distinguish between allergies (fast) and intolerances (slower).
            </Text>
            <View style={styles.optionList}>
              {ONSET_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionItem, quizState.onsetTime === opt && styles.optionItemSelected]}
                  onPress={() => setQuizState((prev) => ({ ...prev, onsetTime: opt }))}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, quizState.onsetTime === opt && styles.radioSelected]} />
                  <Text style={[styles.optionText, quizState.onsetTime === opt && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleNext}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {step === TOTAL_STEPS ? (saving ? 'Saving…' : 'See My Results') : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    marginRight: 12,
  },
  backBtnText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
  },
  progressDotCurrent: {
    backgroundColor: '#6366F1',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 30,
  },
  questionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  optionItemSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F1',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#1E1B4B',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  // Results styles
  resultsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultsSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  resultChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  resultChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  noResultsText: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  disclaimerBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  disclaimerText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 20,
  },
});
