import Navbar from '@/components/Navbar';
import { ShieldCheck, Cpu, Lock, FileText } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 md:pb-0">
      <Navbar />
      <main className="md:pl-64">
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold">About OmniHealth & The Science</h1>
            <p className="text-slate-400 text-lg">
              Designed to solve critical, underexplored healthcare gaps by bridging patient communication, clinical pharmacology, computer vision ergonomics, and physiological safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <Cpu className="w-8 h-8 text-cyan-400" />
              <h3 className="text-xl font-bold">Client-Side Browser AI</h3>
              <p className="text-sm text-slate-400">
                We utilize MediaPipe Pose (TensorFlow.js) and Tesseract.js directly inside your browser. Video feeds and medical photos are processed locally without ever touching a centralized server.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <Lock className="w-8 h-8 text-cyan-400" />
              <h3 className="text-xl font-bold">Privacy-First Guarantee</h3>
              <p className="text-sm text-slate-400">
                No permanent medical records, symptom logs, or scanned prescriptions are stored in external databases. All data remains in your browser's encrypted LocalStorage.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}