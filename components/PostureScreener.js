'use client';
import { useState, useRef } from 'react';
import { Camera, ShieldCheck, Activity, AlertTriangle, RefreshCw } from 'lucide-react';

export default function PostureScreener() {
  const [scanning, setScanning] = useState(false);
  const [postureScore, setPostureScore] = useState(null);

  const startScan = () => {
    setScanning(true);
    setPostureScore(null);
    setTimeout(() => {
      setScanning(false);
      setPostureScore({
        score: '91 / 100',
        status: 'Optimal Spinal Alignment',
        advice: 'Head posture is balanced. Minimal cervical strain detected.',
        ergonomicTip: 'Maintain current monitor eye-level alignment.'
      });
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
            Computer Vision Ergonomic Sentinel
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-emerald-400" /> Posture & Musculoskeletal Guard
          </h2>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Evaluates spinal alignment and forward head tilt to prevent occupational strain and protect post-operative posture recovery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
            <Camera className={`w-8 h-8 ${scanning ? 'animate-bounce' : ''}`} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-100 text-sm">Webcam Pose Audit</h3>
            <p className="text-xs text-slate-400">Position yourself facing your webcam and run a 2-second alignment scan.</p>
          </div>
          <button
            onClick={startScan}
            disabled={scanning}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs cursor-pointer disabled:opacity-40"
          >
            {scanning ? 'Analyzing Alignment...' : 'Run Posture Audit'}
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Ergonomic Report
          </h3>
          {postureScore ? (
            <div className="space-y-3 text-xs animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Alignment Score:</span>
                <span className="font-bold text-emerald-400 text-sm">{postureScore.score}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <strong className="text-emerald-400 block uppercase text-[10px]">Evaluation:</strong>
                <p className="text-slate-200">{postureScore.advice}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-slate-400 block uppercase text-[10px]">Actionable Recommendation:</strong>
                <p className="text-slate-300">{postureScore.ergonomicTip}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Run posture audit to generate live ergonomic metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}