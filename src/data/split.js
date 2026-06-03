// Source of truth for all training data
// Do NOT modify exercise names — they are used as DB keys in exercise_sets.exercise_name
// Split: Upper/Lower + Athletic (v4 — approved 2026-06-03)
// Gym closed on Tuesday. No conventional deadlift until Month 4 (handled by progression.js).

export const days = [
  {
    day: "MON",
    label: "LOWER A",
    dayType: "lower_a",
    color: "#059669",
    icon: "/assets/icons/icon_legs.webp",
    focus: "Quads · Hip Hinge Learning · Core",
    exercises: [
      { name: "Goblet Squat",              sets: "4", reps: "10",     note: "Hold DB at chest. Knees out, chest up, hit depth. Graduate to Barbell Squat at Month 3.", isBodyweight: false, type: "reps" },
      { name: "Leg Press",                  sets: "3", reps: "12",     note: "Feet shoulder-width. Controlled descent — quad volume.", isBodyweight: false, type: "reps" },
      { name: "Romanian Deadlift (RDL)",    sets: "3", reps: "10",     note: "LEARNING SLOT — 20-30kg only. Push hips BACK, feel the hamstring stretch. This teaches the hinge before Month 4 deadlifts.", isBodyweight: false, type: "reps" },
      { name: "Hanging Knee Raises",        sets: "3", reps: "12",     note: "Lower abs — full hang, controlled up and down. Zero swinging.", isBodyweight: true,  type: "reps" },
      { name: "Dead Bug",                   sets: "3", reps: "8",      note: "Opposite arm-leg extension. Spine FLAT on floor. Trains core the way MA needs it — braced while limbs move.", isBodyweight: true, type: "reps" },
    ],
  },
  {
    day: "TUE",
    label: "REST",
    dayType: "rest",
    color: "#4a5568",
    icon: "/assets/icons/icon_rest.webp",
    focus: "Gym Closed — Walk Only",
    exercises: [],
  },
  {
    day: "WED",
    label: "UPPER A",
    dayType: "upper_a",
    color: "#e85d04",
    icon: "/assets/icons/icon_push.webp",
    focus: "Chest · Shoulders · Triceps",
    exercises: [
      { name: "Barbell Bench Press",        sets: "4", reps: "8",      note: "STRENGTH — 8 reps at this stage for better form learning. Drive hard off the chest.", isBodyweight: false, type: "reps" },
      { name: "Overhead Press (OHP)",       sets: "3", reps: "10",     note: "Core tight, glutes squeezed, no lower back arch. Shoulder stability for guard position in MA.", isBodyweight: false, type: "reps" },
      { name: "Dumbbell Lateral Raises",    sets: "3", reps: "15",     note: "Medial delt — slow and controlled. This is what gives shoulder width. Light weight, full range.", isBodyweight: false, type: "reps" },
      { name: "Face Pulls",                 sets: "3", reps: "15",     note: "Rotator cuff health — Set 1 of 2 this week. Never skip this.", isBodyweight: false, type: "reps" },
      { name: "Tricep Pushdown",            sets: "3", reps: "12",     note: "Controlled negative — full lock out at bottom.", isBodyweight: false, type: "reps" },
    ],
  },
  {
    day: "THU",
    label: "LOWER B",
    dayType: "lower_b",
    color: "#dc2626",
    icon: "/assets/icons/icon_full_body.webp",
    focus: "Posterior Chain · Grip · Core",
    exercises: [
      { name: "Hip Thrust",                 sets: "3", reps: "12",     note: "Glutes + posterior chain WITHOUT loading the spine. Squeeze HARD at top. Use barbell when ready.", isBodyweight: false, type: "reps" },
      { name: "Leg Curl (Machine)",         sets: "3", reps: "12",     note: "Isolated hamstring work — builds the muscle the RDL is teaching you to feel.", isBodyweight: false, type: "reps" },
      { name: "Farmer's Carry",             sets: "3", reps: "30m",    note: "Walk tall, shoulders packed, don't lean. Grip + core + traps. Best MA prep exercise in this split.", isBodyweight: false, type: "distance" },
      { name: "Russian Twists",             sets: "3", reps: "20",     note: "Weighted if possible. Rotational core — punching power starts here, not your arms.", isBodyweight: true,  type: "reps" },
      { name: "Plank",                      sets: "3", reps: "45 sec", note: "Hollow body. Squeeze everything. Build to 60 sec by Month 2.", isBodyweight: true, type: "timed" },
    ],
  },
  {
    day: "FRI",
    label: "UPPER B",
    dayType: "upper_b",
    color: "#6d28d9",
    icon: "/assets/icons/icon_pull.webp",
    focus: "Back · Biceps · Rear Shoulder",
    exercises: [
      { name: "Pull-ups / Lat Pulldown",    sets: "4", reps: "8",      note: "PROGRESSION — if you can't do 5 pull-ups, use Lat Pulldown. Track reps every week. Most important metric.", isBodyweight: false, type: "reps" },
      { name: "Bent-Over Barbell Row",      sets: "3", reps: "8",      note: "Hinge to 45°, row to navel — overhand grip. Thick back builder.", isBodyweight: false, type: "reps" },
      { name: "Seated Cable Row",           sets: "3", reps: "12",     note: "Mid-back — rhomboids and mid-traps. This is what gives you the 'thick back'. NEW to this split.", isBodyweight: false, type: "reps" },
      { name: "Face Pulls",                 sets: "3", reps: "15",     note: "Set 2 of 2 this week — twice weekly is intentional for shoulder longevity.", isBodyweight: false, type: "reps" },
      { name: "Hammer Curl",               sets: "3", reps: "10",     note: "Neutral grip — works brachialis AND grip. More MA-relevant than barbell curl.", isBodyweight: false, type: "reps" },
    ],
  },
  {
    day: "SAT",
    label: "ATHLETIC",
    dayType: "athletic",
    color: "#0ea5e9",
    icon: "/assets/icons/icon_athletic.webp",
    focus: "Explosiveness · Conditioning · MA Prep",
    exercises: [
      { name: "Jump Rope / Shadow Boxing",  sets: "3", reps: "3 min",  note: "WARM UP + SKILL — Jump rope if available (best MA cardio). Shadow boxing if not. Footwork and jab-cross only.", isBodyweight: true, type: "timed" },
      { name: "Jump Squats",               sets: "4", reps: "8",      note: "Explosive power — land softly, reset stance, then explode. Fast-twitch legs.", isBodyweight: true, type: "reps" },
      { name: "Burpees",                   sets: "3", reps: "10",     note: "Full chest to floor. Track how long 3×10 takes — this is your conditioning baseline.", isBodyweight: true, type: "reps" },
      { name: "Mountain Climbers",         sets: "3", reps: "30 sec", note: "Drive knees hard. Don't let hips rise. Core + cardio.", isBodyweight: true, type: "timed" },
      { name: "Bicycle Crunches",          sets: "3", reps: "20",     note: "Slow and controlled. Rotate fully. Rotational core finisher.", isBodyweight: true, type: "reps" },
    ],
  },
  {
    day: "SUN",
    label: "ACTIVE RECOVERY",
    dayType: "active_recovery",
    color: "#78716c",
    icon: "/assets/icons/icon_recovery.webp",
    focus: "Makeup Day OR Low Intensity Movement",
    exercises: [],
  },
];

// Major lifts for progress tracking — matches exercises actually logged in Phase 1
export const MAJOR_LIFTS = [
  "Barbell Bench Press",
  "Overhead Press (OHP)",
  "Goblet Squat",
  "Hip Thrust",
  "Bent-Over Barbell Row",
];

// Day index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// Map JS day (0=Sun) to our days array index (0=Mon)
export function getDayForDate(date = new Date()) {
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Our days array: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const map = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  return days[map[jsDay]];
}

export function getDayIndex(date = new Date()) {
  const jsDay = date.getDay();
  const map = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  return map[jsDay];
}
