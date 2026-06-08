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
import { loadSensitivities, saveSensitivities } from '../storage';
import { RootStackParamList } from '../navigation';

type ModeSelectNavProp = StackNavigationProp<RootStackParamList, 'ModeSelect'>;

export default function ModeSelectScreen() {
  const navigation = useNavigation<ModeSelectNavProp>();
  const [currentMode, setCurrentMode] = useState<'investigate' | 'manage' | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSensitivities().then((s) => {
        if (active) setCurrentMode(s.mode);
      });
      return () => { active = false; };
    }, [])
  );

  async function choose(mode: 'investigate' | 'manage') {
    setSaving(true);
    const existing = await loadSensitivities();
    await saveSensitivities({ ...existing, mode });
    setSaving(false);
    setCurrentMode(mode);
    navigation.navigate('MainTabs');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>How would you like to use SensitivityTracker?</Text>
        <Text style={styles.subheading}>
          Pick the path that fits you best. You can always switch later from Settings or Home.
        </Text>

        <TouchableOpacity
          style={[styles.card, styles.investigateCard, currentMode === 'investigate' && styles.cardSelected]}
          onPress={() => choose('investigate')}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.cardIcon}>🔎</Text>
          <Text style={styles.cardTitle}>Investigate</Text>
          <Text style={styles.cardDesc}>
            For people with ongoing, unexplained symptoms (like long-term digestive issues)
            who haven't yet found a clear cause. Log your meals and symptoms, and we'll help
            you spot patterns in your own data — insights you can bring to your doctor — plus
            a guided elimination diet to help narrow things down.
          </Text>
          {currentMode === 'investigate' && <Text style={styles.currentBadge}>✓ Currently selected</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.manageCard, currentMode === 'manage' && styles.cardSelected]}
          onPress={() => choose('manage')}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.cardIcon}>🛡️</Text>
          <Text style={styles.cardTitle}>Manage</Text>
          <Text style={styles.cardDesc}>
            For people who already know their allergies or sensitivities and want help
            avoiding triggers day-to-day. Build a list of foods you know are safe, scan
            ingredient labels quickly, and keep your known sensitivities front and center.
          </Text>
          {currentMode === 'manage' && <Text style={styles.currentBadge}>✓ Currently selected</Text>}
        </TouchableOpacity>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Not sure? You can change your mind any time — this just changes which tools we put
            front and center for you.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8, lineHeight: 32 },
  subheading: { fontSize: 15, color: '#6B7280', marginBottom: 24, lineHeight: 22 },
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  investigateCard: { backgroundColor: '#EEF2FF' },
  manageCard: { backgroundColor: '#F0FDF4' },
  cardSelected: { borderColor: '#6366F1' },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#374151', lineHeight: 21 },
  currentBadge: { marginTop: 12, fontSize: 13, fontWeight: '700', color: '#6366F1' },
  note: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  noteText: { fontSize: 13, color: '#6B7280', lineHeight: 20, textAlign: 'center' },
});
