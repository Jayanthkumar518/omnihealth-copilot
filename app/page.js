import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowRight, Mic, Pill, Droplet, UserCheck, HeartPulse } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 md:pb-0">
      <Navbar />
      <main className="md:pl-64">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Next-Gen Patient Safety Platform
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Your All-in-One <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Health Copilot</span>
            </h1>
            <p className="text-lg text-slate-400">
              Bridge communication gaps, track medications securely, safeguard your kidneys against dehydration, and prevent desk-job musculoskeletal strain—all in one zero-friction web platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all"
              >
                Open Copilot Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/about"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800 transition-all"
              >
                Learn About the Science
              </Link>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {[
              { icon: Mic, title: 'Voice Doctor Prep', desc: 'Convert rambling symptoms into structured physician cheat sheets.' },
              { icon: Pill, title: 'Prescription OCR', desc: 'Scan bottles, extract dosages, and set smart visual alarms.' },
              { icon: Droplet, title: 'Drug-Aware Hydration', desc: 'Calculate safe fluid targets based on medications & body weight.' },
              { icon: UserCheck, title: 'Posture Screener', desc: 'Real-time computer vision joint alignment & ergonomic feedback.' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 w-fit rounded-2xl mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}