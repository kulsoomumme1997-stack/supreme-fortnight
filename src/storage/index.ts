import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodLogEntry, UserSensitivities } from '../types';

const KEYS = {
  SENSITIVITIES: '@sensitivity_tracker:sensitivities',
  FOOD_LOGS: '@sensitivity_tracker:food_logs',
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
  return { known: [], suspected: [], quizCompleted: false };
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
    await AsyncStorage.multiRemove([KEYS.SENSITIVITIES, KEYS.FOOD_LOGS]);
  } catch (e) {
    console.warn('clearAllData error', e);
  }
}
