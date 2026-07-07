import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, Check, X, Volume2, VolumeX, RefreshCw, Sun, Sunset, Moon, Sunrise, Clock, AlertCircle } from 'lucide-react';
import { Prescription } from '../types';

export interface ToastMessage {
  id: string;
  prescriptionId: string;
  name: string;
  dosage: string;
  scheduledTime: string;
  type: 'due' | 'overdue';
}

interface MedicationNotifierProps {
  prescriptions: Prescription[];
  onToggleTaken: (id: string) => void;
  currentPortalTime: Date;
}

export function MedicationNotifier({
  prescriptions,
  onToggleTaken,
  currentPortalTime,
}: MedicationNotifierProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('hospital_med_sound');
    return saved !== 'false';
  });
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  // Listen to sound settings from storage (synced across simulator and toaster)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('hospital_med_sound');
      setSoundEnabled(saved !== 'false');
    };
    window.addEventListener('storage', handleStorageChange);
    // Also poll occasionally or rely on state updates
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const toggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    localStorage.setItem('hospital_med_sound', String(nextSound));
  };

  // Convert 12-hour string (e.g. "09:30 AM") to hour and minutes
  const parse12hTime = (timeStr: string) => {
    const [time, modifier] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) {
      hours = 0;
    }
    if (modifier === 'PM') {
      hours += 12;
    }
    return { hours, minutes };
  };

  // Play a clinical notification chime using Web Audio API
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.12, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(587.33, now, 0.45); // D5
      playTone(880, now + 0.12, 0.55); // A5
    } catch (err) {
      console.warn('Audio feedback blocked or unsupported:', err);
    }
  };

  // Monitor prescriptions and trigger reminders
  useEffect(() => {
    const currentHours = currentPortalTime.getHours();
    const currentMinutes = currentPortalTime.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    prescriptions.forEach((rx) => {
      if (!rx.scheduledTimes) return;

      rx.scheduledTimes.forEach((timeStr) => {
        const { hours, minutes } = parse12hTime(timeStr);
        const scheduledTotalMinutes = hours * 60 + minutes;

        // A medication is due if:
        // 1. Current time is past or equal to scheduled time
        // 2. It hasn't been marked taken today
        const isOverdue = currentTotalMinutes >= scheduledTotalMinutes && !rx.takenToday;
        
        const notificationKey = `${rx.id}-${timeStr}-${currentPortalTime.toDateString()}`;

        if (isOverdue && !dismissedKeys.has(notificationKey) && !notifiedKeysRef.current.has(notificationKey)) {
          // Check if this toast is already showing
          setToasts((prev) => {
            if (prev.some((t) => t.id === notificationKey)) return prev;
            
            // Add a new toast
            const newToast: ToastMessage = {
              id: notificationKey,
              prescriptionId: rx.id,
              name: rx.name,
              dosage: rx.dosage,
              scheduledTime: timeStr,
              type: currentTotalMinutes - scheduledTotalMinutes > 30 ? 'overdue' : 'due',
            };
            
            // Play chime
            setTimeout(() => playAlertChime(), 50);
            
            return [...prev, newToast];
          });
          
          notifiedKeysRef.current.add(notificationKey);
        }
      });
    });
  }, [currentPortalTime, prescriptions, dismissedKeys]);

  // If medications are marked as taken externally, clean up corresponding toasts automatically
  useEffect(() => {
    setToasts((prev) => prev.filter((t) => {
      const rx = prescriptions.find((p) => p.id === t.prescriptionId);
      return rx ? !rx.takenToday : true;
    }));
  }, [prescriptions]);

  // Handle marking taken from toast
  const handleToastAction = (prescriptionId: string, toastId: string) => {
    onToggleTaken(prescriptionId);
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const dismissToast = (toastId: string) => {
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(toastId);
      return next;
    });
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  return (
    <div id="medication-toast-container" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className={`p-4 rounded-2xl shadow-xl border text-slate-900 pointer-events-auto flex gap-3.5 bg-white ${
              toast.type === 'overdue' 
                ? 'border-rose-100 bg-rose-50/20' 
                : 'border-indigo-100 bg-indigo-50/20'
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 h-fit ${
              toast.type === 'overdue' 
                ? 'bg-rose-100 text-rose-600' 
                : 'bg-indigo-100 text-indigo-600'
            }`}>
              <Pill className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                  toast.type === 'overdue' ? 'text-rose-600 font-sans' : 'text-indigo-600 font-sans'
                }`}>
                  {toast.type === 'overdue' ? '⚠️ Medication Overdue' : '⏰ Medication Scheduled'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleSound}
                    className="p-1 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={soundEnabled ? "Mute chimes" : "Unmute chimes"}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                  </button>
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <h5 className="text-sm font-bold text-slate-900 mt-1">
                {toast.name} <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded ml-1 font-mono">{toast.dosage}</span>
              </h5>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Scheduled for <strong className="font-bold">{toast.scheduledTime}</strong>. Take your prescribed dosage to keep your vitals stable.
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleToastAction(toast.prescriptionId, toast.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark as Taken
                </button>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer"
                >
                  Snooze
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface MedicationTimeSimulatorProps {
  currentPortalTime: Date;
  setCurrentPortalTime: React.Dispatch<React.SetStateAction<Date>>;
  prescriptions: Prescription[];
}

export function MedicationTimeSimulator({
  currentPortalTime,
  setCurrentPortalTime,
  prescriptions,
}: MedicationTimeSimulatorProps) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('hospital_med_sound');
    return saved !== 'false';
  });

  const toggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    localStorage.setItem('hospital_med_sound', String(nextSound));
  };

  const formatPortalTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatPortalDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const addMinutes = (mins: number) => {
    setCurrentPortalTime((prev) => new Date(prev.getTime() + mins * 60 * 1000));
  };

  const jumpToTime = (hours: number, minutes: number) => {
    setCurrentPortalTime((prev) => {
      const next = new Date(prev);
      next.setHours(hours, minutes, 0, 0);
      return next;
    });
  };

  const resetToSystemTime = () => {
    setCurrentPortalTime(new Date());
  };

  // Check if any medication is currently overdue
  const parse12hTime = (timeStr: string) => {
    const [time, modifier] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) {
      hours = 0;
    }
    if (modifier === 'PM') {
      hours += 12;
    }
    return { hours, minutes };
  };

  const getOverdueCount = () => {
    const currentHours = currentPortalTime.getHours();
    const currentMinutes = currentPortalTime.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    let count = 0;
    prescriptions.forEach((rx) => {
      if (!rx.scheduledTimes) return;
      rx.scheduledTimes.forEach((timeStr) => {
        const { hours, minutes } = parse12hTime(timeStr);
        const scheduledTotalMinutes = hours * 60 + minutes;
        if (currentTotalMinutes >= scheduledTotalMinutes && !rx.takenToday) {
          count++;
        }
      });
    });
    return count;
  };

  const overdueCount = getOverdueCount();

  return (
    <div id="time-simulator-widget" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between h-full overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800/50 rounded-xl">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Clinical Portal Time</h3>
              <p className="text-[10px] text-slate-400 font-medium">Verify medication alert triggers</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/40 p-1 rounded-lg border border-slate-800">
            <button
              onClick={toggleSound}
              className="p-1 hover:bg-slate-700/80 rounded-md transition text-slate-300 hover:text-white cursor-pointer"
              title={soundEnabled ? "Mute alert sounds" : "Unmute alert sounds"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            </button>
            <button
              onClick={resetToSystemTime}
              className="p-1 hover:bg-slate-700/80 rounded-md transition text-slate-300 hover:text-white cursor-pointer"
              title="Sync with local device clock"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Clock Display */}
        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 px-4 shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Portal Clock</span>
            <div className="text-lg font-mono font-bold text-indigo-400 tracking-tight">
              {formatPortalTime(currentPortalTime)}
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest">Date</span>
            <span className="text-xs font-bold text-slate-300">
              {formatPortalDate(currentPortalTime)}
            </span>
          </div>
        </div>

        {/* Overdue Alerts Indicator */}
        {overdueCount > 0 ? (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-ping" />
            <span>You have <strong className="font-extrabold text-rose-200">{overdueCount} medication dose(s)</strong> due. Check toasts or take actions.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All scheduled medications are fully up to date for this time!</span>
          </div>
        )}

        {/* Fast-Forward Actions */}
        <div className="space-y-2">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast-Forward Time</span>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => addMinutes(15)}
              className="bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/50 text-slate-200 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
            >
              +15m
            </button>
            <button
              onClick={() => addMinutes(60)}
              className="bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/50 text-slate-200 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
            >
              +1h
            </button>
            <button
              onClick={() => addMinutes(240)}
              className="bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/50 text-slate-200 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
            >
              +4h
            </button>
            <button
              onClick={() => addMinutes(480)}
              className="bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/50 text-slate-200 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
            >
              +8h
            </button>
          </div>
        </div>

        {/* Shift Presets */}
        <div className="space-y-2">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulate Clinical Shift Hours</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => jumpToTime(8, 30)}
              className="flex items-center justify-center gap-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl transition text-amber-200 hover:text-amber-100 cursor-pointer"
            >
              <Sunrise className="w-3.5 h-3.5" />
              Morning (08:30 AM)
            </button>
            <button
              onClick={() => jumpToTime(13, 15)}
              className="flex items-center justify-center gap-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl transition text-sky-200 hover:text-sky-100 cursor-pointer"
            >
              <Sun className="w-3.5 h-3.5" />
              Afternoon (01:15 PM)
            </button>
            <button
              onClick={() => jumpToTime(18, 30)}
              className="flex items-center justify-center gap-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl transition text-orange-200 hover:text-orange-100 cursor-pointer"
            >
              <Sunset className="w-3.5 h-3.5" />
              Evening (06:30 PM)
            </button>
            <button
              onClick={() => jumpToTime(22, 15)}
              className="flex items-center justify-center gap-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl transition text-indigo-300 hover:text-indigo-100 cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5" />
              Bedtime (10:15 PM)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
