import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, Check, RotateCw, AlertCircle, ShoppingBag, CheckCircle, Hourglass, Sparkles, Clock } from 'lucide-react';
import { Prescription } from '../types';

interface MedicationTrackerProps {
  prescriptions: Prescription[];
  onToggleTaken: (id: string) => void;
  onUpdateRefillStatus: (id: string, status: Prescription['refillStatus'], remainingRefills?: number) => void;
}

export default function MedicationTracker({
  prescriptions,
  onToggleTaken,
  onUpdateRefillStatus,
}: MedicationTrackerProps) {
  const [refillLoadingId, setRefillLoadingId] = useState<string>('');

  const handleRefillRequest = (id: string, currentRemaining: number) => {
    if (currentRemaining <= 0) return;
    setRefillLoadingId(id);

    // Update to 'requested' immediately
    onUpdateRefillStatus(id, 'requested');

    // 1.5s -> Approved
    setTimeout(() => {
      onUpdateRefillStatus(id, 'approved');
    }, 1500);

    // 3.5s -> Preparing
    setTimeout(() => {
      onUpdateRefillStatus(id, 'preparing');
    }, 3500);

    // 5.5s -> Ready for pickup! (Decrement remaining refills by 1)
    setTimeout(() => {
      onUpdateRefillStatus(id, 'ready', currentRemaining - 1);
      setRefillLoadingId('');
    }, 5500);
  };

  const getRefillBadge = (status: Prescription['refillStatus']) => {
    switch (status) {
      case 'requested':
        return {
          label: 'Request Pending',
          color: 'text-blue-600 bg-blue-50 border-blue-100',
          icon: Hourglass,
        };
      case 'approved':
        return {
          label: 'Doctor Approved',
          color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
          icon: CheckCircle,
        };
      case 'preparing':
        return {
          label: 'Pharmacy Packing',
          color: 'text-amber-600 bg-amber-50 border-amber-100',
          icon: RotateCw,
        };
      case 'ready':
        return {
          label: 'Ready for Pickup',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-100 animate-pulse',
          icon: ShoppingBag,
        };
      default:
        return null;
    }
  };

  return (
    <div id="medication-tracker-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">Prescriptions & Dispensary</h3>
            <p className="text-xs text-slate-500">Track daily doses and pharmacy refills</p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-3.5 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Daily Medication Logs</h4>
            <span className="text-[10px] text-slate-400 font-medium">Log your intake daily</span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {prescriptions.map((rx) => {
              const badge = getRefillBadge(rx.refillStatus);
              const BadgeIcon = badge?.icon;
              return (
                <div
                  key={rx.id}
                  className={`p-3.5 border rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    rx.takenToday 
                      ? 'bg-slate-50/50 border-slate-100 opacity-80' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={() => onToggleTaken(rx.id)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer ${
                        rx.takenToday 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {rx.takenToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className={`text-xs font-bold text-slate-800 ${rx.takenToday ? 'line-through text-slate-400' : ''}`}>
                          {rx.name}
                        </h5>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded">
                          {rx.dosage}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[10px] text-slate-500 font-medium">{rx.frequency}</span>
                        {rx.scheduledTimes && rx.scheduledTimes.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-indigo-600 font-bold bg-indigo-50/75 border border-indigo-100/50 px-1.5 py-0.2 rounded">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            Due: {rx.scheduledTimes.join(', ')}
                          </span>
                        )}
                      </div>
                      
                      {/* Remainder Refills Indicator */}
                      <span className="inline-block text-[9px] text-slate-400 font-semibold mt-1">
                        {rx.remainingRefills > 0 
                          ? `${rx.remainingRefills} refill(s) remaining`
                          : 'No remaining refills'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Refill Request Action or Active Refill Progress */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {badge ? (
                      <div className={`flex items-center gap-1 text-[10px] font-semibold border px-2 py-1 rounded-lg ${badge.color}`}>
                        {BadgeIcon && <BadgeIcon className={`w-3.5 h-3.5 shrink-0 ${rx.refillStatus === 'preparing' ? 'animate-spin' : ''}`} />}
                        <span>{badge.label}</span>
                      </div>
                    ) : (
                      rx.remainingRefills > 0 ? (
                        <button
                          onClick={() => handleRefillRequest(rx.id, rx.remainingRefills)}
                          disabled={!!refillLoadingId}
                          className={`text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg transition ${
                            refillLoadingId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          Request Refill
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          Needs Dr. Renewal
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Pharmacy Info */}
        <div className="bg-indigo-50/30 rounded-xl p-3 border border-indigo-50/50 text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <p className="text-slate-600">
            All pharmacy orders are routed instantly to our in-house Apothecary. Local pickup window: <strong className="text-indigo-700">8:00 AM – 8:00 PM</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
