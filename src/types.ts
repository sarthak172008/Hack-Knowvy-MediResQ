export type UrgencyLevel = 'CRITICAL' | 'MODERATE' | 'LOW';

export type AppTheme = 'clinical' | 'midnight' | 'high-contrast' | 'calm-sage';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  tagline: string;
  badge: string;
  bgHex: string;
  surfaceHex: string;
  accentHex: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  email: string;
  dob: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  organDonor: boolean;
  resuscitationPreference: 'Full Code' | 'DNR (Do Not Resuscitate)' | 'DNI (Do Not Intubate)';
  emergencyContacts: EmergencyContact[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  lockScreenAccessible: boolean;
  privacyPIN?: string;
}

export interface VitalSigns {
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSat?: number;
  temperature?: number;
}

export interface FirstAidStep {
  title: string;
  instruction: string;
  warning?: string;
  type: 'action' | 'warning' | 'critical';
}

export interface AIInterpretation {
  summary: string;
  potentialConcerns: string[];
  clinicalNotes: string;
  safetyAdvisory: string;
  suggestedQuestionsForEMT: string[];
}

export interface TriageAssessment {
  id: string;
  timestamp: string;
  patientInfo: {
    name?: string;
    age?: number;
    gender?: string;
    isPregnant?: boolean;
  };
  symptoms: string[];
  customNotes: string;
  vitals?: VitalSigns;
  urgency: UrgencyLevel;
  score: number;
  matchedRedFlags: string[];
  recommendedAction: string;
  timeframe: string;
  firstAidInstructions: FirstAidStep[];
  aiInterpretation?: AIInterpretation;
  disclaimer: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'Level 1 Trauma Center' | 'Emergency Hospital' | 'Urgent Care Center' | 'Specialized Cardiac/Stroke Center' | '24/7 Clinic' | string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  distanceMiles: number;
  phone: string;
  emergencyPhone: string;
  openStatus: 'Open 24/7' | 'Open (Closes 10 PM)' | 'Busy' | string;
  estimatedWaitMinutes: number;
  traumaLevel: 'Level I' | 'Level II' | 'Level III' | 'Urgent Care' | 'Clinic' | string;
  services: string[];
  icuBedsAvailable: number;
  acceptedInsurance: string[];
}

export interface EmergencySession {
  id: string;
  status: 'ACTIVE_DISPATCH' | 'AWAITING_ASSISTANCE' | 'EN_ROUTE' | 'RESOLVED';
  urgency: UrgencyLevel;
  startedAt: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    accuracyMeters?: number;
  };
  triage: TriageAssessment;
  patientSummaryToken: string;
  notifiedContacts: string[];
  emergencyServicesContacted: boolean;
}

export interface AuthState {
  user: PatientProfile | null;
  token: string | null;
  isAuthenticated: boolean;
}
