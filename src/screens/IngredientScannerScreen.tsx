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
import { ALLERGENS, ALLERGEN_MAP, detectAllergens, getMatchedKeywords, getAmbiguousMatches } from '../constants/allergens';
import { loadSensitivities } from '../storage';
import { UserSensitivities } from '../types';

type MatchLevel = 'known' | 'suspected' | 'other';

const MATCH_COLORS: Record<MatchLevel, string> = {
  known: '#EF4444',
  suspected: '#F59E0B',
  other: '#6B7280',
};

const MATCH_BG: Record<MatchLevel, string> = {
  known: '#FEF2F2',
  suspected: '#FFFBEB',
  other: '#F9FAFB',
};

const MATCH_BORDER: Record<MatchLevel, string> = {
  known: '#FECACA',
  suspected: '#FDE68A',
  other: '#E5E7EB',
};

const MATCH_LABELS: Record<MatchLevel, string> = {
  known: 'Known Allergen',
  suspected: 'Suspected Sensitivity',
  other: 'Potential Allergen',
};

function HighlightedIngredients({
  text,
  keywords,
}: {
  text: string;
  keywords: string[];
}) {
  if (keywords.length === 0) {
    return <Text style={styles.ingredientText}>{text}</Text>;
  }

  // Build a regex that matches any of the keywords (case-insensitive)
  const escapedKws = keywords.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedKws.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <Text style={styles.ingredientText}>
      {parts.map((part, idx) => {
        const isMatch = keywords.some((kw) => part.toLowerCase() === kw.toLowerCase());
        if (isMatch) {
          return (
            <Text key={idx} style={styles.highlightedKeyword}>
              {part}
            </Text>
          );
        }
        return <Text key={idx}>{part}</Text>;
      })}
    </Text>
  );
}

export default function IngredientScannerScreen() {
  const [inputText, setInputText] = useState('');
  const [scanned, setScanned] = useState(false);
  const [detectedIds, setDetectedIds] = useState<string[]>([]);
  const [ambiguousTerms, setAmbiguousTerms] = useState<string[]>([]);
  const [sensitivities, setSensitivities] = useState<UserSensitivities>({
    known: [],
    suspected: [],
    quizCompleted: false,
    mode: null,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSensitivities().then((s) => {
        if (active) setSensitivities(s);
      });
      return () => { active = false; };
    }, [])
  );

  function handleScan() {
    if (!inputText.trim()) return;
    const ids = detectAllergens(inputText);
    setDetectedIds(ids);
    setAmbiguousTerms(getAmbiguousMatches(inputText));
    setScanned(true);
  }

  function handleClear() {
    setInputText('');
    setDetectedIds([]);
    setAmbiguousTerms([]);
    setScanned(false);
  }

  function getMatchLevel(allergenId: string): MatchLevel {
    if (sensitivities.known.includes(allergenId)) return 'known';
    if (sensitivities.suspected.includes(allergenId)) return 'suspected';
    return 'other';
  }

  // Sort: known first, then suspected, then other
  const sortedDetected = [...detectedIds].sort((a, b) => {
    const order: Record<MatchLevel, number> = { known: 0, suspected: 1, other: 2 };
    return order[getMatchLevel(a)] - order[getMatchLevel(b)];
  });

  const hasKnown = detectedIds.some((id) => sensitivities.known.includes(id));
  const hasSuspected = detectedIds.some(
    (id) => sensitivities.suspected.includes(id) && !sensitivities.known.includes(id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Ingredient Scanner</Text>
        <Text style={styles.subheading}>
          Paste or type an ingredient list to check for allergens.
        </Text>

        <TextInput
          style={styles.textArea}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            if (scanned) setScanned(false);
          }}
          placeholder={
            'Paste ingredient list here…\n\nExample:\nWheat flour, water, salt, yeast, soy lecithin, sesame seeds, butter...'
          }
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.scanBtn, !inputText.trim() && styles.scanBtnDisabled]}
            onPress={handleScan}
            disabled={!inputText.trim()}
            activeOpacity={0.85}
          >
            <Text style={styles.scanBtnText}>🔍 Scan Ingredients</Text>
          </TouchableOpacity>
          {(inputText.length > 0 || scanned) && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {scanned && (
          <View style={styles.resultsContainer}>
            {/* Summary banner */}
            {detectedIds.length === 0 ? (
              <View style={styles.safeBanner}>
                <Text style={styles.safeBannerIcon}>✅</Text>
                <View>
                  <Text style={styles.safeBannerTitle}>No allergens detected</Text>
                  <Text style={styles.safeBannerSubtitle}>
                    None of the 16 tracked allergens were found in this ingredient list.
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {hasKnown && (
                  <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                    <Text style={styles.alertBannerIcon}>🚨</Text>
                    <Text style={[styles.alertBannerText, { color: '#B91C1C' }]}>
                      Contains allergens you are known to react to!
                    </Text>
                  </View>
                )}
                {!hasKnown && hasSuspected && (
                  <View style={[styles.alertBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <Text style={styles.alertBannerIcon}>⚠️</Text>
                    <Text style={[styles.alertBannerText, { color: '#92400E' }]}>
                      Contains ingredients you may be sensitive to.
                    </Text>
                  </View>
                )}
                {!hasKnown && !hasSuspected && (
                  <View style={[styles.alertBanner, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                    <Text style={styles.alertBannerIcon}>ℹ️</Text>
                    <Text style={[styles.alertBannerText, { color: '#374151' }]}>
                      Allergens found, but none match your personal profile.
                    </Text>
                  </View>
                )}

                <Text style={styles.resultsTitle}>
                  {detectedIds.length} allergen{detectedIds.length !== 1 ? 's' : ''} detected
                </Text>

                {sortedDetected.map((allergenId) => {
                  const allergen = ALLERGEN_MAP[allergenId];
                  if (!allergen) return null;
                  const level = getMatchLevel(allergenId);
                  const matchedKws = getMatchedKeywords(inputText, allergenId);
                  return (
                    <View
                      key={allergenId}
                      style={[
                        styles.allergenCard,
                        {
                          backgroundColor: MATCH_BG[level],
                          borderColor: MATCH_BORDER[level],
                        },
                      ]}
                    >
                      <View style={styles.allergenCardHeader}>
                        <View style={styles.allergenCardLeft}>
                          <View style={[styles.allergenDot, { backgroundColor: allergen.color }]} />
                          <Text style={styles.allergenCardName}>{allergen.name}</Text>
                        </View>
                        <View
                          style={[
                            styles.matchLevelBadge,
                            { backgroundColor: MATCH_COLORS[level] },
                          ]}
                        >
                          <Text style={styles.matchLevelText}>{MATCH_LABELS[level]}</Text>
                        </View>
                      </View>

                      {matchedKws.length > 0 && (
                        <View style={styles.matchedKeywordsSection}>
                          <Text style={styles.matchedKeywordsLabel}>Found in ingredient list:</Text>
                          <HighlightedIngredients
                            text={inputText}
                            keywords={matchedKws}
                          />
                        </View>
                      )}

                      <Text style={styles.allergenCardDesc}>{allergen.description}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {ambiguousTerms.length > 0 && (
              <View style={styles.ambiguousBox}>
                <Text style={styles.ambiguousTitle}>⚠️ Worth double-checking</Text>
                <Text style={styles.ambiguousSubtitle}>
                  These terms can sometimes hide an allergen depending on the brand or recipe. They aren't a confirmed match, but you may want to check with the manufacturer or read the full label.
                </Text>
                <View style={styles.chipRow}>
                  {ambiguousTerms.map((term) => (
                    <View key={term} style={styles.ambiguousChip}>
                      <Text style={styles.ambiguousChipText}>{term}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Legend */}
            {(sensitivities.known.length > 0 || sensitivities.suspected.length > 0) && (
              <View style={styles.legend}>
                <Text style={styles.legendTitle}>Your Profile Key</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: MATCH_COLORS.known }]} />
                  <Text style={styles.legendText}>Known allergen (confirmed)</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: MATCH_COLORS.suspected }]} />
                  <Text style={styles.legendText}>Suspected sensitivity</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: MATCH_COLORS.other }]} />
                  <Text style={styles.legendText}>General allergen (not in your profile)</Text>
                </View>
              </View>
            )}
          </View>
        )}
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
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 22,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 14,
    color: '#111827',
    minHeight: 160,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  scanBtn: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  clearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 12,
  },
  safeBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  safeBannerIcon: {
    fontSize: 32,
  },
  safeBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  safeBannerSubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  alertBannerIcon: {
    fontSize: 24,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 4,
    marginBottom: 4,
  },
  allergenCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  allergenCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  allergenCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allergenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  allergenCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  matchLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchLevelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  matchedKeywordsSection: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  matchedKeywordsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  ingredientText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  highlightedKeyword: {
    backgroundColor: '#FEF08A',
    color: '#78350F',
    fontWeight: '700',
    borderRadius: 3,
  },
  allergenCardDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  legend: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 8,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#6B7280',
  },
  ambiguousBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  ambiguousTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  ambiguousSubtitle: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ambiguousChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ambiguousChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
});
