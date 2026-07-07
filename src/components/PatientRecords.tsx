import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Plus, Search, FileText, AlertCircle, Edit, Trash2, ShieldAlert, CheckCircle, FilePlus, Eye } from 'lucide-react';
import { PatientRecord } from '../types';

interface PatientRecordsProps {
  records: PatientRecord[];
  onAddRecord: (record: Omit<PatientRecord, 'id' | 'lastUpdated'>) => void;
  onUpdateRecord: (record: PatientRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export default function PatientRecords({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}: PatientRecordsProps) {
  const [search, setSearch] = useState('');
  const [filterBlood, setFilterBlood] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  
  // Modals / forms
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBloodType, setFormBloodType] = useState('O+');
  const [formAllergies, setFormAllergies] = useState('');
  const [formHistory, setFormHistory] = useState('');
  const [formMedications, setFormMedications] = useState('');
  const [formProgress, setFormProgress] = useState('');

  // Access Log (Compliance simulation)
  const [complianceLogs, setComplianceLogs] = useState<{ id: string; time: string; action: string; user: string }[]>([
    { id: '1', time: '09:15 AM', action: 'Accessed patient record: James Cole', user: 'Nurse Jenkins' },
    { id: '2', time: '09:20 AM', action: 'Created record: Evelyn Vance', user: 'Dr. Rostova' },
  ]);

  const logCompliance = (action: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setComplianceLogs(prev => [
      { id: `${Date.now()}`, time: timeStr, action, user: 'Dr. Elena Rostova (Staff)' },
      ...prev
    ]);
  };

  const handleOpenAdd = () => {
    setFormName('');
    setFormDob('');
    setFormGender('Male');
    setFormPhone('');
    setFormEmail('');
    setFormBloodType('O+');
    setFormAllergies('');
    setFormHistory('');
    setFormMedications('');
    setFormProgress('');
    setIsAdding(true);
  };

  const handleOpenEdit = (rec: PatientRecord) => {
    setSelectedRecord(rec);
    setFormName(rec.name);
    setFormDob(rec.dob);
    setFormGender(rec.gender);
    setFormPhone(rec.phone);
    setFormEmail(rec.email);
    setFormBloodType(rec.bloodType);
    setFormAllergies(rec.allergies.join(', '));
    setFormHistory(rec.medicalHistory.join(', '));
    setFormMedications(rec.currentMedications.join(', '));
    setFormProgress(rec.treatmentProgress.join('\n'));
    setIsEditing(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDob) return;

    onAddRecord({
      name: formName,
      dob: formDob,
      gender: formGender,
      phone: formPhone,
      email: formEmail,
      bloodType: formBloodType,
      allergies: formAllergies ? formAllergies.split(',').map(s => s.trim()) : [],
      medicalHistory: formHistory ? formHistory.split(',').map(s => s.trim()) : [],
      currentMedications: formMedications ? formMedications.split(',').map(s => s.trim()) : [],
      treatmentProgress: formProgress ? formProgress.split('\n').map(s => s.trim()) : [],
    });

    logCompliance(`Created patient record for: ${formName}`);
    setIsAdding(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !formName || !formDob) return;

    onUpdateRecord({
      ...selectedRecord,
      name: formName,
      dob: formDob,
      gender: formGender,
      phone: formPhone,
      email: formEmail,
      bloodType: formBloodType,
      allergies: formAllergies ? formAllergies.split(',').map(s => s.trim()) : [],
      medicalHistory: formHistory ? formHistory.split(',').map(s => s.trim()) : [],
      currentMedications: formMedications ? formMedications.split(',').map(s => s.trim()) : [],
      treatmentProgress: formProgress ? formProgress.split('\n').map(s => s.trim()) : [],
      lastUpdated: new Date().toLocaleDateString(),
    });

    logCompliance(`Updated patient record for: ${formName}`);
    setIsEditing(false);
    setSelectedRecord(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the medical file for ${name}? This action is permanent and HIPAA audited.`)) {
      onDeleteRecord(id);
      logCompliance(`DELETED patient record for: ${name}`);
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  };

  const handleViewDetails = (rec: PatientRecord) => {
    setSelectedRecord(rec);
    logCompliance(`Viewed demographic and clinical records of: ${rec.name}`);
  };

  // Filters
  const filtered = records.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(search.toLowerCase()) || 
                          rec.id.toLowerCase().includes(search.toLowerCase()) ||
                          rec.phone.includes(search);
    const matchesBlood = filterBlood === 'All' || rec.bloodType === filterBlood;
    return matchesSearch && matchesBlood;
  });

  return (
    <div id="patient-records-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">EHR / Patient Health Records</h3>
            <p className="text-xs text-slate-500">Secure electronic health records storage</p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Patient Record
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 divide-y xl:divide-y-0 xl:divide-x divide-slate-100 flex-1">
        {/* Main Records List / Grid Table (Cols 3) */}
        <div className="xl:col-span-3 p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, patient ID, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            {/* Blood type select filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Blood Type</span>
              <select
                value={filterBlood}
                onChange={(e) => setFilterBlood(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs font-medium focus:outline-hidden"
              >
                <option value="All">All types</option>
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
              </select>
            </div>
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-2.5">
            {filtered.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <FileText className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs text-slate-500 font-medium">No patient files found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Check spelling or create a new file</p>
              </div>
            ) : (
              filtered.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleViewDetails(rec)}
                  className={`p-3.5 border rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                    selectedRecord?.id === rec.id
                      ? 'bg-teal-50/30 border-teal-500 shadow-2xs'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100">
                      {rec.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{rec.name}</h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-teal-50 border border-teal-100 text-teal-600 rounded">
                          {rec.bloodType}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        ID: {rec.id} | DOB: {rec.dob} ({rec.gender})
                      </p>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {rec.allergies.slice(0, 2).map((al, idx) => (
                          <span key={idx} className="text-[9px] bg-rose-50 border border-rose-100 text-rose-600 font-semibold px-1.5 py-0.2 rounded">
                            ⚠️ {al}
                          </span>
                        ))}
                        {rec.allergies.length > 2 && (
                          <span className="text-[8px] text-slate-400 font-bold self-center">
                            +{rec.allergies.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(rec); }}
                      className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                      title="Edit EHR"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(rec.id, rec.name); }}
                      className="p-1.5 text-red-500 hover:text-red-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                      title="Delete EHR"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* HIPAA & Compliance Audit Log Feed (At bottom) */}
          <div className="border-t border-slate-100 pt-3 mt-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Audited Clinical Access Log (HIPAA Compliant)
              </span>
            </div>
            <div className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 max-h-[70px] overflow-y-auto space-y-1.5">
              {complianceLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                  <span className="text-slate-400 shrink-0">[{log.time}]</span>
                  <span className="truncate mx-2 text-slate-600">{log.action}</span>
                  <span className="text-teal-600 shrink-0">@{log.user}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed EHR Record View Drawer (Cols 2) */}
        <div className="xl:col-span-2 p-5 bg-slate-50/50 flex flex-col h-full justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Selected Clinical Record
            </h4>

            {selectedRecord ? (
              <div className="space-y-4">
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Demographics</span>
                  <h4 className="text-sm font-bold text-slate-800">{selectedRecord.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                    <div>DOB: <span className="text-slate-700">{selectedRecord.dob}</span></div>
                    <div>Gender: <span className="text-slate-700">{selectedRecord.gender}</span></div>
                    <div>Phone: <span className="text-slate-700">{selectedRecord.phone}</span></div>
                    <div>Email: <span className="text-slate-700">{selectedRecord.email}</span></div>
                  </div>
                </div>

                {/* History & Allergies */}
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2.5">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Medical History</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRecord.medicalHistory.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic">None logged</span>
                      ) : (
                        selectedRecord.medicalHistory.map((hist, i) => (
                          <span key={i} className="text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-slate-600 font-medium">
                            {hist}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Allergies & Contraindications</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRecord.allergies.length === 0 ? (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">No known drug allergies (NKDA)</span>
                      ) : (
                        selectedRecord.allergies.map((al, i) => (
                          <span key={i} className="text-[9px] bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded text-rose-600 font-bold">
                            ⚠️ {al}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Active Medications */}
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Current Medications</span>
                  <div className="space-y-1">
                    {selectedRecord.currentMedications.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No prescriptions logged</p>
                    ) : (
                      selectedRecord.currentMedications.map((med, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>{med}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Treatment Progress Tracker */}
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Clinical Treatment Log & Progress</span>
                  <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                    {selectedRecord.treatmentProgress.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No clinical progress logs recorded</p>
                    ) : (
                      selectedRecord.treatmentProgress.map((prog, i) => (
                        <div key={i} className="text-[10px] leading-relaxed text-slate-600 bg-slate-50 p-1.5 rounded italic">
                          "{prog}"
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white border border-dashed border-slate-200 rounded-2xl">
                <Eye className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs text-slate-500 font-medium">No Patient File Selected</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click any record on the left to review demographics, allergies, medical history, and treatment logs.</p>
              </div>
            )}
          </div>

          {selectedRecord && (
            <div className="text-[10px] text-slate-400 font-medium text-center mt-3">
              Last record synchronization: Today, {selectedRecord.lastUpdated}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Patient Record Modal Dialog */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                <div className="flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-teal-600" />
                  <h4 className="font-bold text-slate-800">
                    {isAdding ? 'Create Patient Medical Record' : 'Edit Medical Record'}
                  </h4>
                </div>
                <button
                  onClick={() => { setIsAdding(false); setIsEditing(false); }}
                  className="p-1 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={isAdding ? handleAddSubmit : handleEditSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gender</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Blood Type</label>
                    <select
                      value={formBloodType}
                      onChange={(e) => setFormBloodType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="(555) 019-2034"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Allergies (comma separated)</label>
                  <input
                    type="text"
                    value={formAllergies}
                    onChange={(e) => setFormAllergies(e.target.value)}
                    placeholder="e.g., Penicillin, Peanuts, Latex"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Medical History (comma separated)</label>
                  <input
                    type="text"
                    value={formHistory}
                    onChange={(e) => setFormHistory(e.target.value)}
                    placeholder="e.g., Hypertension, Asthma, Type 2 Diabetes"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Current Active Medications (comma separated)</label>
                  <input
                    type="text"
                    value={formMedications}
                    onChange={(e) => setFormMedications(e.target.value)}
                    placeholder="e.g., Albuterol, Metformin"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Treatment Progress / Notes (one entry per line)</label>
                  <textarea
                    value={formProgress}
                    onChange={(e) => setFormProgress(e.target.value)}
                    placeholder="e.g., Patient is responding well to physical therapy."
                    rows={2}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setIsEditing(false); }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {isAdding ? 'Save Patient File' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
