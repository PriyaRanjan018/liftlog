// Source of truth: fitness-plan.jsx
// Do NOT modify exercise names — they are used as DB keys in exercise_sets.exercise_name

export const days = [
  {
    day: "MON",
    label: "PUSH",
    dayType: "push",
    color: "#e85d04",
    icon: "/assets/icons/icon_push.webp",
    focus: "Chest · Shoulders · Triceps",
    exercises: [
      { name: "Barbell Bench Press", sets: "4", reps: "5", note: "STRENGTH — go heavy", isBodyweight: false, type: "reps" },
      { name: "Overhead Press (OHP)", sets: "3", reps: "8", note: "Core tight, don't arch", isBodyweight: false, type: "reps" },
      { name: "Incline DB Press", sets: "3", reps: "10", note: "Upper chest + front delt", isBodyweight: false, type: "reps" },
      { name: "Lateral Raises", sets: "3", reps: "12-15", note: "Shoulder width builder", isBodyweight: false, type: "reps" },
      { name: "Tricep Pushdown", sets: "3", reps: "12", note: "Controlled negative", isBodyweight: false, type: "reps" },
      { name: "Push-ups to failure", sets: "2", reps: "Max", note: "Finisher — no mercy", isBodyweight: true, type: "reps" },
    ],
  },
  {
    day: "TUE",
    label: "REST",
    dayType: "rest",
    color: "#4a5568",
    icon: "/assets/icons/icon_rest.webp",
    focus: "Full Recovery Day",
    exercises: [],
  },
  {
    day: "WED",
    label: "PULL",
    dayType: "pull",
    color: "#6d28d9",
    icon: "/assets/icons/icon_pull.webp",
    focus: "Back · Biceps · Rear Delts",
    exercises: [
      { name: "Deadlift", sets: "4", reps: "5", note: "STRENGTH — king of all lifts", isBodyweight: false, type: "reps" },
      { name: "Pull-ups / Lat Pulldown", sets: "4", reps: "6-8", note: "Build that V-taper", isBodyweight: true, type: "reps" },
      { name: "Bent-Over Barbell Row", sets: "3", reps: "8", note: "Thick back builder", isBodyweight: false, type: "reps" },
      { name: "Face Pulls", sets: "3", reps: "15", note: "Shoulder health — don't skip", isBodyweight: false, type: "reps" },
      { name: "Barbell/DB Bicep Curl", sets: "3", reps: "10", note: "Slow controlled reps", isBodyweight: false, type: "reps" },
      { name: "Hammer Curls", sets: "2", reps: "12", note: "Forearm + brachialis", isBodyweight: false, type: "reps" },
    ],
  },
  {
    day: "THU",
    label: "LEGS + CORE",
    dayType: "legs_core",
    color: "#059669",
    icon: "/assets/icons/icon_legs.webp",
    focus: "Quads · Hamstrings · Glutes · Abs",
    exercises: [
      { name: "Barbell Back Squat", sets: "4", reps: "5", note: "STRENGTH — knees over toes", isBodyweight: false, type: "reps" },
      { name: "Romanian Deadlift (RDL)", sets: "3", reps: "10", note: "Hamstring + glute focus", isBodyweight: false, type: "reps" },
      { name: "Leg Press", sets: "3", reps: "12", note: "Different quad angle", isBodyweight: false, type: "reps" },
      { name: "Walking Lunges", sets: "3", reps: "10 each", note: "Balance + stabilizers", isBodyweight: true, type: "distance" },
      { name: "Plank", sets: "3", reps: "60 sec", note: "Hollow body position", isBodyweight: true, type: "timed" },
      { name: "Hanging Knee/Leg Raises", sets: "3", reps: "15", note: "Lower abs", isBodyweight: true, type: "reps" },
      { name: "Russian Twists", sets: "3", reps: "20", note: "Rotational core for MA", isBodyweight: true, type: "reps" },
    ],
  },
  {
    day: "FRI",
    label: "FULL BODY STRENGTH",
    dayType: "full_body",
    color: "#dc2626",
    icon: "/assets/icons/icon_full_body.webp",
    focus: "Heavy Compounds + Pulling Power",
    exercises: [
      { name: "Sumo Deadlift / Trap Bar DL", sets: "3", reps: "5", note: "Heavy — different pattern", isBodyweight: false, type: "reps" },
      { name: "Pull-ups (weighted if possible)", sets: "4", reps: "Max", note: "Lat width = fighter's posture", isBodyweight: true, type: "reps" },
      { name: "Dips (weighted if possible)", sets: "4", reps: "Max", note: "Chest + tricep power", isBodyweight: true, type: "reps" },
      { name: "Barbell Row", sets: "3", reps: "8", note: "Overhand grip", isBodyweight: false, type: "reps" },
      { name: "Ab Wheel Rollout", sets: "3", reps: "10", note: "Core anti-extension", isBodyweight: true, type: "reps" },
      { name: "Farmer's Carry", sets: "3", reps: "30m", note: "Grip + core + traps", isBodyweight: false, type: "distance" },
    ],
  },
  {
    day: "SAT",
    label: "ATHLETIC + FUNCTIONAL",
    dayType: "athletic",
    color: "#0ea5e9",
    icon: "/assets/icons/icon_athletic.webp",
    focus: "Explosiveness · Core · Martial Arts Prep",
    exercises: [
      { name: "Jump Squats", sets: "4", reps: "8", note: "Explosive power — same as box jumps, no box needed", isBodyweight: true, type: "reps" },
      { name: "Burpees", sets: "3", reps: "10", note: "Full body explosive — chest, core, legs, cardio in one", isBodyweight: true, type: "reps" },
      { name: "Mountain Climbers", sets: "3", reps: "30 sec", note: "Core + cardio + shoulder stability", isBodyweight: true, type: "timed" },
      { name: "Shadow Boxing (footwork)", sets: "3", reps: "2 min", note: "Learn basic stance + jab-cross", isBodyweight: true, type: "timed" },
      { name: "Bicycle Crunches", sets: "3", reps: "20", note: "Rotational core", isBodyweight: true, type: "reps" },
      { name: "Bear Crawls", sets: "3", reps: "20m", note: "Shoulder stability + coordination", isBodyweight: true, type: "distance" },
    ],
  },
  {
    day: "SUN",
    label: "ACTIVE RECOVERY",
    dayType: "active_recovery",
    color: "#78716c",
    icon: "/assets/icons/icon_recovery.webp",
    focus: "Low intensity movement + flexibility",
    exercises: [],
  },
];

// Major lifts for progress tracking
export const MAJOR_LIFTS = [
  "Barbell Bench Press",
  "Deadlift",
  "Barbell Back Squat",
  "Overhead Press (OHP)",
  "Pull-ups / Lat Pulldown",
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
