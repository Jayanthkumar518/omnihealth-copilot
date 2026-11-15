'use client';
import { Activity, ShieldCheck, Cpu, Code, Users, Sparkles } from 'lucide-react';

export default function AboutPage() {
  const contributors = [
    {
      name: "B Jayanthkumar",
      role: "M.Sc. Bioinformatics (2nd Year)",
      bio: "Currently convincing Python that genomic alignment and FastAPI routing can share the exact same cup of coffee without throwing a 500 error."
    },
    {
      name: "Tejas D",
      role: "M.Sc. Bioinformatics (2nd Year)",
      bio: "Debugging MediaPipe joint angles and skeletal tensors at 3 AM because my posture score just threatened to report me to HR."
    },
    {
      name: "Harshith D",
      role: "M.Sc. Bioinformatics (2nd Year)",
      bio: "Parsing prescriptions faster than an enzyme digesting substrates—waiting for OpenFDA RAG to give me a Nobel Prize in bioinformatics."
    }
  ];

  const modules = [
    {
      title: "Module 1: Voice AI Triage & Cumulative Memory Agent",
      tech: "Web Speech API, FastAPI, OpenAI GPT-4o-mini (JSON Mode)",
      desc: "Processes continuous speech dictation with an interactive symptom intensity slider (1–10) and performs a 5-point clinical intake audit."
    },
    {
      title: "Module 2: Prescription Scanner & OpenFDA RAG",
      tech: "Tesseract OCR, Vision LLMs, OpenFDA REST API (`httpx`)",
      desc: "Dynamically extracts drug compounds from arbitrary prescription images, fetches live federal clinical warnings, and computes renal hydration buffers."
    },
    {
      title: "Module 3: Clinical Hydration & Renal Safety Calculator",
      tech: "Algorithmic Engine, IOM Standards, KDIGO Guidelines",
      desc: "Calculates precise daily water intake targets based on body weight, activity level, and tropical climate evaporation factors."
    },
    {
      title: "Module 4: 3D Kinematic Posture & Ergonomic Screener",
      tech: "MediaPipe Tasks Vision (PoseLandmarker), Recharts, Prisma ORM",
      desc: "Tracks 33 skeletal keypoints in 3D meters client-side, computes REBA ergonomic risk scores (1–12), and generates physician-ready PDF reports."
    },
    {
      title: "Module 5: Stress Playground & Calming Hub",
      tech: "FastAPI Endpoints, Reactive UI",
      desc: "Delivers cognitive reframing affirmations, soothing psychological insights, and guided breathing pacing timers."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-8 px-4 text-slate-100">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-3 backdrop-blur-xl">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-[10px] uppercase flex items-center gap-1.5 w-max">
            <Sparkles className="w-3 h-3 text-indigo-400" /> About OmniHealth
          </span>
          <h1 className="text-3xl font-extrabold text-white">About the Platform & The Team</h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            OmniHealth is an enterprise-grade full-stack healthcare copilot engineered to bridge computational intelligence and clinical workflows.
          </p>
        </div>

        {/* Contributors Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Meet the Bioinformatics Squad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contributors.map((c, i) => (
              <div key={i} className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 shadow-xl flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">{c.role}</span>
                  <h3 className="font-bold text-slate-100 text-base">{c.name}</h3>
                  <p className="text-xs text-slate-300 italic leading-relaxed bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                    &ldquo;{c.bio}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Architecture Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" /> Platform Technicalities & Module Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((m, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2 shadow-sm">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" /> {m.title}
                </h3>
                <p className="text-[11px] text-cyan-400 font-mono"><strong>Tech:</strong> {m.tech}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}