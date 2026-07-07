import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Lock, Eye, EyeOff, Sparkles, Terminal, Activity, 
  Fingerprint, Stethoscope, ShieldAlert, KeyRound, Check
} from 'lucide-react';
import { UserSession } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'developer' | 'doctor' | 'nurse'>('developer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // Pre-configured accounts
  const demoAccounts = {
    developer: {
      email: 'dev@hospital.org',
      password: 'admin123',
      name: 'Developer Admin',
      badgeCode: 'DEV-01'
    },
    doctor: {
      email: 'doctor@hospital.org',
      password: 'doctor123',
      name: 'Dr. Elena Rostova',
      badgeCode: 'DOC-88'
    },
    nurse: {
      email: 'nurse@hospital.org',
      password: 'nurse123',
      name: 'Nurse Practitioner Clara',
      badgeCode: 'NUR-42'
    }
  };

  const handleQuickFill = (role: 'developer' | 'doctor' | 'nurse') => {
    setActiveTab(role);
    setEmail(demoAccounts[role].email);
    setPassword(demoAccounts[role].password);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both authorization email and secure passcode.');
      return;
    }

    // Validation matching demo credentials
    const correctCreds = demoAccounts[activeTab];
    if (email.trim().toLowerCase() !== correctCreds.email || password !== correctCreds.password) {
      setError(`Invalid secure credentials for the ${activeTab.toUpperCase()} access tier.`);
      return;
    }

    // Start secure authentication process
    setIsSubmitting(true);
    setStatusMessage('Querying City General central LDAP directory...');

    setTimeout(() => {
      setStatusMessage('Verifying digital signature and secure badge cryptographic key...');
      
      setTimeout(() => {
        setStatusMessage('Establishing clinical workspace session token...');
        
        setTimeout(() => {
          setIsSubmitting(false);
          onLoginSuccess({
            role: activeTab,
            name: correctCreds.name,
            email: correctCreds.email,
            badgeCode: correctCreds.badgeCode
          });
          onClose();
          // Reset form states
          setEmail('');
          setPassword('');
          setShowPassword(false);
        }, 500);
      }, 600);
    }, 700);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 font-sans"
          >
            {/* Header Graphics */}
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 p-6 pb-4 border-b border-slate-800 relative">
              <div className="absolute right-6 top-6">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">CGH Staff Credentialing</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure Core Node Access</p>
                </div>
              </div>
            </div>

            {/* Quick-Fill Interactive Badges */}
            <div className="p-5 pb-1 bg-slate-950/40 border-b border-slate-800">
              <span className="block text-[9px] font-bold uppercase text-slate-500 tracking-wider mb-2">
                Quick-Fill Secure Roles (Click to autofill)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('developer')}
                  className={`py-1.5 px-2.5 rounded-xl border text-[10px] font-black transition text-left flex flex-col justify-between h-14 cursor-pointer ${
                    activeTab === 'developer' 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Developer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('doctor')}
                  className={`py-1.5 px-2.5 rounded-xl border text-[10px] font-black transition text-left flex flex-col justify-between h-14 cursor-pointer ${
                    activeTab === 'doctor' 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Doctor Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('nurse')}
                  className={`py-1.5 px-2.5 rounded-xl border text-[10px] font-black transition text-left flex flex-col justify-between h-14 cursor-pointer ${
                    activeTab === 'nurse' 
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>Nurse Admin</span>
                </button>
              </div>
            </div>

            {/* Main Form container */}
            <div className="p-6">
              {isSubmitting ? (
                /* Authenticating View */
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
                    <KeyRound className="w-5 h-5 text-teal-400 absolute inset-0 m-auto" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Verification in Progress</p>
                    <p className="text-[11px] text-teal-400 font-mono tracking-tight">{statusMessage}</p>
                  </div>
                </div>
              ) : (
                /* Interactive Form View */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/25 text-[11px] font-semibold text-rose-300 flex items-start gap-2.5"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Active Role Specifier Label */}
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Authenticating as</span>
                    <span className="text-teal-400 font-black">{activeTab} Admin</span>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Staff Secure Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. nurse@hospital.org"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-none transition"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-300">Authorization Code</label>
                      <span className="text-[10px] font-semibold text-slate-500">HIPAA Compliant Key</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-100 rounded-xl py-2 pl-10 pr-10 text-xs font-medium outline-none transition"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      Authorize Access
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer warning */}
            <div className="bg-slate-950 p-4 border-t border-slate-800/60 text-center flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80" />
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest leading-none">
                Protected System. Unauthorized Access Strictly Monitored.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
