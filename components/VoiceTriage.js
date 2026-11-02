'use client';
import { useState, useRef } from 'react';
import { Heart, Mic, MicOff, Volume2, ShieldCheck, Activity, Smile, Send, ClipboardList, CheckCircle2, AlertCircle, Download, Wind, Sparkles, FileText, UserCheck } from 'lucide-react';

export default function CaretakerAgent() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [history, setHistory] = useState([]);
  const [caretakerData, setCaretakerData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const recognitionRef = useRef(null);

  const toggleSession = () => {
    const newState = !isSessionActive;
    setIsSessionActive(newState);
    if (newState) {
      speakText("Hello! I am your clinical intake assistant. Speak continuously or type your symptoms. I will listen as long as you need, and you can submit when finished.");
    } else {
      setCaretakerData(null);
      setHistory([]);
      stopMicrophone();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = userInput.trim();
    if (!text || !isSessionActive) return;
    
    // Stop recording if active before submitting
    if (isRecording) {
      stopMicrophone();
    }

    setUserInput('');
    await processPatientInput(text);
  };

  const processPatientInput = async (text) => {
    setIsProcessing(true);
    const updatedHistory = [...history, { sender: 'patient', text }];

    try {
      const response = await fetch('http://127.0.0.1:8000/api/caregiver-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, history }),
      });

      const data = await response.json();
      if (data.success) {
        setHistory(updatedHistory);
        setCaretakerData(data.caregiverResponse);
        speakText(data.caregiverResponse.emotionalComfort);
      }
    } catch (err) {
      alert('Could not connect to FastAPI backend on port 8000.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMicrophone = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser. Please type your message below.");
      return;
    }

    if (isRecording) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  const startMicrophone = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keeps listening even if you pause
    recognition.interimResults = true; // Shows words as you speak
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setUserInput(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopMicrophone = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.93;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Healing Green Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-900/50 shadow-2xl flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase flex items-center gap-1.5 w-max">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Module 1: Continuous Voice & Memory Intake
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Smile className="w-7 h-7 text-emerald-400" /> OmniHealth Clinical Report Generator
          </h2>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Speak continuously without interruptions. The microphone stays active as you pause to think. Click "Audit & Verify" when you are finished to run the RAG verification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={() => { setShowBreathing(true); speakText("Let's take a calming breath together. Inhale slowly for 4 seconds, hold for 7, and exhale completely for 8."); }}
            className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-900/50 cursor-pointer shadow-md transition-all"
          >
            <Wind className="w-4 h-4 text-emerald-400" /> Calming Exercise
          </button>
          <button
            onClick={toggleSession}
            className={`px-6 py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              isSessionActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isSessionActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isSessionActive ? 'Pause Session' : 'Start Intake Session'}
          </button>
        </div>
      </div>

      {showBreathing && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-400 animate-spin" /> Guided 4-7-8 Breathing Pacing (Anxiety & Pain Relief)
            </h3>
            <button onClick={() => setShowBreathing(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">Close X</button>
          </div>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Inhale slowly through your nose for 4 seconds... Hold gently for 7 seconds... Exhale completely through your mouth for 8 seconds.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Continuous Voice & Text Console */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Continuous Voice Dictation Console
              </h3>
              {isRecording && (
                <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold animate-pulse flex items-center gap-1">
                  🔴 Listening Continuously...
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                rows={5}
                disabled={!isSessionActive}
                placeholder="Speak freely or type your symptoms. The microphone will stay on as you pause... Click Audit & Verify when done."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none resize-none disabled:opacity-40"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!isSessionActive || !userInput.trim() || isProcessing}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 text-xs shadow-md shadow-emerald-500/10"
                >
                  <Send className="w-3.5 h-3.5" /> Audit & Verify Report
                </button>
                <button
                  type="button"
                  disabled={!isSessionActive}
                  onClick={toggleMicrophone}
                  className={`px-4 py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 ${
                    isRecording ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Mic className="w-4 h-4" /> {isRecording ? 'Stop Mic' : 'Start Mic'}
                </button>
              </div>
            </form>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-slate-300">
            <span className="font-bold text-emerald-400 block mb-0.5">Continuous Listening Active</span>
            Speak your full story at your own pace. The system waits until you click submit before verifying with the backend.
          </div>
        </div>

        {/* Right: Cumulative Auditor & Report */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-emerald-400 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Cumulative Doctor Intake Audit
              </h3>
              {caretakerData && (
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button onClick={() => speakText(caretakerData.emotionalComfort)} className="text-emerald-400 hover:text-emerald-300 cursor-pointer">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {caretakerData ? (
              <div className="space-y-4 text-xs animate-fadeIn max-h-[380px] overflow-y-auto pr-1">
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <strong className="text-emerald-400 uppercase text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Caretaker Validation:
                  </strong>
                  <p className="text-slate-200 leading-relaxed">{caretakerData.emotionalComfort}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <strong className="text-cyan-400 uppercase text-xs tracking-wide flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-cyan-400" /> Doctor Intake Checklist (Verified):
                  </strong>
                  <div className="space-y-2">
                    {caretakerData.doctorIntakeAudit?.map((item, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                          item.mentioned
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow-sm'
                            : 'bg-amber-950/20 border-amber-500/50 text-amber-200 shadow-lg'
                        }`}
                      >
                        {item.mentioned ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                        )}
                        <div className="flex-1">
                          <span className={item.mentioned ? 'text-xs font-semibold' : 'text-sm font-extrabold text-amber-300 block'}>
                            {item.title}
                          </span>
                          <span className="block text-[11px] mt-0.5 opacity-90">
                            {item.mentioned ? '✅ Verified in narrative' : '⚠️ Still Needed — Tell your assistant about this!'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-emerald-400 uppercase text-[10px]">Suggested Clinical Focus:</strong>
                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                    {caretakerData.suggestedClinicalPlan || "Perform physical examination and evaluate reported symptoms."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-500">Click Start Mic, speak your complete symptom narrative at your own pace, and click "Audit & Verify Report" when finished.</p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Microphone Status: {isRecording ? '🟢 Listening (Continuous)' : '⚪ Ready'}</span>
            <span className="text-emerald-400 font-semibold">Zero Hardcoding</span>
          </div>
        </div>
      </div>
    </div>
  );
}