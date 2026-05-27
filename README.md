# FitTrack — Personalized Fitness Tracker

> A **single-user, mobile-first** strength tracking web app built around a personalized 6-day training split.
> No exercise library. No community. Just your 6 days, set logging, and progress visualization.

---

## Stack

- **React + Vite** — frontend
- **Tailwind CSS** — styling
- **Supabase** — PostgreSQL database + auth
- **Recharts** — progress charts
- **React Router** — navigation

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd fittrack
npm install
```

### 2. Create `.env` file

Copy the example and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find both values in your Supabase project dashboard → **Settings → API**.

### 3. Run the SQL schema in Supabase

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

This creates 4 tables: `workout_sessions`, `exercise_sets`, `body_stats`, `personal_records`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) on your phone (same Wi-Fi) or browser.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Set the two environment variables in the Vercel dashboard (Project → Settings → Environment Variables).

---

## Screens

| Screen | Path | Description |
|--------|------|-------------|
| Today | `/` | Auto-detects today's workout, set logger, streak counter |
| History | `/history` | Calendar view + past session details |
| Progress | `/progress` | Week/Month view, lift comparisons, PRs, charts |
| Stats | `/stats` | Body weight log, nutrition reference, daily checklist |

---

## Key Features

- ✅ **Pre-fills last session's weight** in every set logger row
- ✅ **Auto-saves** on every input change (no data lost mid-workout)
- ✅ **Streak counter** — counts consecutive training + rest days
- ✅ **PR detection** — automatically logs new personal records with toast alert
- ✅ **Swipe to preview** other days on the Today screen
- ✅ **REST + ACTIVE RECOVERY** screens (Tue/Sun) — no exercises, motivational content
- ✅ **Day-specific accent colors** from the training plan
- ✅ **Daily protein checklist** — resets at midnight, stored in localStorage only

---

## Exercise Data

All exercise names, sets, reps, and notes are sourced directly from `src/data/split.js` which mirrors `fitness-plan.jsx`. Exercise names are used as database keys — **do not rename them** after logging data.

---

*Built for: BTech CSE, VIT-AP · Starting weight: 65 kg · Goal: Athletic + Lean*
# liftlog
