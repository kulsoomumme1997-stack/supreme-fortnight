import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodLogEntry, UserSensitivities, EliminationPlan } from '../types';

const KEYS = {
  SENSITIVITIES: '@sensitivity_tracker:sensitivities',
  FOOD_LOGS: '@sensitivity_tracker:food_logs',
  ELIMINATION_PLANS: '@sensitivity_tracker:elimination_plans',
  SAFE_FOODS: '@sensitivity_tracker:safe_foods',
};

// ─── User Sensitivities ────────────────────────────────────────────────────────

export async function loadSensitivities(): Promise<UserSensitivities> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SENSITIVITIES);
    if (raw) {
      return JSON.parse(raw) as UserSensitivities;
    }
  } catch (e) {
    console.warn('loadSensitivities error', e);
  }
  return { known: [], suspected: [], quizCompleted: false, mode: null };
}

export async function saveSensitivities(data: UserSensitivities): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SENSITIVITIES, JSON.stringify(data));
  } catch (e) {
    console.warn('saveSensitivities error', e);
  }
}

// ─── Food Log Entries ─────────────────────────────────────────────────────────

export async function loadFoodLogs(): Promise<FoodLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FOOD_LOGS);
    if (raw) {
      return JSON.parse(raw) as FoodLogEntry[];
    }
  } catch (e) {
    console.warn('loadFoodLogs error', e);
  }
  return [];
}

export async function saveFoodLog(entry: FoodLogEntry): Promise<void> {
  try {
    const logs = await loadFoodLogs();
    logs.unshift(entry);
    await AsyncStorage.setItem(KEYS.FOOD_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.warn('saveFoodLog error', e);
  }
}

export async function deleteFoodLog(id: string): Promise<void> {
  try {
    const logs = await loadFoodLogs();
    const updated = logs.filter((l) => l.id !== id);
    await AsyncStorage.setItem(KEYS.FOOD_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('deleteFoodLog error', e);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.SENSITIVITIES,
      KEYS.FOOD_LOGS,
      KEYS.ELIMINATION_PLANS,
      KEYS.SAFE_FOODS,
    ]);
  } catch (e) {
    console.warn('clearAllData error', e);
  }
}

// ─── Elimination Plans ────────────────────────────────────────────────────────

export async function loadEliminationPlans(): Promise<EliminationPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ELIMINATION_PLANS);
    if (raw) {
      return JSON.parse(raw) as EliminationPlan[];
    }
  } catch (e) {
    console.warn('loadEliminationPlans error', e);
  }
  return [];
}

export async function saveEliminationPlan(plan: EliminationPlan): Promise<void> {
  try {
    const plans = await loadEliminationPlans();
    plans.unshift(plan);
    await AsyncStorage.setItem(KEYS.ELIMINATION_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.warn('saveEliminationPlan error', e);
  }
}

export async function updateEliminationPlan(plan: EliminationPlan): Promise<void> {
  try {
    const plans = await loadEliminationPlans();
    const updated = plans.map((p) => (p.id === plan.id ? plan : p));
    await AsyncStorage.setItem(KEYS.ELIMINATION_PLANS, JSON.stringify(updated));
  } catch (e) {
    console.warn('updateEliminationPlan error', e);
  }
}

export async function deleteEliminationPlan(id: string): Promise<void> {
  try {
    const plans = await loadEliminationPlans();
    const updated = plans.filter((p) => p.id !== id);
    await AsyncStorage.setItem(KEYS.ELIMINATION_PLANS, JSON.stringify(updated));
  } catch (e) {
    console.warn('deleteEliminationPlan error', e);
  }
}

// ─── Safe Foods ───────────────────────────────────────────────────────────────

export async function getSafeFoods(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAFE_FOODS);
    if (raw) {
      return JSON.parse(raw) as string[];
    }
  } catch (e) {
    console.warn('getSafeFoods error', e);
  }
  return [];
}

export async function saveSafeFoods(foods: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SAFE_FOODS, JSON.stringify(foods));
  } catch (e) {
    console.warn('saveSafeFoods error', e);
  }
}
