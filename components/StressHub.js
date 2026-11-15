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
  Trophy,
  Flower2,
  MessageCircleHeart,
  Music,
  Flame,
  Shield,
} from 'lucide-react';

// C-Major Pentatonic frequencies (Hz) for harmonious spa chimes
const PENTATONIC_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

const COZY_CARD_PAIRS = [
  { key: 'tea', emoji: '🍵', label: 'Warm Tea', affirmation: 'Warmth is relaxing every tight muscle.' },
  { key: 'hug', emoji: '🧸', label: 'Cozy Hug', affirmation: 'You are deeply cared for and safe.' },
  { key: 'hope', emoji: '🌈', label: 'Bright Hope', affirmation: 'Every breath carries you toward stronger days.' },
  { key: 'calm', emoji: '🦋', label: 'Lightness', affirmation: 'Heavy worries are floating away like butterflies.' },
  { key: 'sun', emoji: '🌻', label: 'Sunshine', affirmation: 'Golden energy is recharging your body.' },
  { key: 'love', emoji: '💖', label: 'Self-Love', affirmation: 'Treat yourself with the kindness you give others.' },
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

const RECOVERY_LEVELS = [
  { minXp: 0, title: 'Level 1: Brave Beginner 🌱', color: 'from-emerald-400 to-teal-500' },
  { minXp: 50, title: 'Level 2: Steady Healer 🌿', color: 'from-teal-400 to-cyan-500' },
  { minXp: 120, title: 'Level 3: Calm Warrior 🦋', color: 'from-cyan-400 to-indigo-500' },
  { minXp: 220, title: 'Level 4: Joyful Phoenix 🌈', color: 'from-amber-400 to-rose-500' },
  { minXp: 350, title: 'Level 5: Radiant Champion 👑', color: 'from-fuchsia-500 to-amber-400' },
];

export default function StressHub() {
  const [subTab, setSubTab] = useState('arcade');
  const [healingXp, setHealingXp] = useState(35);
  const [celebrationBurst, setCelebrationBurst] = useState(null);
  const audioCtxRef = useRef(null);

  // Ambient Soundscape State ('off' | 'spa' | 'rain')
  const [ambientMode, setAmbientMode] = useState('off');
  const ambientNodesRef = useRef([]);

  const addHealingXp = useCallback((points, reasonText = '') => {
    setHealingXp((prev) => prev + points);
    if (reasonText) {
      setCelebrationBurst(`+${points} XP • ${reasonText}`);
      setTimeout(() => setCelebrationBurst(null), 2200);
    }
  }, []);

  const getAudioCtx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // --- HARMONIOUS CHIME & POP SOUND FX ---
  const playChime = useCallback(
    (customFreq = null, type = 'sine') => {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const freq =
          customFreq || PENTATONIC_NOTES[Math.floor(Math.random() * PENTATONIC_NOTES.length)];
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.09, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.15);
      } catch {}
    },
    [getAudioCtx]
  );

  // --- AMBIENT LOUNGE SOUNDSCAPE ---
  const stopAmbientNodes = useCallback(() => {
    ambientNodesRef.current.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {}
    });
    ambientNodesRef.current = [];
  }, []);

  const toggleAmbientSound = (mode) => {
    stopAmbientNodes();
    if (ambientMode === mode || mode === 'off') {
      setAmbientMode('off');
      return;
    }

    const ctx = getAudioCtx();
    if (!ctx) return;

    if (mode === 'spa') {
      // Warm 432Hz + 648Hz fifth harmonic drone
      [216, 324, 432].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.018, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        ambientNodesRef.current.push(osc, gain);
      });
    } else if (mode === 'rain') {
      // Soft filtered pink-noise rain
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0,
        b1 = 0,
        b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.025;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 480;
      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start();
      ambientNodesRef.current.push(noise, filter);
    }
    setAmbientMode(mode);
  };

  useEffect(() => {
    return () => stopAmbientNodes();
  }, [stopAmbientNodes]);

  const speakAudio = useCallback((text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.94;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // =========================================================================
  // 1. RECOVERY ORB CATCHER ARCADE GAME (INTERACTIVE CANVAS)
  // =========================================================================
  const arcadeCanvasRef = useRef(null);
  const [isArcadePlaying, setIsArcadePlaying] = useState(false);
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeCombo, setArcadeCombo] = useState(0);
  const [arcadeTimeLeft, setArcadeTimeLeft] = useState(45);
  const [arcadeBestScore, setArcadeBestScore] = useState(0);
  const [arcadeStatusMsg, setArcadeStatusMsg] = useState(
    'Catch Hydration 💧, Sleep 🌙 & Vitamins 🍊 while dodging Stress Sparks ⚡!'
  );

  const arcadeStateRef = useRef({
    basketX: 240,
    items: [],
    particles: [],
    score: 0,
    combo: 0,
    lastSpawn: 0,
    animId: null,
  });

  const startArcadeGame = () => {
    getAudioCtx();
    setArcadeScore(0);
    setArcadeCombo(0);
    setArcadeTimeLeft(45);
    setArcadeStatusMsg('Move your mouse or finger across the arena to catch healing boosts!');
    arcadeStateRef.current = {
      basketX: 250,
      items: [],
      particles: [],
      score: 0,
      combo: 0,
      lastSpawn: performance.now(),
      animId: null,
    };
    setIsArcadePlaying(true);
  };

  useEffect(() => {
    if (!isArcadePlaying) return;

    const countdownInterval = setInterval(() => {
      setArcadeTimeLeft((prev) => {
        if (prev <= 1) {
          setIsArcadePlaying(false);
          const finalScore = arcadeStateRef.current.score;
          setArcadeBestScore((b) => Math.max(b, finalScore));
          if (finalScore > 0) {
            addHealingXp(Math.max(15, Math.round(finalScore / 5)), 'Arcade Victory!');
          }
          setArcadeStatusMsg(
            `🎉 Round Complete! You collected ${finalScore} Healing Points! Play again to beat your record.`
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const GOOD_TYPES = [
      { emoji: '💧', label: '+10 Hydration', pts: 10, good: true },
      { emoji: '🍊', label: '+15 Vitamin C', pts: 15, good: true },
      { emoji: '🌙', label: '+20 Deep Rest', pts: 20, good: true },
      { emoji: '💖', label: '+25 Self-Care', pts: 25, good: true },
    ];
    const BAD_TYPE = { emoji: '⚡', label: 'Stress Spark!', pts: -15, good: false };

    const loop = (now) => {
      const canvas = arcadeCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      const st = arcadeStateRef.current;

      // Spawn items every 620ms
      if (now - st.lastSpawn > 620) {
        st.lastSpawn = now;
        const isBad = Math.random() < 0.24;
        const template = isBad
          ? BAD_TYPE
          : GOOD_TYPES[Math.floor(Math.random() * GOOD_TYPES.length)];
        st.items.push({
          ...template,
          x: 30 + Math.random() * (W - 60),
          y: -20,
          speed: 2.3 + Math.random() * 1.8,
        });
      }

      // Draw Cozy Night-Sky Gradient Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle glowing stars
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.arc((i * 73) % W, (i * 41) % (H - 40), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Healing Shield Basket
      const basketW = 86;
      const basketH = 18;
      const basketY = H - 32;
      ctx.save();
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(st.basketX - basketW / 2, basketY, basketW, basketH, 9);
      ctx.fill();
      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HEALING SHIELD', st.basketX, basketY + 12.5);
      ctx.restore();

      // Update & Draw Falling Orbs
      ctx.font = '24px system-ui, sans-serif';
      ctx.textAlign = 'center';

      const remaining = [];
      for (const item of st.items) {
        item.y += item.speed;

        // Collision check with basket
        if (
          item.y >= basketY - 12 &&
          item.y <= basketY + basketH + 10 &&
          Math.abs(item.x - st.basketX) <= basketW / 2 + 14
        ) {
          if (item.good) {
            st.combo += 1;
            const bonus = item.pts + Math.min(20, st.combo * 2);
            st.score += bonus;
            playChime(PENTATONIC_NOTES[st.combo % PENTATONIC_NOTES.length]);
            st.particles.push({
              x: item.x,
              y: basketY - 14,
              text: `+${bonus}`,
              color: '#34d399',
              alpha: 1,
            });
          } else {
            st.combo = 0;
            st.score = Math.max(0, st.score - 15);
            playChime(196, 'sawtooth');
            st.particles.push({
              x: item.x,
              y: basketY - 14,
              text: 'Dodged late! -15',
              color: '#fb7185',
              alpha: 1,
            });
          }
          setArcadeScore(st.score);
          setArcadeCombo(st.combo);
          continue;
        }

        if (item.y < H + 25) {
          ctx.fillText(item.emoji, item.x, item.y);
          remaining.push(item);
        }
      }
      st.items = remaining;

      // Floating Score Popups
      ctx.font = 'bold 13px system-ui, sans-serif';
      const activeParticles = [];
      for (const p of st.particles) {
        p.y -= 1.2;
        p.alpha -= 0.025;
        if (p.alpha > 0) {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x, p.y);
          ctx.globalAlpha = 1;
          activeParticles.push(p);
        }
      }
      st.particles = activeParticles;

      st.animId = requestAnimationFrame(loop);
    };

    arcadeStateRef.current.animId = requestAnimationFrame(loop);

    return () => {
      clearInterval(countdownInterval);
      if (arcadeStateRef.current.animId) {
        cancelAnimationFrame(arcadeStateRef.current.animId);
      }
    };
  }, [isArcadePlaying, addHealingXp, playChime]);

  const handleArcadePointerMove = (e) => {
    const canvas = arcadeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const relX = ((clientX - rect.left) / rect.width) * canvas.width;
    arcadeStateRef.current.basketX = Math.max(46, Math.min(canvas.width - 46, relX));
  };

  // =========================================================================
  // 2. EMPATHETIC AI CARE BUDDY & WORRY CLOUD RELEASER
  // =========================================================================
  const [selectedMood, setSelectedMood] = useState('In Pain / Sore');
  const [worryInput, setWorryInput] = useState('');
  const [releasedWorries, setReleasedWorries] = useState([]);
  const [isLoadingCare, setIsLoadingCare] = useState(false);
  const [careResponse, setCareResponse] = useState({
    badge: 'Gentle Body Care',
    soothingWords:
      "I am right here with you. Healing takes tremendous behind-the-scenes energy—please don't rush yourself. You deserve warmth, comfort, and zero guilt while you recover.",
    microComfort:
      'Unclench your jaw, let your shoulders drop 2 inches away from your ears, and take one slow sip of warm water.',
  });

  const requestCareSupport = async (moodLabel, worryText = '') => {
    setSelectedMood(moodLabel);
    setIsLoadingCare(true);
    playChime(523.25);

    const localFallbacks = {
      'In Pain / Sore': {
        badge: 'Gentle Body Care',
        soothingWords:
          'I hear you, and I am so sorry your body is aching right now. Healing takes huge energy—please be extra gentle with yourself today.',
        microComfort: 'Unclench your jaw, drop your shoulders, and take a slow sip of warm water.',
      },
      'Anxious / Worried': {
        badge: 'Safe Harbor',
        soothingWords:
          'It makes complete sense to feel worried. Right here in this exact moment, you are safe and cared for. One tiny breath at a time is plenty.',
        microComfort: 'Place one warm hand over your heart and exhale slowly for 4 counts.',
      },
      'Tired & Drained': {
        badge: 'Deep Recharge',
        soothingWords:
          'Fatigue during recovery is your body asking for quiet repair time. Rest is active medicine—let the world wait while you recharge.',
        microComfort: 'Close your eyes for 15 seconds and soften the muscles around your forehead.',
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
          'Look at that spark of resilience in you! Celebrating even small steps forward releases endorphins that actively support your recovery.',
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
      addHealingXp(10, 'Self-Compassion Check-In');
    }
  };

  const handleReleaseWorry = async (e) => {
    e.preventDefault();
    const trimmed = worryInput.trim();
    if (!trimmed) return;
    const cloudItem = { id: Date.now(), text: trimmed };
    setReleasedWorries((prev) => [cloudItem, ...prev.slice(0, 4)]);
    setWorryInput('');
    playChime(659.25);
    await requestCareSupport(selectedMood, trimmed);
    setTimeout(() => {
      setReleasedWorries((prev) => prev.filter((item) => item.id !== cloudItem.id));
    }, 5500);
  };

  // =========================================================================
  // 3. ZEN RIPPLE POND & CONTEXTUAL TENSION POPPER
  // =========================================================================
  const [isRippleActive, setIsRippleActive] = useState(true);
  const [ripples, setRipples] = useState([]);

  const handleCanvasClick = (e) => {
    if (!isRippleActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples((prev) => [...prev.slice(-12), { id: Date.now() + Math.random(), x, y }]);
    playChime();
  };

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
    'Pop any tension bubble above to shatter it and hear tailored soothing advice!'
  );

  const popBubble = (id) => {
    setStressBubbles((prev) =>
      prev.map((b) => {
        if (b.id === id && !b.popped) {
          setPoppedMessage(`💥 ${b.text} Shattered: "${b.quote}"`);
          playChime(587.33);
          speakAudio(b.quote);
          addHealingXp(8, `Released ${b.text}`);
          return { ...b, popped: true };
        }
        return b;
      })
    );
  };

  const resetBubbles = () => {
    setStressBubbles(initialBubbles);
    setPoppedMessage('Fresh tension bubbles ready—tap one to pop it!');
  };

  // =========================================================================
  // 4. CARE GARDEN & COZY MEMORY MATCH
  // =========================================================================
  const [gardenCarePoints, setGardenCarePoints] = useState(2);
  const [gardenMessage, setGardenMessage] = useState(
    'Nurture your recovery sprout with water, sunlight, or kind words!'
  );

  const nurturePlant = (actionType) => {
    playChime(actionType === 'water' ? 440 : actionType === 'sun' ? 523.25 : 659.25);
    addHealingXp(10, 'Nurtured Recovery Garden');
    setGardenCarePoints((prev) => prev + 1);
    if (actionType === 'water') {
      setGardenMessage('💧 Pure hydration! Every sip of water helps your cells repair and thrive.');
    } else if (actionType === 'sun') {
      setGardenMessage('☀️ Warm sunshine! May gentle warmth melt tension out of your body.');
    } else {
      setGardenMessage('💖 Kind words! Self-compassion is the richest soil for fast healing.');
    }
  };

  const plantStage =
    gardenCarePoints >= 10
      ? { emoji: '🌻', title: 'Radiant Recovery Sunflower (Max Bloom!)', sub: 'Glowing with strength and joy!' }
      : gardenCarePoints >= 6
      ? { emoji: '🪷', title: 'Peaceful Healing Lotus (Stage 3)', sub: 'Opening petal by petal with calm resilience.' }
      : gardenCarePoints >= 3
      ? { emoji: '🌿', title: 'Growing Wellness Sprout (Stage 2)', sub: 'Strong healthy roots are forming!' }
      : { emoji: '🌱', title: 'Tender Recovery Seedling (Stage 1)', sub: 'Small steps grow into big strength.' };

  const [cards, setCards] = useState(() => buildShuffledDeck());
  const [flippedUids, setFlippedUids] = useState([]);
  const [matchedKeys, setMatchedKeys] = useState([]);
  const [matchBanner, setMatchBanner] = useState('Flip two cozy cards to match recovery comforts!');

  const handleCardFlip = (card) => {
    if (
      flippedUids.length === 2 ||
      flippedUids.includes(card.uid) ||
      matchedKeys.includes(card.key)
    ) {
      return;
    }
    playChime(392.0);
    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      const firstCard = cards.find((c) => c.uid === nextFlipped[0]);
      if (firstCard && firstCard.key === card.key) {
        setMatchedKeys((prev) => [...prev, card.key]);
        setMatchBanner(`${card.emoji} ${card.label} Matched! "${card.affirmation}"`);
        playChime(659.25);
        addHealingXp(15, `Matched ${card.label}`);
        setFlippedUids([]);
      } else {
        setTimeout(() => setFlippedUids([]), 800);
      }
    }
  };

  // =========================================================================
  // 5. COLORFUL & FUNNY BOX BREATHING PACING
  // =========================================================================
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
      { name: 'Inhale deeply... smell the warm cookies! 🍪', color: 'from-cyan-400 to-blue-500', freq: 392.0, duration: 4 },
      { name: 'Hold it... keep it together! 🤫', color: 'from-amber-400 to-orange-500', freq: 440.0, duration: 4 },
      { name: 'Exhale slowly... let the drama go! 💨', color: 'from-emerald-400 to-teal-500', freq: 329.63, duration: 4 },
      { name: 'Hold empty... pure Zen mode 🧘‍♀️', color: 'from-purple-400 to-indigo-500', freq: 261.63, duration: 4 },
    ];

    let phaseIdx = 0;
    let timeLeft = phases[phaseIdx].duration;
    setBreathingPhase(phases[phaseIdx].name);
    setBreathingThemeColor(phases[phaseIdx].color);
    setCountdown(timeLeft);
    playChime(phases[phaseIdx].freq);

    timerRef.current = setInterval(() => {
      timeLeft--;
      if (timeLeft < 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        timeLeft = phases[phaseIdx].duration;
        setBreathingPhase(phases[phaseIdx].name);
        setBreathingThemeColor(phases[phaseIdx].color);
        playChime(phases[phaseIdx].freq);
        if (phaseIdx === 0) addHealingXp(12, 'Completed Calm Breath Cycle');
      }
      setCountdown(timeLeft);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isBreathingActive, playChime, addHealingXp]);

  // =========================================================================
  // 6. AI WELLNESS SMILES & QUOTES
  // =========================================================================
  const fallbackJokes = [
    { emoji: '🩺', setup: 'Why did the stethoscope blush?', punchline: 'Because it heard the heart skipping a joyful beat! 💓' },
    { emoji: '💻', setup: 'Why did the microchip go to therapy?', punchline: 'It had too many emotional bytes and needed to decompress! 🧘‍♂️' },
    { emoji: '💧', setup: 'Why did the water molecule break up with soda?', punchline: 'It realized it needed pure hydration, not artificial effervescence! ✨' },
    { emoji: '🌿', setup: 'What did the deep breath say to the anxious thought?', punchline: "'You're welcome to visit, but you don't live here!' 🍃" },
    { emoji: '🧸', setup: "What is a doctor's favorite kind of music during recovery?", punchline: 'Anything with a steady, healthy beet! 🥕🎶' },
  ];
  const [activeJoke, setActiveJoke] = useState(fallbackJokes[0]);
  const [revealPunchline, setRevealPunchline] = useState(false);

  const nextJoke = async () => {
    setRevealPunchline(false);
    playChime(523.25);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/stress-playground/joke');
      const data = await res.json();
      if (data.success && data.joke) {
        setActiveJoke({
          emoji: data.joke.emoji || '😂',
          setup: data.joke.setup,
          punchline: data.joke.punchline,
        });
        return;
      }
    } catch {}
    setActiveJoke(fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)]);
  };

  const soothingQuotes = [
    '“The time to relax is when you don’t have time for it.” — Sydney J. Harris',
    '“You don’t have to see the whole staircase, just take the first step.” — Martin Luther King Jr.',
    '“Deep breathing is our nervous system’s love language.” — Clinical Wellness Proverb',
    '“Your body holds deep wisdom. Trust your ability to heal, reset, and recover.”',
    '“Almost everything will work again if you unplug it for a few minutes, including you.” — Anne Lamott',
  ];
  const [currentQuote, setCurrentQuote] = useState(soothingQuotes[0]);

  const currentLevel =
    [...RECOVERY_LEVELS].reverse().find((lvl) => healingXp >= lvl.minXp) || RECOVERY_LEVELS[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* High-Vibe Recovery Lounge Header */}
      <div
        className={`p-7 rounded-3xl bg-gradient-to-r ${currentLevel.color} text-slate-950 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden`}
      >
        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-950/15 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Module 5: Recovery Arcade & Cozy Healing Lounge
            </span>
            {celebrationBurst && (
              <span className="px-3 py-1 rounded-full bg-slate-950 text-amber-300 font-extrabold text-[11px] animate-bounce">
                {celebrationBurst}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7" /> Feel-Good Recovery Playground & Care Sanctuary
          </h2>
          <p className="text-xs font-semibold text-slate-950/85 max-w-xl leading-relaxed">
            Play mini-games that celebrate your healing, turn on cozy rain or 432Hz spa music, chat with your empathetic care buddy, and unwind with colorful breathing.
          </p>
        </div>

        {/* Right Controls: Ambient Soundscape + Recovery Level Card */}
        <div className="z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {/* Ambient Audio Lounge Toggle */}
          <div className="p-2.5 rounded-2xl bg-white/90 backdrop-blur border border-white shadow-sm flex items-center gap-1.5">
            <Music className="w-4 h-4 text-emerald-700 ml-1" />
            {[
              { id: 'rain', label: '🌧️ Rain' },
              { id: 'spa', label: '🎶 432Hz Spa' },
              { id: 'off', label: '🔇 Quiet' },
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => toggleAmbientSound(snd.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all ${
                  ambientMode === snd.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>

          {/* Recovery XP Badge */}
          <div className="px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur border border-white shadow-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-900">{currentLevel.title}</div>
              <div className="text-[11px] font-bold text-emerald-700">{healingXp} Healing XP ✨</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
        {[
          { id: 'arcade', label: 'Healing Orb Arcade 🎮', icon: Gamepad2 },
          { id: 'companion', label: 'Empathetic Care Buddy 💛', icon: MessageCircleHeart },
          { id: 'playground', label: 'Zen Pond & Stress Smasher 💥', icon: Zap },
          { id: 'cozygames', label: 'Recovery Garden & Match 🌻', icon: Flower2 },
          { id: 'breathing', label: 'Cookie-to-Zen Breathing 🌈', icon: Wind },
          { id: 'humor', label: 'AI Wellness Smiles 😂', icon: Smile },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: HEALING ORB CATCHER ARCADE */}
      {subTab === 'arcade' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 p-4 rounded-3xl bg-slate-950 border-2 border-indigo-500/40 shadow-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-900 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-black text-emerald-400">Score: {arcadeScore}</span>
                {arcadeCombo > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> {arcadeCombo}x Combo!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-300 font-bold">
                <span>Best: {arcadeBestScore}</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                  ⏱ {arcadeTimeLeft}s
                </span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800">
              <canvas
                ref={arcadeCanvasRef}
                width={560}
                height={320}
                onMouseMove={handleArcadePointerMove}
                onTouchMove={handleArcadePointerMove}
                className="w-full h-auto block cursor-crosshair touch-none"
              />
              {!isArcadePlaying && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="text-4xl">💧🍊🌙💖</div>
                  <h3 className="text-lg font-extrabold text-white">
                    Healing Orb Catcher — Recovery Boost Edition
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                    Slide your Healing Shield left and right to catch <strong>Hydration</strong>,{' '}
                    <strong>Vitamins</strong>, <strong>Deep Rest</strong>, and{' '}
                    <strong>Self-Care</strong> while dodging <strong>Stress Sparks ⚡</strong>!
                  </p>
                  <button
                    type="button"
                    onClick={startArcadeGame}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-95 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Play className="w-4 h-4" /> Start 45-Second Healing Run
                  </button>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-300 font-medium">{arcadeStatusMsg}</div>
          </div>

          {/* Right Side Recovery Legend */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Recovery Power-Up Guide
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-between">
                <span>💧 Pure Hydration Drop</span>
                <strong className="text-cyan-800">+10 pts</strong>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <span>🍊 Vitamin C Immune Boost</span>
                <strong className="text-amber-800">+15 pts</strong>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <span>🌙 Deep Restorative Sleep</span>
                <strong className="text-indigo-800">+20 pts</strong>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <span>💖 Heart Self-Compassion</span>
                <strong className="text-rose-800">+25 pts</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                <span>⚡ Stress Spark (Dodge!)</span>
                <strong className="text-rose-600">-15 pts</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMPATHETIC AI CARE BUDDY & WORRY CLOUD */}
      {subTab === 'companion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                Compassionate Recovery Check-In
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                How is your heart and body feeling right now?
              </h3>
              <p className="text-xs text-slate-600">
                Tap how you feel—your care buddy will meet you with warmth, validation, and a tiny comfort action.
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
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> Listen Aloud
                </button>
              </div>

              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                {isLoadingCare ? 'Writing a warm note just for you...' : careResponse.soothingWords}
              </p>

              <div className="p-3 rounded-xl bg-white/90 border border-emerald-200 text-xs text-emerald-950">
                <strong>Tiny Comfort Step:</strong> {careResponse.microComfort}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border border-indigo-900/50 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
                Let Go & Float Away
              </span>
              <h3 className="text-base font-extrabold text-white">☁️ Worry Cloud Releaser</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Type any pain frustration or heavy thought below and launch it into the sky to dissolve.
              </p>
            </div>

            <form onSubmit={handleReleaseWorry} className="space-y-3">
              <textarea
                rows={3}
                value={worryInput}
                onChange={(e) => setWorryInput(e.target.value)}
                placeholder="e.g., I'm frustrated that healing takes patience..."
                className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Send className="w-4 h-4" /> Send Worry into the Sky ✨
              </button>
            </form>

            <div className="min-h-[80px] space-y-2">
              {releasedWorries.length > 0 ? (
                releasedWorries.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/10 border border-cyan-400/30 text-xs text-cyan-200 flex items-center justify-between animate-pulse"
                  >
                    <span className="truncate">☁️ Dissolving: “{item.text}”</span>
                    <span className="text-[10px] font-bold text-emerald-300 shrink-0 ml-2">
                      Released ✨
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400 text-center">
                  Your sky is clear and peaceful.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ZEN RIPPLE POND & CONTEXTUAL TENSION SMASHER */}
      {subTab === 'playground' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold">
                  Pentatonic Wind-Chime Pond
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
                  ? 'Tap anywhere on the water to create glowing ripples & soothing chimes'
                  : 'Ripples paused—click "Ripples: OFF" above to turn them back on.'}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" /> Tension Popper Minigame
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
                Pop any tension bubble to shatter it and hear tailored soothing advice:
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

      {/* TAB 4: RECOVERY GARDEN & COZY COMFORT MATCH */}
      {subTab === 'cozygames' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border border-emerald-200 shadow-xl flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                Nurture & Heal Mini-Game
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                🌱 Care & Gratitude Recovery Garden
              </h3>
              <p className="text-xs text-slate-600">
                Give your plant water, sunshine, and kind words—watch it bloom as you heal.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-emerald-200 text-center space-y-2 shadow-inner">
              <div className="text-6xl animate-bounce py-2">{plantStage.emoji}</div>
              <div className="text-sm font-extrabold text-slate-900">{plantStage.title}</div>
              <div className="text-xs text-slate-600">{plantStage.sub}</div>
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

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                  Cozy Focus Mini-Game
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  🧸 Cozy Comfort Card Match
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCards(buildShuffledDeck());
                  setFlippedUids([]);
                  setMatchedKeys([]);
                  setMatchBanner('Shuffled! Flip two cards to match recovery comforts.');
                }}
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

      {/* TAB 5: COLORFUL & FUNNY BOX BREATHING */}
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

      {/* TAB 6: AI WELLNESS SMILES & QUOTES */}
      {subTab === 'humor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-7 rounded-3xl bg-white border border-slate-200 text-center space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto text-3xl">
                {activeJoke.emoji}
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                AI Wellness Smiles & Clinical Humor 😂
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
              <p className="text-sm font-extrabold text-slate-900">“{activeJoke.setup}”</p>
              {revealPunchline ? (
                <div className="p-3.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-black text-xs shadow-sm">
                  {activeJoke.punchline}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRevealPunchline(true);
                    playChime(587.33);
                    speakAudio(activeJoke.punchline);
                    addHealingXp(5, 'Shared a Smile');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Tap to Reveal Punchline 🎁
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={nextJoke}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer text-xs inline-flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Next Wellness Smile 😂
            </button>
          </div>

          <div className="p-7 rounded-3xl bg-white border border-slate-200 text-center space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Restorative Recovery Quotes ✨
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-sm font-semibold text-slate-900 italic leading-relaxed">
              {currentQuote}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const q = soothingQuotes[Math.floor(Math.random() * soothingQuotes.length)];
                  setCurrentQuote(q);
                  playChime(440);
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer text-xs inline-flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> New Quote
              </button>
              <button
                type="button"
                onClick={() => speakAudio(currentQuote)}
                className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 cursor-pointer text-xs border border-slate-300 inline-flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-emerald-600" /> Listen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}