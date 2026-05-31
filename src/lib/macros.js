/**
 * Macro Calculation Engine
 * ─────────────────────────────────────────────────────────────
 * Calculates macros dynamically from current body weight + goal.
 * Goal weight is FIXED at 72 kg (lean athletic fighter physique).
 * ─────────────────────────────────────────────────────────────
 */

/** Fixed target — lean athletic physique (~11% BF, fighter build) */
export const GOAL_WEIGHT_KG = 72;

/** Starting baseline */
export const STARTING_WEIGHT_KG = 66;

/**
 * Goal type definitions with formulas and display metadata.
 * Each goal type defines how to calculate calories, protein, carbs, fats.
 */
export const GOAL_TYPES = {
  lean_bulk: {
    key: 'lean_bulk',
    label: 'Lean Bulk',
    description: 'Build muscle, minimize fat gain',
    calorieMultiplier: 37,   // kcal per kg (moderate surplus ~200–300 over TDEE)
    proteinMultiplier: 2.1,  // g per kg bodyweight
    carbsEnergyPct: 0.46,    // 46% of calories from carbs
    fatsEnergyPct: 0.25,     // 25% of calories from fats
    color: '#059669',
    icon: '💪',
    tag: 'Muscle Gain',
  },
  cut: {
    key: 'cut',
    label: 'Cut',
    description: 'Lose fat, preserve muscle mass',
    calorieMultiplier: 30,
    proteinMultiplier: 2.4,  // Higher protein to preserve muscle in deficit
    carbsEnergyPct: 0.38,
    fatsEnergyPct: 0.25,
    color: '#ef4444',
    icon: '🔥',
    tag: 'Fat Loss',
  },
  maintain: {
    key: 'maintain',
    label: 'Maintain',
    description: 'Hold weight, improve body composition',
    calorieMultiplier: 33,
    proteinMultiplier: 2.0,
    carbsEnergyPct: 0.45,
    fatsEnergyPct: 0.25,
    color: '#0ea5e9',
    icon: '⚖️',
    tag: 'Recomposition',
  },
};

/**
 * Calculate exact macros for a given weight and goal type.
 * @param {number} weightKg — current logged body weight
 * @param {string} goalTypeKey — 'lean_bulk' | 'cut' | 'maintain'
 * @returns {{ calories: number, protein: number, carbs: number, fats: number }}
 */
export function calculateMacros(weightKg, goalTypeKey = 'lean_bulk') {
  const goal = GOAL_TYPES[goalTypeKey] ?? GOAL_TYPES.lean_bulk;
  const w = parseFloat(weightKg) || STARTING_WEIGHT_KG;

  const calories = Math.round(w * goal.calorieMultiplier);
  const protein = Math.round(w * goal.proteinMultiplier);
  const carbs = Math.round((calories * goal.carbsEnergyPct) / 4);
  const fats = Math.round((calories * goal.fatsEnergyPct) / 9);

  return { calories, protein, carbs, fats };
}

/**
 * Format macros as display ranges (±4% window, hostel-friendly approximation).
 * @param {{ calories, protein, carbs, fats }} macros
 * @returns {{ calories: string, protein: string, carbs: string, fats: string }}
 */
export function formatMacrosAsRange(macros) {
  const rng = (val, pct = 0.04) => {
    const lo = Math.round(val * (1 - pct));
    const hi = Math.round(val * (1 + pct));
    return `${lo}–${hi}`;
  };
  return {
    calories: rng(macros.calories),
    protein: rng(macros.protein),
    carbs: rng(macros.carbs),
    fats: rng(macros.fats),
  };
}

/**
 * Get progress percentage from start weight toward goal weight.
 * Clamped between 0 and 100.
 */
export function getGoalProgress(currentWeight, startWeight = STARTING_WEIGHT_KG, goalWeight = GOAL_WEIGHT_KG) {
  if (goalWeight <= startWeight) return 100;
  const total = goalWeight - startWeight;
  const done = (parseFloat(currentWeight) || startWeight) - startWeight;
  return Math.min(Math.max((done / total) * 100, 0), 100);
}

/**
 * Get kg remaining to goal.
 */
export function kgToGoal(currentWeight, goalWeight = GOAL_WEIGHT_KG) {
  const remaining = GOAL_WEIGHT_KG - (parseFloat(currentWeight) || STARTING_WEIGHT_KG);
  return Math.max(remaining, 0).toFixed(1);
}

/**
 * Estimate months to goal at average 0.4 kg/month lean bulk pace.
 */
export function estimateMonthsToGoal(currentWeight, rateKgPerMonth = 0.4) {
  const remaining = parseFloat(kgToGoal(currentWeight));
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / rateKgPerMonth);
}
