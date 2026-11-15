'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Droplets,
  Activity,
  Thermometer,
  Pill,
  Plus,
  RotateCcw,
  Undo2,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  ExternalLink,
  Volume2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const URINE_HYDRATION_SCALE = [
  { color: 'bg-amber-50 border-amber-200', dot: 'bg-[#fef9c3]', label: 'Pale Straw', status: 'Well Hydrated — Maintain steady pacing' },
  { color: 'bg-yellow-50 border-yellow-300', dot: 'bg-[#fde047]', label: 'Transparent Yellow', status: 'Normal — Drink 250 mL within 1 hour' },
  { color: 'bg-amber-100 border-amber-400', dot: 'bg-[#eab308]', label: 'Dark Yellow / Amber', status: 'Mild Dehydration — Drink 500 mL water now' },
  { color: 'bg-orange-100 border-orange-400', dot: 'bg-[#b45309]', label: 'Deep Honey / Concentrated', status: 'Renal Strain Risk — Rehydrate promptly with water/ORS' },
];

export default function HydrationCalculator() {
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState('moderate');
  const [hasFever, setHasFever] = useState(false);
  const [hasGiLoss, setHasGiLoss] = useState(false);

  const [plan, setPlan] = useState(null);
  const [todayStatus, setTodayStatus] = useState({
    consumedMl: 0,
    logs: [],
    syncedMedications: [],
  });
  const [loading, setLoading] = useState(false);
  const hasSpokenGoalRef = useRef(false);

  const speakAudio = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchPlan = async (overrideParams = {}) => {
    setLoading(true);
    const payload = {
      weightKg: Number(overrideParams.weight ?? weight),
      activityLevel: overrideParams.activity ?? activity,
      hasFever: overrideParams.hasFever ?? hasFever,
      hasGiLoss: overrideParams.hasGiLoss ?? hasGiLoss,
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/calculate-hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data);
        if (data.todayStatus) {
          setTodayStatus(data.todayStatus);
        }
      }
    } catch {
      console.error('Could not reach hydration backend on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync latest Module 2 prescriptions & today's intake logs on mount
  useEffect(() => {
    fetchPlan();
  }, []);

  const handleCompute = async (e) => {
    e.preventDefault();
    hasSpokenGoalRef.current = false;
    await fetchPlan();
  };

  const handleLogFluid = async (amountMl, beverageType = 'Plain Water') => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/hydration/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMl, beverageType }),
      });
      const data = await res.json();
      if (data.success) {
        setTodayStatus(data);
        const target = plan?.dailyGoalMl || 2600;
        if (data.consumedMl >= target && !hasSpokenGoalRef.current) {
          hasSpokenGoalRef.current = true;
          speakAudio('Excellent work! You have achieved your daily clinical hydration target.');
        }
      }
    } catch {
      alert('Failed to log fluid intake.');
    }
  };

  const handleUndoLast = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/hydration/undo', { method: 'POST' });
      const data = await res.json();
      if (data.success) setTodayStatus(data);
    } catch {
      alert('Could not undo last entry.');
    }
  };

  const handleResetToday = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/hydration/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTodayStatus(data);
        hasSpokenGoalRef.current = false;
      }
    } catch {
      alert('Could not reset today logs.');
    }
  };

  const goalMl = plan?.dailyGoalMl || 2600;
  const consumedMl = todayStatus.consumedMl || 0;
  const remainingMl = Math.max(0, goalMl - consumedMl);
  const progressPct = Math.min(100, Math.round((consumedMl / goalMl) * 100));
  const syncedMeds = plan?.syncedMedications || todayStatus.syncedMedications || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Clinical Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Module 3: EFSA / IOM & KDIGO Clinical Hydration Engine
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-emerald-600" /> Personalized Renal Safety & Daily Fluid Tracker
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            Computes physiological fluid requirements from body weight, live weather telemetry, acute illness losses, and active prescriptions synced from Module 2.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3.5 py-2 rounded-2xl bg-slate-900 text-cyan-300 text-xs font-bold flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            {plan?.breakdown?.weatherSummary || 'Syncing Live Weather...'}
          </span>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): Physiological & Clinical Inputs + Synced Module 2 Meds */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleCompute} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> 1. Physiological & Clinical Parameters
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Body Weight (kg)</label>
                <input
                  type="number"
                  min={25}
                  max={200}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Activity Level</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="sedentary">Sedentary (+0 mL)</option>
                  <option value="moderate">Moderate (+350 mL)</option>
                  <option value="active">High Output (+750 mL)</option>
                </select>
              </div>
            </div>

            {/* Acute Illness Fluid Loss Checkboxes */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Acute Fluid Loss Modifiers (From Module 1 / Slip)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${hasFever ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <input
                    type="checkbox"
                    checked={hasFever}
                    onChange={(e) => setHasFever(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  Fever / Body Heat (+400 mL)
                </label>

                <label className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${hasGiLoss ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <input
                    type="checkbox"
                    checked={hasGiLoss}
                    onChange={(e) => setHasGiLoss(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  Vomiting / Diarrhea (+500 mL)
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Recalculating Clinical Target...' : 'Update Clinical Hydration Target'}
            </button>
          </form>

          {/* Auto-Synced Module 2 Prescription Vault */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-indigo-600" /> Synced Module 2 Prescriptions
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-extrabold">
                {syncedMeds.length} Active
              </span>
            </div>

            {syncedMeds.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  No scanned prescription found yet. Scan a slip in <strong>Module 2</strong> and its drug-specific renal hydration buffers will automatically sync here.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {syncedMeds.map((med, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{med.medicationName}</strong>
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                        +{med.extraHydrationMl} mL/day
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">{med.hydrationRule}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urine Hydration Self-Check Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Quick Clinical Hydration Self-Check
            </h3>
            <div className="space-y-1.5">
              {URINE_HYDRATION_SCALE.map((item, idx) => (
                <div key={idx} className={`px-3 py-2 rounded-xl border text-[11px] flex items-center gap-2.5 ${item.color}`}>
                  <span className={`w-4 h-4 rounded-full border border-slate-400 shrink-0 ${item.dot}`} />
                  <div>
                    <strong className="text-slate-900">{item.label}:</strong>{' '}
                    <span className="text-slate-700">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Live Tracker, Breakdown, Hourly Pacing & PubMed */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Hero + Live SQLite Intake Logger */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                  Verified Daily Hydration Target
                </span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl font-black text-cyan-300">
                    {plan ? `${plan.targetLiters} L` : '2.60 L'}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    ({goalMl} mL • {plan?.totalGlasses250Ml || 10.4} glasses of 250 mL)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  speakAudio(
                    `Your daily hydration target is ${goalMl} milliliters. You have logged ${consumedMl} milliliters so far, with ${remainingMl} milliliters remaining today.`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
              >
                <Volume2 className="w-4 h-4" /> Read Status
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">
                  Logged Today: <strong className="text-white">{consumedMl} mL</strong>
                </span>
                <span className="text-emerald-400">
                  {progressPct}% Complete ({remainingMl} mL left)
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Quick-Add Beverage Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleLogFluid(250, 'Plain Water (1 Glass)')}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> 250 mL
              </button>
              <button
                type="button"
                onClick={() => handleLogFluid(500, 'Water Bottle (500 mL)')}
                className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> 500 mL
              </button>
              <button
                type="button"
                onClick={() => handleLogFluid(250, 'ORS / Electrolytes')}
                className="py-2.5 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> 250 ORS
              </button>
              <button
                type="button"
                onClick={handleUndoLast}
                disabled={todayStatus.logs.length === 0}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
              <button
                type="button"
                onClick={handleResetToday}
                disabled={todayStatus.logs.length === 0}
                className="py-2.5 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Today's Drink Log Pills */}
            {todayStatus.logs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800">
                {todayStatus.logs.slice(0, 8).map((entry) => (
                  <span
                    key={entry.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    +{entry.amountMl} mL ({entry.beverageType}) • {entry.loggedAt}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Transparent Milliliter Breakdown Grid */}
          {plan?.breakdown && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Evidence-Based Volume Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Physiological Base</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{plan.breakdown.physiologicalBaselineMl} mL</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{weight} kg × 32 mL</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Activity Load</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">+{plan.breakdown.activityMl} mL</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 capitalize">{activity}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Ambient Climate</div>
                  <div className="text-sm font-black text-cyan-700 mt-0.5">+{plan.breakdown.climateMl} mL</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Live Open-Meteo</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Illness Loss</div>
                  <div className="text-sm font-black text-amber-700 mt-0.5">+{plan.breakdown.illnessMl} mL</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Fever / GI</div>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase">Rx Renal Buffer</div>
                  <div className="text-sm font-black text-indigo-900 mt-0.5">+{plan.breakdown.medicationMl} mL</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">{syncedMeds.length} meds synced</div>
                </div>
              </div>
            </div>
          )}

          {/* Hourly Pacing Schedule */}
          {plan?.hourlyPacingSchedule?.length > 0 && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" /> Sleep-Safe Hourly Hydration Pacing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {plan.hourlyPacingSchedule.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-emerald-800">
                        {slot.time} — <span className="text-slate-900">{slot.volumeMl} mL</span> ({slot.glasses})
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{slot.guidance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live PubMed & Clinical Guideline Citations */}
          <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" /> Clinical Reference Standards & Live PubMed Literature
            </h3>
            <div className="space-y-1 text-[11px] text-slate-700">
              {(plan?.evidenceStandards || []).map((std, i) => (
                <div key={i}>• {std}</div>
              ))}
            </div>
            {plan?.pubmedExtracts?.length > 0 && (
              <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                {plan.pubmedExtracts.map((pub) => (
                  <div key={pub.pmid} className="text-[11px] text-slate-800 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-800">[PMID: {pub.pmid}]</span>{' '}
                      {pub.title}{' '}
                      <span className="text-slate-500">({pub.journal}, {pub.pubDate})</span>
                    </div>
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5 shrink-0"
                    >
                      PubMed <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}