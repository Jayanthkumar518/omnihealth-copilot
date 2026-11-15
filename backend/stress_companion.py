'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wind,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Smile,
  Gamepad2,
  Heart,
  RefreshCcw,
  CheckCircle2,
  Zap,
  Droplets,
  Sun,
  Send,
  Star,
  Flower2,
  MessageCircleHeart,
} from 'lucide-react';

// C-Major Pentatonic frequencies (Hz) for harmonious spa wind-chime sounds
const PENTATONIC_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

const COZY_CARD_PAIRS = [
  { key: 'tea', emoji: '🍵', label: 'Warm Chamomile', affirmation: 'Warmth is flowing through you—let your muscles soften.' },
  { key: 'hug', emoji: '🧸', label: 'Gentle Hug', affirmation: 'You are deeply cared for and safe while you heal.' },
  { key: 'hope', emoji: '🌈', label: 'Bright Hope', affirmation: 'Every single breath is carrying you toward stronger days.' },
  { key: 'calm', emoji: '🦋', label: 'Lightness', affirmation: 'Heavy thoughts are floating away like butterflies.' },
  { key: 'sun', emoji: '🌻', label: 'Warm Sunshine', affirmation: 'Gentle energy is recharging your mind and body.' },
  { key: 'love', emoji: '💖', label: 'Self-Kindness', affirmation: 'Treat yourself today the way you would care for a dear friend.' },
];

const buildShuffledDeck = () => {
  const doubled = [...COZY_CARD_PAIRS, ...COZY_CARD_PAIRS].map((item, index) => ({
    ...item,
    uid: `${item.key}-${index}`,
  }));
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled;
};

export default function StressHub() {
  const [subTab, setSubTab] = useState('companion');
  const [comfortStars, setComfortStars] = useState(3);
  const audioCtxRef = useRef(null);

  const awardStar = (count = 1) => {
    setComfortStars((prev) => prev + count);
  };

  // --- SHARED HARMONIOUS WEB AUDIO CHIME ---
  const playSpaChime = useCallback((customFreq = null) => {
    try {
      if (typeof window === 'undefined') return;
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const freq =
        customFreq || PENTATONIC_NOTES[Math.floor(Math.random() * PENTATONIC_NOTES.length)];
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.35);
    } catch {}
  }, []);

  const speakAudio = useCallback((text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.04;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // --- 1. EMPATHETIC AI CARE COMPANION & WORRY CLOUD RELEASE ---
  const [selectedMood, setSelectedMood] = useState('In Pain / Sore');
  const [worryInput, setWorryInput] = useState('');
  const [releasedWorries, setReleasedWorries] = useState([]);
  const [isLoadingCare, setIsLoadingCare] = useState(false);
  const [careResponse, setCareResponse] = useState({
    badge: 'Gentle Body Care',
    soothingWords:
      "I am right here with you. Healing takes tremendous behind-the-scenes energy—please don't rush yourself. You deserve gentleness, comfort, and zero guilt while you recover.",
    microComfort:
      'Unclench your jaw, let your shoulders drop 2 inches away from your ears, and take one slow sip of warm water.',
  });

  const requestCareSupport = async (moodLabel, worryText = '') => {
    setSelectedMood(moodLabel);
    setIsLoadingCare(true);
    playSpaChime(523.25);

    const localFallbacks = {
      'In Pain / Sore': {
        badge: 'Gentle Body Care',
        soothingWords:
          "I hear you, and I am so sorry your body is aching right now. Healing takes tremendous energy—please be extra gentle with yourself today.",
        microComfort:
          'Unclench your jaw, drop your shoulders away from your ears, and take a slow sip of warm water.',
      },
      'Anxious / Worried': {
        badge: 'Safe Harbor',
        soothingWords:
          'It is completely understandable to feel worried. Right here in this exact moment, you are safe and cared for. One tiny breath at a time is plenty.',
        microComfort: 'Place one warm hand over your heart and exhale slowly for 4 counts.',
      },
      'Tired & Drained': {
        badge: 'Deep Recharge',
        soothingWords:
          'Fatigue during recovery is your body asking for quiet repair time. Rest is active medicine—let the world wait while you recharge.',
        microComfort: 'Close your eyes for 15 seconds and soften the muscles around your eyes.',
      },
      'Lonely / Discouraged': {
        badge: 'Warm Connection',
        soothingWords:
          'Recovery can feel quiet and heavy, and it is okay to feel discouraged sometimes. Even on slow days, your body is mending. You are never alone.',
        microComfort: 'Wrap your arms around your shoulders for a comforting 5-second self-hug.',
      },
      'Feeling Hopeful': {
        badge: 'Radiant Momentum',
        soothingWords:
          'Look at that spark of resilience in you! Celebrating even small steps forward releases endorphins that support your recovery.',
        microComfort: 'Take a deep celebratory breath and smile softly at how far you have come.',
      },
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/stress-playground/care-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: moodLabel, worryText }),
      });
      const data = await res.json();
      if (data.success) {
        setCareResponse({
          badge: data.badge,
          soothingWords: data.soothingWords,
          microComfort: data.microComfort,
        });
      } else {
        setCareResponse(localFallbacks[moodLabel] || localFallbacks['Anxious / Worried']);
      }
    } catch {
      setCareResponse(localFallbacks[moodLabel] || localFallbacks['Anxious / Worried']);
    } finally {
      setIsLoadingCare(false);
      awardStar(1);
    }
  };

  const handleReleaseWorry = async (e) => {
    e.preventDefault();
    const trimmed = worryInput.trim();
    if (!trimmed) return;

    const cloudItem = { id: Date.now(), text: trimmed };
    setReleasedWorries((prev) => [cloudItem, ...prev.slice(0, 4)]);
    setWorryInput('');
    playSpaChime(659.25);

    await requestCareSupport(selectedMood, trimmed);
    setTimeout(() => {
      setReleasedWorries((prev) => prev.filter((item) => item.id !== cloudItem.id));
    }, 5500);
  };

  // --- 2. COLORFUL & FUNNY BOX BREATHING PACING ---
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Ready to chill? 🧘‍♂️');
  const [countdown, setCountdown] = useState(4);
  const [breathingThemeColor, setBreathingThemeColor] = useState('from-emerald-400 to-teal-500');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isBreathingActive) {
      clearInterval(timerRef.current);
      setBreathingPhase('Ready to chill? 🧘‍♂️');
      setCountdown(4);
      setBreathingThemeColor('from-emerald-400 to-teal-500');
      return;
    }

    const phases = [
      {
        name: 'Inhale deeply... smell the warm cookies! 🍪',
        color: 'from-cyan-400 to-blue-500',
        freq: 392.0,
        duration: 4,
      },
      {
        name: 'Hold it... keep it together! 🤫',
        color: 'from-amber-400 to-orange-500',
        freq: 440.0,
        duration: 4,
      },
      {
        name: 'Exhale slowly... let the drama go! 💨',
        color: 'from-emerald-400 to-teal-500',
        freq: 329.63,
        duration: 4,
      },
      {
        name: 'Hold empty... pure Zen mode 🧘‍♀️',
        color: 'from-purple-400 to-indigo-500',
        freq: 261.63,
        duration: 4,
      },
    ];

    let phaseIdx = 0;
    let timeLeft = phases[phaseIdx].duration;
    setBreathingPhase(phases[phaseIdx].name);
    setBreathingThemeColor(phases[phaseIdx].color);
    setCountdown(timeLeft);
    playSpaChime(phases[phaseIdx].freq);

    timerRef.current = setInterval(() => {
      timeLeft--;
      if (timeLeft < 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        timeLeft = phases[phaseIdx].duration;
        setBreathingPhase(phases[phaseIdx].name);
        setBreathingThemeColor(phases[phaseIdx].color);
        playSpaChime(phases[phaseIdx].freq);
        if (phaseIdx === 0) awardStar(1);
      }
      setCountdown(timeLeft);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isBreathingActive, playSpaChime]);

  // --- 3. ZEN RIPPLE CANVAS (WITH ON/OFF TOGGLE) ---
  const [isRippleActive, setIsRippleActive] = useState(true);
  const [ripples, setRipples] = useState([]);

  const handleCanvasClick = (e) => {
    if (!isRippleActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { id: Date.now() + Math.random(), x, y };
    setRipples((prev) => [...prev.slice(-12), newRipple]);
    playSpaChime();
  };

  // --- 4. CONTEXTUAL STRESS POPPER MINIGAME ---
  const initialBubbles = [
    {
      id: 1,
      text: 'Deadline Anxiety',
      quote: "Take a breath. Rome wasn't built in a day, and neither is your recovery!",
      popped: false,
    },
    {
      id: 2,
      text: 'Muscle Tension',
      quote: 'Drop your shoulders away from your ears and unclench your jaw right now!',
      popped: false,
    },
    {
      id: 3,
      text: 'Overthinking',
      quote: 'Not every thought is a fact. Let that mental clutter float away like a cloud.',
      popped: false,
    },
    {
      id: 4,
      text: 'Digital Fatigue',
      quote: 'Step away from the screen, look at something 20 feet away, and blink gently!',
      popped: false,
    },
    {
      id: 5,
      text: 'Hospital Jitters',
      quote: 'You are in safe, caring hands. Focus only on this single calm breath.',
      popped: false,
    },
    {
      id: 6,
      text: 'Body Soreness',
      quote: 'Your body is working hard to repair itself. Send gratitude to where it aches.',
      popped: false,
    },
  ];

  const [stressBubbles, setStressBubbles] = useState(initialBubbles);
  const [poppedMessage, setPoppedMessage] = useState(
    'Tap any tension bubble above to pop it and unlock tailored soothing advice!'
  );

  const popBubble = (id) => {
    setStressBubbles((prev) =>
      prev.map((b) => {
        if (b.id === id && !b.popped) {
          setPoppedMessage(`✨ ${b.text} Popped: "${b.quote}"`);
          playSpaChime(587.33);
          speakAudio(b.quote);
          awardStar(1);
          return { ...b, popped: true };
        }
        return b;
      })
    );
  };

  const resetBubbles = () => {
    setStressBubbles(initialBubbles);
    setPoppedMessage('Tap any tension bubble above to pop it and unlock tailored soothing advice!');
  };

  // --- 5. CARE & GRATITUDE GARDEN MINI-GAME ---
  const [gardenCarePoints, setGardenCarePoints] = useState(1);
  const [gardenMessage, setGardenMessage] = useState(
    'Give your recovery sprout water, warm sunshine, or kind words to help it bloom!'
  );

  const nurturePlant = (actionType) => {
    playSpaChime(actionType === 'water' ? 440 : actionType === 'sun' ? 523.25 : 659.25);
    awardStar(1);
    setGardenCarePoints((prev) => {
      const next = prev + 1;
      if (actionType === 'water') {
        setGardenMessage('💧 Pure hydration! Just like this sprout, every sip of water helps your body heal.');
      } else if (actionType === 'sun') {
        setGardenMessage('☀️ Warm sunshine! May gentle warmth melt away tension from your shoulders.');
      } else {
        setGardenMessage('💖 Kind words spoken! Self-compassion is the richest soil for recovery.');
      }
      return next;
    });
  };

  const getPlantStage = () => {
    if (gardenCarePoints >= 10) {
      return {
        emoji: '🌻',
        title: 'Radiant Recovery Sunflower (Level 4)',
        subtitle: 'In full, joyful bloom! Your patience and care are shining.',
      };
    }
    if (gardenCarePoints >= 6) {
      return {
        emoji: '🪷',
        title: 'Peaceful Healing Lotus (Level 3)',
        subtitle: 'Opening petal by petal with calm resilience.',
      };
    }
    if (gardenCarePoints >= 3) {
      return {
        emoji: '🌿',
        title: 'Growing Wellness Sprout (Level 2)',
        subtitle: 'Strong roots are forming beneath the surface!',
      };
    }
    return {
      emoji: '🌱',
      title: 'Tender Recovery Seedling (Level 1)',
      subtitle: 'Small beginnings lead to wonderful healing.',
    };
  };

  // --- 6. COZY COMFORT CARD MEMORY MATCH MINI-GAME ---
  const [cards, setCards] = useState(() => buildShuffledDeck());
  const [flippedUids, setFlippedUids] = useState([]);
  const [matchedKeys, setMatchedKeys] = useState([]);
  const [matchBanner, setMatchBanner] = useState(
    'Flip two cozy cards to match healing comforts!'
  );

  const handleCardFlip = (card) => {
    if (
      flippedUids.length === 2 ||
      flippedUids.includes(card.uid) ||
      matchedKeys.includes(card.key)
    ) {
      return;
    }

    playSpaChime(392.0);
    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      const firstCard = cards.find((c) => c.uid === nextFlipped[0]);
      if (firstCard && firstCard.key === card.key) {
        setMatchedKeys((prev) => [...prev, card.key]);
        setMatchBanner(`${card.emoji} ${card.label} Matched! "${card.affirmation}"`);
        playSpaChime(659.25);
        awardStar(2);
        setFlippedUids([]);
      } else {
        setTimeout(() => setFlippedUids([]), 850);
      }
    }
  };

  const resetMemoryGame = () => {
    setCards(buildShuffledDeck());
    setFlippedUids([]);
    setMatchedKeys([]);
    setMatchBanner('Fresh cozy deck ready—flip two cards to find a match!');
  };

  // --- 7. DYNAMIC CLINICAL QUOTES ---
  const soothingQuotes = [
    '“The time to relax is when you don’t have time for it.” — Sydney J. Harris',
    '“You don’t have to see the whole staircase, just take the first step.” — Martin Luther King Jr.',
    '“Peace comes from within. Do not seek it without.” — Buddha',
    '“Deep breathing is our nervous system’s love language.” — Clinical Wellness Proverb',
    '“Your body holds deep wisdom. Trust your ability to heal, reset, and recover.”',
    '“Almost everything will work again if you unplug it for a few minutes, including you.” — Anne Lamott',
  ];
  const [currentQuote, setCurrentQuote] = useState(soothingQuotes[0]);

  const rotateQuote = () => {
    const randomQuote = soothingQuotes[Math.floor(Math.random() * soothingQuotes.length)];
    setCurrentQuote(randomQuote);
    playSpaChime(440);
    speakAudio(randomQuote);
  };

  // --- 8. PLAYFUL AI WELLNESS SMILES & JOKES ---
  const fallbackJokes = [
    {
      emoji: '🩺',
      setup: 'Why did the stethoscope blush?',
      punchline: 'Because it heard the heart skipping a joyful beat! 💓',
    },
    {
      emoji: '💻',
      setup: 'Why did the microchip go to therapy?',
      punchline: 'It had too many emotional bytes and needed to decompress! 🧘‍♂️',
    },
    {
      emoji: '💧',
      setup: 'Why did the water molecule break up with the soda?',
      punchline: 'It realized it needed pure hydration, not artificial effervescence! ✨',
    },
    {
      emoji: '🌿',
      setup: 'What did the deep breath say to the anxious thought?',
      punchline: "'You're welcome to visit, but you don't live here!' 🍃",
    },
    {
      emoji: '🧸',
      setup: "What is a doctor's favorite kind of music during recovery?",
      punchline: 'Anything with a steady, healthy beet! 🥕🎶',
    },
  ];
  const [activeJoke, setActiveJoke] = useState(fallbackJokes[0]);
  const [revealPunchline, setRevealPunchline] = useState(false);

  const nextJoke = async () => {
    setRevealPunchline(false);
    playSpaChime(523.25);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/stress-playground/joke');
      const data = await res.json();
      if (data.success && data.joke) {
        setActiveJoke({
          emoji: data.joke.emoji || '😊',
          setup: data.joke.setup,
          punchline: data.joke.punchline,
        });
        return;
      }
    } catch {}
    const nextFallback =
      fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
    setActiveJoke(nextFallback);
  };

  const plantStage = getPlantStage();

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Warm & Joyful Top Banner */}
      <div className="p-7 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <span className="px-3 py-1 rounded-full bg-slate-950/15 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Module 5: Empathetic Care & Joyful Recovery Playground
          </span>
          <h2 className="text-2xl font-extrabold flex items-center gap-2.5">
            <Heart className="w-7 h-7 fill-rose-600 text-rose-700" /> Mindful Play, Warm Care & Healing Oasis
          </h2>
          <p className="text-xs font-semibold text-slate-950/85 max-w-xl leading-relaxed">
            A comforting space built to care for your heart and body during recovery—with an empathetic AI Care Companion, cozy mini-games, zen chimes, clinical humor, and colorful breathing.
          </p>
        </div>

        {/* Comfort Stars Pill */}
        <div className="z-10 px-5 py-3.5 rounded-2xl bg-white/90 backdrop-blur border border-white shadow-md flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Self-Care Stars Earned
            </div>
            <div className="text-xl font-black text-slate-900">{comfortStars} Stars ✨</div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
        {[
          { id: 'companion', label: 'Empathetic Care Buddy 💛', icon: MessageCircleHeart },
          { id: 'playground', label: 'Zen Ripples & Stress Popper', icon: Gamepad2 },
          { id: 'cozygames', label: 'Care Garden & Cozy Match 🌻', icon: Flower2 },
          { id: 'humor', label: 'AI Wellness Smiles 😂', icon: Smile },
          { id: 'breathing', label: 'Colorful Breathing 🌈', icon: Wind },
          { id: 'quotes', label: 'Soothing Quotes ✨', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EMPATHETIC AI CARE COMPANION & WORRY CLOUD RELEASER */}
      {subTab === 'companion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 cols: Compassionate Check-In */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                Personalized Emotional Support
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                How is your heart and body feeling right now?
              </h3>
              <p className="text-xs text-slate-600">
                Tap the feeling that matches you best—there is no right or wrong answer during recovery.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: 'In Pain / Sore', emoji: '🩹' },
                { label: 'Anxious / Worried', emoji: '🌧️' },
                { label: 'Tired & Drained', emoji: '🔋' },
                { label: 'Lonely / Discouraged', emoji: '🫂' },
                { label: 'Feeling Hopeful', emoji: '🌤️' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => requestCareSupport(item.label)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    selectedMood === item.label
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span>{item.emoji}</span> {item.label}
                </button>
              ))}
            </div>

            {/* Empathetic Care Response Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase">
                  {careResponse.badge}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    speakAudio(`${careResponse.soothingWords} ${careResponse.microComfort}`)
                  }
                  className="px-3 py-1 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> Listen to Care Note
                </button>
              </div>

              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                {isLoadingCare ? 'Preparing a warm note just for you...' : careResponse.soothingWords}
              </p>

              <div className="p-3 rounded-xl bg-white/90 border border-emerald-200 text-xs text-emerald-950">
                <strong>Tiny Micro-Comfort For You:</strong> {careResponse.microComfort}
              </div>
            </div>
          </div>

          {/* Right 5 cols: Worry Cloud Releaser */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border border-indigo-900/50 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
                Interactive Emotional Release
              </span>
              <h3 className="text-base font-extrabold text-white">
                ☁️ Worry Cloud Releaser
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Type any fear, pain frustration, or heavy thought below and send it up into the sky to dissolve it.
              </p>
            </div>

            <form onSubmit={handleReleaseWorry} className="space-y-3">
              <textarea
                rows={3}
                value={worryInput}
                onChange={(e) => setWorryInput(e.target.value)}
                placeholder="e.g., I'm worried my recovery is taking too long..."
                className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Send className="w-4 h-4" /> Release Worry into the Sky ✨
              </button>
            </form>

            <div className="min-h-[84px] space-y-2">
              {releasedWorries.length > 0 ? (
                releasedWorries.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/10 border border-cyan-400/30 text-xs text-cyan-200 flex items-center justify-between animate-pulse"
                  >
                    <span className="truncate">☁️ Dissolving: “{item.text}”</span>
                    <span className="text-[10px] font-bold text-emerald-300 shrink-0 ml-2">
                      Letting go ✨
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400 text-center">
                  Your sky is clear. Whenever a worry feels heavy, hand it over here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZEN RIPPLE CANVAS (WITH ON/OFF TOGGLE) & CONTEXTUAL STRESS POPPER */}
      {subTab === 'playground' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zen Ripple Canvas */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold">
                  Pentatonic Spa Sensory Toy
                </span>
                <h3 className="font-bold text-base text-cyan-300">Zen Garden Ripple Canvas</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRippleActive(!isRippleActive)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isRippleActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isRippleActive ? 'Ripples: ON 🟢' : 'Ripples: OFF ⚪'}
              </button>
            </div>

            <div
              onClick={handleCanvasClick}
              className={`h-56 rounded-2xl border border-slate-800 bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer transition-all ${
                isRippleActive ? 'hover:border-emerald-500' : 'opacity-60'
              }`}
            >
              {isRippleActive &&
                ripples.map((r) => (
                  <span
                    key={r.id}
                    className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/70 bg-cyan-400/20 animate-ping pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: r.x, top: r.y }}
                  />
                ))}
              <span className="text-xs text-slate-300 font-medium z-10 text-center px-6 pointer-events-none">
                {isRippleActive
                  ? 'Tap anywhere inside the water to play soothing wind-chime notes & ripples'
                  : 'Ripples are paused. Click "Ripples: OFF" above to resume.'}
              </span>
            </div>
          </div>

          {/* Contextual Tension Popper Minigame */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" /> Contextual Tension Popper Minigame
                </h3>
                <button
                  type="button"
                  onClick={resetBubbles}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                >
                  Reset Bubbles
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Pop any stressor bubble to hear & read comforting advice tailored directly to it:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {stressBubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    type="button"
                    onClick={() => popBubble(bubble.id)}
                    disabled={bubble.popped}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                      bubble.popped
                        ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 shadow-sm'
                    }`}
                  >
                    <span>{bubble.text}</span>
                    {bubble.popped ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-semibold text-center">
              {poppedMessage}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CARE & GRATITUDE GARDEN + COZY CARD MATCH */}
      {subTab === 'cozygames' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mini-Game A: Care & Gratitude Garden */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border border-emerald-200 shadow-xl flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                Nurture & Heal Mini-Game
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                🌱 Care & Gratitude Recovery Garden
              </h3>
              <p className="text-xs text-slate-600">
                Care for your virtual recovery plant the same gentle way you care for yourself.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-emerald-200 text-center space-y-2 shadow-inner">
              <div className="text-6xl animate-bounce py-2">{plantStage.emoji}</div>
              <div className="text-sm font-extrabold text-slate-900">{plantStage.title}</div>
              <div className="text-xs text-slate-600">{plantStage.subtitle}</div>
              <div className="text-[11px] font-bold text-emerald-700 pt-1">
                Care Actions Given: {gardenCarePoints}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => nurturePlant('water')}
                className="py-2.5 px-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Droplets className="w-4 h-4" /> Water
              </button>
              <button
                type="button"
                onClick={() => nurturePlant('sun')}
                className="py-2.5 px-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sun className="w-4 h-4" /> Sunshine
              </button>
              <button
                type="button"
                onClick={() => nurturePlant('love')}
                className="py-2.5 px-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-4 h-4" /> Kindness
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-950 font-medium text-center">
              {gardenMessage}
            </div>
          </div>

          {/* Mini-Game B: Cozy Comfort Card Match */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                  Mindful Focus Mini-Game
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  🧸 Cozy Comfort Card Match
                </h3>
              </div>
              <button
                type="button"
                onClick={resetMemoryGame}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Shuffle Deck
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {cards.map((card) => {
                const isFaceUp =
                  flippedUids.includes(card.uid) || matchedKeys.includes(card.key);
                const isMatched = matchedKeys.includes(card.key);
                return (
                  <button
                    key={card.uid}
                    type="button"
                    onClick={() => handleCardFlip(card)}
                    className={`h-20 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isMatched
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 scale-95'
                        : isFaceUp
                        ? 'bg-amber-50 border-amber-300 text-slate-900'
                        : 'bg-gradient-to-br from-indigo-500 to-teal-500 border-indigo-400 text-white hover:opacity-95'
                    }`}
                  >
                    {isFaceUp ? (
                      <>
                        <span className="text-2xl">{card.emoji}</span>
                        <span className="text-[9px] mt-1 font-extrabold">{card.label}</span>
                      </>
                    ) : (
                      <Sparkles className="w-5 h-5 text-white/85" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 font-semibold text-center">
              {matchedKeys.length === COZY_CARD_PAIRS.length
                ? '🎉 All Cozy Comforts Matched! You earned bonus recovery calm!'
                : matchBanner}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PLAYFUL AI WELLNESS SMILES & JOKES */}
      {subTab === 'humor' && (
        <div className="p-9 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-xl max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
            {activeJoke.emoji}
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-slate-900 text-lg">
              AI Wellness Smiles & Clinical Humor ✨
            </h3>
            <p className="text-xs text-slate-600">
              Genuine laughter releases endorphins, lowers cortisol, and eases muscle tension instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-4">
            <p className="text-sm font-extrabold text-slate-900">“{activeJoke.setup}”</p>

            {revealPunchline ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-black text-sm shadow-sm">
                  {activeJoke.punchline}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSpaChime(659.25);
                      awardStar(1);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer"
                  >
                    😂 Needed that! (+1 Star)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSpaChime(523.25);
                      awardStar(1);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold cursor-pointer"
                  >
                    🥹 Heartwarming (+1 Star)
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRevealPunchline(true);
                  playSpaChime(587.33);
                  speakAudio(activeJoke.punchline);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
              >
                Tap to Reveal Punchline 🎁
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={nextJoke}
            className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all cursor-pointer text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Next Wellness Smile 😂
          </button>
        </div>
      )}

      {/* TAB 5: COLORFUL & FUNNY BOX BREATHING VISUALIZER */}
      {subTab === 'breathing' && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-xl max-w-xl mx-auto flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-64 h-64">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${breathingThemeColor} opacity-35 blur-xl transition-all duration-1000 ${
                isBreathingActive && breathingPhase.includes('Inhale')
                  ? 'scale-125 opacity-55'
                  : isBreathingActive && breathingPhase.includes('Exhale')
                  ? 'scale-75 opacity-20'
                  : 'scale-100'
              }`}
            />
            <div
              className={`absolute inset-4 rounded-full bg-gradient-to-br ${breathingThemeColor} opacity-25 transition-all duration-1000`}
            />
            <div className="z-10 flex flex-col items-center p-4">
              <span className="text-4xl font-black text-slate-900 font-mono">
                {isBreathingActive ? countdown : '✨'}
              </span>
              <span className="text-xs text-slate-900 mt-2 max-w-[190px] font-extrabold leading-snug">
                {breathingPhase}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBreathingActive(!isBreathingActive)}
            className={`px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 cursor-pointer transition-all text-xs ${
              isBreathingActive
                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
            }`}
          >
            {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isBreathingActive ? 'Pause Session' : 'Start Colorful Breathing Pacing 🌈'}
          </button>
        </div>
      )}

      {/* TAB 6: DYNAMIC CLINICAL & MINDFULNESS QUOTES */}
      {subTab === 'quotes' && (
        <div className="p-9 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-xl max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-slate-900 text-lg">
              Dynamic Clinical & Mindfulness Quotes
            </h3>
            <p className="text-xs text-slate-600">
              Restorative words to ground your nervous system and remind you how supported you are.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-950 italic leading-relaxed">
            {currentQuote}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={rotateQuote}
              className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all cursor-pointer text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Next Inspiring Quote
            </button>
            <button
              type="button"
              onClick={() => speakAudio(currentQuote)}
              className="px-6 py-3 rounded-2xl bg-slate-100 text-emerald-900 font-bold hover:bg-slate-200 transition-all cursor-pointer text-xs border border-slate-300 inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" /> Listen Aloud
            </button>
          </div>
        </div>
      )}
    </div>
  );
}