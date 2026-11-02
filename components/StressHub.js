'use client';
import { useState, useEffect, useRef } from 'react';
import { Wind, Volume2, Activity, Play, Pause, Sparkles, Smile, Gamepad2, Heart, RefreshCcw, CheckCircle2, Zap } from 'lucide-react';

export default function StressHub() {
  const [subTab, setSubTab] = useState('playground');

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

  // --- 2. Zen Ripple Game State (With On/Off Toggle) ---
  const [isRippleActive, setIsRippleActive] = useState(true);
  const [ripples, setRipples] = useState([]);

  const handleCanvasClick = (e) => {
    if (!isRippleActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev.slice(-10), newRipple]);

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch (err) {}
  };

  // --- 3. Dynamic Soothing Quotes & AI Affirmations ---
  const soothingQuotes = [
    "“The time to relax is when you don't have time for it.” — Sydney J. Harris",
    "“You don't have to see the whole staircase, just take the first step.” — Martin Luther King Jr.",
    "“Peace comes from within. Do not seek it without.” — Buddha",
    "“Deep breathing is our nervous system's love language.” — Clinical Wellness Proverb",
    "“Your body holds deep wisdom. Trust your ability to heal, reset, and recover.”"
  ];

  const [currentQuote, setCurrentQuote] = useState(soothingQuotes[0]);
  const [affirmationMood, setAffirmationMood] = useState('Stressed');
  const [affirmationText, setAffirmationText] = useState("Take a slow breath. You are doing amazing.");

  const rotateQuote = () => {
    const randomQuote = soothingQuotes[Math.floor(Math.random() * soothingQuotes.length)];
    setCurrentQuote(randomQuote);
    speakAudio(randomQuote);
  };

  const fetchAffirmation = async (moodVal) => {
    setAffirmationMood(moodVal);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/stress-playground/affirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: moodVal })
      });
      const data = await res.json();
      if (data.success) {
        setAffirmationText(data.soothingWords);
        speakAudio(data.soothingWords);
      }
    } catch (e) {
      setAffirmationText("You are resilient and capable. Relax your shoulders and breathe.");
    }
  };

  // --- 4. Interactive Stress Popper Minigame ---
  const [stressBubbles, setStressBubbles] = useState([
    { id: 1, text: 'Deadline Anxiety', popped: false },
    { id: 2, text: 'Muscle Tension', popped: false },
    { id: 3, text: 'Overthinking', popped: false },
    { id: 4, text: 'Digital Fatigue', popped: false },
  ]);

  const popBubble = (id) => {
    setStressBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    speakAudio("Stress bubble popped. Tension released.");
  };

  const resetBubbles = () => {
    setStressBubbles([
      { id: 1, text: 'Deadline Anxiety', popped: false },
      { id: 2, text: 'Muscle Tension', popped: false },
      { id: 3, text: 'Overthinking', popped: false },
      { id: 4, text: 'Digital Fatigue', popped: false },
    ]);
  };

  // --- 5. AI Wellness Joke ---
  const [joke, setJoke] = useState({ setup: "Why did the microchip go to therapy?", punchline: "It had too many emotional bytes and needed to decompress!" });

  const fetchJoke = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/stress-playground/joke');
      const data = await res.json();
      if (data.success) setJoke(data.joke);
    } catch (e) {}
  };

  const speakAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.93;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-xl flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <span className="px-3 py-1 rounded-full bg-slate-950/10 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Sparkles className="w-3 h-3" /> Stress Relief & Wellness Playground
          </span>
          <h2 className="text-2xl font-extrabold flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7" /> Mindful Play & Recovery Oasis
          </h2>
          <p className="text-xs font-medium text-slate-900/80 max-w-lg leading-relaxed">
            Unwind with interactive zen ripples, dynamic clinical quotes, stress-popping minigames, and AI humor.
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'playground', label: 'Zen Ripple & Minigame', icon: Gamepad2 },
          { id: 'quotes', label: 'Dynamic Clinical Quotes', icon: Sparkles },
          { id: 'humor', label: 'AI Wellness Smiles', icon: Smile },
          { id: 'breathing', label: 'Box Breathing Pacing', icon: Wind },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                subTab === tab.id ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Zen Ripple & Stress Popper Minigame */}
      {subTab === 'playground' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zen Ripple Canvas with Toggle Button */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold">Sensory Toy</span>
                <h3 className="font-bold text-base text-cyan-300">Zen Ripple Canvas</h3>
              </div>
              <button
                onClick={() => setIsRippleActive(!isRippleActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isRippleActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isRippleActive ? 'Ripples: ON 🟢' : 'Ripples: OFF ⚪'}
              </button>
            </div>

            <div 
              onClick={handleCanvasClick}
              className={`h-52 rounded-2xl border border-slate-800 bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer ${isRippleActive ? 'hover:border-emerald-500' : 'opacity-60'}`}
            >
              {isRippleActive && ripples.map((r) => (
                <span
                  key={r.id}
                  className="absolute w-20 h-20 rounded-full border-2 border-emerald-400/60 bg-emerald-400/20 animate-ping pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: r.x, top: r.y }}
                ></span>
              ))}
              <span className="text-xs text-slate-400 font-medium z-10 text-center px-4">
                {isRippleActive ? 'Click anywhere here for harmonic chimes & ripples' : 'Ripples are currently paused.'}
              </span>
            </div>
          </div>

          {/* Stress Popper Minigame */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" /> Tension Popper Minigame
                </h3>
                <button onClick={resetBubbles} className="text-xs text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer">
                  Reset
                </button>
              </div>
              <p className="text-xs text-slate-600">Click on your current tension bubbles to pop and dissolve them:</p>
              
              <div className="grid grid-cols-2 gap-2.5">
                {stressBubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    onClick={() => popBubble(bubble.id)}
                    disabled={bubble.popped}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                      bubble.popped
                        ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm'
                    }`}
                  >
                    <span>{bubble.text}</span>
                    {bubble.popped ? <CheckCircle2 className="w-4 h-4 text-slate-400" /> : <Sparkles className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-center">
              {stressBubbles.every(b => b.popped) ? '🎉 All tension popped! Great job relaxing.' : 'Pop all bubbles to clear your mental clutter.'}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dynamic Clinical Quotes & Affirmations */}
      {subTab === 'quotes' && (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-xl max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg">Dynamic Clinical & Mindfulness Quotes</h3>
            <p className="text-xs text-slate-600">Fresh restorative perspectives to ground your nervous system.</p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-900 italic leading-relaxed shadow-inner">
            {currentQuote}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={rotateQuote}
              className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all cursor-pointer text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Next Inspiring Quote
            </button>
            <button
              onClick={() => speakAudio(currentQuote)}
              className="px-6 py-3 rounded-2xl bg-slate-100 text-emerald-800 font-bold hover:bg-slate-200 transition-all cursor-pointer text-xs border border-slate-300 inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" /> Listen Aloud
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: AI Wellness Smiles & Humor */}
      {subTab === 'humor' && (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-xl max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Smile className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg">AI Clinical Smile Generator</h3>
            <p className="text-xs text-slate-600">Laughter reduces cortisol and relaxes facial muscle tension instantly.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-left shadow-inner">
            <p className="text-xs font-bold text-slate-900">Q: {joke.setup}</p>
            <p className="text-xs font-extrabold text-emerald-700">A: {joke.punchline}</p>
          </div>

          <button
            onClick={fetchJoke}
            className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all cursor-pointer text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Get Another Wellness Smile
          </button>
        </div>
      )}

      {/* Tab 4: Box Breathing Visualizer */}
      {subTab === 'breathing' && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-xl max-w-xl mx-auto flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-60 h-60">
            <div
              className={`absolute inset-0 rounded-full border-4 border-emerald-500/40 bg-emerald-500/10 transition-all duration-1000 ${
                isBreathingActive && breathingPhase.includes('Inhale')
                  ? 'scale-125 bg-emerald-500/25'
                  : isBreathingActive && breathingPhase.includes('Exhale')
                  ? 'scale-75 bg-emerald-500/5'
                  : 'scale-100'
              }`}
            ></div>
            <div className="z-10 flex flex-col items-center">
              <span className="text-4xl font-black text-emerald-700 font-mono">{isBreathingActive ? countdown : '4-4-4'}</span>
              <span className="text-xs text-slate-600 mt-2 max-w-[150px] font-bold">{breathingPhase}</span>
            </div>
          </div>

          <button
            onClick={() => setIsBreathingActive(!isBreathingActive)}
            className={`px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 cursor-pointer transition-all text-xs ${
              isBreathingActive ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
            }`}
          >
            {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isBreathingActive ? 'Pause Session' : 'Start 4-Step Breathing Pacing'}
          </button>
        </div>
      )}
    </div>
  );
}