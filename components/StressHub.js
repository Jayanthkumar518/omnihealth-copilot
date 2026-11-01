'use client';
import { useState, useEffect, useRef } from 'react';
import { Wind, Volume2, VolumeX, Eye, Smile, Frown, Activity, Play, Pause, RefreshCcw } from 'lucide-react';

export default function StressHub() {
  const [subTab, setSubTab] = useState('breathing');

  // --- 1. Box Breathing State ---
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Press Start');
  const [countdown, setCountdown] = useState(4);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isBreathingActive) {
      clearInterval(timerRef.current);
      setBreathingPhase('Ready');
      setCountdown(4);
      return;
    }

    const phases = [
      { name: 'Inhale (Breathe Deep)', duration: 4 },
      { name: 'Hold Breath', duration: 4 },
      { name: 'Exhale (Release Slowly)', duration: 4 },
      { name: 'Hold Empty', duration: 4 },
    ];

    let phaseIdx = 0;
    let timeLeft = phases[phaseIdx].duration;
    setBreathingPhase(phases[phaseIdx].name);
    setCountdown(timeLeft);

    timerRef.current = setInterval(() => {
      timeLeft--;
      if (timeLeft < 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        timeLeft = phases[phaseIdx].duration;
        setBreathingPhase(phases[phaseIdx].name);
      }
      setCountdown(timeLeft);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isBreathingActive]);

  // --- 2. Ambient Sound Generator (Web Audio API) ---
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);

  const toggleSoundscape = () => {
    if (isPlayingAudio) {
      if (audioCtxRef.current) audioCtxRef.current.close();
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Generate soothing pink/white noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.03; // Low volume for relaxation
          b6 = white * 0.115926;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Soft soothing sound

        noise.connect(filter);
        filter.connect(ctx.destination);
        noise.start();
        noiseNodeRef.current = noise;
        setIsPlayingAudio(true);
      } catch (e) {
        console.error('Audio error:', e);
      }
    }
  };

  // --- 3. Stress Journal State ---
  const [mood, setMood] = useState('Calm');
  const [note, setNote] = useState('');
  const [journalLogs, setJournalLogs] = useState([]);

  const saveJournal = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    const entry = { id: Date.now(), mood, note, time: new Date().toLocaleTimeString() };
    const updated = [entry, ...journalLogs];
    setJournalLogs(updated);
    setNote('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Stress Relief & Recovery Hub</h2>
        <p className="text-sm text-slate-400">Interactive physiological reset tools for real-time nervous system regulation.</p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'breathing', label: 'Box Breathing', icon: Wind },
          { id: 'sound', label: 'Ambient Soundscape', icon: Volume2 },
          { id: 'journal', label: 'Stress Check-in', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                subTab === tab.id ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Box Breathing Visualizer */}
      {subTab === 'breathing' && (
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-6">
          <div className="relative flex items-center justify-center w-56 h-56">
            {/* Pulsing Animated Ring */}
            <div
              className={`absolute inset-0 rounded-full border-4 border-cyan-500/40 bg-cyan-500/10 transition-all duration-1000 ${
                isBreathingActive && breathingPhase.includes('Inhale')
                  ? 'scale-125 bg-cyan-500/25'
                  : isBreathingActive && breathingPhase.includes('Exhale')
                  ? 'scale-75 bg-cyan-500/5'
                  : 'scale-100'
              }`}
            ></div>
            <div className="z-10 flex flex-col items-center">
              <span className="text-3xl font-ext500 text-cyan-400">{isBreathingActive ? countdown : '4-4-4'}</span>
              <span className="text-xs text-slate-400 mt-1 max-w-[120px] font-medium">{breathingPhase}</span>
            </div>
          </div>

          <button
            onClick={() => setIsBreathingActive(!isBreathingActive)}
            className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
              isBreathingActive ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {isBreathingActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isBreathingActive ? 'Pause Session' : 'Start 4-Step Breathing'}
          </button>
        </div>
      )}

      {/* Tab 2: Ambient Soundscape */}
      {subTab === 'sound' && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-6">
          <div className="p-6 bg-cyan-500/10 text-cyan-400 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            {isPlayingAudio ? <Volume2 className="w-10 h-10 animate-bounce" /> : <VolumeX className="w-10 h-10" />}
          </div>
          <div>
            <h3 className="font-bold text-lg">Neural Pink Noise & Frequency Generator</h3>
            <p className="text-xs text-slate-400 mt-1">Synthesizes real-time calming audio waves in your browser to mask office distraction and lower cortisol.</p>
          </div>
          <button
            onClick={toggleSoundscape}
            className={`px-8 py-3 rounded-2xl font-bold transition-all cursor-pointer ${
              isPlayingAudio ? 'bg-red-500 text-white' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {isPlayingAudio ? 'Stop Soundscape' : 'Play Relaxing Soundscape'}
          </button>
        </div>
      )}

      {/* Tab 3: Stress Check-in */}
      {subTab === 'journal' && (
        <div className="space-y-6">
          <form onSubmit={saveJournal} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="font-semibold text-cyan-400">How are you feeling right now?</h3>
            <div className="flex gap-4">
              {['Calm', 'Focused', 'Stressed', 'Anxious'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMood(m)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mood === m ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Jot down any immediate stressors or thoughts..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="3"
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            ></textarea>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all cursor-pointer"
            >
              Log Stress Check-in
            </button>
          </form>

          {journalLogs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Check-ins</h4>
              {journalLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center text-sm">
                  <div>
                    <span className="text-cyan-400 font-bold mr-2">[{log.mood}]</span>
                    <span className="text-slate-200">{log.note}</span>
                  </div>
                  <span className="text-xs text-slate-500">{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}