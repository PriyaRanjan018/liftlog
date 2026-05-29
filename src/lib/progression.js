// src/lib/progression.js
// Progressive Exercise System — 8-week skill-based exercise progression
// Training week counts ONLY when "Complete Workout" is clicked that week.

import { supabase } from './supabase';

// ─── Date Helper ────────────────────────────────────────────────────────────
// Returns the ISO date string (YYYY-MM-DD) for Monday of the current week
export function getMondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const diff = (day === 0 ? -6 : 1 - day); // days back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

// ─── Get current training week number ───────────────────────────────────────
// Returns the highest completed week_number, or 1 if none yet.
export async function getCurrentTrainingWeek() {
  const { data } = await supabase
    .from('progression_weeks')
    .select('week_number')
    .eq('has_completion', true)
    .order('week_number', { ascending: false })
    .limit(1)
    .single();

  return data ? data.week_number : 1;
}

// ─── Record a workout completion for progression tracking ────────────────────
// Called once inside completeWorkout() in Today.jsx
// Returns { isNewWeek: boolean, weekNumber: number }
export async function recordProgressionWeek() {
  const monday = getMondayOfCurrentWeek();

  // Check if this calendar week is already tracked
  const { data: existing } = await supabase
    .from('progression_weeks')
    .select('*')
    .eq('calendar_week_start', monday)
    .maybeSingle();

  if (existing) {
    // Week exists — just mark completed if not already
    if (!existing.has_completion) {
      await supabase
        .from('progression_weeks')
        .update({ has_completion: true })
        .eq('calendar_week_start', monday);
    }
    return { isNewWeek: false, weekNumber: existing.week_number };
  }

  // First completion this week — create a new training week entry
  const { data: lastWeek } = await supabase
    .from('progression_weeks')
    .select('week_number')
    .order('week_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextWeekNumber = lastWeek ? lastWeek.week_number + 1 : 1;

  await supabase.from('progression_weeks').insert({
    calendar_week_start: monday,
    week_number: nextWeekNumber,
    has_completion: true,
  });

  return { isNewWeek: true, weekNumber: nextWeekNumber };
}

// ─── DEADLIFT PROGRESSION ────────────────────────────────────────────────────
// 4-stage, 8-week system. Used for Deadlift & RDL slots.
export function getDeadliftVariation(weekNumber) {
  if (weekNumber <= 2) {
    return {
      name: "DB Romanian Deadlift",
      sets: "3", reps: "12",
      note: "BEGINNER — Light dumbbells, learn the hip hinge. Push hips BACK, not down. Back stays flat.",
      isBodyweight: false, type: "reps",
      _progression: { stage: 1, stageLabel: "Learning Hip Hinge", totalStages: 4, unlockWeek: 3 },
    };
  } else if (weekNumber <= 4) {
    return {
      name: "Barbell RDL",
      sets: "3", reps: "10",
      note: "STAGE 2 — Empty bar or 20 kg. Same hip hinge, now with barbell. Feel the hamstring stretch.",
      isBodyweight: false, type: "reps",
      _progression: { stage: 2, stageLabel: "Barbell Pattern", totalStages: 4, unlockWeek: 5 },
    };
  } else if (weekNumber <= 6) {
    return {
      name: "Conventional Deadlift",
      sets: "3", reps: "5",
      note: "STAGE 3 — Start at 40–50 kg. Bar over mid-foot, hips down, chest up, drive through the floor.",
      isBodyweight: false, type: "reps",
      _progression: { stage: 3, stageLabel: "Conventional Form", totalStages: 4, unlockWeek: 7 },
    };
  } else {
    return {
      name: "Sumo / Trap Bar Deadlift",
      sets: "3", reps: "5",
      note: "UNLOCKED — Wide stance, toes out, grip outside knees. You've earned this.",
      isBodyweight: false, type: "reps",
      _progression: { stage: 4, stageLabel: "Advanced Variation", totalStages: 4, unlockWeek: null },
    };
  }
}

// ─── PULL-UP PROGRESSION ─────────────────────────────────────────────────────
// 3-stage, 6-week system. Used for Pull-up slots on Wed & Fri.
export function getPullUpVariation(weekNumber) {
  if (weekNumber <= 2) {
    return {
      name: "Lat Pulldown",
      sets: "4", reps: "8",
      note: "BEGINNER — Use machine. Same lat engagement as pull-ups. Build the strength pattern first.",
      isBodyweight: false, type: "reps",
      _progression: { stage: 1, stageLabel: "Machine Phase", totalStages: 3, unlockWeek: 3 },
    };
  } else if (weekNumber <= 5) {
    return {
      name: "Assisted Pull-ups / Negative Pull-ups",
      sets: "4", reps: "6",
      note: "STAGE 2 — Jump to top, lower slowly (3–5 sec). Or use resistance band. Building the pull.",
      isBodyweight: true, type: "reps",
      _progression: { stage: 2, stageLabel: "Assisted Phase", totalStages: 3, unlockWeek: 6 },
    };
  } else {
    return {
      name: "Pull-ups (weighted if possible)",
      sets: "4", reps: "Max",
      note: "UNLOCKED — Full bodyweight pull-ups. Add weight when you hit 10 clean reps per set.",
      isBodyweight: true, type: "reps",
      _progression: { stage: 3, stageLabel: "Full Pull-ups", totalStages: 3, unlockWeek: null },
    };
  }
}

// ─── Stage color helper ──────────────────────────────────────────────────────
export function getStageColor(stage, totalStages) {
  const pct = stage / totalStages;
  if (pct <= 0.25) return '#e85d04'; // orange
  if (pct <= 0.5)  return '#f59e0b'; // yellow
  if (pct <= 0.75) return '#0ea5e9'; // blue
  return '#059669';                   // green — fully unlocked
}
