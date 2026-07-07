import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, User, Clock, Star, X, Check, Filter, CheckCircle2, RefreshCw, Send, Bell, Settings, Layers, ListOrdered, CheckCircle } from 'lucide-react';
import { Doctor, Appointment } from '../types';

interface AppointmentSchedulerProps {
  doctors: Doctor[];
  appointments: Appointment[];
  onBookAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (id: string, date: string, time: string) => void;
  onUpdateDoctorAvailability?: (doctorId: string, slots: string[]) => void;
}

export default function AppointmentScheduler({
  doctors,
  appointments,
  onBookAppointment,
  onCancelAppointment,
  onRescheduleAppointment,
  onUpdateDoctorAvailability,
}: AppointmentSchedulerProps) {
  // Mode switcher: Patient Perspective vs Hospital Staff perspective
  const [viewMode, setViewMode] = useState<'patient' | 'staff'>('patient');

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  
  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDateIdx, setRescheduleDateIdx] = useState<number>(0);
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');

  // Notification Toast state
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [reminderSentId, setReminderSentId] = useState<string | null>(null);

  // Staff queue state
  const [queueStatus, setQueueStatus] = useState<Record<string, 'Checked In' | 'In Consultation' | 'Completed'>>({});

  // Staff availability input
  const [newSlotInput, setNewSlotInput] = useState<string>('');
  const [activeStaffDocId, setActiveStaffDocId] = useState<string>(doctors[0]?.id || '');

  // Generate next 7 days dynamically starting from today: Monday July 6th, 2026
  const generateNext7Days = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const baseDate = new Date('2026-07-06T09:21:59-07:00');
    
    for (let i = 0; i < 7; i++) {
      const current = new Date(baseDate);
      current.setDate(baseDate.getDate() + i);
      days.push({
        weekday: weekdays[current.getDay()],
        dayNum: current.getDate(),
        month: months[current.getMonth()],
        fullString: `${months[current.getMonth()]} ${String(current.getDate()).padStart(2, '0')}, 2026`,
      });
    }
    return days;
  };

  const nextDays = generateNext7Days();

  // Filtered doctors
  const specialties = ['All', ...Array.from(new Set(doctors.map((d) => d.specialty)))];
  const filteredDoctors = selectedSpecialty === 'All'
    ? doctors
    : doctors.filter((d) => d.specialty === selectedSpecialty);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Handlers
  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedTimeSlot) return;

    const doctorObj = doctors.find((d) => d.id === selectedDoctorId)!;
    const dateString = nextDays[selectedDateIndex].fullString;

    onBookAppointment({
      doctorId: selectedDoctorId,
      doctorName: doctorObj.name,
      specialty: doctorObj.specialty,
      date: dateString,
      time: selectedTimeSlot,
      notes: bookingNotes.trim() || undefined,
    });

    setSuccessMessage(`Appointment booked successfully with ${doctorObj.name}!`);
    setTimeout(() => setSuccessMessage(''), 4000);

    setSelectedDoctorId('');
    setSelectedTimeSlot('');
    setBookingNotes('');
  };

  const handleRescheduleSubmit = (id: string) => {
    if (!rescheduleSlot) return;
    const dateString = nextDays[rescheduleDateIdx].fullString;
    onRescheduleAppointment(id, dateString, rescheduleSlot);
    
    setSuccessMessage('Appointment rescheduled successfully!');
    setTimeout(() => setSuccessMessage(''), 4000);

    setReschedulingId(null);
    setRescheduleSlot('');
  };

  const handleSendReminder = (appId: string, patientName: string) => {
    setReminderSentId(appId);
    setTimeout(() => {
      setSuccessMessage(`Reminder alert dispatched successfully to ${patientName}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setReminderSentId(null);
    }, 1000);
  };

  // Staff - manage availability
  const handleAddSlot = (docId: string) => {
    if (!newSlotInput) return;
    const doc = doctors.find(d => d.id === docId);
    if (doc && onUpdateDoctorAvailability) {
      if (!doc.availability.includes(newSlotInput)) {
        onUpdateDoctorAvailability(docId, [...doc.availability, newSlotInput]);
      }
    }
    setNewSlotInput('');
  };

  const handleRemoveSlot = (docId: string, slot: string) => {
    const doc = doctors.find(d => d.id === docId);
    if (doc && onUpdateDoctorAvailability) {
      onUpdateDoctorAvailability(docId, doc.availability.filter(s => s !== slot));
    }
  };

  const activeAppointments = appointments.filter((app) => app.status === 'scheduled');

  const getAvatarColorClass = (color: string) => {
    switch (color) {
      case 'teal': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div id="appointment-scheduler-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">Clinical Consultation Scheduler</h3>
            <p className="text-xs text-slate-500">Coordinate clinic appointments and staff rosters</p>
          </div>
        </div>

        {/* View Switcher (Patient vs Staff/Admin) */}
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 self-start sm:self-center">
          <button
            onClick={() => setViewMode('patient')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'patient' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Patient Booking
          </button>
          <button
            onClick={() => setViewMode('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'staff' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Staff Admin Portal
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-1">
        
        {/* VIEW 1: PATIENT BOOKING PERSPECTIVE */}
        {viewMode === 'patient' ? (
          <>
            {/* Left Column: Form & Doctor Picker (Cols 3) */}
            <div className="lg:col-span-3 p-5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Schedule Consult</h4>
                  
                  {/* Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => {
                        setSelectedSpecialty(e.target.value);
                        setSelectedDoctorId('');
                        setSelectedTimeSlot('');
                      }}
                      className="bg-transparent border-none text-[11px] font-medium text-slate-600 focus:outline-hidden cursor-pointer"
                    >
                      {specialties.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 animate-pulse" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                {/* Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {filteredDoctors.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctorId(doc.id);
                        setSelectedTimeSlot('');
                        setReschedulingId(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        selectedDoctorId === doc.id
                          ? 'bg-teal-50/50 border-teal-500 ring-1 ring-teal-100'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColorClass(doc.avatarColor)}`}>
                        {doc.name.split(' ').pop()?.[0]}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-slate-800 truncate">{doc.name}</h5>
                        <p className="text-[10px] text-slate-400 font-medium">{doc.specialty}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-500 font-medium">
                          <Star className="w-2.5 h-2.5 fill-amber-400 stroke-amber-400" />
                          <span>{doc.rating}</span>
                          <span className="text-slate-300">•</span>
                          <span>{doc.experience}y exp</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Slot Pickers */}
                <AnimatePresence mode="wait">
                  {selectedDoctorId && selectedDoctor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden pt-1"
                    >
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1.5">Select Consultation Date</span>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                          {nextDays.map((day, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedDateIndex(idx)}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border min-w-[56px] text-center transition cursor-pointer ${
                                selectedDateIndex === idx
                                  ? 'bg-slate-900 text-white border-slate-950'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'
                              }`}
                            >
                              <span className={`text-[9px] uppercase tracking-wider ${selectedDateIndex === idx ? 'text-slate-300' : 'text-slate-400'}`}>
                                {day.weekday}
                              </span>
                              <span className="text-sm font-bold mt-0.5">{day.dayNum}</span>
                              <span className={`text-[8px] ${selectedDateIndex === idx ? 'text-slate-200' : 'text-slate-400'}`}>
                                {day.month}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1.5">Available Slots</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDoctor.availability.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">No available times today</span>
                          ) : (
                            selectedDoctor.availability.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                                  selectedTimeSlot === slot
                                    ? 'bg-teal-600 text-white border-teal-700'
                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                {slot}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Brief symptoms or purpose of checkup..."
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {selectedDoctorId && selectedTimeSlot && (
                <button
                  onClick={handleBook}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Book Consult Appointment
                </button>
              )}
            </div>

            {/* Right Column: Manage Booked Consultations & Reschedule (Cols 2) */}
            <div className="lg:col-span-2 p-5 flex flex-col h-full bg-slate-50/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Your Booked Consults</h4>
              
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1">
                <AnimatePresence initial={false}>
                  {activeAppointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <Calendar className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
                      <p className="text-xs text-slate-500 font-medium">No active scheduled checkups</p>
                    </div>
                  ) : (
                    activeAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 bg-white border border-slate-100 rounded-xl relative hover:shadow-2xs transition"
                      >
                        {/* Cancel */}
                        <button
                          onClick={() => onCancelAppointment(app.id)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                          title="Cancel appointment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.2 rounded uppercase">
                              {app.specialty}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-800">{app.doctorName}</h5>
                          
                          <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{app.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{app.time}</span>
                            </div>
                          </div>

                          {/* Rescheduling Mode Panel */}
                          {reschedulingId === app.id ? (
                            <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-2.5">
                              <div>
                                <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pick New Date</span>
                                <div className="flex gap-1 overflow-x-auto pb-1">
                                  {nextDays.map((day, dIdx) => (
                                    <button
                                      key={dIdx}
                                      onClick={() => setRescheduleDateIdx(dIdx)}
                                      className={`px-2 py-1 rounded border text-[9px] font-bold cursor-pointer ${
                                        rescheduleDateIdx === dIdx ? 'bg-slate-900 text-white border-slate-950' : 'bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      {day.weekday} {day.dayNum}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pick Slot</span>
                                <div className="flex flex-wrap gap-1">
                                  {(doctors.find(d => d.name === app.doctorName)?.availability || []).map((slot) => (
                                    <button
                                      key={slot}
                                      onClick={() => setRescheduleSlot(slot)}
                                      className={`px-2 py-1 rounded border text-[9px] font-bold cursor-pointer ${
                                        rescheduleSlot === slot ? 'bg-teal-600 text-white border-teal-700' : 'bg-white text-slate-600'
                                      }`}
                                    >
                                      {slot}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => setReschedulingId(null)}
                                  className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 text-[9px] font-bold text-slate-600"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleRescheduleSubmit(app.id)}
                                  disabled={!rescheduleSlot}
                                  className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold disabled:opacity-50"
                                >
                                  Save Reschedule
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 pt-2">
                              <button
                                onClick={() => {
                                  setReschedulingId(app.id);
                                  setSelectedDoctorId('');
                                }}
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-600 bg-teal-50/50 hover:bg-teal-50 border border-teal-100 px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                Reschedule
                              </button>

                              <button
                                onClick={() => handleSendReminder(app.id, 'James Cole')}
                                disabled={reminderSentId === app.id}
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md transition cursor-pointer disabled:opacity-50"
                              >
                                <Bell className="w-2.5 h-2.5" />
                                {reminderSentId === app.id ? 'Dispatched...' : 'Send Reminder'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          /* VIEW 2: STAFF ADMIN PORTAL - ROSTERS, QUEUE, AVAILABILITY */
          <>
            {/* Left Side: Doctor Rosters & Manage Availability (Cols 3) */}
            <div className="lg:col-span-3 p-5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Doctor Availability Rosters</h4>
                  <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">Clinic Management</span>
                </div>

                {/* Select Doctor to configure */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {doctors.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setActiveStaffDocId(d.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition shrink-0 cursor-pointer ${
                        activeStaffDocId === d.id ? 'bg-slate-900 border-slate-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d.name.split(' ').pop()} ({d.specialty[0]}.)
                    </button>
                  ))}
                </div>

                {/* Edit Availability Box */}
                {(() => {
                  const targetDoc = doctors.find(d => d.id === activeStaffDocId);
                  if (!targetDoc) return null;
                  return (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{targetDoc.name}</h5>
                          <p className="text-[10px] text-slate-400">{targetDoc.specialty} Department</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-slate-200/55 px-1.5 py-0.2 rounded">ID: {targetDoc.id}</span>
                      </div>

                      {/* Current slots */}
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1.5">Current Available Slots</span>
                        <div className="flex flex-wrap gap-1.5">
                          {targetDoc.availability.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">No available times logged</span>
                          ) : (
                            targetDoc.availability.map(slot => (
                              <span
                                key={slot}
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                              >
                                {slot}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(targetDoc.id, slot)}
                                  className="text-red-500 hover:text-red-700 font-bold text-[10px]"
                                >
                                  ✕
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Add Slot */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., 05:00 PM"
                          value={newSlotInput}
                          onChange={(e) => setNewSlotInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSlot(targetDoc.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Add Time Slot
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] leading-relaxed text-slate-500">
                ⭐ Changes to availabilities reflect in real-time. Patient-facing search views automatically parse these slots for consult bookings.
              </div>
            </div>

            {/* Right Side: Appointment Queue & Flow Handler (Cols 2) */}
            <div className="lg:col-span-2 p-5 flex flex-col h-full bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Intake Queue</h4>
                <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase">
                  <ListOrdered className="w-3 h-3" />
                  <span>Real-time</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1">
                {activeAppointments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <CheckCircle className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
                    <p className="text-xs text-slate-500 font-medium">No check-ins in queue</p>
                  </div>
                ) : (
                  activeAppointments.map((app) => {
                    const status = queueStatus[app.id] || 'Checked In';
                    return (
                      <div key={app.id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-xs font-bold text-slate-800">Patient: James Cole</h5>
                            <span className="block text-[9px] text-slate-400 font-bold">Assigned: {app.doctorName}</span>
                          </div>
                          
                          <select
                            value={status}
                            onChange={(e) => setQueueStatus({ ...queueStatus, [app.id]: e.target.value as any })}
                            className={`px-2 py-0.5 border rounded text-[9px] font-bold focus:outline-hidden cursor-pointer ${
                              status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                              status === 'In Consultation' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                              'bg-blue-50 border-blue-200 text-blue-600'
                            }`}
                          >
                            <option value="Checked In">Checked In</option>
                            <option value="In Consultation">In Consultation</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold border-t border-slate-50 pt-1.5">
                          <span>Time Slot: {app.time}</span>
                          <span>Dept: {app.specialty}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
