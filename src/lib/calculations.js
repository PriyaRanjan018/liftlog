import { supabase } from './supabase';
import { days } from '../data/split';

/**
 * Calculate total volume for a session: SUM(weight_kg × reps_done)
 * Bodyweight exercises (weight_kg = 0 or null) contribute 0 volume.
 */
export function calculateVolume(sets) {
  return sets.reduce((total, set) => {
    const weight = parseFloat(set.weight_kg) || 0;
    const reps = parseInt(set.reps_done) || 0;
    return total + weight * reps;
  }, 0);
}

/**
 * Calculate weekly completion streak.
 * A streak day = completed session OR it was a rest/active_recovery day.
 * Break only on days where user should have trained but didn't log.
 */
export async function calculateStreak() {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('session_date, day_type, completed')
    .order('session_date', { ascending: false });

  if (!sessions || sessions.length === 0) return 0;

  const sessionMap = {};
  sessions.forEach((s) => {
    sessionMap[s.session_date] = s;
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const jsDay = d.getDay(); // 0=Sun
    const dayMap = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    const dayData = days[dayMap[jsDay]];

    if (dayData.dayType === 'rest' || dayData.dayType === 'active_recovery') {
      // Rest days don't break streak
      streak++;
      continue;
    }

    const session = sessionMap[dateStr];
    if (session && session.completed) {
      streak++;
    } else if (i === 0) {
      // Today hasn't been completed yet — don't break streak for today
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get the last logged weight for an exercise (for pre-filling set logger)
 */
export async function getLastWeight(exerciseName) {
  const { data } = await supabase
    .from('exercise_sets')
    .select('weight_kg')
    .eq('exercise_name', exerciseName)
    .eq('is_completed', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return data[0].weight_kg;
  }
  return null;
}

/**
 * Check and update personal records after a session is completed
 * Returns list of new PRs
 */
export async function checkAndUpdatePRs(sessionId, sets) {
  const newPRs = [];

  // Group sets by exercise
  const byExercise = {};
  sets.forEach((s) => {
    if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = [];
    byExercise[s.exercise_name].push(s);
  });

  for (const [exerciseName, exSets] of Object.entries(byExercise)) {
    const completedSets = exSets.filter(
      (s) => s.is_completed && s.weight_kg > 0
    );
    if (completedSets.length === 0) continue;

    const bestSet = completedSets.reduce((best, s) =>
      s.weight_kg > (best?.weight_kg || 0) ? s : best
    );

    // Get existing PR
    const { data: existing } = await supabase
      .from('personal_records')
      .select('*')
      .eq('exercise_name', exerciseName)
      .single();

    const achievedDate = new Date().toISOString().split('T')[0];

    if (!existing || bestSet.weight_kg > existing.record_weight) {
      await supabase.from('personal_records').upsert(
        {
          exercise_name: exerciseName,
          record_weight: bestSet.weight_kg,
          record_reps: bestSet.reps_done,
          achieved_date: achievedDate,
          session_id: sessionId,
        },
        { onConflict: 'exercise_name' }
      );
      newPRs.push({ exerciseName, weight: bestSet.weight_kg, reps: bestSet.reps_done });
    }
  }

  return newPRs;
}

/**
 * Get weekly session completion for a given week (Mon–Sun)
 */
export function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const jsDay = today.getDay(); // 0=Sun
  // Get Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (jsDay === 0 ? 6 : jsDay - 1) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Format volume display (e.g. 4200 → "4,200 kg")
 */
export function formatVolume(vol) {
  return `${Math.round(vol).toLocaleString()} kg`;
}

/**
 * Get progress bar color based on completion %
 */
export function getProgressColor(pct) {
  if (pct >= 100) return '#059669';
  if (pct >= 60) return '#f59e0b';
  return '#dc2626';
}
