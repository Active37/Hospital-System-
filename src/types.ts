export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  availability: string[];
  avatarColor: string;
  experience: number;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'scheduled' | 'cancelled';
  notes?: string;
}

export interface VitalRecord {
  id: string;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
}

export interface Prescription {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  takenToday: boolean;
  refillStatus: 'none' | 'requested' | 'approved' | 'preparing' | 'ready';
  remainingRefills: number;
  scheduledTimes?: string[];
}

export interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  category: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: string[];
  currentMedications: string[];
  treatmentProgress: string[];
  lastUpdated: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  amountPaid: number;
  status: 'paid' | 'unpaid' | 'pending_insurance' | 'partially_paid';
  insuranceProvider?: string;
  insuranceClaimStatus?: 'not_filed' | 'filed' | 'approved' | 'rejected';
  paymentPlan?: {
    totalMonths: number;
    monthlyInstallment: number;
    monthsPaid: number;
  };
}

export interface InsuranceClaim {
  id: string;
  invoiceId: string;
  patientName: string;
  provider: string;
  policyNumber: string;
  claimAmount: number;
  status: 'filed' | 'approved' | 'rejected';
  submittedDate: string;
  notes?: string;
}
