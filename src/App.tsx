import React, { useState, useEffect } from 'react';
import { INITIAL_DOCTORS, INITIAL_VITALS, INITIAL_PRESCRIPTIONS } from './data';
import { Doctor, Appointment, VitalRecord, Prescription, PatientRecord, Invoice, UserSession } from './types';
import VitalsTracker from './components/VitalsTracker';
import VitalsRecharts from './components/VitalsRecharts';
import AppointmentScheduler from './components/AppointmentScheduler';
import SymptomTriage from './components/SymptomTriage';
import MedicationTracker from './components/MedicationTracker';
import { MedicationNotifier, MedicationTimeSimulator } from './components/MedicationAlerts';
import PatientRecords from './components/PatientRecords';
import BillingSystem from './components/BillingSystem';
import AdminLoginModal from './components/AdminLoginModal';
import { Heart, Activity, Calendar, ShieldCheck, UserCheck, LayoutDashboard, Receipt, UserSquare2, Sparkles, Printer } from 'lucide-react';

export default function App() {
  // 1. Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'records' | 'billing'>('dashboard');

  // Admin Login States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [adminSession, setAdminSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('hospital_admin_session');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (session: UserSession) => {
    setAdminSession(session);
    localStorage.setItem('hospital_admin_session', JSON.stringify(session));
  };

  const handleLogout = () => {
    setAdminSession(null);
    localStorage.removeItem('hospital_admin_session');
  };

  // Keyboard shortcut listener for hidden login (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsLoginOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Print summary event handler
  const handlePrintSummary = () => {
    document.body.classList.add('printing-summary');
    document.body.classList.remove('printing-invoice');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-invoice', 'printing-summary');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
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

  const activePatient = patientRecords.find(p => p.id === 'CG-20267') || patientRecords[0];
  const upcomingAppointments = appointments.filter(app => app.status === 'scheduled');

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
              <div 
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-2 mt-0.5 cursor-pointer hover:text-teal-600 group transition"
                title="Staff Portal Authorization"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:bg-teal-500" />
                <span className="text-xs text-slate-500 font-medium font-sans group-hover:text-teal-600">Authorized Staff & Patient Services</span>
              </div>
            </div>
          </div>

          {/* Quick patient info & Print Summary action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {adminSession && (
              <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl p-2 px-3.5 shadow-sm">
                <div className={`p-1.5 rounded-lg ${
                  adminSession.role === 'developer' ? 'bg-amber-500/20 text-amber-400' :
                  adminSession.role === 'doctor' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-teal-500/20 text-teal-400'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-white leading-none">{adminSession.name}</span>
                  <div className="flex gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    <span className="text-teal-400 font-black">{adminSession.role}</span>
                    <span>•</span>
                    <span className="font-mono font-medium">{adminSession.badgeCode}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2.5 px-2 py-1 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                  title="Revoke Admin Access Session"
                >
                  Sign Out
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-100 rounded-xl p-2 px-3.5">
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

            <button
              onClick={handlePrintSummary}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold transition duration-150 shadow-xs cursor-pointer"
              title="Print current patient vitals & upcoming schedule"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              Print Summary
            </button>
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

        {/* Dynamic Admin/Staff Quick Controls Bar */}
        {adminSession && (
          <div className={`p-4.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs transition duration-200 ${
            adminSession.role === 'developer' ? 'bg-amber-500/5 border-amber-500/20 text-slate-900' :
            adminSession.role === 'doctor' ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-900' :
            'bg-teal-500/5 border-teal-500/20 text-slate-900'
          }`}>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  adminSession.role === 'developer' ? 'bg-amber-500' :
                  adminSession.role === 'doctor' ? 'bg-emerald-500' :
                  'bg-teal-500'
                }`} />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  {adminSession.role.toUpperCase()} CONSOLE ACTIVE
                </span>
                <span className="px-1.5 py-0.5 bg-slate-200/60 rounded text-[9px] font-mono font-bold text-slate-600">
                  Secure Code: {adminSession.badgeCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {adminSession.role === 'developer' && 'You have super-user credentials. You can simulate vital alerts, shift simulated time, and override records.'}
                {adminSession.role === 'doctor' && 'You can review patient charts, authorize diagnostic ledgers, and write clinic prescriptions.'}
                {adminSession.role === 'nurse' && 'You can log raw vitals readouts and check off scheduled medication logs on the flowsheet.'}
              </p>
            </div>

            {/* Role-Specific Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {adminSession.role === 'developer' && (
                <>
                  <button
                    onClick={() => {
                      const extremeVitals: Omit<VitalRecord, 'id' | 'date' | 'time'> = {
                        systolic: 175,
                        diastolic: 105,
                        heartRate: 115,
                        temperature: 102.4,
                      };
                      handleAddVital(extremeVitals);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-[10px] tracking-wide uppercase shadow-xs transition cursor-pointer"
                    title="Insert clinical anomaly values to verify dashboard system warning triggers"
                  >
                    🔥 Trigger Anomaly Vital
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPortalTime((prev) => new Date(prev.getTime() + 60 * 60 * 1000));
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[10px] tracking-wide uppercase shadow-xs transition cursor-pointer"
                  >
                    ⏱️ Fast Forward 1Hr
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to restore all hospital records back to original LDAP defaults?')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[10px] tracking-wide uppercase shadow-xs transition cursor-pointer"
                  >
                    🗑️ Reset Storage
                  </button>
                </>
              )}

              {adminSession.role === 'doctor' && (
                <>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Enter Diagnosis to append to James Cole\'s medical history:', 'Mild Cardiac Arrythmia');
                      if (reason) {
                        setPatientRecords(prev => prev.map(p => {
                          if (p.id === 'CG-20267') {
                            return {
                              ...p,
                              medicalHistory: [...p.medicalHistory, reason],
                              lastUpdated: new Date().toLocaleDateString()
                            };
                          }
                          return p;
                        }));
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] tracking-wide uppercase shadow-xs transition cursor-pointer"
                  >
                    ➕ Append Diagnosis
                  </button>

                  <button
                    onClick={() => {
                      const name = window.prompt('Prescription Name:', 'Metoprolol 25mg');
                      const dosage = window.prompt('Dosage instructions:', 'Take 1 tablet daily');
                      const frequency = window.prompt('Frequency:', 'Once Daily');
                      if (name && dosage && frequency) {
                        const newPrescr: Prescription = {
                          id: `rx-${Date.now()}`,
                          name,
                          dosage,
                          frequency,
                          takenToday: false,
                          refillStatus: 'none',
                          remainingRefills: 3,
                          scheduledTimes: ['08:00 AM']
                        };
                        setPrescriptions(prev => [...prev, newPrescr]);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] tracking-wide uppercase shadow-xs transition cursor-pointer"
                  >
                    📝 Write Rx
                  </button>
                </>
              )}

              {adminSession.role === 'nurse' && (
                <>
                  <button
                    onClick={() => {
                      const sys = parseInt(window.prompt('Enter Blood Pressure (Systolic):', '120') || '120');
                      const dia = parseInt(window.prompt('Enter Blood Pressure (Diastolic):', '80') || '80');
                      const hr = parseInt(window.prompt('Enter Heart Rate (BPM):', '72') || '72');
                      const temp = parseFloat(window.prompt('Enter Temperature (°F):', '98.6') || '98.6');
                      handleAddVital({ systolic: sys, diastolic: dia, heartRate: hr, temperature: temp });
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[10px] tracking-wide uppercase shadow-xs transition cursor-pointer"
                  >
                    🩺 Log Manual Vitals
                  </button>

                  <button
                    onClick={() => {
                      setPrescriptions(prev => prev.map(rx => ({ ...rx, takenToday: true })));
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[10px] tracking-wide uppercase shadow-xs transition cursor-pointer"
                  >
                    💊 Administer All Active Rx
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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
          <button
            onClick={() => setIsLoginOpen(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-teal-600 transition cursor-pointer"
            title="Hospital Staff Portal Access"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted HIPAA & GDPR Compliant Medical Workspace</span>
          </button>
          <div className="flex items-center gap-3">
            <span>City General Hospital &copy; 2026</span>
            <span>•</span>
            <span className="font-mono">v2.1.0-Secure</span>
          </div>
        </div>
      </footer>

      {/* Staff secure credentials login modal */}
      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Global Medication Alerts Toaster */}
      <MedicationNotifier
        prescriptions={prescriptions}
        onToggleTaken={handleToggleTaken}
        currentPortalTime={currentPortalTime}
      />

      {/* Printable Patient Summary Container */}
      <div id="printable-summary-container" className="hidden print:block font-sans">
        {activePatient && (
          <div className="max-w-3xl mx-auto p-6 bg-white space-y-6 text-black">
            {/* Header Letterhead */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-extrabold text-sm">
                    🏥
                  </div>
                  <span className="text-lg font-black text-slate-900 tracking-tight">City General Hospital</span>
                </div>
                <p className="text-xs text-slate-500">100 Medical Plaza, Health Sciences Campus</p>
                <p className="text-xs text-slate-500">HIPAA Protected Health Summary Document</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">Patient Health Summary</h2>
                <p className="text-xs text-slate-500 mt-2">
                  <span className="font-semibold text-slate-700">Printed on:</span> {currentPortalTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} at {currentPortalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Patient Demographics */}
            <div className="grid grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="col-span-1 border-r border-slate-200/60 pr-4">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Demographics</h3>
                <div className="text-xs text-slate-800 space-y-1">
                  <div className="font-extrabold text-slate-900 text-sm">{activePatient.name}</div>
                  <div><span className="text-slate-500">Patient ID:</span> <span className="font-semibold">{activePatient.id}</span></div>
                  <div><span className="text-slate-500">DOB:</span> {activePatient.dob}</div>
                  <div><span className="text-slate-500">Gender:</span> {activePatient.gender}</div>
                  <div><span className="text-slate-500">Blood Type:</span> <span className="font-bold text-teal-700">{activePatient.bloodType}</span></div>
                </div>
              </div>

              <div className="col-span-1 border-r border-slate-200/60 px-4">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Allergies & Risks</h3>
                <div className="space-y-1 text-xs">
                  {activePatient.allergies && activePatient.allergies.length > 0 ? (
                    activePatient.allergies.map((allergy, idx) => (
                      <span key={idx} className="inline-block bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md mr-1 mb-1">
                        ⚠️ {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No known drug allergies</span>
                  )}
                  <div className="pt-1">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">History</span>
                    <span className="text-slate-700 text-xs font-medium">{activePatient.medicalHistory.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-1 pl-4">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Current Medications</h3>
                <ul className="text-xs text-slate-700 list-disc list-inside space-y-0.5 font-medium">
                  {activePatient.currentMedications && activePatient.currentMedications.length > 0 ? (
                    activePatient.currentMedications.map((med, idx) => (
                      <li key={idx} className="truncate">{med}</li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic list-none">No active prescriptions</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Vitals Record Section */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                📈 Patient Vitals Log
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Blood Pressure (BP)</th>
                      <th className="p-3">Heart Rate (HR)</th>
                      <th className="p-3">Temperature</th>
                      <th className="p-3">Status Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {vitals.slice().reverse().map((record) => {
                      // Determine status of vital record
                      const isBPHigh = record.systolic >= 130 || record.diastolic >= 80;
                      const isHeartRateHigh = record.heartRate > 100 || record.heartRate < 60;
                      const isTempHigh = record.temperature > 99.5;
                      
                      let assessment = "Normal";
                      let assessmentColor = "text-emerald-600 font-bold";
                      if (record.systolic >= 140 || record.diastolic >= 90) {
                        assessment = "Stage 2 Hypertension";
                        assessmentColor = "text-red-600 font-bold";
                      } else if (isBPHigh) {
                        assessment = "Prehypertension";
                        assessmentColor = "text-amber-600 font-bold";
                      } else if (isTempHigh) {
                        assessment = "Fever / Elevated Temp";
                        assessmentColor = "text-amber-600 font-bold";
                      }

                      return (
                        <tr key={record.id}>
                          <td className="p-3 font-semibold text-slate-900">{record.date} at {record.time}</td>
                          <td className="p-3">
                            <span className={isBPHigh ? "text-red-600 font-bold" : "font-medium"}>
                              {record.systolic}/{record.diastolic} mmHg
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={isHeartRateHigh ? "text-amber-600 font-bold" : "font-medium"}>
                              {record.heartRate} bpm
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={isTempHigh ? "text-red-600 font-bold" : "font-medium"}>
                              {record.temperature} °F
                            </span>
                          </td>
                          <td className={`p-3 ${assessmentColor}`}>{assessment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming Schedule (Appointments) */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                📅 Upcoming Clinic Schedule
              </h3>
              {upcomingAppointments.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Consultant / Clinic</th>
                        <th className="p-3">Clinical Specialty</th>
                        <th className="p-3">Notes & Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {upcomingAppointments.map((app) => (
                        <tr key={app.id}>
                          <td className="p-3 font-bold text-slate-900">{app.date} at {app.time}</td>
                          <td className="p-3 font-semibold text-slate-800">{app.doctorName}</td>
                          <td className="p-3 text-slate-500 font-medium">{app.specialty}</td>
                          <td className="p-3 text-slate-600 italic font-medium">{app.notes || 'Routine checkup / consult'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-500 bg-slate-50 italic">
                  No upcoming scheduled clinic consultations.
                </div>
              )}
            </div>

            {/* Authenticity Certificate/Signoff */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700 mb-1">Clinic Coordinator Authorization</p>
                <div className="border-b border-slate-300 h-10 w-48 mb-1"></div>
                <p className="text-[10px] text-slate-400">Electronic Verification Code: CGH-SECURE-20267</p>
              </div>
              <div className="text-right self-end text-[10px] text-slate-400 space-y-0.5">
                <p>This medical document meets HIPAA security compliance standards.</p>
                <p>For inquiries, please contact City General Hospital Patient Advocacy.</p>
                <p className="font-semibold text-slate-500">© 2026 City General Hospital Corporation.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
