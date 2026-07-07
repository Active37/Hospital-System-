import React, { useState, useEffect } from 'react';
import { INITIAL_DOCTORS, INITIAL_VITALS, INITIAL_PRESCRIPTIONS } from './data';
import { Doctor, Appointment, VitalRecord, Prescription, PatientRecord, Invoice } from './types';
import VitalsTracker from './components/VitalsTracker';
import VitalsRecharts from './components/VitalsRecharts';
import AppointmentScheduler from './components/AppointmentScheduler';
import SymptomTriage from './components/SymptomTriage';
import MedicationTracker from './components/MedicationTracker';
import { MedicationNotifier, MedicationTimeSimulator } from './components/MedicationAlerts';
import PatientRecords from './components/PatientRecords';
import BillingSystem from './components/BillingSystem';
import { Heart, Activity, Calendar, ShieldCheck, UserCheck, LayoutDashboard, Receipt, UserSquare2, Sparkles } from 'lucide-react';

export default function App() {
  // 1. Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'records' | 'billing'>('dashboard');

  // Portal time state that drives medication scheduling & alarms
  const [currentPortalTime, setCurrentPortalTime] = useState<Date>(() => {
    const saved = localStorage.getItem('hospital_portal_time');
    return saved ? new Date(saved) : new Date();
  });

  // Keep simulated/portal clock ticking, incrementing 1 second every real second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPortalTime((prev) => {
        const next = new Date(prev.getTime() + 1000);
        localStorage.setItem('hospital_portal_time', next.toISOString());
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. State management with LocalStorage backup
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('hospital_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('hospital_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse appointments', e);
      }
    }
    return [
      {
        id: 'app-init-1',
        doctorId: 'doc-3',
        doctorName: 'Dr. Elena Rostova',
        specialty: 'General Medicine',
        date: 'Jul 08, 2026',
        time: '10:00 AM',
        status: 'scheduled',
        notes: 'Annual routine health checkup',
      }
    ];
  });

  const [vitals, setVitals] = useState<VitalRecord[]>(() => {
    const saved = localStorage.getItem('hospital_vitals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse vitals', e);
      }
    }
    return INITIAL_VITALS;
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem('hospital_prescriptions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse prescriptions', e);
      }
    }
    return INITIAL_PRESCRIPTIONS;
  });

  // Patient Records State
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>(() => {
    const saved = localStorage.getItem('hospital_patient_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse patient records', e);
      }
    }
    return [
      {
        id: 'CG-20267',
        name: 'James Cole',
        dob: '1985-10-12',
        gender: 'Male',
        phone: '(555) 019-2034',
        email: 'j.cole@hospital-portal.org',
        bloodType: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        medicalHistory: ['Hypertension', 'Seasonal Asthma'],
        currentMedications: ['Lisinopril 10mg', 'Atorvastatin 20mg'],
        treatmentProgress: [
          'Jul 01: Initial cardiac consult complete. BP stabilizing on Lisinopril.',
          'Jul 05: Follow-up lab panel looks within limits. Heart rate stable.'
        ],
        lastUpdated: '07/06/2026',
      },
      {
        id: 'CG-90812',
        name: 'Evelyn Vance',
        dob: '1992-04-22',
        gender: 'Female',
        phone: '(555) 014-9981',
        email: 'e.vance@gmail.com',
        bloodType: 'A+',
        allergies: ['Sulfa Drugs'],
        medicalHistory: ['Hypothyroidism'],
        currentMedications: ['Levothyroxine 50mcg'],
        treatmentProgress: [
          'Jun 20: TSH level measured at 2.4 mIU/L. Keep current dosage.',
        ],
        lastUpdated: '06/20/2026',
      },
    ];
  });

  // Invoices & Billing State
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('hospital_invoices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse invoices', e);
      }
    }
    return [
      {
        id: 'INV-40289',
        patientId: 'CG-20267',
        patientName: 'James Cole',
        date: 'Jul 02, 2026',
        items: [
          { id: 'item-1', description: 'Specialist Cardiology Consultation', amount: 150.00 },
          { id: 'item-2', description: 'Diagnostic Metabolic Blood Panel', amount: 90.00 },
        ],
        totalAmount: 240.00,
        insuranceCoverage: 120.00,
        patientResponsibility: 120.00,
        amountPaid: 0.00,
        status: 'pending_insurance',
        insuranceProvider: 'Blue Cross Shield',
        insuranceClaimStatus: 'filed',
      },
      {
        id: 'INV-39821',
        patientId: 'CG-90812',
        patientName: 'Evelyn Vance',
        date: 'Jun 20, 2026',
        items: [
          { id: 'item-3', description: 'Endocrinology Roster Checkup', amount: 120.00 },
        ],
        totalAmount: 120.00,
        insuranceCoverage: 96.00,
        patientResponsibility: 24.00,
        amountPaid: 24.00,
        status: 'paid',
        insuranceProvider: 'Aetna HMO',
        insuranceClaimStatus: 'approved',
      },
    ];
  });

  // Save states to localStorage on changes
  useEffect(() => {
    localStorage.setItem('hospital_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('hospital_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('hospital_vitals', JSON.stringify(vitals));
  }, [vitals]);

  useEffect(() => {
    localStorage.setItem('hospital_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem('hospital_patient_records', JSON.stringify(patientRecords));
  }, [patientRecords]);

  useEffect(() => {
    localStorage.setItem('hospital_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Appointment Actions
  const handleBookAppointment = (newApp: Omit<Appointment, 'id' | 'status'>) => {
    const app: Appointment = {
      ...newApp,
      id: `app-${Date.now()}`,
      status: 'scheduled',
    };
    setAppointments((prev) => [...prev, app]);
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' } : app))
    );
  };

  const handleRescheduleAppointment = (id: string, date: string, time: string) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, date, time } : app))
    );
  };

  const handleUpdateDoctorAvailability = (doctorId: string, slots: string[]) => {
    setDoctors(prev => prev.map(doc => doc.id === doctorId ? { ...doc, availability: slots } : doc));
  };

  // Vitals Actions
  const handleAddVital = (newVital: Omit<VitalRecord, 'id' | 'date' | 'time'>) => {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateString = `${months[today.getMonth()]} ${String(today.getDate()).padStart(2, '0')}`;
    
    let hours = today.getHours();
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeString = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const vital: VitalRecord = {
      ...newVital,
      id: `v-${Date.now()}`,
      date: dateString,
      time: timeString,
    };
    setVitals((prev) => [...prev, vital]);
  };

  // Prescription Actions
  const handleToggleTaken = (id: string) => {
    setPrescriptions((prev) =>
      prev.map((rx) => (rx.id === id ? { ...rx, takenToday: !rx.takenToday } : rx))
    );
  };

  const handleUpdateRefillStatus = (
    id: string,
    status: Prescription['refillStatus'],
    remainingRefills?: number
  ) => {
    setPrescriptions((prev) =>
      prev.map((rx) => {
        if (rx.id === id) {
          return {
            ...rx,
            refillStatus: status,
            remainingRefills: remainingRefills !== undefined ? remainingRefills : rx.remainingRefills,
            takenToday: status === 'ready' ? false : rx.takenToday,
          };
        }
        return rx;
      })
    );
  };

  // EHR Records Actions
  const handleAddRecord = (record: Omit<PatientRecord, 'id' | 'lastUpdated'>) => {
    const newRecord: PatientRecord = {
      ...record,
      id: `CG-${Math.floor(10000 + Math.random() * 90000)}`,
      lastUpdated: new Date().toLocaleDateString(),
    };
    setPatientRecords(prev => [...prev, newRecord]);
  };

  const handleUpdateRecord = (updatedRecord: PatientRecord) => {
    setPatientRecords(prev => prev.map(rec => rec.id === updatedRecord.id ? updatedRecord : rec));
  };

  const handleDeleteRecord = (id: string) => {
    setPatientRecords(prev => prev.filter(rec => rec.id !== id));
  };

  // Billing Actions
  const handleAddInvoice = (invoice: Omit<Invoice, 'id' | 'date'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    };
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const handlePayInvoice = (id: string, amount: number) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const newPaid = inv.amountPaid + amount;
        const fullyPaid = newPaid >= inv.patientResponsibility;
        return {
          ...inv,
          amountPaid: newPaid,
          status: fullyPaid ? 'paid' : 'partially_paid'
        };
      }
      return inv;
    }));
  };

  const handleFileClaim = (id: string, provider: string, policy: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          insuranceProvider: provider,
          insuranceClaimStatus: 'filed',
          status: 'pending_insurance'
        };
      }
      return inv;
    }));
  };

  const handleSetupPaymentPlan = (id: string, months: number) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const installment = (inv.patientResponsibility - inv.amountPaid) / months;
        return {
          ...inv,
          paymentPlan: {
            totalMonths: months,
            monthlyInstallment: installment,
            monthsPaid: 0,
          }
        };
      }
      return inv;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Brand & Patient Header */}
      <header className="bg-white border-b border-slate-100 py-4.5 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                City General Hospital
                <span className="hidden sm:inline-block px-2 py-0.5 bg-teal-50 border border-teal-100 rounded-full text-[10px] font-bold text-teal-600">
                  Comprehensive Portal
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-500 font-medium font-sans">Authorized Staff & Patient Services</span>
              </div>
            </div>
          </div>

          {/* Quick patient info */}
          <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-100 rounded-xl p-2 px-3.5 max-w-fit">
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-800">James Cole</span>
              <div className="flex gap-3 text-[10px] text-slate-500 font-semibold mt-0.5">
                <span>ID: CG-20267</span>
                <span>•</span>
                <span>DOB: 10/12/1985</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xs">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center p-8 pointer-events-none">
            <Heart className="w-64 h-64 stroke-[1]" />
          </div>
          
          <div className="relative space-y-2 max-w-2xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300">
              Authorized Health Workspace
            </span>
            <h2 className="text-2xl font-bold tracking-tight">EHR, Billing & Clinical Workspace</h2>
            <p className="text-sm text-teal-100/90 leading-relaxed font-medium">
              Manage patient files under strict clinical regulations, track insurance claims, structure installment payment plans, and book clinic-wide consultations in real-time.
            </p>
          </div>
        </div>

        {/* Tab Switcher Navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            My Care Dashboard
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'appointments'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Clinic Bookings & Rosters
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'records'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserSquare2 className="w-4 h-4" />
            Patient EHR Records
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Ledger, Claims & Billing
          </button>
        </div>

        {/* Render Active Tab */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Vitals and Medications */}
              <div className="space-y-6">
                <MedicationTimeSimulator
                  currentPortalTime={currentPortalTime}
                  setCurrentPortalTime={setCurrentPortalTime}
                  prescriptions={prescriptions}
                />

                <VitalsTracker
                  vitals={vitals}
                  onAddVital={handleAddVital}
                />

                <MedicationTracker
                  prescriptions={prescriptions}
                  onToggleTaken={handleToggleTaken}
                  onUpdateRefillStatus={handleUpdateRefillStatus}
                />
              </div>

              {/* Right Column: Symptom Assessment */}
              <div className="space-y-6">
                <VitalsRecharts vitals={vitals} />
                <SymptomTriage />
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <AppointmentScheduler
              doctors={doctors}
              appointments={appointments}
              onBookAppointment={handleBookAppointment}
              onCancelAppointment={handleCancelAppointment}
              onRescheduleAppointment={handleRescheduleAppointment}
              onUpdateDoctorAvailability={handleUpdateDoctorAvailability}
            />
          )}

          {activeTab === 'records' && (
            <PatientRecords
              records={patientRecords}
              onAddRecord={handleAddRecord}
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSystem
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
              onPayInvoice={handlePayInvoice}
              onFileClaim={handleFileClaim}
              onSetupPaymentPlan={handleSetupPaymentPlan}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted HIPAA & GDPR Compliant Medical Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <span>City General Hospital &copy; 2026</span>
            <span>•</span>
            <span className="font-mono">v2.1.0-Secure</span>
          </div>
        </div>
      </footer>

      {/* Global Medication Alerts Toaster */}
      <MedicationNotifier
        prescriptions={prescriptions}
        onToggleTaken={handleToggleTaken}
        currentPortalTime={currentPortalTime}
      />
    </div>
  );
}
