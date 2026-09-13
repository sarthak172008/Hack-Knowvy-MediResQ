import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Brain,
  MessageSquare,
  Bot,
  Zap,
} from 'lucide-react';
import { UrgencyLevel } from '../types';

interface GeminiEmergencyAssistantProps {
  urgency?: UrgencyLevel | null;
  symptoms?: string[];
  vitals?: any;
  onApplyExtractedData?: (data: {
    symptoms: string[];
    vitals: any;
    narrative: string;
    urgency: string;
  }) => void;
  compact?: boolean;
}

export const GeminiEmergencyAssistant: React.FC<GeminiEmergencyAssistantProps> = ({
  urgency,
  symptoms,
  vitals,
  onApplyExtractedData,
  compact = false,
}) => {
  const [activeMode, setActiveMode] = useState<'qa' | 'extract'>('qa');
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResponse, setQaResponse] = useState<any>(null);
  const [qaError, setQaError] = useState<string | null>(null);

  // Natural language extraction
  const [narrative, setNarrative] = useState('');
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const quickQuestions = [
    'Can I give water or aspirin to the patient?',
    'What should I do if the person vomits while lying down?',
    'How do I check if their airway is blocked?',
    'Where exactly do I place my hands for CPR compressions?',
  ];

  const handleAskQuestion = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim()) return;

    setQaLoading(true);
    setQaError(null);
    setQaResponse(null);

    try {
      const res = await fetch('/api/gemini/emergency-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          emergencyContext: {
            urgency: urgency || 'CRITICAL',
            symptoms: symptoms || [],
            vitals: vitals || {},
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer from Gemini.');
      }
      setQaResponse(data);
    } catch (err: any) {
      setQaError(err.message);
    } finally {
      setQaLoading(false);
    }
  };

  const handleNaturalExtract = async () => {
    if (!narrative.trim()) return;

    setExtractLoading(true);
    setExtractError(null);
    setExtractedResult(null);

    try {
      const res = await fetch('/api/gemini/natural-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract emergency data.');
      }
      setExtractedResult(data);
    } catch (err: any) {
      setExtractError(err.message);
    } finally {
      setExtractLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (extractedResult && onApplyExtractedData) {
      onApplyExtractedData({
        symptoms: extractedResult.extractedSymptoms || [],
        vitals: extractedResult.extractedVitals || {},
        narrative,
        urgency: extractedResult.urgency || 'CRITICAL',
      });
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-indigo-500/30 space-y-5">
      {/* Ambient decorative glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-rose-600 to-indigo-600 border border-white/20 rounded-2xl text-white shadow-md shadow-rose-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Gemini Emergency Copilot
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Real-time emergency triage assistant & instant bystander clinical guidance
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMode('qa')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeMode === 'qa'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Emergency Q&A
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('extract')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeMode === 'extract'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Natural Intake AI
          </button>
        </div>
      </div>

      {/* MODE 1: EMERGENCY Q&A */}
      {activeMode === 'qa' && (
        <div className="relative z-10 space-y-3.5">
          <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Select a rapid clinical prompt or type a specific bystander inquiry:</span>
          </div>

          {/* Quick prompt pills */}
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(q);
                  handleAskQuestion(q);
                }}
                className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-rose-500/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-left shadow-2xs hover:scale-[1.02] active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Query input */}
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Ask Gemini: e.g. How to position patient who fainted?"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/60 focus:border-rose-500 shadow-inner"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAskQuestion()}
              disabled={qaLoading || !question.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/30 active:scale-95 shrink-0"
            >
              {qaLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Ask Copilot</span>
            </button>
          </div>

          {qaError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{qaError}</span>
            </div>
          )}

          {/* Q&A Result */}
          {qaResponse && (
            <div className="p-5 bg-slate-900/90 rounded-2xl border border-indigo-500/40 space-y-4 shadow-xl animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-400">Direct Clinical Answer</div>
                  <div className="text-sm font-bold text-white leading-relaxed">
                    {qaResponse.directAnswer}
                  </div>
                </div>
              </div>

              {qaResponse.actionSteps && qaResponse.actionSteps.length > 0 && (
                <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recommended Immediate Actions</span>
                  </div>
                  <ul className="space-y-2">
                    {qaResponse.actionSteps.map((step: string, sIdx: number) => (
                      <li key={sIdx} className="text-xs text-slate-200 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {qaResponse.criticalWarning && (
                <div className="p-3.5 bg-rose-950/70 border border-rose-700/80 rounded-xl text-xs text-rose-100 flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-300 uppercase tracking-wider text-[11px] block">Critical Prohibition:</strong>
                    <span>{qaResponse.criticalWarning}</span>
                  </div>
                </div>
              )}

              {qaResponse.emergencyEscalation && (
                <div className="p-3 bg-amber-950/60 border border-amber-600/60 rounded-xl text-xs text-amber-100 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 uppercase tracking-wider text-[10px] block">When to Escalate immediately:</strong>
                    <span>{qaResponse.emergencyEscalation}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{qaResponse.modelUsed ? `Answered by ${qaResponse.modelUsed}` : 'Powered by Google Gemini Flash'}</span>
                </span>
                <span className="text-emerald-400 font-bold">108 / 112 Protocol Aligned</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: NATURAL INTAKE PARSER */}
      {activeMode === 'extract' && (
        <div className="relative z-10 space-y-3.5">
          <div className="text-xs text-slate-300 font-medium">
            Paste or describe the emergency scene in plain English. Gemini will automatically extract clinical
            symptoms, vital signs, and priority level:
          </div>

          <textarea
            rows={3}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="e.g. 68-year-old neighbor collapsed in the yard. Complaining of crushing chest tightness radiating to neck, pale and sweaty, pulse feels around 120 bpm."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/60 shadow-inner"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Powered by Google Gemini 2.5 Flash Structured JSON Extraction
            </span>
            <button
              type="button"
              onClick={handleNaturalExtract}
              disabled={extractLoading || !narrative.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/30"
            >
              {extractLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Extract with Gemini</span>
            </button>
          </div>

          {extractError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{extractError}</span>
            </div>
          )}

          {/* Extracted JSON Results */}
          {extractedResult && (
            <div className="p-5 bg-slate-900/90 rounded-2xl border border-indigo-500/40 space-y-3.5 animate-in fade-in text-xs shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Gemini Clinical Extraction Completed
                </span>
                <span
                  className={`px-3 py-1 rounded-full font-black text-[10px] tracking-wider uppercase ${
                    extractedResult.urgency === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : extractedResult.urgency === 'MODERATE'
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {extractedResult.urgency} PRIORITY
                </span>
              </div>

              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-300">
                  <strong className="text-white">Identified Symptoms:</strong>{' '}
                  <span className="text-slate-200">{extractedResult.extractedSymptoms?.join(', ') || 'None parsed'}</span>
                </div>
                {extractedResult.detectedRedFlags && extractedResult.detectedRedFlags.length > 0 && (
                  <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Red Flags: {extractedResult.detectedRedFlags.join(', ')}</span>
                  </div>
                )}
                {extractedResult.extractedVitals && (
                  <div className="text-slate-300 font-mono text-[11px] pt-1 border-t border-slate-800">
                    <strong className="text-white font-sans">Extracted Vitals:</strong>{' '}
                    {Object.entries(extractedResult.extractedVitals)
                      .filter(([_, v]) => v != null)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' | ') || 'None mentioned'}
                  </div>
                )}
              </div>

              {onApplyExtractedData && (
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Extracted Data to Triage Assessment</span>
                </button>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{extractedResult.modelUsed ? `Parsed by ${extractedResult.modelUsed}` : 'Parsed by Google Gemini Flash'}</span>
                </span>
                <span className="text-emerald-400 font-bold">Ready for Paramedic Handoff</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
