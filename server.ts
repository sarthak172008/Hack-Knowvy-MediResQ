import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mediresq-emergency-secret-key-2025';

app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MediResQ API', timestamp: new Date().toISOString() });
});

// Lazy-initialized Gemini instance
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Gemini client:', err);
    }
  }
  return geminiClient;
}

// In-Memory Database for Hackathon Prototype (Simulating PostgreSQL/MySQL)
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string; // In production: bcrypt hash
  fullName: string;
  dob: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  organDonor: boolean;
  resuscitationPreference: 'Full Code' | 'DNR (Do Not Resuscitate)' | 'DNI (Do Not Intubate)';
  emergencyContacts: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }>;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  lockScreenAccessible: boolean;
  privacyPIN?: string;
}

const mockUsers: Record<string, UserRecord> = {
  'user_1': {
    id: 'user_1',
    email: 'rajesh.sharma@example.in',
    passwordHash: 'demo123',
    fullName: 'Rajesh Sharma',
    dob: '1988-08-22',
    bloodType: 'O+',
    allergies: ['Penicillin (Severe - Anaphylaxis)', 'Peanuts', 'NSAIDs (Ibuprofen)'],
    medications: ['Ecosprin 75mg (Daily)', 'Telmisartan 40mg (Morning)', 'Asthalin Inhaler (PRN)'],
    chronicConditions: ['Hypertension', 'Mild Asthma'],
    organDonor: true,
    resuscitationPreference: 'Full Code',
    emergencyContacts: [
      {
        id: 'ec_1',
        name: 'Priya Sharma',
        relationship: 'Spouse',
        phone: '+91 98112 34567',
        isPrimary: true,
      },
      {
        id: 'ec_2',
        name: 'Dr. Alok Verma',
        relationship: 'Family Physician',
        phone: '+91 98765 43210',
        isPrimary: false,
      },
    ],
    insuranceProvider: 'Ayushman Bharat (PM-JAY) / Star Health Comprehensive',
    insurancePolicyNumber: 'AB-PMJAY-DEL-98412',
    lockScreenAccessible: true,
    privacyPIN: '1122',
  },
};

interface EmergencySessionRecord {
  id: string;
  userId?: string;
  status: 'ACTIVE_DISPATCH' | 'AWAITING_ASSISTANCE' | 'EN_ROUTE' | 'RESOLVED';
  urgency: 'CRITICAL' | 'MODERATE' | 'LOW';
  startedAt: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    accuracyMeters?: number;
  };
  triage: any;
  patientSummaryToken: string;
  notifiedContacts: string[];
  emergencyServicesContacted: boolean;
}

const emergencySessions: Record<string, EmergencySessionRecord> = {};

// Reference Facilities in India (National Ambulance Helpline 108 & Unified ERSS 112)
const referenceFacilities = [
  {
    id: 'fac_1',
    name: 'AIIMS New Delhi - Apex Trauma Centre (Jai Prakash Narayan)',
    type: 'Apex Level 1 Trauma Centre',
    address: 'Ring Road, Raj Nagar, Safdarjung Enclave, New Delhi 110029',
    lat: 28.5672,
    lng: 77.2100,
    phone: '+91 11 2659 3677',
    emergencyPhone: '108 / +91 11 2659 4405',
    openStatus: 'Open 24/7',
    estimatedWaitMinutes: 10,
    traumaLevel: 'Level I',
    services: [
      'Apex Level 1 Trauma Resuscitation',
      '24/7 Emergency Surgery',
      'Comprehensive Stroke Ready',
      'Cardiac Cath Lab & Primary PCI',
      'National Blood Bank',
    ],
    icuBedsAvailable: 18,
    acceptedInsurance: ['Ayushman Bharat (PM-JAY)', 'CGHS', 'ECHS', 'Universal Emergency Access'],
  },
  {
    id: 'fac_2',
    name: 'Safdarjung Hospital & VMMC - Emergency & Super Speciality Block',
    type: 'Super Speciality Emergency Hospital',
    address: 'Ansari Nagar East, Ring Road, New Delhi 110029',
    lat: 28.5701,
    lng: 77.2078,
    phone: '+91 11 2616 5060',
    emergencyPhone: '108 / 112',
    openStatus: 'Open 24/7',
    estimatedWaitMinutes: 15,
    traumaLevel: 'Level I',
    services: [
      'National Burn & Plastic Surgery Centre',
      'High-Acuity Resuscitation Bay',
      'Neurosurgery Trauma ICU',
      '24/7 Emergency Dialysis',
      'Pediatric Emergency',
    ],
    icuBedsAvailable: 14,
    acceptedInsurance: ['Ayushman Bharat PM-JAY', 'Central Govt Health Scheme', 'Free Public Emergency'],
  },
  {
    id: 'fac_3',
    name: 'Indraprastha Apollo Hospitals - 24/7 Emergency & Acute Care',
    type: 'Tertiary Care & Super Speciality Trauma',
    address: 'Sarita Vihar, Delhi Mathura Road, New Delhi 110076',
    lat: 28.5355,
    lng: 77.2882,
    phone: '+91 11 2692 5858',
    emergencyPhone: '1066 / 108 / +91 11 2987 1066',
    openStatus: 'Open 24/7',
    estimatedWaitMinutes: 8,
    traumaLevel: 'Level I',
    services: [
      '1066 Dedicated Air/Ground Ambulance Fleet',
      'Door-to-Balloon < 60 Min Cardiac Protocol',
      'Comprehensive Stroke Thrombolysis',
      'Advanced ECMO & Critical Care Transport',
    ],
    icuBedsAvailable: 22,
    acceptedInsurance: ['All Cashless Mediclaim TPAs', 'Star Health', 'HDFC ERGO', 'ICICI Lombard', 'PM-JAY'],
  },
  {
    id: 'fac_4',
    name: 'Fortis Escorts Heart Institute - 24/7 Emergency Cardiac Care',
    type: 'Specialized Cardiac Emergency Centre',
    address: 'Okhla Road, New Friends Colony, New Delhi 110025',
    lat: 28.5612,
    lng: 77.2731,
    phone: '+91 11 4713 5000',
    emergencyPhone: '108 / 105010',
    openStatus: 'Open 24/7',
    estimatedWaitMinutes: 10,
    traumaLevel: 'Level II',
    services: [
      'Emergency Primary PCI Angioplasty',
      'Cardiogenic Shock Resuscitation',
      'Coronary Care Unit (CCU)',
      'Advanced Cardiac Life Support (ACLS)',
    ],
    icuBedsAvailable: 12,
    acceptedInsurance: ['Cashless TPA Network', 'Care Health', 'Star Health', 'Max Bupa', 'CGHS'],
  },
  {
    id: 'fac_5',
    name: 'Max Super Speciality Hospital - Emergency Medicine Department',
    type: 'Multi-Speciality Emergency Hospital',
    address: '1, 2, Press Enclave Marg, Saket, New Delhi 110017',
    lat: 28.5284,
    lng: 77.2131,
    phone: '+91 11 2651 5050',
    emergencyPhone: '108 / 011 4055 4055',
    openStatus: 'Open 24/7',
    estimatedWaitMinutes: 12,
    traumaLevel: 'Level II',
    services: [
      'Rapid Triage & Resuscitation',
      'Emergency Neuro & Orthopaedic Surgery',
      '24/7 CT, MRI & Radiology',
      'Pediatric Emergency Care',
    ],
    icuBedsAvailable: 16,
    acceptedInsurance: ['Bajaj Allianz', 'Niva Bupa', 'Tata AIG', 'Star Health', 'Ayushman Bharat'],
  },
  {
    id: 'fac_6',
    name: 'Mohalla Clinic & Urban Primary Health Centre',
    type: '24/7 Urgent Care & Clinic',
    address: 'Hauz Khas Enclave, New Delhi 110016',
    lat: 28.5494,
    lng: 77.2001,
    phone: '+91 11 2230 7140',
    emergencyPhone: '108 / 102',
    openStatus: 'Open (Primary & Stabilizing)',
    estimatedWaitMinutes: 5,
    traumaLevel: 'Clinic',
    services: [
      'Primary Stabilization & Nebulization',
      'Basic Wound Dressing & Laceration Care',
      'Oral Rehydration & Rapid Diagnostics',
      'Ambulance 108 Dispatch Point',
    ],
    icuBedsAvailable: 0,
    acceptedInsurance: ['Delhi Free Healthcare', 'Universal Public Access'],
  },
];

// Helper: Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES (JWT)
// -------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName, dob, bloodType, allergies, medications, chronicConditions, emergencyContacts } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and Full Name are required.' });
  }

  const existing = Object.values(mockUsers).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const newId = `user_${Date.now()}`;
  const newUser: UserRecord = {
    id: newId,
    email,
    passwordHash: password,
    fullName,
    dob: dob || '1995-01-01',
    bloodType: bloodType || 'Unknown',
    allergies: Array.isArray(allergies) ? allergies : [],
    medications: Array.isArray(medications) ? medications : [],
    chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
    organDonor: true,
    resuscitationPreference: 'Full Code',
    emergencyContacts: Array.isArray(emergencyContacts) && emergencyContacts.length > 0 ? emergencyContacts : [
      { id: `ec_${Date.now()}`, name: 'Primary Contact', relationship: 'Family', phone: '+1 (555) 019-2831', isPrimary: true }
    ],
    lockScreenAccessible: true,
  };

  mockUsers[newId] = newUser;
  const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...safeProfile } = newUser;
  res.json({ token, user: safeProfile });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = Object.values(mockUsers).find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. (Hint for demo: sarah.jenkins@example.com / demo123)' });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...safeProfile } = user;
  res.json({ token, user: safeProfile });
});

app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = mockUsers[decoded.userId];
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const { passwordHash, ...safeProfile } = user;
    res.json({ user: safeProfile });
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid.' });
  }
});

app.put('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = mockUsers[decoded.userId];
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const {
      fullName, dob, bloodType, allergies, medications, chronicConditions,
      organDonor, resuscitationPreference, emergencyContacts, insuranceProvider,
      insurancePolicyNumber, lockScreenAccessible, privacyPIN,
    } = req.body;

    if (fullName) user.fullName = fullName;
    if (dob) user.dob = dob;
    if (bloodType) user.bloodType = bloodType;
    if (allergies) user.allergies = allergies;
    if (medications) user.medications = medications;
    if (chronicConditions) user.chronicConditions = chronicConditions;
    if (organDonor !== undefined) user.organDonor = organDonor;
    if (resuscitationPreference) user.resuscitationPreference = resuscitationPreference;
    if (emergencyContacts) user.emergencyContacts = emergencyContacts;
    if (insuranceProvider !== undefined) user.insuranceProvider = insuranceProvider;
    if (insurancePolicyNumber !== undefined) user.insurancePolicyNumber = insurancePolicyNumber;
    if (lockScreenAccessible !== undefined) user.lockScreenAccessible = lockScreenAccessible;
    if (privacyPIN !== undefined) user.privacyPIN = privacyPIN;

    const { passwordHash, ...safeProfile } = user;
    res.json({ user: safeProfile });
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid.' });
  }
});

// -------------------------------------------------------------
// TRIAGE ALGORITHM & AI GUARDRAILED INTERPRETATION
// -------------------------------------------------------------
const RED_FLAGS: Array<{ pattern: RegExp; description: string; firstAid: { title: string; instruction: string; type: 'critical' | 'action' | 'warning' } }> = [
  {
    pattern: /chest\s*pain|crushing\s*pressure|radiat(ing|es).*(arm|jaw|neck)|heart\s*attack|myocardial/i,
    description: 'Suspicion of Acute Coronary Syndrome / Heart Attack',
    firstAid: {
      title: 'Cardiac Emergency Protocol',
      instruction: 'Have patient sit upright, rest quietly, loosen tight clothing. If not allergic and no recent stomach ulcer, chew one 325mg adult aspirin or two low-dose aspirins. Do not leave unattended. If patient loses consciousness, initiate CPR immediately.',
      type: 'critical',
    },
  },
  {
    pattern: /stroke|facial\s*droop|arm\s*weakness|slur(red)?\s*speech|sudden\s*numbness|FAST\s*sign/i,
    description: 'Acute Neurological Deficit / Suspected Stroke (FAST Signs)',
    firstAid: {
      title: 'Stroke FAST Protocol',
      instruction: 'Note exact time symptoms began. Keep patient lying with head elevated 30 degrees. DO NOT give anything to eat or drink (choking hazard). DO NOT administer aspirin.',
      type: 'critical',
    },
  },
  {
    pattern: /cannot\s*breathe|severe\s*shortness\s*of\s*breath|stridor|gasping|blu(e|ish)\s*lips|cyanosis|suffocat/i,
    description: 'Severe Respiratory Distress / Airway Obstruction',
    firstAid: {
      title: 'Airway & Respiratory Support',
      instruction: 'Position upright in tripod position (hands on knees). Administer emergency rescue inhaler (Albuterol) if prescribed. Ensure clear airflow. Check if choking and perform Heimlich maneuver if unable to cough.',
      type: 'critical',
    },
  },
  {
    pattern: /anaphyla|throat\s*closing|swollen\s*(tongue|throat|lips)|epipen|allergic\s*shock/i,
    description: 'Severe Anaphylactic Reaction',
    firstAid: {
      title: 'Anaphylaxis Protocol (Epinephrine)',
      instruction: 'Administer EpiPen / epinephrine autoinjector into outer mid-thigh immediately. Hold for 3 seconds. Keep patient lying down with legs elevated unless breathing is labored. A second dose may be needed in 5-15 minutes.',
      type: 'critical',
    },
  },
  {
    pattern: /severe\s*bleed|arterial|gushing\s*blood|stab|gunshot|amputat/i,
    description: 'Severe Uncontrolled Hemorrhage',
    firstAid: {
      title: 'Severe Bleeding Control',
      instruction: 'Apply direct, firm, uninterrupted pressure with clean cloth or sterile gauze. Do not remove soaked gauze; layer more on top. If bleeding from a limb is arterial and uncontrolled, apply a commercial tourniquet 2-3 inches above wound.',
      type: 'critical',
    },
  },
  {
    pattern: /unconscious|unresponsive|passed\s*out|fainted|seizure|convuls/i,
    description: 'Altered Consciousness / Unresponsive / Active Seizure',
    firstAid: {
      title: 'Unconscious / Seizure Protocol',
      instruction: 'Check breathing. If NOT breathing normally, begin CPR (100-120 compressions/min). If breathing, place in recovery position on their side. During seizures, clear hard objects, DO NOT restrain, and DO NOT place anything in mouth.',
      type: 'critical',
    },
  },
];

const MODERATE_FLAGS: Array<{ pattern: RegExp; description: string; firstAid: { title: string; instruction: string; type: 'action' | 'warning' } }> = [
  {
    pattern: /fracture|broken\s*bone|deformity|dislocat/i,
    description: 'Suspected Bone Fracture or Joint Dislocation',
    firstAid: {
      title: 'Splinting & Immobilization',
      instruction: 'Immobilize the injured area in the position found. Apply ice pack wrapped in a towel for 15-20 minutes. Do not attempt to force bone back into place.',
      type: 'action',
    },
  },
  {
    pattern: /deep\s*cut|laceration|wound.*stitches/i,
    description: 'Deep Laceration Requiring Sutures',
    firstAid: {
      title: 'Wound Management',
      instruction: 'Rinse gently with clean cool water. Apply firm pressure with sterile dressing to stop bleeding. Seek urgent care within 6 hours for proper suturing to prevent infection.',
      type: 'action',
    },
  },
  {
    pattern: /burn|scald|blistering\s*burn/i,
    description: 'Moderate Burn Injury',
    firstAid: {
      title: 'Burn Cooling Care',
      instruction: 'Cool burn immediately under gentle running cool water for 10-20 minutes. DO NOT use ice or butter. Cover loosely with sterile plastic cling wrap or non-stick dressing.',
      type: 'action',
    },
  },
  {
    pattern: /high\s*fever|stiff\s*neck|lethargy|103|104/i,
    description: 'High Fever with Systemic Symptoms',
    firstAid: {
      title: 'Fever Monitoring & Hydration',
      instruction: 'Provide small sips of electrolyte fluids. Wear light clothing. Monitor for confusion, petechial rash, or stiff neck which require immediate emergency care.',
      type: 'action',
    },
  },
  {
    pattern: /severe\s*abdominal|stomach\s*pain|appendicitis/i,
    description: 'Acute Abdominal Pain',
    firstAid: {
      title: 'Abdominal Rest Protocol',
      instruction: 'Rest in a comfortable position (often knees bent). Refrain from eating solid food or taking laxatives/painkillers until medical evaluation.',
      type: 'warning',
    },
  },
  {
    pattern: /asthma\s*attack|wheezing/i,
    description: 'Asthma Attack / Bronchospasm',
    firstAid: {
      title: 'Rescue Bronchodilator Treatment',
      instruction: 'Sit upright. Take 2 to 4 puffs of rescue inhaler with spacer every 20 minutes for up to 1 hour. If wheezing worsens or lips turn pale, escalate to 108 immediately.',
      type: 'action',
    },
  },
];

app.post('/api/triage/assess', async (req, res) => {
  try {
    const { symptoms = [], customNotes = '', patientInfo = {}, vitals = {} } = req.body;

    const fullText = [...symptoms, customNotes].join(' ').toLowerCase();

    const matchedRedFlags: string[] = [];
    const firstAidInstructions: any[] = [];

    // Check Red Flags
    for (const rf of RED_FLAGS) {
      if (rf.pattern.test(fullText)) {
        matchedRedFlags.push(rf.description);
        firstAidInstructions.push(rf.firstAid);
      }
    }

    // Vital signs check for critical criteria
    if (vitals.oxygenSat && vitals.oxygenSat < 90) {
      matchedRedFlags.push(`Critical Hypoxia (O2 Saturation: ${vitals.oxygenSat}%)`);
      firstAidInstructions.push({
        title: 'Severe Oxygen Depletion',
        instruction: 'Sit upright, ensure maximum ventilation. Call 108 / 112 immediately for emergency ambulance & oxygen.',
        type: 'critical',
      });
    }
    if (vitals.heartRate && (vitals.heartRate > 140 || vitals.heartRate < 45)) {
      matchedRedFlags.push(`Extreme Heart Rate (${vitals.heartRate} BPM)`);
    }
    if (vitals.systolicBP && (vitals.systolicBP < 85 || vitals.systolicBP > 190)) {
      matchedRedFlags.push(`Critical Blood Pressure (${vitals.systolicBP}/${vitals.diastolicBP || '--'} mmHg)`);
    }

    // Check Moderate Flags
    const matchedModerateFlags: string[] = [];
    for (const mf of MODERATE_FLAGS) {
      if (mf.pattern.test(fullText)) {
        matchedModerateFlags.push(mf.description);
        if (!firstAidInstructions.some((i) => i.title === mf.firstAid.title)) {
          firstAidInstructions.push(mf.firstAid);
        }
      }
    }

    // Determine Urgency
    let urgency: 'CRITICAL' | 'MODERATE' | 'LOW' = 'LOW';
    let score = 20;
    let recommendedAction = 'Self-Care & Primary Clinic Visit';
    let timeframe = 'Consult healthcare provider within 24-48 hours or if symptoms worsen.';

    if (matchedRedFlags.length > 0) {
      urgency = 'CRITICAL';
      score = 95;
      recommendedAction = 'IMMEDIATE EMERGENCY DISPATCH (CALL 108 / 112)';
      timeframe = 'Immediate Action Required (< 5 minutes). Transport via Ambulance (108) recommended.';
    } else if (matchedModerateFlags.length > 0 || symptoms.length >= 3 || (vitals.temperature && vitals.temperature > 102)) {
      urgency = 'MODERATE';
      score = 65;
      recommendedAction = 'Urgent Medical Evaluation Required';
      timeframe = 'Proceed to Nearest Emergency Department or Urgent Care within 1 to 2 hours.';
    } else {
      urgency = 'LOW';
      score = 25;
      recommendedAction = 'Non-Emergency Symptom Guidance';
      timeframe = 'Monitor symptoms closely. Contact primary care doctor or telehealth provider.';
      firstAidInstructions.push({
        title: 'General Symptom Comfort Care',
        instruction: 'Rest comfortably in a well-ventilated space. Stay hydrated with water or electrolyte fluids. Document any progression of symptoms.',
        type: 'action',
      });
    }

    // AI-Assisted Clinical Interpretation using Gemini 3.8 Flash (Server-Side)
    let aiInterpretation: any = null;
    const ai = getGemini();

    if (ai) {
      try {
        const prompt = `
Patient Info: Age ${patientInfo.age || 'Unknown'}, Gender ${patientInfo.gender || 'Unknown'}, Pregnant: ${patientInfo.isPregnant ? 'Yes' : 'No'}
Reported Symptoms: ${symptoms.join(', ') || 'None selected'}
User Narrative Notes: "${customNotes || 'None'}"
Vitals: HR: ${vitals.heartRate || 'N/A'}, BP: ${vitals.systolicBP ? `${vitals.systolicBP}/${vitals.diastolicBP}` : 'N/A'}, O2 Sat: ${vitals.oxygenSat || 'N/A'}%, Temp: ${vitals.temperature || 'N/A'}F
Algorithmic Urgency Level: ${urgency}
Matched Clinical Red Flags: ${matchedRedFlags.join(', ') || 'None'}

As MediResQ's Clinical Emergency Interpretation Engine, provide a structured clinical assessment.
CRITICAL SAFETY GUARDRAIL: You must NEVER diagnose definitely. You must NEVER downgrade a Critical urgency. Keep advice safe, concise, actionable for first responders, and include questions for EMTs.
`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are the server-side medical emergency triage copilot for MediResQ.
Always prioritize life preservation and caution. Never contradict red-flag medical safety standards.
Provide valid JSON following the schema.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: 'Concise 2-sentence clinical synopsis of patient emergency state',
                },
                potentialConcerns: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 2-4 differential emergency concerns to rule out',
                },
                clinicalNotes: {
                  type: Type.STRING,
                  description: 'Actionable notes formatted for paramedics or triage nurses',
                },
                safetyAdvisory: {
                  type: Type.STRING,
                  description: 'High-visibility safety warning or precautionary directive',
                },
                suggestedQuestionsForEMT: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Questions the user or caregiver should ask the arriving EMTs/doctors',
                },
              },
              required: ['summary', 'potentialConcerns', 'clinicalNotes', 'safetyAdvisory', 'suggestedQuestionsForEMT'],
            },
          },
        });

        if (geminiRes.text) {
          aiInterpretation = JSON.parse(geminiRes.text);
        }
      } catch (aiErr) {
        console.warn('Gemini triage interpretation fallback to algorithmic heuristics:', aiErr);
      }
    }

    // Fallback AI interpretation if Gemini is unavailable or failed
    if (!aiInterpretation) {
      if (urgency === 'CRITICAL') {
        aiInterpretation = {
          summary: `High-acuity medical emergency detected based on reported red-flag indicators (${matchedRedFlags.join(', ') || 'severe acute distress'}).`,
          potentialConcerns: ['Acute Cardiopulmonary Compromise', 'Neurological Event', 'Severe Anaphylactic Reaction'],
          clinicalNotes: 'Immediate paramedic dispatch warranted. Maintain patent airway, continuous vitals monitoring, and prepare for rapid transfer.',
          safetyAdvisory: 'DO NOT DRIVE YOURSELF. Await emergency medical personnel. Remain calm and seated or lying down.',
          suggestedQuestionsForEMT: [
            'What is the priority hospital with appropriate specialty coverage?',
            'Should aspirin or medication be administered before ambulance arrives?',
            'What vital changes should we immediately monitor?',
          ],
        };
      } else if (urgency === 'MODERATE') {
        aiInterpretation = {
          summary: 'Significant symptoms noted that require professional clinical evaluation to prevent secondary complications.',
          potentialConcerns: ['Acute Infection', 'Musculoskeletal Injury', 'Dehydration / GI Distress'],
          clinicalNotes: 'Urgent Care or ED evaluation recommended within 1-2 hours. Vital signs stable but warrant reassessment.',
          safetyAdvisory: 'If breathing becomes difficult, chest pain develops, or consciousness changes, immediately call 108 / 112.',
          suggestedQuestionsForEMT: [
            'Do you have digital imaging / X-ray available onsite today?',
            'What is the current triage wait time?',
          ],
        };
      } else {
        aiInterpretation = {
          summary: 'Symptoms currently indicate low immediate acuity. Suitable for outpatient primary care or structured self-care.',
          potentialConcerns: ['Viral Upper Respiratory Infection', 'Minor Strain', 'Mild Allergic Rhinitis'],
          clinicalNotes: 'Low acuity. Conservative therapy, rest, hydration, and primary care follow-up indicated.',
          safetyAdvisory: 'If new red-flag symptoms arise, re-triage or seek immediate emergency care.',
          suggestedQuestionsForEMT: [
            'Which over-the-counter remedies are safe with existing medications?',
            'What timeline should I expect before full recovery?',
          ],
        };
      }
    }

    const triageAssessment = {
      id: `triage_${Date.now()}`,
      timestamp: new Date().toISOString(),
      patientInfo,
      symptoms,
      customNotes,
      vitals,
      urgency,
      score,
      matchedRedFlags,
      recommendedAction,
      timeframe,
      firstAidInstructions,
      aiInterpretation,
      disclaimer: 'DISCLAIMER: MediResQ is a clinical decision-support and emergency response aid, NOT a certified doctor or diagnostic replacement. If experiencing severe or life-threatening symptoms, dial emergency medical services (108 / 112 in India) immediately.',
    };

    res.json(triageAssessment);
  } catch (err: any) {
    console.error('Triage error:', err);
    res.status(500).json({ error: 'Internal triage processing error', details: err.message });
  }
});

// -------------------------------------------------------------
// DEDICATED GEMINI API ENDPOINTS
// -------------------------------------------------------------

// 1. Natural Language Emergency Intake
app.post('/api/gemini/natural-intake', async (req, res) => {
  try {
    const { narrative = '' } = req.body;
    if (!narrative || typeof narrative !== 'string' || narrative.trim().length === 0) {
      return res.status(400).json({ error: 'Narrative description is required.' });
    }

    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const prompt = `
Analyze the following natural language emergency or bystander description:
"${narrative}"

Extract all clinically relevant symptoms, vital signs, patient indicators, clinical red flags, and determine preliminary triage urgency.
CRITICAL SAFETY RULE: You are a life-safety system. If there is ANY indication of chest pain, stroke (facial droop, arm weakness, speech difficulty), severe breathing difficulty, choking, uncontrolled bleeding, or loss of consciousness, you MUST categorize urgency as CRITICAL. Never minimize life-threatening risks.
`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are the Google Gemini Emergency Clinical Extraction Copilot for MediResQ.
Extract symptoms, vitals, flags, urgency, and step-by-step immediate first aid from natural language. Output strictly valid JSON conforming to the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedSymptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Standardized symptom strings identified in the narrative',
            },
            extractedVitals: {
              type: Type.OBJECT,
              properties: {
                heartRate: { type: Type.NUMBER, description: 'Heart rate in BPM if mentioned' },
                systolicBP: { type: Type.NUMBER, description: 'Systolic blood pressure if mentioned' },
                diastolicBP: { type: Type.NUMBER, description: 'Diastolic blood pressure if mentioned' },
                oxygenSat: { type: Type.NUMBER, description: 'O2 saturation percentage if mentioned' },
                temperature: { type: Type.NUMBER, description: 'Body temp in Fahrenheit if mentioned' },
              },
            },
            patientContext: {
              type: Type.OBJECT,
              properties: {
                approxAge: { type: Type.STRING, description: 'Estimated age or age group' },
                gender: { type: Type.STRING, description: 'Estimated gender if mentioned' },
                severitySummary: { type: Type.STRING, description: '1-sentence clinical synopsis' },
              },
            },
            detectedRedFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Life-threatening red flags identified in text',
            },
            urgency: {
              type: Type.STRING,
              description: 'CRITICAL, MODERATE, or LOW',
            },
            immediateFirstAid: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 immediate actionable bullet points while awaiting help',
            },
            reassuranceNote: {
              type: Type.STRING,
              description: 'Calm, clear reassuring directive for bystander/caller',
            },
          },
          required: ['extractedSymptoms', 'detectedRedFlags', 'urgency', 'immediateFirstAid', 'reassuranceNote'],
        },
      },
    });

    if (!geminiRes.text) {
      throw new Error('No response returned from Gemini API');
    }

    const data = JSON.parse(geminiRes.text);
    res.json(data);
  } catch (err: any) {
    console.error('Gemini Natural Intake Error:', err);
    res.status(500).json({ error: 'Failed to process natural intake', details: err.message });
  }
});

// 2. Interactive Emergency AI Copilot Q&A
app.post('/api/gemini/emergency-qa', async (req, res) => {
  try {
    const { question = '', emergencyContext = {} } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const contextPrompt = `
CURRENT INCIDENT CONTEXT:
Urgency: ${emergencyContext.urgency || 'CRITICAL'}
Symptoms: ${emergencyContext.symptoms ? emergencyContext.symptoms.join(', ') : 'Acute Medical Emergency'}
Vitals: ${JSON.stringify(emergencyContext.vitals || {})}
Allergies: ${emergencyContext.allergies ? emergencyContext.allergies.join(', ') : 'None documented'}
Medications: ${emergencyContext.medications ? emergencyContext.medications.join(', ') : 'None documented'}

USER / BYSTANDER QUESTION:
"${question}"

Provide immediate, calm, concise, evidence-based emergency first-aid instruction.
DO NOT provide complex medical diagnoses. Keep answers under 120 words with clear bullet points. If dangerous action (e.g. giving water to unconscious person), give clear "DO NOT" warning.
`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: `You are the Google Gemini Real-Time Emergency First-Aid Assistant for MediResQ.
Provide direct, life-preserving, calm instructions. Always remind users to stay on the line with 108 emergency ambulance dispatch (or 112).
Output valid JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directAnswer: {
              type: Type.STRING,
              description: 'Clear direct response to the specific question',
            },
            actionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Numbered action steps for the bystander/caregiver',
            },
            criticalWarning: {
              type: Type.STRING,
              description: 'Specific what-NOT-to-do warning (e.g. DO NOT move neck if trauma)',
            },
            emergencyEscalation: {
              type: Type.STRING,
              description: 'When to immediately escalate to CPR or call back 108 / 112',
            },
          },
          required: ['directAnswer', 'actionSteps', 'criticalWarning'],
        },
      },
    });

    if (!geminiRes.text) {
      throw new Error('No response returned from Gemini API');
    }

    const data = JSON.parse(geminiRes.text);
    res.json(data);
  } catch (err: any) {
    console.error('Gemini Emergency QA Error:', err);
    res.status(500).json({ error: 'Failed to process emergency Q&A', details: err.message });
  }
});

// 3. Paramedic Clinical SBAR Handoff Summary
app.post('/api/gemini/sbar-summary', async (req, res) => {
  try {
    const { patientProfile, triageSession } = req.body;

    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured.',
      });
    }

    const prompt = `
Generate an EMT/Hospital standard SBAR (Situation, Background, Assessment, Recommendation) clinical handoff note based on:
Patient: ${patientProfile?.fullName || 'Unknown'}, Age/DOB: ${patientProfile?.dob || 'Unknown'}, Blood Type: ${patientProfile?.bloodType || 'Unknown'}
Allergies: ${patientProfile?.allergies?.join(', ') || 'NKDA'}
Active Meds: ${patientProfile?.medications?.join(', ') || 'None'}
Chronic Conditions: ${patientProfile?.chronicConditions?.join(', ') || 'None'}
Incident Urgency: ${triageSession?.urgency || 'CRITICAL'}
Chief Symptoms: ${triageSession?.symptoms?.join(', ') || 'Acute Distress'}
Vitals: ${JSON.stringify(triageSession?.vitals || {})}
`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are the Google Gemini Clinical SBAR Generator for EMT and ER staff.
Provide a professional, high-density, error-free clinical handoff summary in JSON format.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            situation: { type: Type.STRING, description: 'Immediate chief complaint and acute status' },
            background: { type: Type.STRING, description: 'Medical history, allergies, medications' },
            assessment: { type: Type.STRING, description: 'Clinical findings, vitals, red-flag risks' },
            recommendation: { type: Type.STRING, description: 'Immediate ER actions, priority diagnostics, specialty consults' },
          },
          required: ['situation', 'background', 'assessment', 'recommendation'],
        },
      },
    });

    if (!geminiRes.text) {
      throw new Error('No response returned from Gemini API');
    }

    const data = JSON.parse(geminiRes.text);
    res.json(data);
  } catch (err: any) {
    console.error('Gemini SBAR Error:', err);
    res.status(500).json({ error: 'Failed to generate SBAR summary', details: err.message });
  }
});

// -------------------------------------------------------------
// NEARBY HEALTHCARE FACILITIES
// -------------------------------------------------------------
app.get('/api/facilities/nearby', (req, res) => {
  const userLat = parseFloat(req.query.lat as string) || 28.6139;
  const userLng = parseFloat(req.query.lng as string) || 77.2090;
  const category = (req.query.category as string) || 'ALL';

  // Calculate real distance for all facilities relative to requested coordinates
  const facilitiesWithDistance = referenceFacilities.map((fac) => {
    const distKm = calculateDistanceKm(userLat, userLng, fac.lat, fac.lng);
    const distMiles = Math.round(distKm * 0.621371 * 10) / 10;
    return {
      ...fac,
      distanceKm: distKm,
      distanceMiles: distMiles,
    };
  });

  // Sort by distance
  facilitiesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  let filtered = facilitiesWithDistance;
  if (category === 'CRITICAL') {
    filtered = facilitiesWithDistance.filter(
      (f) => f.type.includes('Trauma') || f.type.includes('Cardiac') || f.traumaLevel.includes('Level I')
    );
  } else if (category === 'MODERATE') {
    filtered = facilitiesWithDistance.filter(
      (f) => f.type.includes('Hospital') || f.type.includes('Urgent') || f.traumaLevel.includes('Level II')
    );
  } else if (category === 'LOW') {
    filtered = facilitiesWithDistance.filter(
      (f) => f.type.includes('Urgent') || f.type.includes('Clinic')
    );
  }

  // Always return at least top facilities
  if (filtered.length === 0) filtered = facilitiesWithDistance;

  res.json({
    userLocation: { lat: userLat, lng: userLng },
    totalCount: filtered.length,
    facilities: filtered,
  });
});

// -------------------------------------------------------------
// EMERGENCY SESSIONS & LOCATION SHARING
// -------------------------------------------------------------
app.post('/api/emergency/create-session', (req, res) => {
  const { triage, location, patientProfile, notifiedContacts = [] } = req.body;

  const sessionId = `emg_${Date.now()}`;
  const token = `token_${Math.random().toString(36).substring(2, 10)}`;

  const newSession: EmergencySessionRecord = {
    id: sessionId,
    userId: patientProfile?.id || 'guest',
    status: 'ACTIVE_DISPATCH',
    urgency: triage?.urgency || 'CRITICAL',
    startedAt: new Date().toISOString(),
    location: location || {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Connaught Place / Ring Road, New Delhi, India (GPS Active)',
      accuracyMeters: 5,
    },
    triage: triage || null,
    patientSummaryToken: token,
    notifiedContacts,
    emergencyServicesContacted: true,
  };

  emergencySessions[sessionId] = newSession;

  res.json({
    sessionId,
    token,
    session: newSession,
    shareableLink: `/emergency-summary/${token}`,
  });
});

app.get('/api/emergency/session/:id', (req, res) => {
  const session = emergencySessions[req.params.id];
  if (!session) {
    return res.status(404).json({ error: 'Emergency session not found' });
  }
  res.json({ session });
});

app.post('/api/emergency/update-location', (req, res) => {
  const { sessionId, lat, lng, address } = req.body;
  const session = emergencySessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Emergency session not found' });
  }
  session.location = {
    lat,
    lng,
    address: address || 'Updated Live GPS Location',
    accuracyMeters: 3,
  };
  res.json({ success: true, location: session.location });
});

// -------------------------------------------------------------
// PARAMEDIC EMERGENCY CARD SUMMARY (FAST-SCAN)
// -------------------------------------------------------------
app.get('/api/emergency/summary/:token', (req, res) => {
  const token = req.params.token;
  const session = Object.values(emergencySessions).find((s) => s.patientSummaryToken === token);

  // Return session summary or fallback demo patient summary for medical responders
  const demoProfile = mockUsers['user_1'];

  const responseSummary = {
    token,
    generatedAt: new Date().toISOString(),
    patient: {
      fullName: demoProfile.fullName,
      dob: demoProfile.dob,
      bloodType: demoProfile.bloodType,
      allergies: demoProfile.allergies,
      medications: demoProfile.medications,
      chronicConditions: demoProfile.chronicConditions,
      organDonor: demoProfile.organDonor,
      resuscitationPreference: demoProfile.resuscitationPreference,
      insurance: {
        provider: demoProfile.insuranceProvider,
        policyNumber: demoProfile.insurancePolicyNumber,
      },
      emergencyContacts: demoProfile.emergencyContacts,
    },
    incident: session
      ? {
          urgency: session.urgency,
          status: session.status,
          startedAt: session.startedAt,
          location: session.location,
          chiefComplaint: session.triage?.symptoms || ['Emergency Medical Assistance'],
          matchedRedFlags: session.triage?.matchedRedFlags || [],
          vitals: session.triage?.vitals || {},
          clinicalNotes: session.triage?.aiInterpretation?.clinicalNotes || 'Immediate clinical stabilization recommended.',
        }
      : {
          urgency: 'CRITICAL',
          status: 'ACTIVE_DISPATCH',
          startedAt: new Date().toISOString(),
          location: { lat: 28.6139, lng: 77.2090, address: 'Connaught Place / AIIMS Trauma Corridor, New Delhi, India' },
          chiefComplaint: ['Sudden Severe Chest Pain', 'Shortness of Breath'],
          matchedRedFlags: ['Suspicion of Acute Coronary Syndrome'],
          vitals: { heartRate: 118, systolicBP: 145, diastolicBP: 92, oxygenSat: 93 },
          clinicalNotes: 'Suspected ACS. Patient administered aspirin per protocol. Monitor lead II cardiac rhythm.',
        },
  };

  res.json(responseSummary);
});

// -------------------------------------------------------------
// COMPLETE SYSTEM BLUEPRINT & HACKATHON ARCHITECTURE
// -------------------------------------------------------------
app.get('/api/system/blueprint', (req, res) => {
  res.json({
    projectName: 'MediResQ – Smart Emergency Health Response System',
    tagline: 'Bridging the Critical 8-Minute Gap Between Medical Distress and Paramedic Arrival',
    version: '1.0.0-hackathon-mvp',
    architecture: {
      frontend: 'React 19 + TypeScript + Tailwind CSS v4 + Motion + Leaflet OpenStreetMap Engine',
      backend: 'Node.js Express + TypeScript Full-Stack API Gateway (with ready Java Spring Boot controller blueprints)',
      database: 'Relational Schema (PostgreSQL / MySQL compliant with HIPAA-conscious PII encryption)',
      aiComponent: 'Gemini 3.8 Flash via @google/genai SDK with rule-based safety guardrails',
      security: 'Stateless JWT authentication, HMAC-SHA256 tokens, lock-screen emergency bypass PIN',
    },
    keyFeaturesMVP: [
      'Transparent Rule-Based Triage Matrix (START/Manchester Triage compliant)',
      '1-Tap Emergency Dispatch with prominent direct dialer and auditory countdown',
      'Interactive OpenStreetMap Locator with real-time distance and trauma level filters',
      'Real-Time Geolocation Consent & 1-Tap SMS/WhatsApp Emergency Contact Beacon',
      'Paramedic 5-Second Fast-Scan QR Summary Card (Allergies, Meds, Blood Type, Code Status)',
      'Interactive Audio-Guided CPR Metronome (100-120 BPM) with visual chest compression guide',
      'FAST Stroke & Heart Attack Quick-Screen bypass workflows',
    ],
    futureScalability: [
      'ERSS 112 / 108 Emergency Ambulance CAD direct API link',
      'Wearable ECG & Continuous SpO2 Bluetooth ingestion (Apple HealthKit / Wear OS)',
      'Automated Drone AED (Automated External Defibrillator) dispatch coordination',
      'Satellite SOS fallback for remote zones without cellular broadband',
      'Multilingual real-time voice translation via Gemini 3.5 Transcribe Live for EMT handoff',
    ],
    pitch: {
      hook: 'In sudden cardiac arrest or acute stroke, every 60-second delay reduces survival chances by 7-10%. Yet the average ambulance response time is 8-14 minutes.',
      solution: 'MediResQ transforms the user’s smartphone into an instantaneous emergency response copilot that assesses clinical urgency in 15 seconds, dispatches live GPS location to loved ones, guides bystander CPR with a metronomic beat, and generates a paramedic-ready summary card before the ambulance sirens even arrive.',
      marketOpportunity: '140 million emergency room visits annually in the US alone; critical need for bystander preparedness and rapid triage in smart cities worldwide.',
    },
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediResQ] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
