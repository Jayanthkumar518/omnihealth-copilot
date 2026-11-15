'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Download,
  Wind,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  Stethoscope,
  BookOpen,
  RotateCcw,
  Radio,
} from 'lucide-react';

const DEFAULT_CHECKLIST = [
  {
    id: 'onset',
    title: 'Onset & Timeline',
    shortLabel: 'When It Started',
    mentioned: false,
    status: 'red',
    extractedQuotes: [],
    voicePrompt: 'When did these symptoms first start, and have they changed since then?',
  },
  {
    id: 'severity',
    title: 'Pain / Discomfort Intensity (1–10)',
    shortLabel: 'Severity (1–10)',
    mentioned: false,
    status: 'red',
    extractedQuotes: [],
    voicePrompt: 'On a scale from 1 to 10, how strong is your discomfort right now?',
  },
  {
    id: 'triggers',
    title: 'What Makes It Worse or Better',
    shortLabel: 'Triggers & Relief',
    mentioned: false,
    status: 'red',
    extractedQuotes: [],
    voicePrompt: 'What makes the symptoms feel worse or better, such as movement, food, light, or rest?',
  },
  {
    id: 'autonomic',
    title: 'Related Symptoms (Fever, Dizziness, Nausea)',
    shortLabel: 'Other Symptoms',
    mentioned: false,
    status: 'red',
    extractedQuotes: [],
    voicePrompt: 'Are you also having any fever, body heat, dizziness, nausea, or breathing trouble?',
  },
  {
    id: 'medications',
    title: 'Medicines Taken Recently',
    shortLabel: 'Medicines Taken',
    mentioned: false,
    status: 'red',
    extractedQuotes: [],
    voicePrompt: 'Have you taken any tablets or home remedies for this yet, such as Dolo, paracetamol, or ibuprofen?',
  },
];

export default function VoiceTriage() {
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [handsFreeAutoListen, setHandsFreeAutoListen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activePromptTopic, setActivePromptTopic] = useState(null);

  const [userInput, setUserInput] = useState('');
  const [history, setHistory] = useState([]);
  const [painScore, setPainScore] = useState(0);
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'hpi' | 'opqrst'
  const [showBreathing, setShowBreathing] = useState(false);

  const recognitionRef = useRef(null);
  const finalBufferRef = useRef('');
  const handsFreeRef = useRef(handsFreeAutoListen);
  const mutedRef = useRef(isMuted);

  useEffect(() => {
    handsFreeRef.current = handsFreeAutoListen;
  }, [handsFreeAutoListen]);

  useEffect(() => {
    mutedRef.current = isMuted;
    if (isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isMuted]);

  const speakText = (text, autoListenAfter = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || mutedRef.current || !text) {
      if (autoListenAfter && handsFreeRef.current) {
        startListening();
      }
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.onend = () => {
      if (autoListenAfter && handsFreeRef.current && isSessionActive) {
        setTimeout(() => startListening(), 350);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const toggleSession = () => {
    const next = !isSessionActive;
    setIsSessionActive(next);
    if (next) {
      speakText(
        "I'm ready. Tell me your symptoms in your own words, and I'll turn each detail green as you mention it.",
        true
      );
    } else {
      stopListening(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };

  const startListening = (topicLabel = null) => {
    if (!isSessionActive) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setActivePromptTopic(topicLabel);
    finalBufferRef.current = '';
    setUserInput('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalBufferRef.current += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setUserInput((finalBufferRef.current + interim).trim());
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const captured = finalBufferRef.current.trim();
      if (captured) {
        finalBufferRef.current = '';
        setUserInput('');
        submitPatientUpdate(captured, screeningAnswers, painScore, true);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = (shouldSubmit = true) => {
    if (recognitionRef.current) {
      if (!shouldSubmit) {
        finalBufferRef.current = '';
      }
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const submitPatientUpdate = async (
    newText = '',
    updatedScreening = screeningAnswers,
    updatedPain = painScore,
    fromVoice = false
  ) => {
    const cleanText = newText.trim();
    const updatedHistory = cleanText
      ? [...history, { text: cleanText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
      : history;

    if (cleanText) {
      setHistory(updatedHistory);
    }

    setIsProcessing(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/caregiver-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: cleanText,
          history: history,
          screeningAnswers: updatedScreening,
          painScore: updatedPain > 0 ? updatedPain : null,
        }),
      });

      const data = await response.json();
      if (data.success && data.caregiverResponse) {
        setReportData(data.caregiverResponse);
        const hasMissing = data.caregiverResponse.mentionedCount < data.caregiverResponse.totalRequired;
        if (cleanText) {
          speakText(data.caregiverResponse.emotionalComfort, fromVoice && hasMissing);
        }
      }
    } catch {
      alert('Could not reach FastAPI backend on port 8000. Make sure backend/main.py is running.');
    } finally {
      setIsProcessing(false);
      setActivePromptTopic(null);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;
    const text = userInput.trim();
    setUserInput('');
    submitPatientUpdate(text, screeningAnswers, painScore, false);
  };

  const handleSliderCommit = (newVal) => {
    setPainScore(newVal);
    if (newVal > 0) {
      submitPatientUpdate(`Pain intensity is ${newVal} out of 10`, screeningAnswers, newVal, false);
    }
  };

  const handleScreeningAnswer = (qId, answer) => {
    const nextAnswers = { ...screeningAnswers, [qId]: answer };
    setScreeningAnswers(nextAnswers);
    submitPatientUpdate('', nextAnswers, painScore, false);
  };

  const handleAskSpecificRedItem = (item) => {
    speakText(item.voicePrompt, false);
    setTimeout(() => {
      startListening(item.shortLabel);
    }, 2800);
  };

  const handleReadAllMissing = () => {
    const missing = auditList.filter((i) => !i.mentioned);
    if (missing.length === 0) {
      speakText('Great news! Every single required item is already green and complete.');
      return;
    }
    const questions = missing.map((m, idx) => `Number ${idx + 1}: ${m.voicePrompt}`).join(' ');
    speakText(`You have ${missing.length} details still in red. ${questions}`);
  };

  const handleResetSession = () => {
    stopListening(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setHistory([]);
    setUserInput('');
    setPainScore(0);
    setScreeningAnswers({});
    setReportData(null);
    setActiveTab('checklist');
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) return;

    const checklistRows = reportData.doctorIntakeAudit
      .map(
        (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #cbd5e1;font-weight:bold;">${item.title}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;color:${item.mentioned ? '#047857' : '#b91c1c'};font-weight:bold;">
            ${item.mentioned ? 'MENTIONED' : 'NOT YET MENTIONED'}
          </td>
          <td style="padding:8px;border:1px solid #cbd5e1;">${item.clinicalNote}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>OmniHealth Pre-Consultation Doctor Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; line-height: 1.5; }
            h1 { font-size: 20px; margin-bottom: 4px; color: #065f46; }
            .badge { display: inline-block; padding: 4px 10px; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 6px; font-size: 12px; font-weight: bold; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 14px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>OmniHealth Clinical Intake Summary</h1>
          <div class="badge">${reportData.condition} • ${reportData.urgencyLevel}</div>
          <div class="box">
            <strong>Physician HPI Clinical Summary:</strong><br/>
            ${reportData.hpiSummary}
          </div>
          <h3>Doctor Checklist Verification (${reportData.mentionedCount}/${reportData.totalRequired} Captured)</h3>
          <table>
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:8px;border:1px solid #cbd5e1;text-align:left;">Required Parameter</th>
                <th style="padding:8px;border:1px solid #cbd5e1;text-align:left;">Status</th>
                <th style="padding:8px;border:1px solid #cbd5e1;text-align:left;">Patient Details</th>
              </tr>
            </thead>
            <tbody>${checklistRows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const auditList = reportData?.doctorIntakeAudit || DEFAULT_CHECKLIST;
  const mentionedCount = reportData?.mentionedCount ?? 0;
  const totalRequired = reportData?.totalRequired ?? 5;
  const progressPercent = Math.round((mentionedCount / totalRequired) * 100);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Top Caretaker & Voice Control Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 border border-emerald-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Voice-Guided Clinical Intake
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            OmniHealth Voice Caretaker & Doctor Prep
          </h2>
          <p className="text-xs text-slate-600 max-w-xl">
            Speak naturally. Items turn <strong className="text-emerald-700">Green</strong> as you mention them, while missing details stay <strong className="text-red-600">Red</strong> so the Caretaker can ask you by voice.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
              isMuted
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            {isMuted ? 'Voice Muted' : 'Voice On'}
          </button>

          <button
            onClick={() => {
              setShowBreathing(!showBreathing);
              if (!showBreathing) {
                speakText('Let us take a slow 4-7-8 calming breath together. Inhale for 4 seconds, hold for 7, and exhale for 8.');
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Wind className="w-4 h-4 text-emerald-600" /> 4-7-8 Calm Breath
          </button>

          <button
            onClick={toggleSession}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
              isSessionActive
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isSessionActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            {isSessionActive ? 'Caretaker Active' : 'Wake Caretaker'}
          </button>
        </div>
      </div>

      {/* Guided 4-7-8 Breathing Drawer */}
      {showBreathing && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wind className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
            <p className="text-xs text-emerald-950 font-medium">
              <strong>4-7-8 Anxiety & Pain Pacing:</strong> Inhale gently through your nose (4s) → Hold softly (7s) → Exhale slowly through your mouth (8s).
            </p>
          </div>
          <button
            onClick={() => setShowBreathing(false)}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (5 cols): Voice Console + Caretaker Voice Prompt + Severity Slider */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            {/* Primary Microphone Action */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                1. Speak or Dictate
              </span>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={handsFreeAutoListen}
                  onChange={(e) => setHandsFreeAutoListen(e.target.checked)}
                  className="rounded accent-emerald-600 w-4 h-4"
                />
                <Radio className="w-3.5 h-3.5 text-emerald-600" /> Auto-Listen Follow-Ups
              </label>
            </div>

            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2.5">
              <button
                type="button"
                disabled={!isSessionActive || isProcessing}
                onClick={() => (isRecording ? stopListening(true) : startListening())}
                className={`p-5 rounded-full transition-all cursor-pointer shadow-lg disabled:opacity-40 ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse scale-105 ring-4 ring-red-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">
                  {isRecording
                    ? activePromptTopic
                      ? `Listening for: ${activePromptTopic}... (Tap to Finish)`
                      : 'Listening... Tap Mic When Done'
                    : isProcessing
                    ? 'Updating Green/Red Checklist...'
                    : 'Tap Microphone to Speak'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Continuous dictation — pause naturally and tap stop when finished
                </p>
              </div>
            </div>

            {/* Live Transcript / Manual Input */}
            <form onSubmit={handleFormSubmit} className="space-y-2.5">
              <textarea
                rows={3}
                disabled={!isSessionActive}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Your spoken words appear here live, or type directly (e.g., 'Throbbing headache since yesterday morning, feeling giddy, took Dolo 650')..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!isSessionActive || !userInput.trim() || isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Add & Check Details
                </button>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetSession}
                    title="Start Fresh"
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                )}
              </div>
            </form>

            {/* Draggable 1-10 Pain / Discomfort Slider */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Quick Discomfort Scale (1–10):</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
                  {painScore > 0 ? `${painScore} / 10` : 'Not set'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painScore}
                onChange={(e) => setPainScore(Number(e.target.value))}
                onMouseUp={(e) => handleSliderCommit(Number(e.target.value))}
                onTouchEnd={(e) => handleSliderCommit(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>1 Mild</span>
                <span>5 Moderate</span>
                <span>10 Severe</span>
              </div>
            </div>
          </div>

          {/* Caretaker Voice Guidance Card */}
          <div className="p-5 rounded-3xl bg-emerald-950 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Caretaker Voice Assistant
              </span>
              <button
                type="button"
                onClick={() =>
                  speakText(
                    reportData?.emotionalComfort ||
                      'Tap the microphone and tell me what symptoms brought you in today.'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> Repeat Aloud
              </button>
            </div>
            <p className="text-xs text-emerald-50 leading-relaxed">
              {reportData?.emotionalComfort ||
                'Tell me what you are feeling in your own words. I will track what your doctor needs in green and ask you by voice for anything still in red.'}
            </p>
            {history.length > 0 && (
              <div className="pt-2 border-t border-emerald-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  Recorded Voice Log ({history.length}):
                </span>
                <div className="max-h-20 overflow-y-auto space-y-1 text-[11px] text-emerald-100/90">
                  {history.map((entry, idx) => (
                    <div key={idx} className="truncate">
                      • "{entry.text}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Progress Bar + 3 Clean Tabs (No Overload) */}
        <div className="lg:col-span-7 p-5 md:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          {/* Top Progress & PDF Export Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">
                  Doctor Intake Readiness: {mentionedCount} of {totalRequired} Mentioned
                </span>
                <span
                  className={`font-bold ${
                    mentionedCount === totalRequired ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-red-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReadAllMissing}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> Ask Red Items
              </button>
              <button
                type="button"
                disabled={!reportData}
                onClick={handleExportPDF}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>
          </div>

          {/* Clean 3-Tab Navigation */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'checklist'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
              1. Checklist ({mentionedCount}/{totalRequired})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hpi')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'hpi'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              2. Doctor Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('opqrst')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'opqrst'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              3. OPQRST & Terms
            </button>
          </div>

          {/* TAB 1: RED (NOT MENTIONED) vs GREEN (MENTIONED) CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  <strong className="text-red-600">Red</strong> = Still needed for your doctor •{' '}
                  <strong className="text-emerald-700">Green</strong> = Captured & verified
                </span>
              </div>

              <div className="space-y-2.5">
                {auditList.map((item) => {
                  const isGreen = item.mentioned;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        isGreen
                          ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
                          : 'bg-red-50/80 border-red-300 text-red-950'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {isGreen ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                          )}
                          <div>
                            <h4 className="text-xs font-extrabold">{item.title}</h4>
                            {!isGreen && (
                              <p className="text-[11px] text-red-800 mt-0.5">{item.voicePrompt}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {isGreen ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                              Mentioned ✓
                            </span>
                          ) : (
                            <>
                              <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                                Not Mentioned
                              </span>
                              <button
                                type="button"
                                disabled={!isSessionActive || isRecording}
                                onClick={() => handleAskSpecificRedItem(item)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-red-100 text-red-700 border border-red-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                              >
                                <Mic className="w-3 h-3" /> Answer by Voice
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Exact Captured Words for Green Items */}
                      {isGreen && item.extractedQuotes?.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex flex-wrap gap-1.5">
                          {item.extractedQuotes.map((quote, qIdx) => (
                            <span
                              key={qIdx}
                              className="px-2.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-900 text-[11px] font-medium"
                            >
                              "{quote}"
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PHYSICIAN HPI SUMMARY, SAFETY ALERTS & YES/NO SCREENING */}
          {activeTab === 'hpi' && (
            <div className="space-y-4">
              {reportData ? (
                <>
                  {/* Specialty & Urgency Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-extrabold text-slate-900">{reportData.condition}</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      {reportData.urgencyLevel}
                    </span>
                  </div>

                  {/* Safety Alerts */}
                  {reportData.safetyAlerts?.length > 0 && (
                    <div className="space-y-2">
                      {reportData.safetyAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-red-50 border border-red-300 flex items-start gap-2.5 text-xs text-red-950"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-extrabold">{alert.title}:</strong> {alert.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clinical HPI Translation */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Physician HPI Summary
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(reportData.hpiSummary)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" /> Read Aloud
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">{reportData.hpiSummary}</p>
                  </div>

                  {/* 1-Click Yes/No Screening Questions */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <h4 className="text-xs font-extrabold text-slate-800">
                      Quick Doctor Screening Questions (Tap Yes or No)
                    </h4>
                    {reportData.screeningQuestions?.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span className="text-xs text-slate-700 font-medium">{q.question}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {['Yes', 'No'].map((ans) => (
                            <button
                              key={ans}
                              type="button"
                              onClick={() => handleScreeningAnswer(q.id, ans)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                                screeningAnswers[q.id] === ans
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-xs text-slate-500">
                  Speak or enter your symptoms on the left to generate your physician HPI summary.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPQRST-A BREAKDOWN, VITALS & PLAIN-LANGUAGE GLOSSARY */}
          {activeTab === 'opqrst' && (
            <div className="space-y-4">
              {reportData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(reportData.opqrst || {}).map(([label, val]) => {
                      const isMissing = val === 'Not yet mentioned';
                      return (
                        <div
                          key={label}
                          className={`p-3.5 rounded-2xl border ${
                            isMissing
                              ? 'bg-red-50/60 border-red-200'
                              : 'bg-emerald-50/60 border-emerald-200'
                          }`}
                        >
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            {label}
                          </div>
                          <div
                            className={`text-xs font-semibold mt-1 ${
                              isMissing ? 'text-red-700' : 'text-slate-900'
                            }`}
                          >
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommended Vitals */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase text-slate-600">
                      Recommended Point-of-Care Vitals
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {reportData.vitalsFocus?.map((vital, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-800"
                        >
                          {vital}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Plain-Language Glossary for Diverse Audiences */}
                  {reportData.glossary?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase text-emerald-800">
                        Everyday-to-Medical Term Translation
                      </span>
                      {reportData.glossary.map((g, idx) => (
                        <div key={idx} className="text-xs text-slate-700">
                          <strong className="capitalize text-slate-900">"{g.patientTerm}"</strong> →{' '}
                          <span className="font-semibold text-emerald-800">{g.clinicalTerm}</span> ({g.plainExplanation})
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-xs text-slate-500">
                  Your structured OPQRST-A chart and plain-language glossary will appear here once you share your symptoms.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}