// NOTE: Macros are now dynamically calculated by src/lib/macros.js
// based on current logged body weight and selected goal type.

// Daily protein checklist — resets at midnight (not stored long-term)
export const proteinChecklist = [
  { id: "eggs", label: "6–10 boiled eggs" },
  { id: "dal", label: "2 katoris of dal at every meal" },
  { id: "paneer", label: "Paneer / chicken when available" },
  { id: "milk", label: "1 glass milk before sleep" },
  { id: "curd", label: "Curd with meals" },
];

// Protein sources from fitness-plan.jsx
export const proteinSources = [
  { food: "Boiled Eggs", amount: "4 eggs", protein: "24g", cal: "280", emoji: "🥚", tip: "Cheapest protein in hostel" },
  { food: "Paneer", amount: "100g", protein: "18g", cal: "265", emoji: "🧀", tip: "Ask for extra from mess" },
  { food: "Dal (Moong/Masoor)", amount: "1 katori", protein: "9g", cal: "120", emoji: "🍲", tip: "2 katoris at every mess meal" },
  { food: "Whole Milk", amount: "300ml", protein: "9g", cal: "200", emoji: "🥛", tip: "Best pre-sleep protein" },
  { food: "Chicken (mess/outside)", amount: "150g", protein: "35g", cal: "230", emoji: "🍗", tip: "Eat when available" },
  { food: "Peanuts / PB", amount: "30g / 2 tbsp", protein: "8g", cal: "180", emoji: "🥜", tip: "Cheap snack + healthy fats" },
  { food: "Soya Chunks", amount: "50g dry", protein: "25g", cal: "170", emoji: "🫘", tip: "Boil + add to sabzi" },
  { food: "Curd (Dahi)", amount: "200g", protein: "7g", cal: "120", emoji: "🥣", tip: "Probiotic + protein" },
];

// Meal plan from fitness-plan.jsx
export const mealPlan = [
  {
    time: "7:00 AM — Wake Up",
    emoji: "🌅",
    items: ["4 boiled eggs (keep 2 yolks)", "2 rotis or 1 cup oats", "Black coffee / milk tea (no sugar)"],
    protein: "~30g",
  },
  {
    time: "10:30 AM — Pre-Workout Snack",
    emoji: "⚡",
    items: ["1 banana + handful peanuts", "OR 2 rotis + peanut butter", "Plenty of water (500ml)"],
    protein: "~10g",
  },
  {
    time: "12:00–1:30 PM — Post Gym + Lunch (Mess)",
    emoji: "🍽️",
    items: ["Mess dal + sabzi + 3-4 rotis OR rice", "Extra curd / paneer if available", "Walk 20-30 mins AFTER this"],
    protein: "~30g",
  },
  {
    time: "4:00 PM — Snack",
    emoji: "🥜",
    items: ["Boiled eggs x2 or soya chunk chaat", "Fruit (banana/apple)", "Optional: PB sandwich"],
    protein: "~20g",
  },
  {
    time: "8:00 PM — Dinner (Mess)",
    emoji: "🌙",
    items: ["Dal + sabzi + roti/rice", "Ask for extra paneer / chicken", "Limit excess rice — prefer roti"],
    protein: "~25g",
  },
  {
    time: "10:00 PM — Before Sleep",
    emoji: "😴",
    items: ["1 glass milk (200ml)", "Optional: 2 boiled eggs", "This feeds muscles overnight"],
    protein: "~15g",
  },
];

// See src/lib/macros.js for STARTING_WEIGHT_KG, GOAL_WEIGHT_KG and calculation logic.
