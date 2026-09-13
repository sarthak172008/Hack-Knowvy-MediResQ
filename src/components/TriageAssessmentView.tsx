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
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Important Medical Disclaimer:</span> MediResQ provides standardized
          triage screening and first-aid guidance based on clinical protocols. It is{' '}
          <strong className="underline">NOT a replacement for professional medical diagnosis or a physician</strong>.
          If someone is unresponsive, choking, or having severe chest pain, bypass this form and call{' '}
          <strong className="text-rose-700 font-extrabold">108 / 112</strong> immediately.
        </div>
      </div>

      {/* Critical Red-Flag Fast-Pill Shortcut */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <Zap className="w-4 h-4 text-rose-600 fill-rose-600 animate-pulse" />
            <span>High-Acuity Red Flags (Tap for Instant Priority Triage)</span>
          </div>
          <span className="text-[11px] font-semibold text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200">
            Rapid Triage
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-100/70'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{rf.label}</span>
                {isSelected && <Check className="w-3 h-3 ml-1 stroke-[3]" />}
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <form onSubmit={handleSubmitTriage} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                Emergency Symptom Assessment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select reported symptoms or write a quick description for instant clinical triage.
              </p>
            </div>
            {selectedSymptoms.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSymptoms([])}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Clear all ({selectedSymptoms.length})
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Filter by Symptom Category:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
            {filteredSymptoms.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom.label);
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.label)}
                  className={`p-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-rose-50 border-rose-400 text-rose-950 font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {symptom.redFlag && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" title="Clinical Red Flag" />
                    )}
                    <span className="truncate">{symptom.label}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-1.5 ${
                      isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Describe Any Additional Symptoms or Situation (Optional):
            </label>
            <textarea
              id="triage-custom-notes"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Started 20 minutes ago while sitting, dizzy, feels like an elephant on chest, allergic to penicillin..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Basic Patient Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Patient Age:
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 32"
                className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Biological Sex:
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Not Disclosed</option>
              </select>
            </div>
            <div className="flex items-center mt-4 sm:mt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Pregnant Patient</span>
              </label>
            </div>
          </div>

          {/* Optional Vitals Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowVitals(!showVitals)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>{showVitals ? 'Hide Vital Signs (Optional)' : 'Add Known Vital Signs (BP, Heart Rate, SpO2) +'}</span>
              {showVitals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showVitals && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Heart Rate (BPM):
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g. 110"
                    className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Blood Pressure:
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={systolicBP}
                      onChange={(e) => setSystolicBP(e.target.value)}
                      placeholder="Sys 130"
                      className="w-1/2 text-xs p-2 rounded-lg bg-white border border-slate-200"
                    />
                    <input
                      type="number"
                      value={diastolicBP}
                      onChange={(e) => setDiastolicBP(e.target.value)}
                      placeholder="Dia 85"
                      className="w-1/2 text-xs p-2 rounded-lg bg-white border border-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Oxygen Saturation (%):
                  </label>
                  <input
                    type="number"
                    value={oxygenSat}
                    onChange={(e) => setOxygenSat(e.target.value)}
                    placeholder="e.g. 96"
                    className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Temperature (°F):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="e.g. 98.6"
                    className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200"
                  />
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
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Clinical Triage Rules & Guardrails...</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  <span>Run Emergency Triage Assessment</span>
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
          className={`rounded-2xl border-2 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-3 ${
            currentTriage.urgency === 'CRITICAL'
              ? 'bg-rose-50/40 border-rose-500'
              : currentTriage.urgency === 'MODERATE'
              ? 'bg-amber-50/40 border-amber-500'
              : 'bg-emerald-50/40 border-emerald-500'
          }`}
        >
          {/* Urgency Badge Header */}
          <div
            className={`p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              currentTriage.urgency === 'CRITICAL'
                ? 'bg-rose-600'
                : currentTriage.urgency === 'MODERATE'
                ? 'bg-amber-600'
                : 'bg-emerald-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                {currentTriage.urgency === 'CRITICAL' ? (
                  <AlertOctagon className="w-7 h-7 animate-pulse" />
                ) : currentTriage.urgency === 'MODERATE' ? (
                  <AlertTriangle className="w-7 h-7" />
                ) : (
                  <ShieldCheck className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md">
                    TRIAGE LEVEL: {currentTriage.urgency}
                  </span>
                  <span className="text-xs opacity-90">Acuity Score: {currentTriage.score}/100</span>
                </div>
                <h3 className="font-black text-xl sm:text-2xl mt-0.5 tracking-tight">
                  {currentTriage.recommendedAction}
                </h3>
              </div>
            </div>

            {/* If Critical: 1-Tap Trigger Emergency Mode */}
            {currentTriage.urgency === 'CRITICAL' && (
              <button
                id="btn-activate-emergency-mode"
                onClick={() => onActivateEmergency?.(currentTriage)}
                className="py-2.5 px-5 bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse"
              >
                <span>OPEN EMERGENCY DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-5 bg-white">
            {/* Action Timeframe */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <Clock className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="text-slate-800">
                <span className="font-bold">Recommended Response Window: </span>
                {currentTriage.timeframe}
              </div>
            </div>

            {/* Matched Red Flags */}
            {currentTriage.matchedRedFlags && currentTriage.matchedRedFlags.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Triggered Red-Flag Clinical Indicators:</span>
                </div>
                <ul className="list-disc list-inside text-xs text-rose-800 space-y-1">
                  {currentTriage.matchedRedFlags.map((flag, idx) => (
                    <li key={idx} className="font-semibold">{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* First Aid Instructions */}
            {currentTriage.firstAidInstructions && currentTriage.firstAidInstructions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  Immediate First-Aid Protocols While Arranging Care:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentTriage.firstAidInstructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{step.title}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pl-6.5">
                        {step.instruction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Clinical Interpretation with Safety Guardrails */}
            {currentTriage.aiInterpretation && (
              <div className="p-4.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>AI Decision-Support Interpretation (Gemini 3.8 Flash)</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                    Medical Safety Guardrailed
                  </span>
                </div>

                <p className="text-xs text-indigo-900 font-medium">
                  {currentTriage.aiInterpretation.summary}
                </p>

                {currentTriage.aiInterpretation.safetyAdvisory && (
                  <div className="text-xs p-2.5 bg-white/80 rounded-lg border border-indigo-100 text-indigo-900">
                    <strong className="text-rose-700">Safety Directive: </strong>
                    {currentTriage.aiInterpretation.safetyAdvisory}
                  </div>
                )}

                {currentTriage.aiInterpretation.clinicalNotes && (
                  <div className="text-xs text-slate-600 border-t border-indigo-100/80 pt-2">
                    <strong className="text-slate-800">Paramedic / EMT Hand-off Notes: </strong>
                    {currentTriage.aiInterpretation.clinicalNotes}
                  </div>
                )}
              </div>
            )}

            {/* Permanent Medical Disclaimer */}
            <div className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-3">
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
