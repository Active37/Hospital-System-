import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, Check, AlertCircle, ShieldAlert, Heart, PhoneCall, HelpCircle, ArrowRight, RotateCcw, Mic, MicOff, Sparkles } from 'lucide-react';
import { Symptom } from '../types';
import { SYMPTOMS_LIST } from '../data';

interface SymptomTriageProps {
  onTriageComplete?: (outcome: string) => void;
}

export default function SymptomTriage({ onTriageComplete }: SymptomTriageProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [step, setStep] = useState<'select' | 'questions' | 'result'>('select');
  
  // Question answers
  const [duration, setDuration] = useState<string>('');
  const [hasEmergencySigns, setHasEmergencySigns] = useState<boolean | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const detectSymptomsFromText = (text: string): Symptom[] => {
    const normalized = text.toLowerCase();
    const detected: Symptom[] = [];

    // Keyword mapping for common symptoms to their system IDs
    const mapping: { [key: string]: string } = {
      'headache': 'sym-1',
      'head ache': 'sym-1',
      'migraine': 'sym-2',
      'fever': 'sym-3', // Default to low grade unless specified
      'cough': 'sym-5',
      'breath': 'sym-6',
      'throat': 'sym-7',
      'chest': 'sym-8',
      'muscle': 'sym-9',
      'ache': 'sym-9',
      'joint': 'sym-10',
      'swelling': 'sym-10',
      'nausea': 'sym-11',
      'indigestion': 'sym-11',
      'dizzy': 'sym-12',
      'dizziness': 'sym-12',
      'faint': 'sym-12',
    };

    // Specific severe matches first
    if (normalized.includes('high fever') || normalized.includes('severe fever') || normalized.includes('hot')) {
      const highFever = SYMPTOMS_LIST.find((s) => s.id === 'sym-4');
      if (highFever) detected.push(highFever);
    } else if (normalized.includes('fever') || normalized.includes('temperature')) {
      const lowFever = SYMPTOMS_LIST.find((s) => s.id === 'sym-3');
      if (lowFever) detected.push(lowFever);
    }

    if (normalized.includes('migraine') || normalized.includes('severe headache')) {
      const migraine = SYMPTOMS_LIST.find((s) => s.id === 'sym-2');
      if (migraine) detected.push(migraine);
    } else if (normalized.includes('headache') || normalized.includes('head ache')) {
      const headache = SYMPTOMS_LIST.find((s) => s.id === 'sym-1');
      if (headache) detected.push(headache);
    }

    // Map other matching terms
    Object.entries(mapping).forEach(([keyword, id]) => {
      // Skip if already handled by the custom logic above
      if (id === 'sym-1' || id === 'sym-2' || id === 'sym-3' || id === 'sym-4') return;

      if (normalized.includes(keyword)) {
        const sym = SYMPTOMS_LIST.find((s) => s.id === id);
        if (sym && !detected.some((d) => d.id === sym.id)) {
          detected.push(sym);
        }
      }
    });

    return detected;
  };

  const startListening = () => {
    setSpeechError(null);
    setSpeechFeedback(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please try Chrome, Safari, or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechFeedback('Listening... Speak your symptoms clearly (e.g. "fever", "chest pain").');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        
        const detected = detectSymptomsFromText(transcript);
        if (detected.length > 0) {
          setSelectedSymptoms((prev) => {
            const next = [...prev];
            detected.forEach((sym) => {
              if (!next.some((s) => s.id === sym.id)) {
                next.push(sym);
              }
            });
            return next;
          });
          setSpeechFeedback(`Recognized: "${transcript}" — Automatically selected: ${detected.map(d => d.name).join(', ')}`);
        } else {
          setSpeechFeedback(`Recognized: "${transcript}". No exact matching symptoms found in list, but you can search manually.`);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access denied. Please grant microphone permission to record symptoms.');
        } else {
          setSpeechError(`Error capturing speech: ${event.error || 'Check microphone.'}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception', err);
      setSpeechError('Failed to start speech recognition.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition', err);
      }
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSymptom = (sym: Symptom) => {
    if (selectedSymptoms.some((s) => s.id === sym.id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s.id !== sym.id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleStartQuestions = () => {
    if (selectedSymptoms.length === 0) return;
    setStep('questions');
  };

  const getTriageOutcome = () => {
    const hasSevereSymptom = selectedSymptoms.some((s) => s.severity === 'severe');
    const isDurationLong = duration === 'long'; // > 3 days

    if (hasEmergencySigns === true || hasSevereSymptom) {
      return {
        level: 'emergency',
        title: 'Emergency Medical Care Required',
        color: 'text-red-700 bg-red-50 border-red-200',
        badgeColor: 'bg-red-500 text-white',
        icon: ShieldAlert,
        action: 'Go to the nearest Emergency Room (ER) immediately or dial 911.',
        guidelines: [
          'Do not drive yourself if experiencing chest pain, dizziness, or heavy bleeding.',
          'Bring all current prescription bottles with you.',
          'City General Hospital ER wait time is currently 14 minutes.',
        ],
        contact: 'ER Direct: (555) 019-9110',
      };
    }

    if (isDurationLong || selectedSymptoms.some((s) => s.severity === 'moderate')) {
      return {
        level: 'urgent',
        title: 'Urgent Care Evaluation Advised',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badgeColor: 'bg-amber-500 text-white',
        icon: AlertCircle,
        action: 'Visit an Urgent Care Center or book an expedited appointment today.',
        guidelines: [
          'Best suited for severe symptoms that are not immediately life-threatening.',
          'Consider our Walk-In Clinic (Hours: 8:00 AM - 10:00 PM).',
          'Current Urgent Care wait time: 8 minutes.',
        ],
        contact: 'Urgent Care Clinic: (555) 019-9120',
      };
    }

    if (duration === 'moderate' || selectedSymptoms.length > 2) {
      return {
        level: 'routine',
        title: 'Primary Care Consultation Recommended',
        color: 'text-teal-700 bg-teal-50 border-teal-200',
        badgeColor: 'bg-teal-600 text-white',
        icon: Stethoscope,
        action: 'Schedule a virtual consultation or clinic visit with Dr. Rostova.',
        guidelines: [
          'Excellent for mild symptoms of 1 to 3 days duration.',
          'Keep tracking and logging your daily vitals in the Health tab.',
          'Drink plenty of warm fluids and rest.',
        ],
        contact: 'Clinic Scheduling: (555) 019-9130',
      };
    }

    return {
      level: 'home',
      title: 'Rest & Home Care Guided self-care',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      icon: Heart,
      action: 'Rest, hydrate, and monitor your symptoms closely from home.',
      guidelines: [
        'Over-the-counter medicine can help alleviate mild discomfort.',
        'If symptoms persist for more than 48 hours, schedule a primary care checkup.',
        'Log your temperature and vitals once every 12 hours.',
      ],
      contact: 'Nurse Advisory Line (24/7): (555) 019-9150',
    };
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setStep('select');
    setDuration('');
    setHasEmergencySigns(null);
    setSearchQuery('');
  };

  const filteredSymptoms = SYMPTOMS_LIST.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="symptom-triage-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">Symptom Assessment & Triage</h3>
            <p className="text-xs text-slate-500">Interactive symptom-based clinical triage</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-5">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select your current symptoms
                  </h4>
                  {isListening && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                      Listening...
                    </span>
                  )}
                </div>

                {/* Input + Mic Button Group */}
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search or click mic to speak symptoms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-3 pr-8 py-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 transition ${
                        isListening
                          ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 ring-1 ring-emerald-100/50 bg-emerald-50/5'
                          : 'border-slate-200 focus:ring-slate-900 focus:border-slate-900'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer text-[10px] font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={toggleListening}
                    type="button"
                    className={`p-2 rounded-lg border transition flex items-center justify-center shrink-0 cursor-pointer ${
                      isListening
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs animate-pulse'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                    title={isListening ? "Stop listening" : "Record symptoms with your voice"}
                  >
                    {isListening ? (
                      <MicOff className="w-3.5 h-3.5 animate-bounce" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Speech feedback, instruction or errors */}
                <AnimatePresence>
                  {(speechFeedback || speechError) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {speechError ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-600 font-medium bg-rose-50 border border-rose-100 p-2 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{speechError}</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 text-[10px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-semibold block text-indigo-900">Voice Assistant:</span>
                            <span className="text-indigo-700">{speechFeedback}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Visual Audio Waveform when listening */}
                {isListening && (
                  <div className="flex items-center justify-center gap-1.5 py-1 bg-emerald-50/20 border border-dashed border-emerald-100 rounded-lg">
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono mr-1">Capture:</span>
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-0.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="w-0.5 h-3 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.1s]" />
                      <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                      <span className="w-0.5 h-3.5 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.15s]" />
                      <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {filteredSymptoms.map((sym) => {
                  const isChecked = selectedSymptoms.some((s) => s.id === sym.id);
                  return (
                    <button
                      key={sym.id}
                      onClick={() => toggleSymptom(sym)}
                      className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50/50 border-emerald-500 text-slate-800'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[11px] font-medium truncate">{sym.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedSymptoms.length} symptom(s) selected
                </span>
                <button
                  onClick={handleStartQuestions}
                  disabled={selectedSymptoms.length === 0}
                  className={`inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedSymptoms.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Assess Health Status
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'questions' && (
            <motion.div
              key="questions-step"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 py-1"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Secondary Clinical Screening
              </h4>

              {/* Duration Question */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  How long have you felt these symptoms?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'short', label: 'Less than 24 hrs' },
                    { val: 'moderate', label: '1 to 3 Days' },
                    { val: 'long', label: 'More than 3 Days' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setDuration(opt.val)}
                      className={`p-2 rounded-lg border text-center transition text-xs font-medium cursor-pointer ${
                        duration === opt.val
                          ? 'bg-slate-900 border-slate-950 text-white'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severe Signs Question */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 leading-normal">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Are you experiencing any tightness in chest, difficulty catching breath, or severe fainting spells?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setHasEmergencySigns(true)}
                    className={`p-2 rounded-lg border text-center transition text-xs font-medium cursor-pointer ${
                      hasEmergencySigns === true
                        ? 'bg-red-600 border-red-700 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                    }`}
                  >
                    Yes, actively
                  </button>
                  <button
                    onClick={() => setHasEmergencySigns(false)}
                    className={`p-2 rounded-lg border text-center transition text-xs font-medium cursor-pointer ${
                      hasEmergencySigns === false
                        ? 'bg-slate-900 border-slate-950 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                    }`}
                  >
                    No, none
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                <button
                  onClick={() => setStep('select')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('result')}
                  disabled={!duration || hasEmergencySigns === null}
                  className={`px-4.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    duration && hasEmergencySigns !== null
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Complete Screen
                </button>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Outcome Badge and Card */}
              {(() => {
                const outcome = getTriageOutcome();
                const Icon = outcome.icon;
                return (
                  <div className={`p-4 rounded-xl border ${outcome.color} space-y-3`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 ${outcome.badgeColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-75">
                          Triage Recommendation
                        </span>
                        <h4 className="text-sm font-bold mt-0.5 leading-tight">{outcome.title}</h4>
                      </div>
                    </div>

                    <p className="text-xs font-semibold leading-relaxed">
                      {outcome.action}
                    </p>

                    {/* Guidelines */}
                    <div className="border-t border-slate-200/50 pt-2.5 space-y-1.5">
                      <span className="block text-[10px] uppercase font-bold text-slate-500">
                        Care Instructions:
                      </span>
                      <ul className="space-y-1 text-[10px] font-medium leading-relaxed">
                        {outcome.guidelines.map((line, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 shrink-0">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Dial button for immediate realistic touch */}
                    <div className="flex items-center justify-between pt-1.5 text-[10px] font-bold text-slate-600">
                      <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded border border-slate-200/30">
                        <PhoneCall className="w-3 h-3 text-slate-500" />
                        <span>{outcome.contact}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Restart assessment */}
              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Assessment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer warning */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[10px] leading-relaxed text-slate-400">
          <strong className="text-slate-500">Clinical Disclaimer:</strong> This symptom assessor is a triage guidance tool for clinic routing purposes. It is not a substitute for professional clinical judgments or diagnostic procedures. If you have any serious chest pressure or trouble breathing, contact local emergency services immediately.
        </div>
      </div>
    </div>
  );
}
