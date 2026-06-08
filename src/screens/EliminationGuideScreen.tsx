import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ALLERGENS, ALLERGEN_MAP } from '../constants/allergens';
import {
  loadEliminationPlans,
  saveEliminationPlan,
  updateEliminationPlan,
} from '../storage';
import { EliminationPlan } from '../types';

const ELIMINATION_DAYS = 21; // ~3 weeks
const REINTRO_DAYS = 3; // 48-72 hours

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function daysSince(dateStr: string): number {
  const start = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24))) + 1;
}

const PHASE_LABELS: Record<EliminationPlan['phase'], string> = {
  eliminating: 'Eliminating',
  reintroducing: 'Reintroducing',
  completed: 'Completed',
};

const PHASE_COLORS: Record<EliminationPlan['phase'], string> = {
  eliminating: '#EF4444',
  reintroducing: '#F59E0B',
  completed: '#10B981',
};

export default function EliminationGuideScreen() {
  const [plans, setPlans] = useState<EliminationPlan[]>([]);
  const [selectedAllergen, setSelectedAllergen] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    loadEliminationPlans().then((p) => {
      setPlans(p);
      setLoaded(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadEliminationPlans().then((p) => {
        if (active) {
          setPlans(p);
          setLoaded(true);
        }
      });
      return () => { active = false; };
    }, [])
  );

  const activePlan = plans.find((p) => p.phase !== 'completed');

  async function startPlan() {
    if (!selectedAllergen) return;
    const plan: EliminationPlan = {
      id: generateId(),
      allergenId: selectedAllergen,
      startDate: new Date().toISOString(),
      phase: 'eliminating',
      notes: '',
    };
    await saveEliminationPlan(plan);
    setSelectedAllergen(null);
    refresh();
  }

  async function advancePhase(plan: EliminationPlan) {
    const nextPhase: EliminationPlan['phase'] =
      plan.phase === 'eliminating' ? 'reintroducing' :
      plan.phase === 'reintroducing' ? 'completed' : 'completed';

    const messages: Record<string, string> = {
      reintroducing: 'Move to the reintroduction phase? Watch closely for symptoms over the next 48-72 hours as you reintroduce this food group.',
      completed: 'Mark this plan as completed?',
    };

    Alert.alert(
      'Move to next phase?',
      messages[nextPhase] ?? '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await updateEliminationPlan({ ...plan, phase: nextPhase });
            refresh();
          },
        },
      ]
    );
  }

  async function saveNotes(plan: EliminationPlan) {
    const notes = notesDraft[plan.id];
    if (notes === undefined) return;
    await updateEliminationPlan({ ...plan, notes });
    refresh();
  }

  function dayLabel(plan: EliminationPlan): string {
    const day = daysSince(plan.startDate);
    if (plan.phase === 'eliminating') {
      return `Day ${day} of ~${ELIMINATION_DAYS} (elimination)`;
    }
    if (plan.phase === 'reintroducing') {
      return `Day ${day} of reintroduction (watch for ${REINTRO_DAYS} days)`;
    }
    return 'Plan completed';
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Elimination Diet Guide</Text>
        <Text style={styles.subheading}>
          A structured way to test whether removing a suspected trigger — and then carefully
          reintroducing it — changes how you feel. Always consider doing this alongside your
          doctor or a registered dietitian, especially for restrictive diets.
        </Text>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineCardTitle}>Suggested timeline</Text>
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.timelineStepText}>
              <Text style={styles.bold}>Eliminate</Text> the food group completely for 2-3 weeks
              (about {ELIMINATION_DAYS} days), keeping your food log going the whole time.
            </Text>
          </View>
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.timelineStepText}>
              <Text style={styles.bold}>Reintroduce</Text> it deliberately, then watch closely
              for symptoms over the next 48-72 hours.
            </Text>
          </View>
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.timelineStepText}>
              <Text style={styles.bold}>Reflect</Text> on what you noticed, add notes, and
              discuss the results with your doctor.
            </Text>
          </View>
        </View>

        {loaded && !activePlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start a plan</Text>
            <Text style={styles.sectionSubtitle}>
              Pick one suspected allergen group to focus on. Trying to eliminate too much at
              once makes it hard to learn anything useful.
            </Text>
            <View style={styles.chipRow}>
              {ALLERGENS.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.chip,
                    selectedAllergen === a.id && { backgroundColor: a.color, borderColor: a.color },
                  ]}
                  onPress={() => setSelectedAllergen(a.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, selectedAllergen === a.id && styles.chipTextSelected]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, !selectedAllergen && styles.primaryButtonDisabled]}
              onPress={startPlan}
              disabled={!selectedAllergen}
            >
              <Text style={styles.primaryButtonText}>Start Elimination Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {activePlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your active plan</Text>
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planAllergen}>
                  {ALLERGEN_MAP[activePlan.allergenId]?.name ?? activePlan.allergenId}
                </Text>
                <View style={[styles.phaseBadge, { backgroundColor: PHASE_COLORS[activePlan.phase] }]}>
                  <Text style={styles.phaseBadgeText}>{PHASE_LABELS[activePlan.phase]}</Text>
                </View>
              </View>
              <Text style={styles.planDay}>{dayLabel(activePlan)}</Text>
              <Text style={styles.planStarted}>
                Started {new Date(activePlan.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>

              <Text style={styles.notesLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                placeholder="How are you feeling? Anything you noticed today?"
                placeholderTextColor="#9CA3AF"
                value={notesDraft[activePlan.id] ?? activePlan.notes}
                onChangeText={(text) => setNotesDraft((prev) => ({ ...prev, [activePlan.id]: text }))}
                onBlur={() => saveNotes(activePlan)}
                textAlignVertical="top"
              />

              {activePlan.phase !== 'completed' && (
                <TouchableOpacity style={styles.advanceButton} onPress={() => advancePhase(activePlan)}>
                  <Text style={styles.advanceButtonText}>
                    {activePlan.phase === 'eliminating' ? 'Move to Reintroduction →' : 'Mark as Completed →'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {plans.filter((p) => p.phase === 'completed').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past plans</Text>
            {plans.filter((p) => p.phase === 'completed').map((p) => (
              <View key={p.id} style={styles.pastPlanCard}>
                <Text style={styles.pastPlanAllergen}>{ALLERGEN_MAP[p.allergenId]?.name ?? p.allergenId}</Text>
                <Text style={styles.pastPlanDate}>
                  Started {new Date(p.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {!!p.notes && <Text style={styles.pastPlanNotes}>{p.notes}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This guide is informational and not medical advice. Talk to a healthcare provider
            before starting any elimination diet, especially if you have nutritional concerns
            or existing health conditions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subheading: { fontSize: 14, color: '#6B7280', marginBottom: 18, lineHeight: 21 },
  timelineCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 24, gap: 14 },
  timelineCardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  timelineStep: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineStepText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  bold: { fontWeight: '700', color: '#111827' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 19 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  primaryButton: { backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryButtonDisabled: { backgroundColor: '#A5B4FC' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planAllergen: { fontSize: 18, fontWeight: '800', color: '#111827' },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  phaseBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  planDay: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 2 },
  planStarted: { fontSize: 12, color: '#9CA3AF', marginBottom: 16 },
  notesLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 90,
    marginBottom: 16,
  },
  advanceButton: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  advanceButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pastPlanCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10 },
  pastPlanAllergen: { fontSize: 15, fontWeight: '700', color: '#111827' },
  pastPlanDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  pastPlanNotes: { fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 19 },
  disclaimerBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  disclaimerText: { color: '#92400E', fontSize: 13, lineHeight: 20 },
});
