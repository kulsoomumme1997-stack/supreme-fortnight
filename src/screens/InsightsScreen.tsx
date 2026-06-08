import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ALLERGEN_MAP } from '../constants/allergens';
import { loadFoodLogs } from '../storage';
import { FoodLogEntry } from '../types';
import { RootStackParamList } from '../navigation';
import {
  analyzePatterns,
  CorrelationResult,
  Confidence,
  PATTERN_DISCLAIMER,
  MIN_SAMPLE_SIZE,
} from '../utils/patternAnalysis';

type InsightsNavProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  notable: 'Notable pattern',
  moderate: 'Moderate pattern',
  low: 'Early signal',
};

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  notable: '#EF4444',
  moderate: '#F59E0B',
  low: '#9CA3AF',
};

function CorrelationCard({ result }: { result: CorrelationResult }) {
  const allergen = ALLERGEN_MAP[result.allergenId];
  const pct = Math.round(result.symptomRate * 100);
  return (
    <View style={styles.corrCard}>
      <View style={styles.corrHeader}>
        <View style={styles.corrHeaderLeft}>
          {allergen && <View style={[styles.dot, { backgroundColor: allergen.color }]} />}
          <Text style={styles.corrName}>{allergen?.name ?? result.allergenId}</Text>
        </View>
        <View style={[styles.confBadge, { backgroundColor: CONFIDENCE_COLORS[result.confidence] }]}>
          <Text style={styles.confBadgeText}>{CONFIDENCE_LABELS[result.confidence]}</Text>
        </View>
      </View>
      <Text style={styles.corrSummary}>{result.summary}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: CONFIDENCE_COLORS[result.confidence] }]} />
      </View>
      <View style={styles.corrFooter}>
        <Text style={styles.corrFooterText}>{pct}% symptom rate</Text>
        <Text style={styles.corrFooterText}>{result.occurrences} meals logged</Text>
      </View>
    </View>
  );
}

function TimelineRow({ entry }: { entry: FoodLogEntry }) {
  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const hasSymptoms = entry.severity > 0 || entry.symptoms.length > 0;

  return (
    <View style={[styles.timelineRow, hasSymptoms ? styles.timelineRowSymptom : styles.timelineRowClear]}>
      <View style={styles.timelineDateCol}>
        <Text style={styles.timelineDate}>{dateStr}</Text>
        <Text style={styles.timelineTime}>{timeStr}</Text>
      </View>
      <View style={styles.timelineMainCol}>
        <Text style={styles.timelineFoods} numberOfLines={2}>{entry.foods}</Text>
        {hasSymptoms ? (
          <Text style={styles.timelineSymptoms}>
            {entry.symptoms.length > 0 ? entry.symptoms.join(', ') : 'Symptoms reported'}
            {entry.severity > 0 ? ` · severity ${entry.severity}/3` : ''}
          </Text>
        ) : (
          <Text style={styles.timelineNoSymptoms}>No symptoms reported</Text>
        )}
      </View>
      <View style={[styles.timelineDotIndicator, { backgroundColor: hasSymptoms ? '#EF4444' : '#10B981' }]} />
    </View>
  );
}

export default function InsightsScreen() {
  const navigation = useNavigation<InsightsNavProp>();
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadFoodLogs().then((l) => {
        if (active) {
          setLogs(l);
          setLoaded(true);
        }
      });
      return () => { active = false; };
    }, [])
  );

  const allergenNames: Record<string, string> = Object.fromEntries(
    Object.values(ALLERGEN_MAP).map((a) => [a.id, a.name])
  );

  const results = analyzePatterns(logs, allergenNames);
  const sortedTimeline = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Your Insights</Text>

        <View style={styles.disclaimerBanner}>
          <Text style={styles.disclaimerIcon}>🩺</Text>
          <Text style={styles.disclaimerText}>
            These are observed patterns in YOUR data, not a medical diagnosis. Share these
            insights with your doctor.
          </Text>
        </View>

        {loaded && results.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateText}>
              Log at least {MIN_SAMPLE_SIZE} meals containing the same potential trigger to start
              seeing patterns.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateBtn}
              onPress={() => navigation.navigate('FoodLog')}
            >
              <Text style={styles.emptyStateBtnText}>Log a Meal</Text>
            </TouchableOpacity>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Possible Patterns</Text>
            {results.map((r) => (
              <CorrelationCard key={r.allergenId} result={r} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Timeline</Text>
          {sortedTimeline.length === 0 ? (
            <Text style={styles.timelineEmptyText}>No meals logged yet.</Text>
          ) : (
            <>
              <View style={styles.timelineLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Day with symptoms</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>No symptoms</Text>
                </View>
              </View>
              {sortedTimeline.map((entry) => (
                <TimelineRow key={entry.id} entry={entry} />
              ))}
            </>
          )}
        </View>

        <View style={styles.footerDisclaimer}>
          <Text style={styles.footerDisclaimerText}>{PATTERN_DISCLAIMER}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 16 },
  disclaimerBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginBottom: 20,
    alignItems: 'center',
  },
  disclaimerIcon: { fontSize: 28 },
  disclaimerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#3730A3', lineHeight: 19 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 8,
  },
  emptyStateIcon: { fontSize: 40, marginBottom: 10 },
  emptyStateText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 16, paddingHorizontal: 24, lineHeight: 21 },
  emptyStateBtn: { backgroundColor: '#6366F1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyStateBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  corrCard: {
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
  corrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  corrHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  corrName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  confBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  corrSummary: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 10 },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: '#F3F4F6', overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 5 },
  corrFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  corrFooterText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  timelineEmptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  timelineLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6B7280' },
  timelineRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  timelineRowSymptom: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  timelineRowClear: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  timelineDateCol: { width: 76 },
  timelineDate: { fontSize: 12, fontWeight: '700', color: '#374151' },
  timelineTime: { fontSize: 11, color: '#9CA3AF' },
  timelineMainCol: { flex: 1, paddingHorizontal: 8 },
  timelineFoods: { fontSize: 14, fontWeight: '600', color: '#111827' },
  timelineSymptoms: { fontSize: 12, color: '#B91C1C', marginTop: 2 },
  timelineNoSymptoms: { fontSize: 12, color: '#047857', marginTop: 2 },
  timelineDotIndicator: { width: 10, height: 10, borderRadius: 5 },
  footerDisclaimer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginTop: 4 },
  footerDisclaimerText: { fontSize: 12, color: '#9CA3AF', lineHeight: 18, textAlign: 'center' },
});
