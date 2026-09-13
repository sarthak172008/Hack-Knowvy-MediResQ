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
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-600/30 border border-rose-500/40 rounded-xl text-rose-300">
            <Sparkles className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                Google Gemini Emergency Copilot
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live AI Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live AI medical guidance, instant bystander Q&A, and natural-language symptom parsing.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('qa')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeMode === 'qa'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Emergency Q&A
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('extract')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeMode === 'extract'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            AI Natural Intake
          </button>
        </div>
      </div>

      {/* MODE 1: EMERGENCY Q&A */}
      {activeMode === 'qa' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-300">
            Ask an urgent question while waiting for paramedics (e.g., patient positioning, what NOT to do):
          </div>

          {/* Quick prompt pills */}
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(q);
                  handleAskQuestion(q);
                }}
                className="text-[11px] bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Query input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Type urgent emergency question for Gemini..."
              className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="button"
              onClick={() => handleAskQuestion()}
              disabled={qaLoading || !question.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {qaLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Ask AI</span>
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
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-indigo-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2">
                <Bot className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-white leading-relaxed">
                  {qaResponse.directAnswer}
                </div>
              </div>

              {qaResponse.actionSteps && qaResponse.actionSteps.length > 0 && (
                <div className="space-y-1 pl-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Recommended Actions:
                  </div>
                  <ul className="list-decimal text-xs text-slate-200 space-y-1">
                    {qaResponse.actionSteps.map((step: string, sIdx: number) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {qaResponse.criticalWarning && (
                <div className="p-2.5 bg-rose-900/40 border border-rose-700/60 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>DO NOT:</strong> {qaResponse.criticalWarning}
                  </span>
                </div>
              )}

              {qaResponse.emergencyEscalation && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-700/60 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>When to Escalate:</strong> {qaResponse.emergencyEscalation}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-700/50">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3 h-3 text-rose-400" />
                  <span>{qaResponse.modelUsed ? `Answered by ${qaResponse.modelUsed}` : 'Powered by Google Gemini Flash'}</span>
                </span>
                <span className="text-emerald-400 font-semibold">108 / 112 Protocol Aligned</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: NATURAL INTAKE PARSER */}
      {activeMode === 'extract' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-300">
            Paste or type a messy description of the emergency incident. Gemini will extract clinical
            symptoms, vital numbers, and urgency automatically:
          </div>

          <textarea
            rows={3}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="e.g. My 68-year-old neighbor collapsed in the yard. He is complaining of crushing chest tightness radiating up to his neck, his skin is pale and sweaty, and his pulse is around 120 bpm."
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Powered by Gemini 3.8 Flash structured schema extraction
            </span>
            <button
              type="button"
              onClick={handleNaturalExtract}
              disabled={extractLoading || !narrative.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-indigo-500/30 space-y-3 animate-in fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Gemini Clinical Extraction Completed
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
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

              <div className="space-y-1.5">
                <div className="text-slate-300">
                  <strong>Identified Symptoms:</strong>{' '}
                  {extractedResult.extractedSymptoms?.join(', ') || 'None parsed'}
                </div>
                {extractedResult.detectedRedFlags && extractedResult.detectedRedFlags.length > 0 && (
                  <div className="text-rose-300">
                    <strong>Flagged Red Flags:</strong> {extractedResult.detectedRedFlags.join(', ')}
                  </div>
                )}
                {extractedResult.extractedVitals && (
                  <div className="text-slate-300 font-mono text-[11px]">
                    Vitals Detected:{' '}
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
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Extracted Symptoms & Vitals to Triage Form</span>
                </button>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-700/50">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3 h-3 text-rose-400" />
                  <span>{extractedResult.modelUsed ? `Parsed by ${extractedResult.modelUsed}` : 'Parsed by Google Gemini Flash'}</span>
                </span>
                <span className="text-emerald-400 font-semibold">Triage Ready</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
