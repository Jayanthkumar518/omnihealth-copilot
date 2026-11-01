'use client';
import { useState } from 'react';
import { Droplet, ShieldAlert } from 'lucide-react';

export default function HydrationCalculator() {
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState(1.2);
  const [hasNsaid, setHasNsaid] = useState(false);

  const baseWater = (weight * 35 * activity) / 1000; // Liters
  const finalWater = hasNsaid ? baseWater + 0.5 : baseWater;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Drug-Aware Hydration Calculator</h2>
        <p className="text-sm text-slate-400">Calculates precise water intake factoring in body weight and renal drug strain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div>
            <label className="text-sm font-medium text-slate-400">Body Weight (kg): {weight} kg</label>
            <input
              type="range"
              min="40"
              max="140"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full mt-2 accent-cyan-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-400">Activity Level</label>
            <select
              value={activity}
              onChange={(e) => setActivity(Number(e.target.value))}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
            >
              <option value={1.0}>Sedentary / Desk Job</option>
              <option value={1.2}>Moderate Activity / Walking</option>
              <option value={1.5}>High Activity / Laborer</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={hasNsaid}
              onChange={(e) => setHasNsaid(e.target.checked)}
              className="w-5 h-5 rounded accent-cyan-500"
            />
            <span className="text-sm font-medium text-slate-300">Taking NSAIDs or Diuretics (Renal Strain Buffer)</span>
          </label>
        </div>

        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-center space-y-3">
          <Droplet className="w-12 h-12 text-cyan-400 animate-bounce" />
          <h3 className="text-sm uppercase tracking-wider text-cyan-400 font-semibold">Recommended Daily Intake</h3>
          <div className="text-4xl font-extrabold">{finalWater.toFixed(2)} Liters</div>
          <p className="text-xs text-slate-400 max-w-xs">
            {hasNsaid ? 'Includes a 500ml safety buffer to flush renal metabolite accumulation safely.' : 'Standard optimal baseline for your body weight and activity.'}
          </p>
        </div>
      </div>
    </div>
  );
}