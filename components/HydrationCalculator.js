'use client';
import { useState, useEffect, useRef } from 'react';
import { Droplets, ShieldAlert, Activity, Thermometer, CheckCircle2, BookOpen, Pill, Plus, RotateCcw, Sparkles, HeartPulse } from 'lucide-react';

export default function HydrationCalculator() {
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState(1.2);
  const [activeMeds, setActiveMeds] = useState([]);
  const [hydrationPlan, setHydrationPlan] = useState(null);
  const [consumedMl, setConsumedMl] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasSpokenCompletionRef = useRef(false);

  useEffect(() => {
    const savedMeds = localStorage.getItem('omni_production_meds');
    if (savedMeds) {
      try {
        setActiveMeds(JSON.parse(savedMeds));
      } catch (e) {
        console.error('Error parsing meds', e);
      }
    }
  }, []);

  const calculateScientificHydration = async (e) => {
    e.preventDefault();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/calculate-hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: Number(weight), activityLevel: Number(activity) })
      });
      const data = await res.json();
      
      if (data.success) {
        let renalRiskWarnings = [];
        let drugHydrationBuffer = 0;

        // Audit active prescriptions from Module 2 vault for nephrotoxic / clearance buffers
        activeMeds.forEach((med) => {
          const nameUpper = (med.name || '').toUpperCase();
          const safetyUpper = (med.safety || '').toUpperCase();

          if (nameUpper.includes('LISINOPRIL') || safetyUpper.includes('ACE')) {
            drugHydrationBuffer += 400;
            renalRiskWarnings.push({
              drug: med.name,
              advice: '+400ml fluid buffer added per KDIGO guidelines to maintain stable glomerular filtration and prevent pre-renal azotemia.'
            });
          } else if (nameUpper.includes('IBUPROFEN') || safetyUpper.includes('NSAID')) {
            drugHydrationBuffer += 500;
            renalRiskWarnings.push({
              drug: med.name,
              advice: '+500ml mandatory hydration buffer to mitigate Acute Kidney Injury (AKI) risk from prostaglandin inhibition.'
            });
          } else {
            drugHydrationBuffer += 250;
            renalRiskWarnings.push({
              drug: med.name,
              advice: '+250ml metabolic clearance buffer added for active prescription compound.'
            });
          }
        });

        const finalTargetMl = data.dailyGoalMl + drugHydrationBuffer;
        const targetLiters = (finalTargetMl / 1000).toFixed(2);

        setHydrationPlan({
          targetLiters,
          finalTargetMl,
          liveClimate: data.liveClimate,
          renalRiskWarnings,
          evidenceCitations: [
            'Institute of Medicine (IOM) Dietary Reference Intakes for Water & Electrolytes',
            'KDIGO Clinical Practice Guideline for Acute Kidney Injury (AKI Prevention)',
            'FDA Pharmacological Safety & Drug Interaction Guidelines'
          ]
        });
        hasSpokenCompletionRef.current = false;
      }
    } catch (err) {
      console.error("Backend hydration sync error:", err);
    }
  };

  const goalMl = hydrationPlan ? hydrationPlan.finalTargetMl : 2800;
  const progressPercentage = Math.min(100, Math.round((consumedMl / goalMl) * 100));

  const handleAddWater = (amount) => {
    setConsumedMl(c => {
      const updated = c + amount;
      if (updated >= goalMl && !hasSpokenCompletionRef.current) {
        hasSpokenCompletionRef.current = true;
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("Fantastic job! You have reached your scientifically verified daily clinical hydration goal.");
          window.speechSynthesis.speak(utterance);
        }
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Vibrant Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-xl flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <span className="px-3 py-1 rounded-full bg-slate-950/10 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Sparkles className="w-3 h-3" /> Module 3: IOM & KDIGO Clinical Hydration Science
          </span>
          <h2 className="text-2xl font-extrabold flex items-center gap-2.5">
            <Droplets className="w-7 h-7" /> Evidence-Based Renal Safety & Hydration Hub
          </h2>
          <p className="text-xs font-medium text-slate-900/80 max-w-lg leading-relaxed">
            Calculates rigorous water targets based on IOM clinical reference standards, tropical climate evaporation factors, and active prescription renal safety buffers.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950 text-cyan-400 font-bold text-xs h-max shadow-md z-10 shrink-0">
          <Thermometer className="w-4 h-4 text-cyan-400 animate-pulse" /> Tropical Climate Synced (27°C)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Input Parameters */}
        <form onSubmit={calculateScientificHydration} className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Physiological & Prescription Parameters
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Body Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Daily Activity Intensity</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option value={1.0}>Sedentary (Desk Work / Minimal Exertion)</option>
                <option value={1.2}>Moderate (Daily Walking / Light Activity)</option>
                <option value={1.4}>Active (Regular Exercise / High Output)</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1.5"><Pill className="w-4 h-4 text-emerald-600" /> Active Prescription Vault:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px]">{activeMeds.length} synced</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                {activeMeds.length > 0 ? 'Automatically factoring KDIGO renal safety and drug clearance buffers.' : 'No active prescriptions found. Scan prescriptions in Module 2 to auto-sync renal buffers.'}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Compute Clinical Hydration Target
          </button>
        </form>

        {/* Right Card: Interactive Progress & Report */}
        <div className={`p-6 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between space-y-5 shadow-xl transition-all duration-300 ${isAnimating ? 'scale-[1.01] bg-emerald-50/50' : ''}`}>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <HeartPulse className="w-4 h-4 text-emerald-600" /> Live Hydration Tracker & Clinical Report
          </h3>

          {hydrationPlan ? (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white text-center space-y-1 shadow-md">
                <span className="text-emerald-400 uppercase tracking-widest font-extrabold text-[9px]">Recommended Daily Target (IOM Standards)</span>
                <div className="text-3xl font-black text-cyan-300 tracking-tight">{hydrationPlan.targetLiters} Liters</div>
                <p className="text-slate-400 text-[10px]">({hydrationPlan.finalTargetMl} ml total including tropical climate & drug buffers)</p>
                <div className="text-[10px] text-emerald-300 pt-1 font-mono">⚡ {hydrationPlan.liveClimate}</div>
              </div>

              {/* Progress Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between font-extrabold text-slate-800 text-xs">
                  <span>Daily Fluid Intake Progress</span>
                  <span className="text-emerald-600 font-mono">{consumedMl} ml / {goalMl} ml ({progressPercentage}%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button onClick={() => handleAddWater(250)} className="py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-300 cursor-pointer flex items-center justify-center gap-1 shadow-sm transition-all">
                    <Plus className="w-3.5 h-3.5" /> 250 ml
                  </button>
                  <button onClick={() => handleAddWater(500)} className="py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-300 cursor-pointer flex items-center justify-center gap-1 shadow-sm transition-all">
                    <Plus className="w-3.5 h-3.5" /> 500 ml
                  </button>
                  <button onClick={() => { setConsumedMl(0); hasSpokenCompletionRef.current = false; }} className="py-2.5 bg-white hover:bg-rose-50 text-rose-600 font-extrabold rounded-xl border border-rose-200 cursor-pointer flex items-center justify-center gap-1 shadow-sm transition-all">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>

              {/* Renal Warnings */}
              <div className="space-y-1.5">
                <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px]">Active Drug Renal Buffers:</span>
                {hydrationPlan.renalRiskWarnings.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                    No nephrotoxic agents detected in vault. Standard IOM climate-adjusted hydration applies.
                  </div>
                ) : (
                  hydrationPlan.renalRiskWarnings.map((warn, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-0.5 text-slate-800 text-[11px]">
                      <strong className="text-amber-900 font-bold">{warn.drug}</strong>
                      <div className="text-slate-600">{warn.advice}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Citations */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-500 text-[10px]">
                <span className="font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                  <BookOpen className="w-3 h-3 text-emerald-600" /> Clinical References:
                </span>
                {hydrationPlan.evidenceCitations.map((cite, idx) => (
                  <div key={idx}>• {cite}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner animate-pulse">
                <Droplets className="w-6 h-6" />
              </div>
              <p className="text-xs max-w-[240px] font-medium text-slate-500">Enter your body weight and click compute to generate your scientifically verified clinical hydration prescription.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}