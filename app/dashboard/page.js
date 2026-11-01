'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import VoiceTriage from '@/components/VoiceTriage';
import PrescriptionScanner from '@/components/PrescriptionScanner';
import HydrationCalculator from '@/components/HydrationCalculator';
import PostureScreener from '@/components/PostureScreener';
import StressHub from '@/components/StressHub';
import { Mic, Pill, Droplet, UserCheck, HeartPulse } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('voice');

  const tabs = [
    { id: 'voice', label: 'Voice Doctor Prep', icon: Mic },
    { id: 'prescriptions', label: 'Prescriptions & Alarms', icon: Pill },
    { id: 'hydration', label: 'Hydration Safety', icon: Droplet },
    { id: 'posture', label: 'Posture Screener', icon: UserCheck },
    { id: 'stress', label: 'Stress & Recovery Hub', icon: HeartPulse },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 md:pb-12">
      <Navbar />
      <main className="md:pl-64 max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold">Patient Safety & Copilot Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Select a module below to begin your diagnostic and wellness check.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-8 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Module Container */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          {activeTab === 'voice' && <VoiceTriage />}
          {activeTab === 'prescriptions' && <PrescriptionScanner />}
          {activeTab === 'hydration' && <HydrationCalculator />}
          {activeTab === 'posture' && <PostureScreener />}
          {activeTab === 'stress' && <StressHub />}
        </div>
      </main>
    </div>
  );
}