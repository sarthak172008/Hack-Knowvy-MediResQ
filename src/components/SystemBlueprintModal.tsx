import React, { useState } from 'react';
import {
  Layers,
  Database,
  Terminal,
  GitFork,
  FolderTree,
  Sparkles,
  Rocket,
  Lightbulb,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface SystemBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemBlueprintModal: React.FC<SystemBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'apis' | 'userflow' | 'pitch' | 'innovation'>('architecture');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const sqlSchema = `
-- =========================================================================
-- MEDIRESQ RELATIONAL DATABASE SCHEMA (PostgreSQL / MySQL Compliant)
-- Designed for High-Availability Emergency Care with HIPAA/GDPR PII Encryption
-- =========================================================================

-- 1. USERS TABLE (Authentication & Account Core)
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(32) DEFAULT 'PATIENT' -- 'PATIENT', 'PARAMEDIC', 'CLINICIAN', 'DISPATCHER'
);

-- 2. PATIENT PROFILES (Medical Identifiers & Baseline Clinical History)
CREATE TABLE patient_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    blood_type VARCHAR(8) NOT NULL, -- 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
    allergies JSONB DEFAULT '[]'::jsonb, -- e.g. ["Penicillin", "Peanuts", "Latex"]
    current_medications JSONB DEFAULT '[]'::jsonb, -- e.g. ["Albuterol Inhaler", "Lisinopril 10mg"]
    chronic_conditions JSONB DEFAULT '[]'::jsonb, -- e.g. ["Asthma", "Hypertension", "Epilepsy"]
    organ_donor BOOLEAN DEFAULT TRUE,
    resuscitation_preference VARCHAR(32) DEFAULT 'Full Code', -- 'Full Code', 'DNR', 'DNI'
    insurance_provider VARCHAR(128),
    insurance_policy_number VARCHAR(128),
    lock_screen_accessible BOOLEAN DEFAULT TRUE,
    privacy_pin_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMERGENCY CONTACTS (Designated Kin & Caregivers)
CREATE TABLE emergency_contacts (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(64) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    notification_channel VARCHAR(32) DEFAULT 'SMS', -- 'SMS', 'WHATSAPP', 'AUTOMATED_VOICE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. EMERGENCY TRIAGE SESSIONS (Incident Logs & Clinical Urgency)
CREATE TABLE emergency_sessions (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) REFERENCES patient_profiles(id) ON DELETE SET NULL,
    urgency_level VARCHAR(16) NOT NULL, -- 'CRITICAL', 'MODERATE', 'LOW'
    acuity_score INT NOT NULL, -- 0 to 100
    reported_symptoms JSONB NOT NULL,
    user_narrative_notes TEXT,
    vital_signs JSONB DEFAULT '{}'::jsonb, -- { heartRate, systolicBP, diastolicBP, oxygenSat, temperature }
    matched_red_flags JSONB DEFAULT '[]'::jsonb,
    ai_interpretation JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) DEFAULT 'ACTIVE_DISPATCH', -- 'ACTIVE_DISPATCH', 'EN_ROUTE', 'RESOLVED'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    gps_accuracy_meters NUMERIC(6, 2),
    location_address TEXT,
    patient_summary_token VARCHAR(64) UNIQUE NOT NULL
);

-- 5. HEALTHCARE FACILITIES (Hospitals, Trauma Centers & 24/7 ERs)
CREATE TABLE healthcare_facilities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(64) NOT NULL, -- 'Level 1 Trauma Center', 'Emergency Hospital', 'Urgent Care'
    trauma_level VARCHAR(32) NOT NULL, -- 'Level I', 'Level II', 'Level III', 'Urgent Care'
    address TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    phone_primary VARCHAR(32) NOT NULL,
    phone_emergency VARCHAR(32) NOT NULL,
    open_status VARCHAR(32) DEFAULT 'Open 24/7',
    current_wait_minutes INT DEFAULT 15,
    icu_beds_available INT DEFAULT 5,
    specialized_services JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AUDIT & DISPATCH LOGS (HIPAA Compliance & First Responder Access)
CREATE TABLE emergency_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES emergency_sessions(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL, -- 'PARAMEDIC_SUMMARY_SCANNED', 'LOCATION_BEACON_DISPATCHED'
    performed_by VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_token ON emergency_sessions(patient_summary_token);
CREATE INDEX idx_facility_coords ON healthcare_facilities(latitude, longitude);
`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg sm:text-xl tracking-tight">
                  MediResQ System Architecture & Blueprint
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                  Hackathon Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-Stack Technical Documentation, Relational Schema, APIs, User Flow & Pitch Deck
              </p>
            </div>
          </div>
          <button
            id="blueprint-modal-close"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto shrink-0 py-2">
          {[
            { id: 'architecture', label: '1. Architecture & Tech Stack', icon: Layers },
            { id: 'database', label: '2. Database Schema (PostgreSQL/MySQL)', icon: Database },
            { id: 'apis', label: '3. API Endpoints', icon: Terminal },
            { id: 'userflow', label: '4. User Flow & Triage Matrix', icon: GitFork },
            { id: 'pitch', label: '5. Hackathon Pitch & MVP', icon: Rocket },
            { id: 'innovation', label: '6. Standout Innovations', icon: Lightbulb },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200">
                <h3 className="font-bold text-sm text-indigo-950 mb-2">
                  System Architecture Overview
                </h3>
                <p className="text-slate-700">
                  MediResQ utilizes a <strong>high-reliability full-stack architecture</strong> engineered to
                  function with zero-latency critical pathways. Even during poor network conditions or cloud service
                  interruptions, the client automatically cascades from server-assisted Gemini AI triage to
                  local deterministic rule engines and offline-cached emergency directives.
                </p>
              </div>

              {/* Diagram / ASCII Map */}
              <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-tight space-y-1">
                <div>+--------------------------------------------------------------------------------+</div>
                <div>|                        CLIENT LAYER (React 19 + Vite + Leaflet)                |</div>
                <div>|  - 1-Tap SOS Dispatcher   - START/Manchester Triage UI   - Bystander Audio CPR     |</div>
                <div>|  - Paramedic QR Summary   - Real-time OpenStreetMap GIS  - GPS Distress Beacon    |</div>
                <div>+---------------------------------------+----------------------------------------+</div>
                <div>                                        | HTTPS / REST / JWT Bearer</div>
                <div>                                        v</div>
                <div>+--------------------------------------------------------------------------------+</div>
                <div>|                     API GATEWAY / APPLICATION SERVER (Node.js/Express)         |</div>
                <div>|  - /api/triage/assess (Rule Engine + Red-Flag Matrix + Vitals Check)            |</div>
                <div>|  - /api/facilities/nearby (Haversine Spatial Routing & Trauma Filter)          |</div>
                <div>|  - /api/emergency/* (Distress Beacon Session Generator & Paramedic Tokens)     |</div>
                <div>|  - /api/auth/* (Stateless JWT Token Signer & Role-Based Access Control)        |</div>
                <div>+-------------------+------------------------------------+-----------------------+</div>
                <div>                    |                                    |</div>
                <div>                    v                                    v</div>
                <div>+-----------------------------------+   +----------------------------------------+</div>
                <div>|     AI EMERGENCY INTERPRETATION   |   |   DATABASE LAYER (PostgreSQL / MySQL)  |</div>
                <div>|  - Google Gemini 3.8 Flash SDK    |   |  - HIPAA Encrypted Patient Profiles    |</div>
                <div>|  - Medical Guardrails & Escalate  |   |  - Pre-seeded Trauma Facilities        |</div>
                <div>|  - Paramedic Hand-off Notes       |   |  - Audit Logs & Emergency Event Tokens |</div>
                <div>+-----------------------------------+   +----------------------------------------+</div>
              </div>

              {/* Folder Structure */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-indigo-600" />
                  Application Folder Structure
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
                  <div>mediresq/</div>
                  <div>├── server.ts                       # Express full-stack API, Gemini SDK proxy & JWT auth</div>
                  <div>├── package.json                    # Scripts, dependencies (React 19, Leaflet, GenAI)</div>
                  <div>├── index.html                      # PWA shell, Leaflet stylesheets, meta tags</div>
                  <div>└── src/</div>
                  <div>    ├── main.tsx                    # React root entry point</div>
                  <div>    ├── App.tsx                     # Main state orchestrator & view coordinator</div>
                  <div>    ├── index.css                   # Tailwind CSS v4 directives</div>
                  <div>    ├── types.ts                    # Strict TypeScript clinical & system interfaces</div>
                  <div>    ├── data/</div>
                  <div>    │   └── mockData.ts             # Red-flag taxonomy, fallback facilities & demo profile</div>
                  <div>    └── components/</div>
                  <div>        ├── Header.tsx              # SOS emergency button & responsive navigation</div>
                  <div>        ├── TriageAssessmentView.tsx# Symptom intake, vitals, algorithmic triage & AI notes</div>
                  <div>        ├── EmergencyDashboardView.tsx # Live stopwatch, 108/112 dialer & waiting instructions</div>
                  <div>        ├── NearbyFacilitiesView.tsx # Leaflet OpenStreetMap, trauma filter & wait times</div>
                  <div>        ├── LocationSharingView.tsx # GPS coordinates, Web Share API distress beacon</div>
                  <div>        ├── PatientSummaryView.tsx  # Paramedic 5-second fast-scan card & QR code</div>
                  <div>        ├── ProfileView.tsx         # JWT patient auth, medical history & privacy PIN</div>
                  <div>        ├── CPRMetronomeModal.tsx   # 110 BPM Web Audio synthesizer & visual compression guide</div>
                  <div>        └── SystemBlueprintModal.tsx# Technical architecture & hackathon pitch hub</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE */}
          {activeTab === 'database' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Relational Database Schema (PostgreSQL / MySQL DDL)
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Optimized for rapid write throughput, index lookups on emergency tokens, and encrypted PII.
                  </p>
                </div>
                <button
                  onClick={() => copyText(sqlSchema)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96">
                <code>{sqlSchema}</code>
              </pre>
            </div>
          )}

          {/* TAB 3: APIS */}
          {activeTab === 'apis' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-sm text-slate-900">
                Core REST API Endpoints Specification
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px]">
                      POST
                    </span>
                    <span className="font-mono font-bold text-slate-900">/api/triage/assess</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Evaluates reported symptoms, vitals, and narrative against clinical red flags and triggers server-side Gemini 3.8 Flash interpretation.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                    Input: &#123; symptoms: string[], customNotes: string, patientInfo: &#123; age, gender &#125;, vitals: &#123; heartRate, systolicBP, oxygenSat &#125; &#125;<br/>
                    Output: &#123; urgency: 'CRITICAL' | 'MODERATE' | 'LOW', score: number, matchedRedFlags: string[], firstAidInstructions: [...], aiInterpretation: &#123; ... &#125; &#125;
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                      GET
                    </span>
                    <span className="font-mono font-bold text-slate-900">/api/facilities/nearby</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Calculates distance using spherical trigonometry (Haversine formula), filters facilities by trauma level/category, and returns current ER wait times.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                    Query: ?lat=28.6139&lng=77.2090&category=CRITICAL<br/>
                    Output: &#123; facilities: [ &#123; id, name, type, traumaLevel, distanceKm, distanceMiles, estimatedWaitMinutes, icuBedsAvailable, phone, emergencyPhone &#125; ] &#125;
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                      POST
                    </span>
                    <span className="font-mono font-bold text-slate-900">/api/emergency/create-session</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Initializes an active emergency incident, generates a secure unguessable paramedic summary token, and stores live GPS coordinates.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                      GET
                    </span>
                    <span className="font-mono font-bold text-slate-900">/api/emergency/summary/:token</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Returns the paramedic fast-scan card data for EMT tablet terminals or mobile browsers via QR scan with zero login friction.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold text-[10px]">
                      POST
                    </span>
                    <span className="font-mono font-bold text-slate-900">/api/auth/login & /api/auth/register</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Issues HMAC-SHA256 signed JSON Web Tokens (JWT) for secure health profile synchronization and privacy access control.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USER FLOW */}
          {activeTab === 'userflow' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-sm text-slate-900">
                End-to-End Emergency User Flow & Triage Matrix
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 text-xs">Medical Distress Trigger & Fast-Tap Red Flags:</strong>
                    <p className="text-slate-600 mt-0.5">
                      User or bystander opens MediResQ. If experiencing acute distress (e.g. chest pain, facial droop, severe bleeding), they tap the prominent 1-tap red-flag pill or SOS dialer within 2 seconds.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 text-xs">Transparent Triage Scoring & AI Copilot Analysis:</strong>
                    <p className="text-slate-600 mt-0.5">
                      Symptoms and vitals are processed against strict START/Manchester clinical triage criteria. If red flags are detected, urgency is categorized as <strong>CRITICAL</strong>. Server-side Gemini provides clinical hand-off notes while strictly forbidden from downgrading life-threatening conditions.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 text-xs">Immediate Emergency Dispatch & Pre-Arrival First Aid:</strong>
                    <p className="text-slate-600 mt-0.5">
                      App transitions to Emergency Mode: 1-tap call 108 (National Ambulance, India) or 112, active stopwatch, and essential instructions while waiting (unlock front door, turn on porch light, restrain pets, gather prescription bottles). If unresponsive, bystander launches the 110 BPM CPR Metronome.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-900 text-xs">Live GPS Distress Beacon to Family Contacts:</strong>
                    <p className="text-slate-600 mt-0.5">
                      Coordinates are automatically packaged into a 1-tap SMS/WhatsApp distress link dispatched to designated emergency contacts.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    5
                  </span>
                  <div>
                    <strong className="text-slate-900 text-xs">Paramedic 5-Second Fast-Scan Handoff:</strong>
                    <p className="text-slate-600 mt-0.5">
                      Arriving EMTs glance at the high-contrast lock-screen summary or scan the dynamic QR code to immediately learn the patient's blood type (O+), severe allergies (Penicillin anaphylaxis), active medications, and code status (Full Code vs DNR), avoiding dangerous medical errors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PITCH */}
          {activeTab === 'pitch' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-white px-2 py-0.5 rounded">
                  30-Second Elevator Pitch
                </span>
                <p className="text-sm font-bold text-rose-950 italic">
                  "In a sudden cardiac arrest or stroke, every single minute of delay reduces survival chances by 7 to 10%. Yet the average ambulance response time is 8 to 14 minutes. MediResQ is the smart emergency health response system that bridges that critical 8-minute gap. By turning any smartphone into an instant clinical triage copilot, audio-guiding CPR compressions at 110 BPM, transmitting live GPS beacons to family, and generating a 5-second paramedic summary card, MediResQ saves precious minutes when seconds count most."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Key Features for Hackathon MVP</h4>
                  <ul className="list-disc list-inside text-slate-700 space-y-1">
                    <li>Transparent 3-tier clinical triage matrix (Low, Moderate, Critical)</li>
                    <li>Optional Gemini 3.8 Flash medical interpretation with safety guardrails</li>
                    <li>1-Tap Direct 108 / 112 Dialer and pre-arrival home safety checklist</li>
                    <li>Interactive OpenStreetMap GIS with live distance and trauma filters</li>
                    <li>Audio-Guided CPR Metronome (110 BPM Web Audio synthesizer)</li>
                    <li>EMT Fast-Scan Summary Card with QR code simulation</li>
                    <li>JWT Authentication and lock-screen privacy PIN controls</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Future Scalability Roadmap</h4>
                  <ul className="list-disc list-inside text-slate-700 space-y-1">
                    <li><strong>ERSS 112 CAD Integration:</strong> Direct machine-to-machine dispatch into Indian Emergency Response Support System</li>
                    <li><strong>Wearable Telemetry:</strong> Continuous Apple Watch / Wear OS ECG and SpO2 stream</li>
                    <li><strong>Drone AED Dispatch:</strong> Automatic dispatch of aerial automated defibrillators</li>
                    <li><strong>Satellite SOS:</strong> Low-bandwidth emergency distress packets for off-grid zones</li>
                    <li><strong>Real-time EMT Live Voice Translation:</strong> Multilingual paramedic communication via Gemini Live</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: INNOVATION */}
          {activeTab === 'innovation' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-sm text-slate-900">
                Suggested Standout Features that Differentiate MediResQ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>Paramedic "5-Second Fast-Scan" Lock-Screen Protocol</span>
                  </div>
                  <p className="text-slate-600">
                    Traditional medical apps hide info behind biometric logins. MediResQ provides a high-contrast, standardized lock-screen card so arriving EMTs can identify blood group, anaphylactic allergies, and DNR status without touching a password.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>Real-Time Synthesized CPR Metronome (110 BPM)</span>
                  </div>
                  <p className="text-slate-600">
                    Bystanders freeze during cardiac arrest. MediResQ integrates a pure Web Audio oscillator metronome that ticks at 110 beats per minute with visual recoil guides, keeping bystander compressions effective while waiting.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Pre-Arrival Home Optimization Checklist</span>
                  </div>
                  <p className="text-slate-600">
                    Often ambulances waste 2-4 minutes searching for the house. MediResQ prompts users to turn on porch lights, unlock the door, gather pill bottles, and confine pets before the sirens arrive.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span>Dual-Engine Triage with Medical Safety Guardrails</span>
                  </div>
                  <p className="text-slate-600">
                    Unlike naive chatbots that hallucinate medical diagnoses, MediResQ strictly binds AI interpretation inside deterministic clinical red-flag rules. If chest pain or stroke signs exist, the system hard-locks to Critical priority and cannot be downgraded.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
