import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity,
  HeartPulse,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { COMMON_SYMPTOMS } from '../data/mockData';
import { TriageAssessment, PatientProfile, UrgencyLevel } from '../types';
import { GeminiEmergencyAssistant } from './GeminiEmergencyAssistant';

interface TriageAssessmentViewProps {
  userProfile?: PatientProfile | null;
  patientProfile?: PatientProfile | null;
  currentTriage?: TriageAssessment | null;
  onTriageComplete: (assessment: TriageAssessment) => void;
  onActivateEmergency?: (assessment: TriageAssessment) => void;
}

export const TriageAssessmentView: React.FC<TriageAssessmentViewProps> = ({
  userProfile,
  patientProfile,
  currentTriage,
  onTriageComplete,
  onActivateEmergency,
}) => {
  const profile = patientProfile || userProfile || null;
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');
  const [age, setAge] = useState<number | string>(profile ? 32 : '');
  const [gender, setGender] = useState('female');
  const [isPregnant, setIsPregnant] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [heartRate, setHeartRate] = useState<number | string>('');
  const [systolicBP, setSystolicBP] = useState<number | string>('');
  const [diastolicBP, setDiastolicBP] = useState<number | string>('');
  const [oxygenSat, setOxygenSat] = useState<number | string>('');
  const [temperature, setTemperature] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const handleApplyExtractedData = (data: {
    symptoms: string[];
    vitals: any;
    narrative: string;
    urgency: string;
  }) => {
    if (data.symptoms && data.symptoms.length > 0) {
      setSelectedSymptoms((prev) => Array.from(new Set([...prev, ...data.symptoms])));
    }
    if (data.narrative) {
      setCustomNotes(data.narrative);
    }
    if (data.vitals) {
      if (data.vitals.heartRate) setHeartRate(data.vitals.heartRate);
      if (data.vitals.systolicBP) setSystolicBP(data.vitals.systolicBP);
      if (data.vitals.diastolicBP) setDiastolicBP(data.vitals.diastolicBP);
      if (data.vitals.oxygenSat) setOxygenSat(data.vitals.oxygenSat);
      if (data.vitals.temperature) setTemperature(data.vitals.temperature);
      setShowVitals(true);
    }
  };

  const toggleSymptom = (label: string) => {
    if (selectedSymptoms.includes(label)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== label));
    } else {
      setSelectedSymptoms([...selectedSymptoms, label]);
    }
  };

  const handleQuickRedFlag = (symptomLabel: string) => {
    if (!selectedSymptoms.includes(symptomLabel)) {
      setSelectedSymptoms([...selectedSymptoms, symptomLabel]);
    }
  };

  const handleSubmitTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !customNotes.trim()) {
      alert('Please select at least one symptom or describe what you are experiencing.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        symptoms: selectedSymptoms,
        customNotes,
        patientInfo: {
          name: userProfile?.fullName || 'Emergency Patient',
          age: Number(age) || undefined,
          gender,
          isPregnant,
        },
        vitals: {
          heartRate: heartRate ? Number(heartRate) : undefined,
          systolicBP: systolicBP ? Number(systolicBP) : undefined,
          diastolicBP: diastolicBP ? Number(diastolicBP) : undefined,
          oxygenSat: oxygenSat ? Number(oxygenSat) : undefined,
          temperature: temperature ? Number(temperature) : undefined,
        },
      };

      const res = await fetch('/api/triage/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to complete triage assessment');
      }

      const assessment: TriageAssessment = await res.json();
      onTriageComplete(assessment);
      // If critical, auto-scroll to result
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Triage assessment failed:', err);
      // Fallback local assessment in case of network interruption
      const isCritical = selectedSymptoms.some((s) =>
        COMMON_SYMPTOMS.find((cs) => cs.label === s)?.redFlag
      );
      const fallbackAssessment: TriageAssessment = {
        id: `triage_${Date.now()}`,
        timestamp: new Date().toISOString(),
        patientInfo: { age: Number(age) || 30, gender, isPregnant },
        symptoms: selectedSymptoms,
        customNotes,
        vitals: {},
        urgency: isCritical ? 'CRITICAL' : 'MODERATE',
        score: isCritical ? 90 : 60,
        matchedRedFlags: isCritical ? ['Immediate Emergency Red Flag Identified'] : [],
        recommendedAction: isCritical
          ? 'IMMEDIATE EMERGENCY DISPATCH (CALL 108 / 112)'
          : 'Urgent Medical Evaluation within 1-2 hours',
        timeframe: isCritical ? 'Immediate (< 5 minutes)' : '1 - 2 Hours',
        firstAidInstructions: [
          {
            title: 'Immediate Safety Position',
            instruction: 'Sit or lie down in a safe, quiet position. Loosen restrictive clothing.',
            type: 'action',
          },
        ],
        aiInterpretation: {
          summary: 'Rule-based emergency assessment determined urgent attention is required.',
          potentialConcerns: ['Acute Health Incident'],
          clinicalNotes: 'Present to emergency healthcare provider for physical evaluation.',
          safetyAdvisory: 'If symptoms escalate, dial 108 / 112 without delay.',
          suggestedQuestionsForEMT: ['What are the next diagnostic steps?'],
        },
        disclaimer:
          'DISCLAIMER: MediResQ is a decision-support aid and not a certified doctor or diagnostic replacement. If experiencing severe or life-threatening symptoms, dial emergency services (108 / 112 in India) immediately.',
      };
      onTriageComplete(fallbackAssessment);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Cardiac', 'Neurological', 'Respiratory', 'Trauma', 'Allergic', 'General'];
  const filteredSymptoms =
    activeCategory === 'All'
      ? COMMON_SYMPTOMS
      : COMMON_SYMPTOMS.filter((s) => s.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Safety Notice Banner */}
      <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-4 sm:p-4.5 flex items-start gap-3.5 shadow-xs backdrop-blur-xs">
        <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl shrink-0 mt-0.5 border border-amber-500/30">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
          <strong className="font-bold text-amber-900 dark:text-amber-100">Standardized Clinical Triage Screening:</strong> MediResQ
          applies emergency decision-tree protocols for rapid prioritization. It is{' '}
          <span className="font-bold underline text-amber-950 dark:text-amber-100">NOT a substitute for emergency dispatch or a licensed physician</span>.
          If the individual is unresponsive, cyanotic, or suffering severe chest constriction, immediately bypass manual entry and dial{' '}
          <strong className="text-rose-600 dark:text-rose-400 font-black">108 / 112</strong>.
        </div>
      </div>

      {/* Critical Red-Flag Fast-Pill Shortcut */}
      <div className="bg-gradient-to-r from-rose-50 to-red-50/60 dark:from-rose-950/30 dark:to-slate-900 border border-rose-200/90 dark:border-rose-800/60 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200 font-extrabold text-sm">
            <div className="p-1.5 bg-rose-600 text-white rounded-lg shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
            </div>
            <span>High-Acuity Red Flags (Tap for Instant Priority Scoring)</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-700 shadow-2xs">
            Direct Acuity
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.filter((s) => s.redFlag).slice(0, 6).map((rf) => {
            const isSelected = selectedSymptoms.includes(rf.label);
            return (
              <button
                key={rf.id}
                type="button"
                onClick={() => toggleSymptom(rf.label)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400 scale-[1.02]'
                    : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/70 hover:bg-rose-100/70 dark:hover:bg-slate-700/80 shadow-2xs hover:scale-[1.01]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{rf.label}</span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Google Gemini AI Emergency Intake & Copilot */}
      <GeminiEmergencyAssistant
        urgency={currentTriage?.urgency}
        symptoms={selectedSymptoms}
        vitals={{
          heartRate: Number(heartRate) || undefined,
          systolicBP: Number(systolicBP) || undefined,
          diastolicBP: Number(diastolicBP) || undefined,
          oxygenSat: Number(oxygenSat) || undefined,
          temperature: Number(temperature) || undefined,
        }}
        onApplyExtractedData={handleApplyExtractedData}
      />

      {/* Assessment Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none p-5 sm:p-7 transition-colors">
        <form onSubmit={handleSubmitTriage} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                  <Activity className="w-5 h-5 stroke-[2.5]" />
                </div>
                Clinical Symptom Assessment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select reported patient symptoms or filter by physiological system for instant triage.
              </p>
            </div>
            {selectedSymptoms.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSymptoms([])}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer self-start sm:self-auto"
              >
                Reset selections ({selectedSymptoms.length})
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Filter by Organ System:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-slate-900 dark:bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-2 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40">
            {filteredSymptoms.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom.label);
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.label)}
                  className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-100 shadow-xs ring-1 ring-rose-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {symptom.redFlag && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 animate-ping" title="Clinical Red Flag" />
                    )}
                    <span className="truncate">{symptom.label}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 ${
                      isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Narrative Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Circumstances & Incident Timeline (Optional):
            </label>
            <textarea
              id="triage-custom-notes"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Sudden onset 15 mins ago, radiating left arm pain, clammy skin, history of angina..."
              className="w-full text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 shadow-inner"
            />
          </div>

          {/* Basic Patient Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/90 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Patient Age:
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 32"
                className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Biological Sex:
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Not Disclosed</option>
              </select>
            </div>
            <div className="flex items-center mt-3 sm:mt-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 w-full select-none">
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>Pregnant Patient (High-Risk)</span>
              </label>
            </div>
          </div>

          {/* Optional Vitals Accordion */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowVitals(!showVitals)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer select-none transition-colors"
            >
              <div className="p-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span>{showVitals ? 'Hide Vital Signs (Optional)' : 'Add Known Vital Signs (Pulse, BP, SpO2, Temp) +'}</span>
              {showVitals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showVitals && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Pulse (Heart Rate):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="110"
                      className="w-full text-xs p-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                      BPM
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Blood Pressure:
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={systolicBP}
                      onChange={(e) => setSystolicBP(e.target.value)}
                      placeholder="130"
                      className="w-1/2 text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="self-center text-slate-400 font-bold">/</span>
                    <input
                      type="number"
                      value={diastolicBP}
                      onChange={(e) => setDiastolicBP(e.target.value)}
                      placeholder="85"
                      className="w-1/2 text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Oxygen Saturation:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={oxygenSat}
                      onChange={(e) => setOxygenSat(e.target.value)}
                      placeholder="96"
                      className="w-full text-xs p-2.5 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Temperature:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="98.6"
                      className="w-full text-xs p-2.5 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                      °F
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-evaluate-triage"
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.99] text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 tracking-wide"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Clinical Triage Rules & Guardrails...</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5 stroke-[2.5]" />
                  <span>RUN CLINICAL EMERGENCY TRIAGE ASSESSMENT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Triage Results Display Card */}
      {currentTriage && (
        <div
          id="triage-results-card"
          className={`rounded-3xl border-2 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 ${
            currentTriage.urgency === 'CRITICAL'
              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500 shadow-rose-500/10'
              : currentTriage.urgency === 'MODERATE'
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-500 shadow-amber-500/10'
              : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-emerald-500/10'
          }`}
        >
          {/* Urgency Badge Header */}
          <div
            className={`p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              currentTriage.urgency === 'CRITICAL'
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700'
                : currentTriage.urgency === 'MODERATE'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs border border-white/20">
                {currentTriage.urgency === 'CRITICAL' ? (
                  <AlertOctagon className="w-8 h-8 animate-pulse" />
                ) : currentTriage.urgency === 'MODERATE' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full border border-white/10">
                    TRIAGE LEVEL: {currentTriage.urgency}
                  </span>
                  <span className="text-xs font-mono font-bold opacity-90">Acuity Score: {currentTriage.score}/100</span>
                </div>
                <h3 className="font-black text-xl sm:text-2xl mt-1 tracking-tight">
                  {currentTriage.recommendedAction}
                </h3>
              </div>
            </div>

            {/* If Critical: 1-Tap Trigger Emergency Mode */}
            {currentTriage.urgency === 'CRITICAL' && (
              <button
                id="btn-activate-emergency-mode"
                onClick={() => onActivateEmergency?.(currentTriage)}
                className="py-3 px-6 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse hover:scale-105 active:scale-95 shrink-0"
              >
                <span>LAUNCH RESCUE DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 sm:p-7 space-y-6 bg-white dark:bg-slate-900 transition-colors">
            {/* Action Timeframe */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="text-slate-800 dark:text-slate-200 font-medium">
                <span className="font-bold text-slate-900 dark:text-white">Recommended Response Window: </span>
                {currentTriage.timeframe}
              </div>
            </div>

            {/* Matched Red Flags */}
            {currentTriage.matchedRedFlags && currentTriage.matchedRedFlags.length > 0 && (
              <div className="p-4.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80">
                <div className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Triggered Red-Flag Clinical Indicators:</span>
                </div>
                <ul className="list-disc list-inside text-xs text-rose-800 dark:text-rose-300 space-y-1 font-semibold">
                  {currentTriage.matchedRedFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* First Aid Instructions */}
            {currentTriage.firstAidInstructions && currentTriage.firstAidInstructions.length > 0 && (
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Immediate First-Aid Protocols While Arranging Care:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentTriage.firstAidInstructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-1.5 shadow-2xs"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-rose-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{step.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                        {step.instruction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Clinical Interpretation with Safety Guardrails */}
            {currentTriage.aiInterpretation && (
              <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>AI Clinical Interpretation (Gemini Telemetry)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-700">
                    Guardrailed
                  </span>
                </div>

                <p className="text-xs text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed">
                  {currentTriage.aiInterpretation.summary}
                </p>

                {currentTriage.aiInterpretation.safetyAdvisory && (
                  <div className="text-xs p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-indigo-100 dark:border-slate-800 text-indigo-950 dark:text-indigo-200">
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">Safety Directive: </strong>
                    {currentTriage.aiInterpretation.safetyAdvisory}
                  </div>
                )}

                {currentTriage.aiInterpretation.clinicalNotes && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-indigo-100/80 dark:border-indigo-900/60 pt-2.5">
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">Paramedic / EMT Hand-off Notes: </strong>
                    {currentTriage.aiInterpretation.clinicalNotes}
                  </div>
                )}
              </div>
            )}

            {/* Permanent Medical Disclaimer */}
            <div className="text-[11px] text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-3">
              {currentTriage.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Help icon placeholder import fix
function AlertOctagon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
