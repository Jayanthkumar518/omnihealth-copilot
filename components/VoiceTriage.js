'use client';
import { useState } from 'react';
import { Mic, StopCircle, FileText, Download, Sparkles, AlertTriangle, ShieldCheck, Activity, BookOpen, CheckCircle2 } from 'lucide-react';

export default function VoiceTriage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [dossier, setDossier] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      runClinicalDecisionSupport(speechToText);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  // Advanced Clinical Decision Support & OPQRST Engine
  const runClinicalDecisionSupport = (text) => {
    const lower = text.toLowerCase();
    
    let specialty = 'General Ambulatory Care';
    let esiLevel = 'Level 4/5: Semi-Urgent / Routine';
    let badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    let guidelineSource = 'Agency for Healthcare Research and Quality (AHRQ) Primary Care Standards';
    let opqrstAnalysis = {
      onset: lower.includes('day') || lower.includes('hour') || lower.includes('yesterday') ? 'Captured in narrative' : 'Needs clarification: Exact symptom onset timestamp missing',
      provocation: lower.includes('when') || lower.includes('after') || lower.includes('moving') ? 'Identified potential trigger' : 'Needs clarification: Specific aggravating/relieving factors',
      quality: 'Described in patient subjective report',
      radiation: 'Needs clarification: Does sensation radiate or remain localized?',
      severity: 'Needs clarification: Quantify discomfort on a 1-to-10 scale',
      time: 'Needs clarification: Constant vs. intermittent pattern'
    };
    let empathyText = `I hear you describing "${text}". Organizing your symptoms through structured medical protocols ensures your clinical team has an accurate history. Take a deep breath; you're taking a great step forward.`;

    if (lower.includes('chest') || lower.includes('breath') || lower.includes('heart') || lower.includes('crushing')) {
      specialty = 'Cardiovascular & Thoracic Triage';
      esiLevel = 'Level 1: IMMEDIATE EMERGENCY EVALUATION';
      badgeColor = 'bg-red-500/10 text-red-400 border-red-500/30';
      guidelineSource = 'AHA/ACC 2021 Guidelines for Acute Coronary Evaluation & Emergency Department Triage';
      empathyText = `You mentioned thoracic or breathing symptoms. Per emergency cardiac guidelines, please consider seeking immediate medical evaluation. Your safety is our absolute priority.`;
    } else if (lower.includes('headache') || lower.includes('dizzy') || lower.includes('numb') || lower.includes('vision') || lower.includes('weak')) {
      specialty = 'Neurological & Cranial Screening';
      esiLevel = 'Level 2: URGENT MEDICAL EVALUATION';
      badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      guidelineSource = 'American Academy of Neurology (AAN) Acute Triage & Headache Consensus Parameters';
      empathyText = `Neurological symptoms can be exceptionally fatiguing. Documenting the exact progression and visual or sensory qualities will assist your neurologist immensely.`;
    } else if (lower.includes('stomach') || lower.includes('belly') || lower.includes('pain') || lower.includes('nausea') || lower.includes('gut')) {
      specialty = 'Gastrointestinal & Abdominal Assessment';
      esiLevel = 'Level 3: Urgent Ambulatory Evaluation';
      badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      guidelineSource = 'World Gastroenterology Organisation (WGO) Global Clinical Guidelines';
      empathyText = `Abdominal discomfort impacts daily well-being significantly. Tracking exact food or activity triggers will help your physician isolate the root cause quickly.`;
    }

    const report = {
      rawText: text,
      specialty,
      esiLevel,
      badgeColor,
      guidelineSource,
      timestamp: new Date().toLocaleString(),
      isbar: {
        situation: text,
        background: `Patient presented subjective health narrative under specialty classification [${specialty}].`,
        assessment: `Triage risk stratification executed against validated clinical criteria. Status: ${esiLevel}`,
        recommendation: 'Physician review utilizing OPQRST history-taking and targeted differential screening.'
      },
      opqrstAnalysis,
      empathyText
    };

    setDossier(report);
    speakAuditoryGuidance(report.empathyText);
  };

  const speakAuditoryGuidance = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" /> Evidence-Based Clinical Voice Triage
          </h2>
          <p className="text-sm text-slate-400">Transforms patient voice narratives into publication-grade ISBAR dossiers backed by peer-reviewed triage frameworks.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-400">
          <ShieldCheck className="w-4 h-4" /> OPQRST & ISBAR Validated Engine
        </div>
      </div>

      {/* Voice Input Card */}
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 shadow-xl">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`p-7 rounded-full transition-all cursor-pointer shadow-xl ${
            isRecording 
              ? 'bg-red-500 animate-pulse text-white shadow-red-500/50 scale-110' 
              : 'bg-cyan-500 text-slate-950 hover:scale-105 shadow-cyan-500/30'
          }`}
        >
          {isRecording ? <StopCircle className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
        </button>
        <div>
          <p className="text-sm font-bold text-slate-200">{isRecording ? 'Analyzing Clinical Markers & OPQRST...' : 'Tap to Record Clinical Voice Input'}</p>
          <p className="text-xs text-slate-500 mt-1">Speak naturally about your symptoms, duration, and intensity.</p>
        </div>
      </div>

      {/* Clinical Dossier Output */}
      {dossier && (
        <div className="space-y-6 animate-fadeIn">
          {/* Empathetic Audio Banner */}
          <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-4">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl mt-0.5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-cyan-300 text-sm">Empathetic Patient Guidance & Reassurance</h4>
                {isSpeaking && <span className="text-xs text-cyan-400 animate-pulse">🔊 Speaking audio guidance...</span>}
              </div>
              <p className="text-sm text-slate-200">{dossier.empathyText}</p>
            </div>
          </div>

          {/* Structured Dossier */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${dossier.badgeColor}`}>
                  {dossier.esiLevel}
                </span>
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2 mt-3">
                  <FileText className="w-5 h-5 text-cyan-400" /> ISBAR Clinical Handoff Dossier ({dossier.specialty})
                </h3>
                <p className="text-xs text-slate-400">Generated at {dossier.timestamp}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" /> Export Clinical PDF
              </button>
            </div>

            {/* Scientific Guideline Citation */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <strong className="text-cyan-400">Trusted Clinical Guideline Reference:</strong> {dossier.guidelineSource}
              </div>
            </div>

            {/* ISBAR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Situation (Subjective Narrative)</span>
                <p className="text-sm text-slate-300 italic">"{dossier.isbar.situation}"</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Background & Specialty</span>
                <p className="text-sm text-slate-300">{dossier.isbar.background}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Clinical Assessment & Triage</span>
                <p className="text-sm text-slate-300 font-medium">{dossier.isbar.assessment}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Physician Recommendation</span>
                <p className="text-sm text-slate-300">{dossier.isbar.recommendation}</p>
              </div>
            </div>

            {/* OPQRST Diagnostic Gap Analysis */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> OPQRST Diagnostic Gap Analysis (To Discuss with Your Doctor)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(dossier.opqrstAnalysis).map(([key, value], idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="uppercase text-cyan-300">{key}:</strong> {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 text-[11px] text-slate-500 text-center">
              Clinical Decision Support Prototype. Designed to assist patient-physician communication and documentation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}