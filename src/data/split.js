// Source of truth for all training data
// Do NOT modify exercise names — they are used as DB keys in exercise_sets.exercise_name
// Split: Upper/Lower + Athletic (v3 — approved 2026-05-30)

export const days = [
  {
    day: "MON",
    label: "LOWER A",
    dayType: "lower_a",
    color: "#059669",
    icon: "/assets/icons/icon_legs.webp",
    focus: "Quads · Hamstrings · Core",
    exercises: [
      { name: "Barbell Back Squat", sets: "4", reps: "5", note: "STRENGTH — knees over toes, chest up, drive through the floor", isBodyweight: false, type: "reps" },
      { name: "Leg Press", sets: "3", reps: "12", note: "Quad volume — feet shoulder width, controlled descent", isBodyweight: false, type: "reps" },
      { name: "Romanian Deadlift (RDL)", sets: "3", reps: "12", note: "LEARNING SLOT — light weight, push hips back, feel the hamstring stretch", isBodyweight: false, type: "reps" },
      { name: "Hanging Knee Raises", sets: "3", reps: "15", note: "Lower abs — controlled, no swinging momentum", isBodyweight: true, type: "reps" },
      { name: "Plank", sets: "3", reps: "60 sec", note: "Hollow body — squeeze glutes and abs, breathe", isBodyweight: true, type: "timed" },
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
    label: "UPPER A",
    dayType: "upper_a",
    color: "#e85d04",
    icon: "/assets/icons/icon_push.webp",
    focus: "Chest · Shoulders · Back · Triceps",
    exercises: [
      { name: "Barbell Bench Press", sets: "4", reps: "5", note: "STRENGTH — controlled descent to chest, drive hard", isBodyweight: false, type: "reps" },
      { name: "Pull-ups / Lat Pulldown", sets: "4", reps: "8", note: "PROGRESSION — vertical pull, squeeze lats at bottom", isBodyweight: false, type: "reps" },
      { name: "Overhead Press (OHP)", sets: "3", reps: "8", note: "Core tight, don't arch — builds shoulder stability for MA", isBodyweight: false, type: "reps" },
      { name: "Face Pulls", sets: "3", reps: "15", note: "Rotator cuff health — never skip this", isBodyweight: false, type: "reps" },
      { name: "Tricep Pushdown", sets: "3", reps: "12", note: "Controlled negative — feel the contraction fully", isBodyweight: false, type: "reps" },
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
      { name: "Deadlift", sets: "3", reps: "5", note: "STRENGTH SLOT — same pattern as Monday RDL, now heavy", isBodyweight: false, type: "reps" },
      { name: "Leg Press", sets: "3", reps: "12", note: "Quad volume — different stimulus angle from Squat", isBodyweight: false, type: "reps" },
      { name: "Farmer's Carry", sets: "3", reps: "30m", note: "Walk tall, don't lean — grip + core + traps. Best MA prep", isBodyweight: false, type: "distance" },
      { name: "Russian Twists", sets: "3", reps: "20", note: "Rotational core — punching power starts here, not the arms", isBodyweight: true, type: "reps" },
      { name: "Plank", sets: "3", reps: "60 sec", note: "Core stability finisher — brace like you're about to take a punch", isBodyweight: true, type: "timed" },
    ],
  },
  {
    day: "FRI",
    label: "UPPER B",
    dayType: "upper_b",
    color: "#6d28d9",
    icon: "/assets/icons/icon_pull.webp",
    focus: "Back · Chest · Biceps · Shoulders",
    exercises: [
      { name: "Pull-ups (weighted if possible)", sets: "4", reps: "Max", note: "PROGRESSION — hardest movement first when fresh. Every rep counts", isBodyweight: true, type: "reps" },
      { name: "Dips", sets: "4", reps: "Max", note: "Full range of motion — chest + tricep power for clinch work", isBodyweight: true, type: "reps" },
      { name: "Bent-Over Barbell Row", sets: "3", reps: "8", note: "Overhand grip, row to navel — thick back builder", isBodyweight: false, type: "reps" },
      { name: "Barbell/DB Bicep Curl", sets: "3", reps: "10", note: "Slow controlled reps — grip and pulling strength for MA", isBodyweight: false, type: "reps" },
      { name: "Face Pulls", sets: "3", reps: "15", note: "Twice a week is intentional — shoulder health for longevity", isBodyweight: false, type: "reps" },
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
      { name: "Shadow Boxing (footwork)", sets: "3", reps: "2 min", note: "SKILL FIRST while fresh — stance, jab-cross, move your feet. Bad form now = bad habit forever", isBodyweight: true, type: "timed" },
      { name: "Jump Squats", sets: "4", reps: "8", note: "Explosive power — land softly, reset stance, then explode", isBodyweight: true, type: "reps" },
      { name: "Burpees", sets: "3", reps: "10", note: "Full body conditioning — chest to floor, jump and clap overhead", isBodyweight: true, type: "reps" },
      { name: "Mountain Climbers", sets: "3", reps: "30 sec", note: "Core + cardio — drive knees hard, don't let hips rise", isBodyweight: true, type: "timed" },
      { name: "Bicycle Crunches", sets: "3", reps: "20", note: "Rotational core finisher — slow and controlled", isBodyweight: true, type: "reps" },
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
