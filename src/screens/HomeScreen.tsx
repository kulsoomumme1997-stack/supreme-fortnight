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
import { loadSensitivities, loadFoodLogs } from '../storage';
import { UserSensitivities, FoodLogEntry } from '../types';
import { RootStackParamList } from '../navigation';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const SEVERITY_COLORS = ['#6EE7B7', '#FCD34D', '#FB923C', '#EF4444'];

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

function FoodLogCard({ entry }: { entry: FoodLogEntry }) {
  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.logCard}>
      <View style={styles.logCardHeader}>
        <View>
          <Text style={styles.logCardDate}>{dateStr} · {timeStr}</Text>
          <Text style={styles.logCardMeal}>{entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}</Text>
        </View>
        <SeverityBadge severity={entry.severity} />
      </View>
      <Text style={styles.logCardFoods} numberOfLines={2}>{entry.foods}</Text>
      {entry.flaggedAllergens.length > 0 && (
        <View style={styles.logCardAllergens}>
          {entry.flaggedAllergens.slice(0, 4).map((id) => (
            <AllergenChip key={id} allergenId={id} />
          ))}
          {entry.flaggedAllergens.length > 4 && (
            <Text style={styles.moreText}>+{entry.flaggedAllergens.length - 4} more</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const [sensitivities, setSensitivities] = useState<UserSensitivities>({
    known: [],
    suspected: [],
    quizCompleted: false,
  });
  const [recentLogs, setRecentLogs] = useState<FoodLogEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [sens, logs] = await Promise.all([loadSensitivities(), loadFoodLogs()]);
        if (active) {
          setSensitivities(sens);
          setRecentLogs(logs.slice(0, 3));
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const allSensitivities = [
    ...sensitivities.known.map((id) => ({ id, type: 'known' as const })),
    ...sensitivities.suspected
      .filter((id) => !sensitivities.known.includes(id))
      .map((id) => ({ id, type: 'suspected' as const })),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header greeting */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>Your Sensitivity Dashboard</Text>
          <Text style={styles.subtitle}>Track your food reactions and sensitivities</Text>
        </View>

        {/* Quiz banner */}
        {!sensitivities.quizCompleted && (
          <TouchableOpacity
            style={styles.quizBanner}
            onPress={() => navigation.navigate('Quiz')}
            activeOpacity={0.85}
          >
            <View style={styles.quizBannerContent}>
              <Text style={styles.quizBannerIcon}>📋</Text>
              <View style={styles.quizBannerText}>
                <Text style={styles.quizBannerTitle}>Take the Sensitivity Quiz</Text>
                <Text style={styles.quizBannerSubtitle}>
                  Answer a few questions to identify your likely sensitivities.
                </Text>
              </View>
              <Text style={styles.quizBannerArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Sensitivities section */}
        {allSensitivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Sensitivities</Text>
            <View style={styles.chipRow}>
              {allSensitivities.map(({ id, type }) => {
                const a = ALLERGEN_MAP[id];
                if (!a) return null;
                return (
                  <View
                    key={id}
                    style={[
                      styles.sensitivityChip,
                      { backgroundColor: a.color },
                      type === 'suspected' && styles.sensitivityChipSuspected,
                    ]}
                  >
                    <Text style={styles.sensitivityChipText}>{a.name}</Text>
                    {type === 'suspected' && (
                      <Text style={styles.sensitivityChipBadge}> ?</Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={styles.chipLegend}>? = suspected only</Text>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#EEF2FF' }]}
              onPress={() => navigation.navigate('FoodLog')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>🍽️</Text>
              <Text style={styles.actionLabel}>Log a Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]}
              onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Scanner' })}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionLabel}>Scan Ingredients</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#FFFBEB' }]}
              onPress={() => navigation.navigate('Quiz')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>{sensitivities.quizCompleted ? 'Retake Quiz' : 'Take Quiz'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#FFF1F2' }]}
              onPress={() => (navigation as any).navigate('MainTabs', { screen: 'History' })}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionLabel}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Food Logs</Text>
          {recentLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🍴</Text>
              <Text style={styles.emptyStateText}>No food logs yet. Start tracking your meals!</Text>
              <TouchableOpacity
                style={styles.emptyStateBtn}
                onPress={() => navigation.navigate('FoodLog')}
              >
                <Text style={styles.emptyStateBtnText}>Log Your First Meal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {recentLogs.map((entry) => (
                <FoodLogCard key={entry.id} entry={entry} />
              ))}
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('MainTabs', { screen: 'History' })}
              >
                <Text style={styles.viewAllLink}>View all logs →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 20,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  quizBanner: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  quizBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizBannerIcon: {
    fontSize: 32,
  },
  quizBannerText: {
    flex: 1,
  },
  quizBannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quizBannerSubtitle: {
    fontSize: 13,
    color: '#C7D2FE',
    marginTop: 2,
  },
  quizBannerArrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sensitivityChip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sensitivityChipSuspected: {
    opacity: 0.75,
  },
  sensitivityChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sensitivityChipBadge: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  chipLegend: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
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
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logCardDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  logCardMeal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  logCardFoods: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
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
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emptyStateBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  viewAllLink: {
    textAlign: 'center',
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 15,
    marginTop: 4,
  },
});
