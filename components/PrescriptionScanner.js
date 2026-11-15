'use client';
import { useState } from 'react';
import {
  Upload,
  Pill,
  ShieldCheck,
  Clock,
  Droplets,
  Sparkles,
  BellRing,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Volume2,
  ExternalLink,
  FileText,
} from 'lucide-react';

export default function PrescriptionScanner() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [manualText, setManualText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  // Active Learning / Handwriting Correction State
  const [ocrCorrectionPattern, setOcrCorrectionPattern] = useState('');
  const [correctedDrugName, setCorrectedDrugName] = useState('');
  const [learningStatus, setLearningStatus] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setErrorInfo(null);
  };

  const speakAudio = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnalyze = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const textToSend = overrideText !== null ? overrideText : manualText;
    if (!file && !textToSend.trim()) {
      alert('Please upload a prescription image or type/paste the prescription text.');
      return;
    }

    setLoading(true);
    setErrorInfo(null);

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (textToSend.trim()) formData.append('manual_text', textToSend.trim());

    try {
      const res = await fetch('http://127.0.0.1:8000/api/parse-prescription-rag', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setScanResult(data);
        setErrorInfo(null);
        const names = data.verifiedMedications.map((m) => m.medicationName).join(', ');
        speakAudio(
          `Verified ${data.verifiedMedications.length} medication: ${names}. Daily hydration target adjusted to ${data.hydrationSafetyBuffer.adjustedDailyGoalMl} milliliters.`
        );
      } else {
        setScanResult(null);
        setErrorInfo(data);
        if (data.unmatchedFragments?.length > 0) {
          setOcrCorrectionPattern(data.unmatchedFragments[0]);
        }
      }
    } catch {
      alert('Could not reach FastAPI backend on port 8000. Make sure backend/main.py is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeachModel = async (e) => {
    e.preventDefault();
    if (!ocrCorrectionPattern.trim() || !correctedDrugName.trim()) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/prescription-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrPattern: ocrCorrectionPattern.trim(),
          correctedDrug: correctedDrugName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLearningStatus(data.message);
        const updatedText = `${manualText} ${correctedDrugName.trim()}`.trim();
        setManualText(updatedText);
        setCorrectedDrugName('');
        await handleAnalyze(null, updatedText);
      }
    } catch {
      alert('Failed to save handwriting training pattern.');
    }
  };

  const triggerBrowserAlarm = (timeString, actionText) => {
    speakAudio(`Medication reminder set for ${timeString}. ${actionText}`);
    alert(`Medication Reminder Set\nTime: ${timeString}\nAction: ${actionText}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-blue-50 border border-indigo-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Module 2: Handwriting ML (.joblib) + OpenFDA & PubMed RAG
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-indigo-600" /> Verified Prescription & Practical Hydration Engine
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            Enhances doctor handwriting via OpenCV, resolves drug names with a trained character n-gram model, verifies benefits via OpenFDA, and computes literature-backed hydration targets from PubMed.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-indigo-200 text-xs font-bold text-indigo-800 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Zero-Hallucination Evidence Mode
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): Slip Upload + Optional Text + Active Learning Box */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleAnalyze} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
              1. Upload Medical Slip or Enter Text
            </span>

            <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 transition-all cursor-pointer text-center space-y-2">
              <Upload className="w-7 h-7 text-indigo-600" />
              <div className="text-xs font-bold text-slate-800">
                {file ? file.name : 'Click to Upload Doctor Prescription (JPG, PNG)'}
              </div>
              <span className="text-[11px] text-slate-500">
                Supports handwritten Rx slips & printed clinic charts
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {previewUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center">
                <img src={previewUrl} alt="Prescription Preview" className="object-contain max-h-48 w-full" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">
                Optional: Add / Paste Prescription Line (e.g. "Tab. Augmentin 625 1-0-1, Pan 40 OD")
              </label>
              <textarea
                rows={2}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type or supplement any handwritten text here..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!file && !manualText.trim())}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-all shadow-sm"
            >
              <Pill className="w-4 h-4" />
              {loading ? 'Running OpenCV + OpenFDA + PubMed RAG...' : 'Verify Prescription & Hydration'}
            </button>
          </form>

          {/* Active Learning / Teach Handwriting Card */}
          <form onSubmit={handleTeachModel} className="p-5 rounded-3xl bg-slate-900 text-white space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" /> Teach Handwriting Model (.joblib)
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If a doctor's handwriting was extra cursive, link the misread word to the real medicine name. It saves to SQLite and retrains the model immediately.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={ocrCorrectionPattern}
                onChange={(e) => setOcrCorrectionPattern(e.target.value)}
                placeholder="Misread OCR text..."
                className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-indigo-400 focus:outline-none"
              />
              <input
                type="text"
                value={correctedDrugName}
                onChange={(e) => setCorrectedDrugName(e.target.value)}
                placeholder="Actual drug (e.g. Dolo 650)"
                className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!ocrCorrectionPattern.trim() || !correctedDrugName.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-40 transition-all"
            >
              Save & Retrain Handwriting Model
            </button>
            {learningStatus && (
              <p className="text-[11px] text-emerald-400 font-semibold">{learningStatus}</p>
            )}
          </form>
        </div>

        {/* RIGHT COLUMN (7 cols): Verified Clinical Output */}
        <div className="lg:col-span-7 space-y-4">
          {/* Anti-Hallucination Low-Confidence Notice */}
          {errorInfo && (
            <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-amber-950">
                    Verification Safeguard Triggered (No Guessing)
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">{errorInfo.error}</p>
                </div>
              </div>
              {errorInfo.rawOcrExtractedText && (
                <div className="p-3 rounded-xl bg-white border border-amber-200 text-[11px] text-slate-700 font-mono">
                  <strong>Raw OCR Captured:</strong> {errorInfo.rawOcrExtractedText}
                </div>
              )}
            </div>
          )}

          {scanResult ? (
            <>
              {/* Practical Daily Hydration Summary Banner (Linked to Module 3) */}
              <div className="p-5 rounded-3xl bg-blue-50 border-2 border-blue-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-600" /> Practical Hydration Protocol (Module 3 Link)
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold">
                    Target: {scanResult.hydrationSafetyBuffer.adjustedDailyGoalMl} mL / day
                  </span>
                </div>
                <p className="text-xs text-blue-950 leading-relaxed">
                  {scanResult.hydrationSafetyBuffer.clinicalRationale}
                </p>
              </div>

              {/* Verified Medications List */}
              <div className="space-y-4">
                {scanResult.verifiedMedications.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                  >
                    {/* Top Row: Name, Composition, Confidence */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <h3 className="text-base font-extrabold text-slate-900">
                            {med.medicationName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                            {med.dosage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          <strong>Active Composition:</strong> {med.composition} • <em>{med.drugClass}</em>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                          Match: {med.confidenceScore}%
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            speakAudio(
                              `${med.medicationName}, ${med.composition}. ${med.howItHelps}. Hydration advice: ${med.renalHydrationImpact}`
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Read Medication Info Aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Benefits & Dosing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-700">
                          Therapeutic Benefits (OpenFDA Verified)
                        </span>
                        <p className="text-slate-800 leading-relaxed">{med.howItHelps}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-blue-800">
                          Practical Drug Hydration Rule (+{med.extraDailyWaterMl} mL/day)
                        </span>
                        <p className="text-blue-950 leading-relaxed">{med.renalHydrationImpact}</p>
                      </div>
                    </div>

                    {/* Schedule & FDA Safety Note */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                      <span>
                        <strong>Schedule:</strong> {med.scheduleTiming} ({med.perDoseWaterMl} mL water per dose)
                      </span>
                      <span className="text-slate-400">Matched OCR: "{med.matchedOcrFragment}"</span>
                    </div>

                    {/* Live PubMed Literature Extracts */}
                    {med.pubmedExtracts?.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-700" /> Supporting PubMed Literature Extracts
                        </span>
                        <div className="space-y-1.5">
                          {med.pubmedExtracts.map((pub) => (
                            <div key={pub.pmid} className="text-[11px] text-slate-800 flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-emerald-800">[PMID: {pub.pmid}]</span>{' '}
                                {pub.title}{' '}
                                <span className="text-slate-500">
                                  ({pub.journal}, {pub.pubDate})
                                </span>
                              </div>
                              <a
                                href={pub.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5 shrink-0"
                              >
                                PubMed <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Smart Dosing Alarms */}
              {scanResult.smartAlarmSchedule?.length > 0 && (
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" /> One-Tap Dosing & Water Reminders
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {scanResult.smartAlarmSchedule.map((alarm, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="text-xs">
                          <div className="font-extrabold text-indigo-700">{alarm.time}</div>
                          <div className="text-slate-700 text-[11px]">{alarm.action}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerBrowserAlarm(alarm.time, alarm.action)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <BellRing className="w-3 h-3" /> Set
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw OCR Audit Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Multi-Pass OpenCV + Tesseract Raw Text
                </span>
                <p className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap">
                  {scanResult.rawOcrExtractedText}
                </p>
              </div>
            </>
          ) : (
            !errorInfo && (
              <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
                <Pill className="w-8 h-8 text-indigo-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">Ready to Analyze Prescription Slip</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Upload a handwritten or printed prescription on the left. Every identified medicine is cross-checked against OpenFDA labels and live PubMed hydration literature.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}