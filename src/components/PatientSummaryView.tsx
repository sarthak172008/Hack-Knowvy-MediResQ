import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Heart,
  Pill,
  Shield,
  Phone,
  QrCode,
  Printer,
  Copy,
  Check,
  Activity,
  User,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PatientProfile, TriageAssessment, UrgencyLevel } from '../types';
import { DEFAULT_DEMO_PROFILE } from '../data/mockData';

interface PatientSummaryViewProps {
  patientProfile: PatientProfile | null;
  currentTriage: TriageAssessment | null;
  urgency: UrgencyLevel | null;
}

export const PatientSummaryView: React.FC<PatientSummaryViewProps> = ({
  patientProfile,
  currentTriage,
  urgency,
}) => {
  const [copied, setCopied] = useState(false);
  const [sbarLoading, setSbarLoading] = useState(false);
  const [sbarNote, setSbarNote] = useState<{
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  } | null>(null);
  const [sbarError, setSbarError] = useState<string | null>(null);

  // Fallback demo profile if not logged in
  const profile = patientProfile || DEFAULT_DEMO_PROFILE;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textSummary = `
=== MEDIRESQ EMERGENCY PATIENT SUMMARY ===
Patient: ${profile.fullName} (DOB: ${profile.dob})
Blood Type: ${profile.bloodType} | Code Status: ${profile.resuscitationPreference}
Organ Donor: ${profile.organDonor ? 'YES' : 'NO'}

ALLERGIES (CRITICAL):
${profile.allergies.join(', ') || 'None reported'}

CURRENT MEDICATIONS:
${profile.medications.join(', ') || 'None reported'}

CHRONIC CONDITIONS:
${profile.chronicConditions.join(', ') || 'None reported'}

CURRENT EMERGENCY INCIDENT:
Urgency: ${urgency || 'CRITICAL'}
Chief Complaints: ${currentTriage?.symptoms.join(', ') || 'Acute Medical Emergency'}
Vitals: HR ${currentTriage?.vitals?.heartRate || 'N/A'} | BP ${currentTriage?.vitals?.systolicBP || 'N/A'}/${currentTriage?.vitals?.diastolicBP || 'N/A'} | SpO2 ${currentTriage?.vitals?.oxygenSat || 'N/A'}%

EMERGENCY CONTACTS:
${profile.emergencyContacts.map((c) => `${c.name} (${c.relationship}): ${c.phone}`).join('\n')}
==========================================
    `.trim();

    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSbar = async () => {
    setSbarLoading(true);
    setSbarError(null);
    try {
      const res = await fetch('/api/gemini/sbar-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: profile,
          triageSession: currentTriage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate SBAR summary');
      }
      setSbarNote(data);
    } catch (err: any) {
      setSbarError(err.message);
    } finally {
      setSbarLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-rose-600" />
              Emergency Patient Summary Card
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-900 text-white rounded-md">
              EMT FAST-SCAN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimized for immediate 5-second triage by arriving paramedics and emergency room staff.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-generate-sbar"
            onClick={handleGenerateSbar}
            disabled={sbarLoading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {sbarLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate Gemini SBAR</span>
          </button>
          <button
            id="btn-copy-summary"
            onClick={handleCopyText}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
          <button
            id="btn-print-summary"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Card</span>
          </button>
        </div>
      </div>

      {/* Gemini SBAR Clinical Note Display (if generated) */}
      {sbarNote && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-sm text-white">
                Google Gemini SBAR Clinical Hand-off Note (EMT / ER Protocol)
              </h3>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-rose-500 text-white rounded-full">
              Gemini 3.8 Flash
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-indigo-500/20 space-y-1">
              <div className="font-black text-rose-400 uppercase tracking-wider text-[11px]">
                S — Situation
              </div>
              <p className="text-slate-200 leading-relaxed">{sbarNote.situation}</p>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-indigo-500/20 space-y-1">
              <div className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
                B — Background
              </div>
              <p className="text-slate-200 leading-relaxed">{sbarNote.background}</p>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-indigo-500/20 space-y-1">
              <div className="font-black text-sky-400 uppercase tracking-wider text-[11px]">
                A — Assessment
              </div>
              <p className="text-slate-200 leading-relaxed">{sbarNote.assessment}</p>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-indigo-500/20 space-y-1">
              <div className="font-black text-emerald-400 uppercase tracking-wider text-[11px]">
                R — Recommendation
              </div>
              <p className="text-slate-200 leading-relaxed">{sbarNote.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {sbarError && (
        <div className="p-4 bg-rose-900/40 border border-rose-700/60 rounded-2xl text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{sbarError}</span>
        </div>
      )}

      {/* The Printable / High-Contrast Fast-Scan Card */}
      <div
        id="emt-summary-printable"
        className="bg-white rounded-3xl border-2 border-slate-900 shadow-xl overflow-hidden print:border-none print:shadow-none"
      >
        {/* Urgent Top Stripe */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-rose-600">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {profile.bloodType}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400 font-extrabold tracking-wider uppercase">
                  BLOOD TYPE: {profile.bloodType}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs font-bold text-amber-300">
                  CODE: {profile.resuscitationPreference}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
                {profile.fullName}
              </h1>
              <div className="text-xs text-slate-300">
                DOB: {profile.dob} • Organ Donor: {profile.organDonor ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          {/* QR Code Placeholder for EMT Scan */}
          <div className="p-2.5 bg-white rounded-xl flex items-center gap-3 shrink-0 text-slate-900">
            <div className="w-14 h-14 border-2 border-slate-900 rounded-lg p-1 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-slate-900" />
            </div>
            <div className="text-left text-[11px] leading-tight pr-1">
              <span className="font-extrabold block text-rose-600">SCAN TO SYNC</span>
              <span className="text-slate-600">EMT Direct Card</span>
              <span className="font-mono text-[9px] text-slate-400 block mt-0.5">#MQ-98214</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* CRITICAL ALLERGY BANNER */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950">
            <div className="flex items-center gap-2 font-black text-sm text-rose-700 tracking-wide uppercase mb-1.5">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              <span>CRITICAL ALLERGIES & CONTRAINDICATIONS:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white rounded-xl border border-rose-300 font-bold text-xs text-rose-900 shadow-xs"
                >
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          </div>

          {/* Medical Snapshot Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Medications */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Pill className="w-4 h-4 text-indigo-600" />
                <span>Current Active Medications</span>
              </div>
              <ul className="space-y-1.5">
                {profile.medications.map((med, idx) => (
                  <li
                    key={idx}
                    className="text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Existing Chronic Conditions */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Existing Medical Conditions</span>
              </div>
              <ul className="space-y-1.5">
                {profile.chronicConditions.map((cond, idx) => (
                  <li
                    key={idx}
                    className="text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current Incident Assessment */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Current Incident Chief Complaint & Triage</span>
              </div>
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-md text-white ${
                  urgency === 'CRITICAL'
                    ? 'bg-rose-600'
                    : urgency === 'MODERATE'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
              >
                {urgency || 'CRITICAL'} PRIORITY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Reported Symptoms:</span>
                <span className="font-bold text-slate-900">
                  {currentTriage?.symptoms.join(', ') || 'Crushing Chest Pain, Left Arm Radiating'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Recorded Vitals:</span>
                <span className="font-mono font-bold text-slate-900">
                  HR: {currentTriage?.vitals?.heartRate || '114'} bpm • BP:{' '}
                  {currentTriage?.vitals?.systolicBP || '142'}/{currentTriage?.vitals?.diastolicBP || '88'} •
                  SpO2: {currentTriage?.vitals?.oxygenSat || '94'}%
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contacts & Insurance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                Primary Emergency Contact:
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {profile.emergencyContacts[0]?.name} ({profile.emergencyContacts[0]?.relationship})
              </div>
              <div className="font-mono text-rose-600 font-bold mt-0.5">
                {profile.emergencyContacts[0]?.phone}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold uppercase">
                Health Insurance Provider:
              </span>
              <div className="font-bold text-slate-900 mt-0.5">
                {profile.insuranceProvider || 'BlueCross BlueShield'}
              </div>
              <div className="font-mono text-slate-500 text-[11px]">
                Policy #{profile.insurancePolicyNumber || 'BCBS-98214-X9'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
