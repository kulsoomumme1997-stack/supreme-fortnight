import { FoodLogEntry, AllergenId } from '../types';

export const PATTERN_DISCLAIMER =
  'These results are simple pattern observations based only on the meals and symptoms you logged. ' +
  'They are NOT a medical diagnosis. Please share them with a doctor or registered dietitian who can ' +
  'help interpret what they might mean for you.';

export const MIN_SAMPLE_SIZE = 3;
export const DEFAULT_WINDOW_HOURS = 8;

export type Confidence = 'low' | 'moderate' | 'notable';

export interface CorrelationResult {
  allergenId: AllergenId;
  occurrences: number;
  symptomRate: number; // 0-1
  confidence: Confidence;
  summary: string;
}

function hasSymptoms(entry: FoodLogEntry): boolean {
  return entry.severity > 0 || entry.symptoms.length > 0;
}

/**
 * Returns true if any entry containing the given allergen, eaten before `entry.date`,
 * falls within `windowHours` of `entry` and that later entry shows symptoms.
 *
 * Simpler model used here: for a given meal entry that contains the allergen, we check
 * whether ANY entry (including itself) logged within `windowHours` after it shows symptoms.
 */
function symptomsWithinWindow(
  sourceEntry: FoodLogEntry,
  allEntries: FoodLogEntry[],
  windowHours: number
): boolean {
  const sourceTime = new Date(sourceEntry.date).getTime();
  const windowMs = windowHours * 60 * 60 * 1000;

  return allEntries.some((candidate) => {
    const candidateTime = new Date(candidate.date).getTime();
    const delta = candidateTime - sourceTime;
    if (delta < 0 || delta > windowMs) return false;
    return hasSymptoms(candidate);
  });
}

function confidenceFor(occurrences: number, symptomRate: number): Confidence {
  if (occurrences >= 6 && symptomRate >= 0.6) return 'notable';
  if (occurrences >= 4 && symptomRate >= 0.5) return 'moderate';
  return 'low';
}

function buildSummary(allergenName: string, occurrences: number, symptomCount: number, symptomRate: number): string {
  const pct = Math.round(symptomRate * 100);
  return `Symptoms appeared after ${symptomCount} of ${occurrences} meals containing ${allergenName} (${pct}%)`;
}

/**
 * Analyzes food log entries for correlations between allergens and symptoms occurring
 * within `windowHours` after eating. Pure function — no React/storage dependencies.
 */
export function analyzePatterns(
  entries: FoodLogEntry[],
  allergenNames: Record<AllergenId, string>,
  windowHours: number = DEFAULT_WINDOW_HOURS,
  minSampleSize: number = MIN_SAMPLE_SIZE
): CorrelationResult[] {
  if (entries.length === 0) return [];

  // Sort chronologically (oldest first) so window comparisons make sense.
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const allergenIds = new Set<AllergenId>();
  sorted.forEach((e) => e.flaggedAllergens.forEach((id) => allergenIds.add(id)));

  const results: CorrelationResult[] = [];

  for (const allergenId of allergenIds) {
    const withAllergen = sorted.filter((e) => e.flaggedAllergens.includes(allergenId));
    const occurrences = withAllergen.length;
    if (occurrences < minSampleSize) continue;

    const symptomCount = withAllergen.filter((e) =>
      symptomsWithinWindow(e, sorted, windowHours)
    ).length;
    const symptomRate = occurrences > 0 ? symptomCount / occurrences : 0;
    const confidence = confidenceFor(occurrences, symptomRate);
    const allergenName = allergenNames[allergenId] ?? allergenId;

    results.push({
      allergenId,
      occurrences,
      symptomRate,
      confidence,
      summary: buildSummary(allergenName, occurrences, symptomCount, symptomRate),
    });
  }

  const confidenceOrder: Record<Confidence, number> = { notable: 0, moderate: 1, low: 2 };
  return results.sort((a, b) => {
    const orderDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (orderDiff !== 0) return orderDiff;
    return b.symptomRate - a.symptomRate;
  });
}
