export type AllergenId = string;

export interface Allergen {
  id: AllergenId;
  name: string;
  description: string;
  keywords: string[];
  color: string;
}

export interface FoodLogEntry {
  id: string;
  date: string; // ISO string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: string;
  symptoms: string[];
  severity: 0 | 1 | 2 | 3; // 0=none, 1=mild, 2=moderate, 3=severe
  notes: string;
  flaggedAllergens: AllergenId[];
}

export interface UserSensitivities {
  known: AllergenId[];      // confirmed allergies/intolerances
  suspected: AllergenId[];  // suspected from quiz
  quizCompleted: boolean;
  mode: 'investigate' | 'manage' | null;
}

export interface EliminationPlan {
  id: string;
  allergenId: AllergenId;
  startDate: string; // ISO string
  phase: 'eliminating' | 'reintroducing' | 'completed';
  notes: string;
}
