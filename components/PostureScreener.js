'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  Camera,
  FileText,
  VolumeX,
  Activity,
  Upload,
  Square,
  Crosshair,
  Sparkles,
  CheckCircle2,
  Play,
  RotateCcw,
  Bell,
  HeartPulse,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

// --- BIOMECHANICAL HELPER FUNCTIONS ---
const calculateAngle = (p1, p2, p3) => {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return Math.round(angle);
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// --- TARGETED YOGA ASANAS FOR SEDENTARY DESK WORKERS ---
const YOGA_ASANA_LIBRARY = {
  forwardHead: [
    {
      id: 'bhujangasana',
      sanskritName: 'Bhujangasana',
      englishName: 'Cobra Pose (Cervical & Thoracic Extension)',
      targetArea: 'Neck Extensors, Suboccipitals & Tight Pectorals',
      durationSeconds: 30,
      steps: [
        'Lie face down with palms flat under your shoulders and elbows tucked gently against your ribs.',
        'Press the tops of your feet and pelvis into the floor to stabilize your lower spine.',
        'Inhale and lift your chest forward and up without crunching the back of your neck.',
        'Draw shoulders away from your ears, hold for 5 slow breaths (30s), then lower slowly.',
      ],
      deskTip:
        'Desk Alternative: Interlace fingers behind your back while seated, squeeze shoulder blades together, and lift your chest for 20s.',
    },
    {
      id: 'greeva_sanchalana',
      sanskritName: 'Greeva Sanchalana',
      englishName: 'Seated Cervical Retraction & Trapezius Release',
      targetArea: 'Deep Neck Flexors & Upper Trapezius',
      durationSeconds: 30,
      steps: [
        'Sit tall with feet flat on the floor and crown of the head reaching upward.',
        'Glide your chin straight backward (axial retraction) without tilting your head up or down; hold 5 seconds.',
        'Next, gently tilt your right ear toward your right shoulder to lengthen the left side of your neck.',
        'Hold 15 seconds per side while keeping both shoulders relaxed.',
      ],
      deskTip: 'Can be done directly in your office chair every 45 minutes.',
    },
  ],
  lumbarFlexion: [
    {
      id: 'marjaryasana_bitilasana',
      sanskritName: 'Marjaryasana–Bitilasana',
      englishName: 'Cat-Cow Spinal Mobilization',
      targetArea: 'Lumbar Discs & Erector Spinae',
      durationSeconds: 30,
      steps: [
        'Sit on the front edge of your chair with hands on your knees (or come onto hands and knees on a mat).',
        'Inhale (Cow): Tilt pelvis forward, gently arch your lower back, and lift your sternum.',
        'Exhale (Cat): Tuck tailbone under, draw navel toward spine, and round your upper/mid back.',
        'Move smoothly with your breath for 5 cycles to decompress spinal discs.',
      ],
      deskTip: 'Zero floor space needed when practiced seated on your chair.',
    },
    {
      id: 'ardha_matsyendrasana',
      sanskritName: 'Ardha Matsyendrasana',
      englishName: 'Seated Chair Spinal Twist',
      targetArea: 'Lower Back, Obliques & Mid-Thoracic Spine',
      durationSeconds: 30,
      steps: [
        'Sit tall with knees together and feet planted flat on the floor.',
        'Inhale and lengthen your spine upward from tailbone to crown.',
        'Exhale and rotate gently to the right, resting left hand on outer right thigh and right hand on the chair back.',
        'Hold 15 seconds per side, breathing deeply into your ribcage.',
      ],
      deskTip: 'Relieves mid-back stiffness after prolonged typing.',
    },
  ],
  asymmetryOrProximity: [
    {
      id: 'gomukhasana_arms',
      sanskritName: 'Gomukhasana Arms + Tadasana',
      englishName: 'Cow-Face Shoulder Opener & Mountain Alignment',
      targetArea: 'Rhomboids, Rotator Cuff & Bilateral Shoulder Balance',
      durationSeconds: 30,
      steps: [
        'Stand evenly on both feet in Tadasana (Mountain Pose) with knees soft.',
        'Reach your right arm overhead, bend the elbow, and rest your palm between your shoulder blades.',
        'Sweep your left arm behind your lower back and reach up toward your right hand (or hold a strap/towel).',
        'Hold 15 seconds per side with ribs stacked directly over your hips.',
      ],
      deskTip: 'Re-centers uneven shoulder height caused by mouse-hand leaning.',
    },
  ],
  preventive: [
    {
      id: 'urdhva_hastasana',
      sanskritName: 'Urdhva Hastasana in Tadasana',
      englishName: 'Upward Salute & Full-Spine Decompression',
      targetArea: 'Axial Spine, Shoulders & Diaphragm',
      durationSeconds: 30,
      steps: [
        'Stand tall with feet hip-width apart and weight balanced evenly across both feet.',
        'Inhale and sweep both arms overhead with palms facing inward and shoulders relaxed downward.',
        'Lengthen from your heels through your fingertips for 5 calm, deep breaths.',
      ],
      deskTip: 'Great hourly reset to maintain your green alignment streak.',
    },
  ],
};

const getRecommendedAsanas = (metrics, proximityWarning) => {
  const list = [];
  if (metrics.forwardHeadAngle > 15) {
    list.push(...YOGA_ASANA_LIBRARY.forwardHead);
  }
  if (metrics.lumbarFlexionAngle > 15) {
    list.push(...YOGA_ASANA_LIBRARY.lumbarFlexion);
  }
  if (
    parseFloat(metrics.shoulderAsymmetryCm) > 1.5 ||
    parseFloat(metrics.pelvicTiltPx) > 15 ||
    proximityWarning
  ) {
    list.push(...YOGA_ASANA_LIBRARY.asymmetryOrProximity);
  }
  return list.length > 0 ? list : YOGA_ASANA_LIBRARY.preventive;
};

const generateReportSummary = (metrics, proximityWarning) => {
  let summary = `Patient underwent a real-time 3D kinematic ergonomic screening. Overall REBA assessment score is ${metrics.rulaScore}/12 (${metrics.riskLevel}). `;

  if (metrics.forwardHeadAngle > 15) {
    summary += `Cervical tracking reveals forward head translation (${metrics.forwardHeadAngle}°), increasing upper cervical load. `;
  } else {
    summary += `Cervical alignment remains within healthy limits (${metrics.forwardHeadAngle}°). `;
  }

  if (parseFloat(metrics.shoulderAsymmetryCm) > 1.5 || parseFloat(metrics.pelvicTiltPx) > 15) {
    summary += `Structural asymmetry noted (Shoulder tilt: ${metrics.shoulderAsymmetryCm} cm, Pelvic offset: ${metrics.pelvicTiltPx} px). `;
  }

  if (metrics.lumbarFlexionAngle > 15) {
    summary += `Lumbar vectors indicate elevated trunk flexion (${metrics.lumbarFlexionAngle}°), raising anterior disc pressure. `;
  }

  if (proximityWarning) {
    summary += `Z-axis proximity monitoring detected leaning close into the display monitor. `;
  }

  summary +=
    metrics.rulaScore >= 5
      ? 'Action: Correct workstation alignment immediately and perform the prescribed desk-worker Yoga Asanas below.'
      : 'Action: Maintain current neutral alignment with hourly micro-breaks.';

  return summary;
};

export default function PostureScreener() {
  // --- REFS ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTrendUpdateRef = useRef(0);
  const audioModeRef = useRef('chime_voice');
  const wasBadPostureRef = useRef(false);
  const lastSoundTimestampRef = useRef(0);
  const badStreakSecondsRef = useRef(0);
  const lastStreakTickRef = useRef(Date.now());
  const autoCapturedInStreakRef = useRef(false);
  const audioCtxRef = useRef(null);

  // --- STATES ---
  const [landmarker, setLandmarker] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [statusText, setStatusText] = useState('Loading MediaPipe 3D Vision Model...');

  // Sound Effects & Alert State
  const [audioMode, setAudioMode] = useState('chime_voice');
  const [slouchDuration, setSlouchDuration] = useState(0);
  const [autoCaptured, setAutoCaptured] = useState(false);
  const [soundPulse, setSoundPulse] = useState(false);

  // Calibration & Proximity State
  const [baseline, setBaseline] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isTooClose, setIsTooClose] = useState(false);

  // Session Telemetry & Charting
  const [sessionTrend, setSessionTrend] = useState([]);
  const [alignmentStats, setAlignmentStats] = useState({ goodFrames: 0, totalFrames: 0 });

  // Interactive Yoga Asana Hold Timer State
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);

  // Clinical Metrics State (Green = Aligned, Red = Misaligned)
  const [clinicalMetrics, setClinicalMetrics] = useState({
    rulaScore: 1,
    riskLevel: 'OPTIMAL ALIGNMENT',
    forwardHeadAngle: 4,
    shoulderAsymmetryCm: '0.4',
    lumbarFlexionAngle: 5,
    pelvicTiltPx: '2.0',
    hipFlexionAngle: 94,
    spineRisk: 'NORMAL',
    generatedSummary: 'Start Live Camera or Upload a Photo to begin 3D posture tracking.',
    color: '#10B981',
    isAligned: true,
  });

  useEffect(() => {
    audioModeRef.current = audioMode;
  }, [audioMode]);

  // --- WEB AUDIO API SYNTHESIZED SOUND EFFECTS ---
  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playPostureAlertSound = useCallback(
    (cueText = 'Please sit upright and align your neck and shoulders.') => {
      if (audioModeRef.current === 'muted') return;
      const ctx = getAudioContext();
      if (ctx) {
        const now = ctx.currentTime;
        // Descending two-tone ergonomic alert chime (A4 440Hz -> E4 329.63Hz)
        [
          { freq: 440, start: 0, dur: 0.16 },
          { freq: 329.63, start: 0.18, dur: 0.28 },
        ].forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.22, now + start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.02);
        });
      }

      setSoundPulse(true);
      setTimeout(() => setSoundPulse(false), 700);

      if (
        audioModeRef.current === 'chime_voice' &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cueText);
        utterance.rate = 1.02;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    },
    []
  );

  const playAlignmentRestoredSound = useCallback(() => {
    if (audioModeRef.current === 'muted') return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Gentle ascending major triad confirmation chime (C5 -> E5 -> G5)
    [
      { freq: 523.25, start: 0, dur: 0.11 },
      { freq: 659.25, start: 0.11, dur: 0.11 },
      { freq: 783.99, start: 0.22, dur: 0.22 },
    ].forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.14, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  }, []);

  // --- YOGA HOLD COUNTDOWN TIMER ---
  useEffect(() => {
    if (!activeTimerId || timerSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setActiveTimerId(null);
          playAlignmentRestoredSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimerId, timerSecondsLeft, playAlignmentRestoredSound]);

  // --- INITIALIZE MEDIAPIPE POSE LANDMARKER (WITH REAL GPU -> CPU FALLBACK) ---
  const loadVisionModel = useCallback(async () => {
    setIsModelLoading(true);
    setModelError(null);

    const wasmCandidates = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
    ];
    const modelUrl =
      'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

    let lastErr = null;

    for (const wasmUrl of wasmCandidates) {
      for (const delegate of ['GPU', 'CPU']) {
        try {
          setStatusText(`Loading MediaPipe Vision (${delegate})...`);
          const vision = await FilesetResolver.forVisionTasks(wasmUrl);
          const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate,
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });

          setLandmarker(poseLandmarker);
          setIsModelLoading(false);
          setModelError(null);
          setStatusText(`MediaPipe 3D Vision Ready (${delegate}) — Start Camera or Upload Photo`);
          return;
        } catch (err) {
          lastErr = err;
          console.warn(`MediaPipe init attempt failed [${wasmUrl} | ${delegate}]:`, err);
        }
      }
    }

    setIsModelLoading(false);
    const reason =
      lastErr?.message ||
      'Unable to fetch MediaPipe WASM/model files. Check internet connection and click Retry.';
    setModelError(reason);
    setStatusText(`Vision Model Load Failed: ${reason}`);
  }, []);

  useEffect(() => {
    loadVisionModel();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [loadVisionModel]);

  // --- CLEAN HOSPITAL-GRADE PDF / PRINT REPORT ---
  const exportDoctorReport = (snapshotOverride = null, metricsOverride = null) => {
    const m = metricsOverride || clinicalMetrics;
    const snapshot =
      snapshotOverride || (canvasRef.current ? canvasRef.current.toDataURL('image/png') : '');
    const recommendedAsanas = getRecommendedAsanas(m, isTooClose);
    const goodPct =
      alignmentStats.totalFrames > 0
        ? Math.round((alignmentStats.goodFrames / alignmentStats.totalFrames) * 100)
        : m.isAligned
        ? 100
        : 45;

    const printWindow = window.open('', '_blank', 'width=920,height=1050');
    if (!printWindow) {
      alert('Please allow browser popups to open the clean diagnostic PDF report.');
      return;
    }

    const reportDate = new Date().toLocaleString();
    const statusBadgeBg = m.isAligned ? '#059669' : '#DC2626';

    const yogaRowsHtml = recommendedAsanas
      .map(
        (asana, index) => `
        <div class="asana-card">
          <div class="asana-header">
            <strong>${index + 1}. ${asana.sanskritName} — ${asana.englishName}</strong>
            <span class="asana-tag">Target: ${asana.targetArea} • Hold ${asana.durationSeconds}s</span>
          </div>
          <ol class="asana-steps">
            ${asana.steps.map((s) => `<li>${s}</li>`).join('')}
          </ol>
          <div class="desk-tip"><strong>Workstation Tip:</strong> ${asana.deskTip}</div>
        </div>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OmniHealth Ergonomic & Yoga Therapy Report</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 28px; background: #fff; line-height: 1.45; }
            .topbar { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${statusBadgeBg}; padding-bottom: 14px; margin-bottom: 18px; }
            .brand { font-size: 20px; font-weight: 800; margin: 0; color: #0f172a; }
            .sub { font-size: 11px; color: #475569; margin-top: 2px; }
            .pill { padding: 6px 14px; border-radius: 999px; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.4px; background: ${statusBadgeBg}; }
            .meta-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 11px; color: #334155; margin-bottom: 18px; }
            h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.7px; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin: 18px 0 10px; }
            .split { display: grid; grid-template-columns: 1.05fr 1.25fr; gap: 16px; align-items: start; }
            .snap-wrap { border: 2px solid ${statusBadgeBg}; border-radius: 10px; overflow: hidden; background: #0f172a; }
            .snap-wrap img { width: 100%; display: block; }
            table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
            th { text-align: left; background: #f1f5f9; color: #334155; padding: 7px 9px; border: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
            td { padding: 7px 9px; border: 1px solid #e2e8f0; }
            .ok { color: #059669; font-weight: 700; }
            .warn { color: #dc2626; font-weight: 700; }
            .summary-box { background: ${m.isAligned ? '#ecfdf5' : '#fef2f2'}; border-left: 4px solid ${statusBadgeBg}; padding: 11px 14px; border-radius: 0 8px 8px 0; font-size: 12px; color: #1e293b; }
            .asana-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; background: #f8fafc; page-break-inside: avoid; }
            .asana-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: #0f172a; margin-bottom: 5px; }
            .asana-tag { font-size: 10px; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 999px; font-weight: 700; }
            .asana-steps { margin: 4px 0 6px 18px; padding: 0; font-size: 11px; color: #334155; }
            .asana-steps li { margin-bottom: 2px; }
            .desk-tip { font-size: 10.5px; color: #065f46; background: #ecfdf5; padding: 4px 8px; border-radius: 6px; }
            .signoff { margin-top: 16px; border: 1px dashed #94a3b8; border-radius: 8px; padding: 10px 12px; font-size: 10.5px; color: #64748b; min-height: 48px; }
            .footer { margin-top: 14px; text-align: center; font-size: 10px; color: #94a3b8; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <div class="topbar">
            <div>
              <h1 class="brand">OmniHealth Kinematic Posture & Yoga Therapy Report</h1>
              <div class="sub">3D MediaPipe Skeletal Alignment Screening & Sedentary Ergonomic Recovery Plan</div>
            </div>
            <span class="pill">${m.riskLevel}</span>
          </div>

          <div class="meta-bar">
            <span><strong>Date:</strong> ${reportDate}</span>
            <span><strong>REBA Ergonomic Score:</strong> ${m.rulaScore} / 12</span>
            <span><strong>Session Optimal Alignment:</strong> ${goodPct}%</span>
          </div>

          <h2>1. Visual Skeletal Scan & Kinematic Measurements</h2>
          <div class="split">
            ${snapshot ? `<div class="snap-wrap"><img src="${snapshot}" alt="Posture Skeleton Scan" /></div>` : '<div></div>'}
            <table>
              <thead>
                <tr>
                  <th>Biomechanical Metric</th>
                  <th>Measured</th>
                  <th>Healthy Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Forward Head Angle</td>
                  <td><strong>${m.forwardHeadAngle}°</strong></td>
                  <td>0° – 15°</td>
                  <td class="${m.forwardHeadAngle > 15 ? 'warn' : 'ok'}">${m.forwardHeadAngle > 15 ? 'Elevated Strain' : 'Optimal'}</td>
                </tr>
                <tr>
                  <td>Lumbar / Trunk Flexion</td>
                  <td><strong>${m.lumbarFlexionAngle}°</strong></td>
                  <td>0° – 15°</td>
                  <td class="${m.lumbarFlexionAngle > 15 ? 'warn' : 'ok'}">${m.lumbarFlexionAngle > 15 ? 'Slouch Detected' : 'Optimal'}</td>
                </tr>
                <tr>
                  <td>Shoulder Asymmetry</td>
                  <td><strong>${m.shoulderAsymmetryCm} cm</strong></td>
                  <td>&lt; 1.5 cm</td>
                  <td class="${parseFloat(m.shoulderAsymmetryCm) > 1.5 ? 'warn' : 'ok'}">${parseFloat(m.shoulderAsymmetryCm) > 1.5 ? 'Tilt Noted' : 'Balanced'}</td>
                </tr>
                <tr>
                  <td>Pelvic Tilt Offset</td>
                  <td><strong>${m.pelvicTiltPx} px</strong></td>
                  <td>&lt; 15.0 px</td>
                  <td class="${parseFloat(m.pelvicTiltPx) > 15 ? 'warn' : 'ok'}">${parseFloat(m.pelvicTiltPx) > 15 ? 'Uneven' : 'Level'}</td>
                </tr>
                <tr>
                  <td>Hip Flexion Angle</td>
                  <td><strong>${m.hipFlexionAngle}°</strong></td>
                  <td>85° – 110°</td>
                  <td class="ok">Recorded</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>2. Clinical Biomechanical Assessment</h2>
          <div class="summary-box">${m.generatedSummary}</div>

          <h2>3. Prescribed Yoga Asanas for Sedentary Pain Relief</h2>
          ${yogaRowsHtml}

          <div class="signoff">Clinician / Physiotherapist Notes:</div>
          <div class="footer">Generated by OmniHealth AI 3D Posture Sentinel • Non-diagnostic ergonomic wellness report</div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // --- SYNC TO FASTAPI BACKEND + TRIGGER REPORT ---
  const handleCaptureAndSync = async (metricsObj, mode = 'manual_capture', autoPrint = true) => {
    const snapshot = canvasRef.current ? canvasRef.current.toDataURL('image/png') : '';
    try {
      await fetch('http://127.0.0.1:8000/api/posture/analyze-kinematics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rulaScore: metricsObj.rulaScore,
          riskLevel: metricsObj.riskLevel,
          forwardHeadAngle: metricsObj.forwardHeadAngle,
          shoulderAsymmetryCm: parseFloat(metricsObj.shoulderAsymmetryCm),
          lumbarFlexionAngle: metricsObj.lumbarFlexionAngle,
          pelvicTiltPx: parseFloat(metricsObj.pelvicTiltPx),
          hipFlexionAngle: metricsObj.hipFlexionAngle,
          generatedSummary: metricsObj.generatedSummary,
          proximityWarning: isTooClose,
        }),
      });
      setAutoCaptured(true);
      setTimeout(() => setAutoCaptured(false), 4500);
    } catch (err) {
      console.error('FastAPI posture sync skipped:', err);
    }

    if (autoPrint) {
      exportDoctorReport(snapshot, metricsObj);
    }
  };

  // --- CORE VISION & VISUAL HUD ENGINE ---
  const analyzePostureFrame = (landmarks, width, height, staticImage = null) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    if (staticImage) {
      ctx.drawImage(staticImage, 0, 0, width, height);
    } else if (videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    if (!landmarks || landmarks.length === 0) return;
    const points = landmarks[0];

    const ear = points[7] || points[8];
    const leftShoulder = points[11];
    const rightShoulder = points[12];
    const leftHip = points[23];
    const rightHip = points[24];
    const leftKnee = points[25];
    const nose = points[0];

    if (!ear || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

    const earX = ear.x * width;
    const earY = ear.y * height;
    const shoulderX = ((leftShoulder.x + rightShoulder.x) / 2) * width;
    const shoulderY = ((leftShoulder.y + rightShoulder.y) / 2) * height;

    const deltaX = earX - shoulderX;
    const deltaY = Math.max(1, shoulderY - earY);
    const forwardHeadAngle = Math.abs(Math.round((Math.atan2(deltaX, deltaY) * 180) / Math.PI));

    const shoulderYDiff = Math.abs((leftShoulder.y - rightShoulder.y) * height);
    const shoulderAsymmetryCm = (shoulderYDiff / 10).toFixed(1);

    const midHip = {
      x: ((leftHip.x + rightHip.x) / 2) * width,
      y: ((leftHip.y + rightHip.y) / 2) * height,
    };

    const lumbarDeltaX = shoulderX - midHip.x;
    const lumbarDeltaY = Math.max(1, midHip.y - shoulderY);
    const lumbarFlexionAngle = Math.abs(Math.round((Math.atan2(lumbarDeltaX, lumbarDeltaY) * 180) / Math.PI));

    const pelvicTiltPx = Math.abs((leftHip.y - rightHip.y) * height).toFixed(1);

    const hipFlexionAngle = leftKnee
      ? calculateAngle(
          { x: leftShoulder.x * width, y: leftShoulder.y * height },
          midHip,
          { x: leftKnee.x * width, y: leftKnee.y * height }
        )
      : 92;

    // Baseline Calibration & Z-Axis Screen Proximity
    const currentShoulderWidthPx = Math.abs(leftShoulder.x - rightShoulder.x) * width;
    let proximityWarning = false;

    if (!staticImage) {
      if (isCalibrating) {
        setBaseline({
          shoulderWidthPx: currentShoulderWidthPx,
          forwardHeadAngle,
          lumbarFlexionAngle,
        });
        setIsCalibrating(false);
        playAlignmentRestoredSound();
      } else if (baseline && baseline.shoulderWidthPx) {
        if (currentShoulderWidthPx > baseline.shoulderWidthPx * 1.24) {
          proximityWarning = true;
        }
      }
    }
    setIsTooClose(proximityWarning);

    // Compute REBA Score (1-12) & Green vs Red State
    let rulaScore = 1;
    if (forwardHeadAngle > 15) rulaScore += 3;
    if (forwardHeadAngle > 28) rulaScore += 2;
    if (lumbarFlexionAngle > 15) rulaScore += 3;
    if (parseFloat(shoulderAsymmetryCm) > 1.5) rulaScore += 2;
    if (proximityWarning) rulaScore += 2;
    rulaScore = Math.min(12, rulaScore);

    const isAligned = rulaScore < 4 && !proximityWarning;
    const activeColor = isAligned ? '#10B981' : '#EF4444'; // Green when right, Red when wrong
    const riskLevel = isAligned
      ? 'OPTIMAL ALIGNMENT'
      : rulaScore >= 7
      ? 'HIGH STRAIN — CORRECT POSTURE'
      : 'POSTURE ALERT — REALIGN';
    const spineRisk = isAligned ? 'OPTIMAL' : rulaScore >= 7 ? 'HIGH RISK' : 'MODERATE STRAIN';

    // --- DRAW ENHANCED VISUAL HUD ON CANVAS ---
    // 1. Vertical Reference Plumb Line
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midHip.x, midHip.y + 20);
    ctx.lineTo(midHip.x, Math.max(20, earY - 35));
    ctx.stroke();
    ctx.restore();

    // 2. Glowing Spinal & Shoulder Kinetic Vectors (Green vs Red)
    ctx.save();
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(midHip.x, midHip.y);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.lineTo(earX, earY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftShoulder.x * width, leftShoulder.y * height);
    ctx.lineTo(rightShoulder.x * width, rightShoulder.y * height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftHip.x * width, leftHip.y * height);
    ctx.lineTo(rightHip.x * width, rightHip.y * height);
    ctx.stroke();
    ctx.restore();

    // 3. Keypoint Joint Nodes
    [
      { x: earX, y: earY },
      { x: shoulderX, y: shoulderY },
      { x: leftShoulder.x * width, y: leftShoulder.y * height },
      { x: rightShoulder.x * width, y: rightShoulder.y * height },
      { x: midHip.x, y: midHip.y },
      nose ? { x: nose.x * width, y: nose.y * height } : null,
    ]
      .filter(Boolean)
      .forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = activeColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });

    // 4. On-Canvas Angle Callout Pills
    const drawHudPill = (text, x, y) => {
      ctx.font = 'bold 12px system-ui, sans-serif';
      const pad = 8;
      const w = ctx.measureText(text).width + pad * 2;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      drawRoundedRect(ctx, x, y - 14, w, 22, 6);
      ctx.fill();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x + pad, y + 1);
    };

    drawHudPill(`Neck: ${forwardHeadAngle}°`, Math.min(width - 115, earX + 14), Math.max(24, earY));
    drawHudPill(`Lumbar: ${lumbarFlexionAngle}°`, Math.min(width - 125, shoulderX + 14), shoulderY + 6);

    const draftMetrics = {
      rulaScore,
      riskLevel,
      forwardHeadAngle,
      shoulderAsymmetryCm,
      lumbarFlexionAngle,
      pelvicTiltPx,
      hipFlexionAngle,
      spineRisk,
      color: activeColor,
      isAligned,
    };
    const generatedSummary = generateReportSummary(draftMetrics, proximityWarning);
    const updatedMetrics = { ...draftMetrics, generatedSummary };
    setClinicalMetrics(updatedMetrics);

    // --- SOUND EFFECT & SLOUCH TIMER LOGIC ---
    if (!staticImage) {
      const now = Date.now();

      setAlignmentStats((prev) => ({
        goodFrames: prev.goodFrames + (isAligned ? 1 : 0),
        totalFrames: prev.totalFrames + 1,
      }));

      if (!isAligned) {
        if (!wasBadPostureRef.current || now - lastSoundTimestampRef.current > 6000) {
          const customCue =
            forwardHeadAngle > 15
              ? 'Forward head detected. Tuck your chin back and lift your chest.'
              : lumbarFlexionAngle > 15
              ? 'Lower back slouch detected. Sit upright against your chair.'
              : proximityWarning
              ? 'You are leaning too close to the screen. Sit back gently.'
              : 'Posture alert. Level your shoulders and straighten your spine.';
          playPostureAlertSound(customCue);
          lastSoundTimestampRef.current = now;
        }
        wasBadPostureRef.current = true;

        const dt = (now - lastStreakTickRef.current) / 1000;
        lastStreakTickRef.current = now;
        badStreakSecondsRef.current += dt;
        const roundedSec = Math.floor(badStreakSecondsRef.current);
        setSlouchDuration(roundedSec);

        if (roundedSec >= 8 && !autoCapturedInStreakRef.current) {
          autoCapturedInStreakRef.current = true;
          handleCaptureAndSync(updatedMetrics, 'auto_captured', false);
        }
      } else {
        if (wasBadPostureRef.current) {
          playAlignmentRestoredSound();
        }
        wasBadPostureRef.current = false;
        badStreakSecondsRef.current = 0;
        autoCapturedInStreakRef.current = false;
        lastStreakTickRef.current = now;
        setSlouchDuration(0);
      }

      if (now - lastTrendUpdateRef.current > 1200) {
        lastTrendUpdateRef.current = now;
        setSessionTrend((prev) => [
          ...prev.slice(-24),
          {
            time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            reba: rulaScore,
            neck: forwardHeadAngle,
          },
        ]);
      }
    }
  };

  // --- START / STOP LIVE WEBCAM ---
  const startWebcam = async () => {
    if (!landmarker) return;
    getAudioContext();
    setIsUploadMode(false);
    try {
      await landmarker.setOptions({ runningMode: 'VIDEO' });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsWebcamActive(true);
        setStatusText('Live 3D Kinematic Tracking Active');
        lastStreakTickRef.current = Date.now();

        const renderLoop = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            const results = landmarker.detectForVideo(videoRef.current, performance.now());
            analyzePostureFrame(
              results.landmarks,
              videoRef.current.videoWidth || 640,
              videoRef.current.videoHeight || 480
            );
          }
          animFrameRef.current = requestAnimationFrame(renderLoop);
        };
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    } catch (err) {
      console.error('Webcam error:', err);
      alert('Camera access denied or unavailable. You can also upload a side/front posture photo.');
    }
  };

  const stopWebcam = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setSlouchDuration(0);
    setStatusText('Webcam Stopped — Ready');
  };

  // --- STATIC PHOTO UPLOAD MODE ---
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !landmarker) return;
    e.target.value = '';
    stopWebcam();
    getAudioContext();
    setIsUploadMode(true);
    setStatusText(`Analyzing Uploaded Image: ${file.name}`);

    const img = new Image();
    img.onload = async () => {
      try {
        await landmarker.setOptions({ runningMode: 'IMAGE' });
        const res = landmarker.detect(img);
        analyzePostureFrame(res.landmarks, img.width, img.height, img);
      } catch (err) {
        console.error('Image analysis error:', err);
        setStatusText('Could not analyze uploaded photo.');
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const recommendedAsanas = getRecommendedAsanas(clinicalMetrics, isTooClose);
  const optimalPercentage =
    alignmentStats.totalFrames > 0
      ? Math.round((alignmentStats.goodFrames / alignmentStats.totalFrames) * 100)
      : 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-sm transition-colors duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          clinicalMetrics.isAligned
            ? 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-200'
            : 'bg-gradient-to-r from-rose-50 via-white to-amber-50 border-rose-300'
        }`}
      >
        <div className="space-y-1">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wide ${
              clinicalMetrics.isAligned
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-rose-100 text-rose-900 animate-pulse'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Module 4: 3D Kinematic Posture & Desk Yoga Sentinel
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Activity
              className={`w-6 h-6 ${
                clinicalMetrics.isAligned ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            Real-Time Ergonomic Alignment & Sedentary Pain Relief
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            Tracks 33 skeletal keypoints in real time—glowing{' '}
            <strong className="text-emerald-700">Green</strong> when aligned and{' '}
            <strong className="text-rose-700">Red</strong> with acoustic correction chimes &
            targeted Yoga Asanas when slouching is detected.
          </p>
        </div>

        {/* Sound Mode Selector & Test Chime */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={audioMode}
            onChange={(e) => setAudioMode(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
            title="Choose Posture Sound Alert Mode"
          >
            <option value="chime_voice">🔊 Chime + Voice Cue</option>
            <option value="chime_only">🔔 Sound Chime Only</option>
            <option value="muted">🔇 Muted</option>
          </select>

          <button
            type="button"
            onClick={() =>
              playPostureAlertSound('Posture check: sit tall and relax your shoulders.')
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${
              soundPulse
                ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
            }`}
          >
            {audioMode === 'muted' ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4 text-amber-400" />
            )}
            Test Alert Sound
          </button>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Live Vision Viewport + Controls + Fatigue Chart */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`p-3 rounded-3xl bg-slate-950 transition-all duration-300 shadow-xl border-4 ${
              clinicalMetrics.isAligned
                ? 'border-emerald-500 shadow-emerald-500/15'
                : 'border-rose-500 shadow-rose-500/30'
            }`}
          >
            {/* Top Status HUD Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 mb-2 rounded-2xl bg-slate-900 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    clinicalMetrics.isAligned ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'
                  }`}
                />
                <span
                  className={`font-extrabold uppercase tracking-wider ${
                    clinicalMetrics.isAligned ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {clinicalMetrics.riskLevel}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-300">
                {slouchDuration > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Slouch Timer: {slouchDuration}s
                  </span>
                )}
                {isTooClose && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Too Close to Screen
                  </span>
                )}
                <span>Green Streak: {optimalPercentage}%</span>
              </div>
            </div>

            {/* Video + HUD Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[340px] flex items-center justify-center">
              <video ref={videoRef} className="hidden" playsInline muted />
              <canvas ref={canvasRef} className="w-full h-auto block rounded-2xl" />

              {!isWebcamActive && !isUploadMode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  {isModelLoading ? (
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                  ) : (
                    <Activity className="w-10 h-10 text-emerald-400 animate-pulse" />
                  )}
                  <p className="text-sm font-bold text-white max-w-md">{statusText}</p>
                  {modelError ? (
                    <button
                      type="button"
                      onClick={loadVisionModel}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer"
                    >
                      Retry Loading Vision Model
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400 max-w-sm">
                      {isModelLoading
                        ? 'Initializing WebAssembly pose tracker (usually 2–4 seconds)...'
                        : 'Click Start Live Camera below for continuous Green/Red alignment tracking with sound alerts.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Control Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
              {!isWebcamActive ? (
                <button
                  type="button"
                  onClick={startWebcam}
                  disabled={isModelLoading || !landmarker}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {isModelLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Start Live Camera
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopWebcam}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Square className="w-4 h-4" /> Stop Camera
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCalibrating(true)}
                disabled={!isWebcamActive}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
              >
                <Crosshair className="w-4 h-4" /> Calibrate Ideal
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isModelLoading || !landmarker}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
              >
                <Upload className="w-4 h-4" /> Upload Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  handleCaptureAndSync(
                    clinicalMetrics,
                    isUploadMode ? 'image_upload' : 'manual_capture',
                    true
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <FileText className="w-4 h-4" /> Print Report
              </button>
            </div>
          </div>

          {autoCaptured && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Posture checkpoint saved to FastAPI database and Yoga Therapy recommendations updated.
            </div>
          )}

          {/* Live Session Fatigue & REBA Trend Chart */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" /> Live Session REBA & Neck Angle Trend
              </span>
              <span className="text-[11px] text-slate-500">Lower REBA (1–3) = Optimal Green Zone</span>
            </div>
            <div className="h-32 w-full">
              {sessionTrend.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionTrend}>
                    <YAxis domain={[0, 12]} hide />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="reba"
                      name="REBA Risk"
                      stroke={clinicalMetrics.color}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  Start webcam tracking to plot live posture stability over time.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Kinematic Readouts + Targeted Yoga Asanas */}
        <div className="lg:col-span-5 space-y-4">
          {/* Kinematic Metrics Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Kinematic Alignment Metrics
              </h3>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white ${
                  clinicalMetrics.isAligned ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                REBA {clinicalMetrics.rulaScore}/12
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div
                className={`p-3 rounded-2xl border ${
                  clinicalMetrics.forwardHeadAngle > 15
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-500">Forward Head</span>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {clinicalMetrics.forwardHeadAngle}°
                </div>
                <span className="text-[10px] font-semibold text-slate-600">Target: ≤ 15°</span>
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  clinicalMetrics.lumbarFlexionAngle > 15
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-500">Lumbar Flexion</span>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {clinicalMetrics.lumbarFlexionAngle}°
                </div>
                <span className="text-[10px] font-semibold text-slate-600">Target: ≤ 15°</span>
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  parseFloat(clinicalMetrics.shoulderAsymmetryCm) > 1.5
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-500">Shoulder Tilt</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {clinicalMetrics.shoulderAsymmetryCm} cm
                </div>
                <span className="text-[10px] text-slate-500">Target: &lt; 1.5 cm</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Hip / Pelvic</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {clinicalMetrics.hipFlexionAngle}° / {clinicalMetrics.pelvicTiltPx}px
                </div>
                <span className="text-[10px] text-slate-500">Seated neutral</span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                clinicalMetrics.isAligned
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              {clinicalMetrics.generatedSummary}
            </div>
          </div>

          {/* Targeted Yoga Asanas for Sedentary Workers */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Recommended Yoga Asanas (Sedentary Relief)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                {recommendedAsanas.length} Matched
              </span>
            </div>

            <div className="space-y-3">
              {recommendedAsanas.map((asana) => {
                const isRunning = activeTimerId === asana.id;
                return (
                  <div
                    key={asana.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {asana.sanskritName}
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-700">
                          {asana.englishName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Relieves: {asana.targetArea}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          getAudioContext();
                          if (isRunning) {
                            setActiveTimerId(null);
                            setTimerSecondsLeft(0);
                          } else {
                            setActiveTimerId(asana.id);
                            setTimerSecondsLeft(asana.durationSeconds);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition-all ${
                          isRunning
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <RotateCcw className="w-3 h-3" /> {timerSecondsLeft}s
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> {asana.durationSeconds}s Hold
                          </>
                        )}
                      </button>
                    </div>

                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
                      {asana.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                      <strong>Desk Tip:</strong> {asana.deskTip}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}