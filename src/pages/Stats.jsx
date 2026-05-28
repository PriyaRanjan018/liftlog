import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { proteinChecklist } from '../data/nutrition';
import {
  calculateMacros,
  formatMacrosAsRange,
  getGoalProgress,
  kgToGoal,
  estimateMonthsToGoal,
  GOAL_WEIGHT_KG,
  STARTING_WEIGHT_KG,
  GOAL_TYPES,
} from '../lib/macros';
import ChartLine from '../components/ChartLine';
import { useAuth } from '../context/AuthContext';

const CHECKLIST_KEY = 'fittrack_checklist';
const GOAL_TYPE_KEY = 'fittrack_goal_type';

// Macro card configs (label, color, unit, hostel tip)
const MACRO_META = {
  calories: {
    label: 'Calories',
    unit: 'kcal/day',
    color: '#e85d04',
    icon: '⚡',
    tip: 'Mess roti ~80kcal, rice katori ~130kcal, egg ~80kcal',
  },
  protein: {
    label: 'Protein',
    unit: 'g/day',
    color: '#6d28d9',
    icon: '🥩',
    tip: '6 eggs=36g, 2 dal katori=18g, paneer 100g=18g, milk=9g',
  },
  carbs: {
    label: 'Carbs',
    unit: 'g/day',
    color: '#059669',
    icon: '🍚',
    tip: 'Roti, rice, oats, banana. Don\'t fear carbs — they fuel workouts.',
  },
  fats: {
    label: 'Fats',
    unit: 'g/day',
    color: '#0ea5e9',
    icon: '🥚',
    tip: 'Eggs, peanuts, paneer, ghee. Essential for testosterone + strength.',
  },
};

export default function Stats() {
  const { isViewer } = useAuth();
  const [bodyStats, setBodyStats] = useState([]);
  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [goalType, setGoalType] = useState(
    () => localStorage.getItem(GOAL_TYPE_KEY) || 'lean_bulk'
  );
  const [checklist, setChecklist] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}');
      if (stored.date !== new Date().toDateString()) return {};
      return stored.checks || {};
    } catch {
      return {};
    }
  });
  const [weightChartData, setWeightChartData] = useState([]);
  const [toast, setToast] = useState(null);
  const [expandedMacro, setExpandedMacro] = useState(null);

  // Auto-set fixed goal weight to 72 kg on mount
  useEffect(() => {
    localStorage.setItem('fittrack_goal_weight', GOAL_WEIGHT_KG.toString());
    loadBodyStats();
  }, []);

  const loadBodyStats = async () => {
    const { data } = await supabase
      .from('body_stats')
      .select('*')
      .order('logged_date', { ascending: true })
      .limit(16);

    setBodyStats(data || []);

    const baseline = { label: 'Start', value: STARTING_WEIGHT_KG };
    const chartPoints = (data || []).map((s) => ({
      label: new Date(s.logged_date + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
      value: parseFloat(s.weight_kg),
    }));
    setWeightChartData([baseline, ...chartPoints]);
  };

  const logWeight = async () => {
    if (isViewer) return;
    if (!weightInput || isNaN(parseFloat(weightInput))) return;
    setSaving(true);

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('body_stats').upsert(
      { logged_date: today, weight_kg: parseFloat(weightInput) },
      { onConflict: 'logged_date' }
    );

    setWeightInput('');
    setToast(`✅ Weight logged — macros updated for ${parseFloat(weightInput)} kg`);
    setTimeout(() => setToast(null), 3000);
    await loadBodyStats();
    setSaving(false);
  };

  const switchGoalType = (key) => {
    if (isViewer) return;
    setGoalType(key);
    localStorage.setItem(GOAL_TYPE_KEY, key);
    setToast(`Goal switched to ${GOAL_TYPES[key].label}`);
    setTimeout(() => setToast(null), 2000);
  };

  const toggleCheck = (id) => {
    if (isViewer) return;
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    localStorage.setItem(
      CHECKLIST_KEY,
      JSON.stringify({ date: new Date().toDateString(), checks: updated })
    );
  };

  // Derived values — all recalculate when weight or goal type changes
  const latestStat = bodyStats.length > 0 ? bodyStats[bodyStats.length - 1] : null;
  const currentWeight = latestStat ? parseFloat(latestStat.weight_kg) : STARTING_WEIGHT_KG;
  const macros = calculateMacros(currentWeight, goalType);
  const rangedMacros = formatMacrosAsRange(macros);
  const progressPct = getGoalProgress(currentWeight);
  const remaining = kgToGoal(currentWeight);
  const months = estimateMonthsToGoal(currentWeight);
  const goalInfo = GOAL_TYPES[goalType];

  return (
    <div className="min-h-screen bg-[#060606] pb-32">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-neutral-900 border border-neutral-700 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl uppercase tracking-wider">
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-12 pb-6 border-b border-neutral-900/60 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] bg-sky-500/10 pointer-events-none" />
        <h1 className="text-3xl font-black text-white tracking-tight font-display">My Stats</h1>
        <p className="text-neutral-500 text-xs mt-1">
          Live macros · Body weight tracking · Nutrition targets
        </p>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* ───────── GOAL PROGRESS CARD ───────── */}
        <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          {/* Ambient glow based on goal type */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none"
            style={{ backgroundColor: goalInfo.color }}
          />

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[9px] font-black text-neutral-500 tracking-widest uppercase mb-1">
                Physique Goal
              </div>
              <div className="text-lg font-black text-white font-display flex items-center gap-2">
                <span>{goalInfo.icon}</span>
                <span>Fighter Build — {GOAL_WEIGHT_KG} kg</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Remaining</div>
              <div className="text-2xl font-black font-display" style={{ color: goalInfo.color }}>
                {remaining} kg
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[9px] font-black text-neutral-500 uppercase tracking-wider mb-2">
              <span>{STARTING_WEIGHT_KG} kg start</span>
              <span>{Math.round(progressPct)}% there</span>
              <span>{GOAL_WEIGHT_KG} kg goal</span>
            </div>
            <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${goalInfo.color}80, ${goalInfo.color})`,
                  boxShadow: `0 0 12px ${goalInfo.color}60`,
                }}
              />
            </div>
            <div className="text-center mt-2 text-[10px] font-bold text-neutral-500">
              {currentWeight} kg now → {GOAL_WEIGHT_KG} kg target · ~{months} months at clean bulk pace
            </div>
          </div>

          {/* Goal type switcher */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-900">
            {Object.values(GOAL_TYPES).map((g) => (
              <button
                key={g.key}
                onClick={() => switchGoalType(g.key)}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                  goalType === g.key
                    ? 'text-white border-transparent'
                    : 'bg-neutral-950 border-neutral-900 text-neutral-500 hover:text-neutral-300'
                }`}
                style={
                  goalType === g.key
                    ? { backgroundColor: `${g.color}20`, borderColor: `${g.color}40`, color: g.color }
                    : {}
                }
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* ───────── BODY WEIGHT CARD ───────── */}
        <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-black text-neutral-500 tracking-widest uppercase">
              Weight Metrics
            </div>
            <div className="text-right">
              {latestStat ? (
                <>
                  <span className="text-[9px] text-neutral-500 font-bold block leading-none uppercase tracking-wider">Current</span>
                  <span className="text-2xl font-black text-white font-display">{currentWeight} kg</span>
                </>
              ) : (
                <span className="text-xs text-neutral-500 font-bold">Baseline: {STARTING_WEIGHT_KG} kg</span>
              )}
            </div>
          </div>

          <ChartLine
            data={weightChartData}
            color="#0ea5e9"
            unit="kg"
            referenceLine={GOAL_WEIGHT_KG}
          />

          <div className="mt-4 flex gap-2">
            <input
              id="weight-log-input"
              type="number"
              inputMode="decimal"
              placeholder="Enter today's weight (kg)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && logWeight()}
              disabled={saving || isViewer}
              className="flex-1 bg-[#0a0a0a] border border-neutral-900 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-all font-bold disabled:opacity-50"
            />
            <button
              id="log-weight-btn"
              onClick={logWeight}
              disabled={saving || isViewer}
              className="px-5 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              {saving ? '...' : 'Log'}
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-900 flex items-center justify-between">
            <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">
              📌 Goal Weight
            </span>
            <div className="flex items-center gap-2">
              <span className="text-white font-black font-display">{GOAL_WEIGHT_KG} kg</span>
              <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-1 rounded-lg font-black uppercase tracking-wider">
                Fixed
              </span>
            </div>
          </div>
        </div>

        {/* ───────── LIVE MACRO CARDS ───────── */}
        <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black text-neutral-500 tracking-widest uppercase">
              Macro-Nutrient Framework
            </div>
            <div
              className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border"
              style={{ color: goalInfo.color, borderColor: `${goalInfo.color}30`, backgroundColor: `${goalInfo.color}10` }}
            >
              {goalInfo.tag}
            </div>
          </div>

          {/* Live basis label */}
          <div className="text-[10px] text-neutral-500 mb-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Calculated for <strong className="text-sky-400">{currentWeight} kg</strong> · Updates when you log new weight
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['calories', 'protein', 'carbs', 'fats']).map((key) => {
              const meta = MACRO_META[key];
              const value = rangedMacros[key];
              const exact = macros[key];
              const isExpanded = expandedMacro === key;

              // Formula hints per macro
              const formula = key === 'calories'
                ? `${currentWeight}kg × ${goalInfo.calorieMultiplier} kcal`
                : key === 'protein'
                ? `${currentWeight}kg × ${goalInfo.proteinMultiplier}g`
                : key === 'carbs'
                ? `${Math.round(goalInfo.carbsEnergyPct * 100)}% of ${macros.calories} kcal`
                : `${Math.round(goalInfo.fatsEnergyPct * 100)}% of ${macros.calories} kcal`;

              return (
                <button
                  key={key}
                  onClick={() => setExpandedMacro(isExpanded ? null : key)}
                  className="rounded-2xl p-4 border text-left transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: `${meta.color}07`,
                    borderColor: isExpanded ? `${meta.color}40` : `${meta.color}15`,
                  }}
                >
                  <div className="text-[9px] font-black tracking-widest uppercase mb-1 flex items-center gap-1.5" style={{ color: meta.color }}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </div>
                  <div className="text-xl font-black text-white leading-none font-display mb-0.5">
                    {value}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wide">{meta.unit}</div>

                  {isExpanded && (
                    <div className="mt-3 pt-2.5 border-t space-y-1" style={{ borderColor: `${meta.color}20` }}>
                      <div className="text-[9px] text-neutral-400 font-bold">
                        <span className="text-neutral-500">Formula:</span> {formula}
                      </div>
                      <div className="text-[9px] text-neutral-400 font-bold">
                        <span className="text-neutral-500">Exact:</span> ~{exact} {key === 'calories' ? 'kcal' : 'g'}
                      </div>
                      <div className="text-[9px] text-neutral-500 leading-relaxed mt-1">
                        {meta.tip}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick summary banner */}
          <div className="mt-4 bg-neutral-950 border border-neutral-900 rounded-2xl p-3.5 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <div className="text-[10px] font-black text-neutral-300 mb-1">Hostel Shortcut</div>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                6 eggs + 2 dal katoris + 1 glass milk = ~<strong className="text-neutral-300">63g protein</strong>. Add paneer or chicken to hit your {rangedMacros.protein}g target. Don't overthink it — just eat consistently.
              </p>
            </div>
          </div>
        </div>

        {/* ───────── DAILY PROTEIN CHECKLIST ───────── */}
        <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[9px] font-black text-neutral-500 tracking-widest uppercase">
                Daily Protein Checklist
              </h3>
              <p className="text-[10px] text-neutral-600 font-bold mt-0.5">Resets automatically at midnight</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 bg-neutral-950 border border-neutral-900/60 rounded-xl px-2.5 py-1 font-black">
                {Object.values(checklist).filter(Boolean).length} / {proteinChecklist.length}
              </span>
              {Object.values(checklist).filter(Boolean).length === proteinChecklist.length && (
                <span className="text-xs text-emerald-400 font-black">🏆</span>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {proteinChecklist.map((item) => {
              const checked = checklist[item.id];
              return (
                <button
                  key={item.id}
                  id={`checklist-${item.id}`}
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 text-left border ${
                    checked
                      ? 'bg-[#0d1a0d]/60 border-[#059669]/25 shadow-sm'
                      : 'bg-neutral-950 border-neutral-900/80 hover:border-neutral-800'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all border shrink-0 ${
                      checked
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-neutral-800 bg-neutral-950'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span
                    className={`text-xs font-bold tracking-wide transition-all ${
                      checked ? 'text-emerald-400/90 line-through' : 'text-neutral-300'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-neutral-600 text-[9px] font-black uppercase tracking-widest py-6">
          Eat well · Train hard · Sleep deep · Repeat 🎯
        </div>
      </div>
    </div>
  );
}
