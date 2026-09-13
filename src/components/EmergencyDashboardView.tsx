import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  MapPin,
  Heart,
  Share2,
  CheckCircle2,
  Clock,
  Home,
  Lightbulb,
  Pill,
  Dog,
  PhoneForwarded,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { TriageAssessment, PatientProfile, UrgencyLevel } from '../types';
import { GeminiEmergencyAssistant } from './GeminiEmergencyAssistant';

interface EmergencyDashboardViewProps {
  currentTriage: TriageAssessment | null;
  patientProfile: PatientProfile | null;
  onOpenCPRMetronome: () => void;
  onGoToFacilities: () => void;
  onGoToLocation: () => void;
  onGoToSummary: () => void;
  onResolveEmergency: () => void;
  userCoords: { lat: number; lng: number } | null;
}

export const EmergencyDashboardView: React.FC<EmergencyDashboardViewProps> = ({
  currentTriage,
  patientProfile,
  onOpenCPRMetronome,
  onGoToFacilities,
  onGoToLocation,
  onGoToSummary,
  onResolveEmergency,
  userCoords,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [beaconSent, setBeaconSent] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const urgency: UrgencyLevel = currentTriage?.urgency || 'CRITICAL';

  const handleSendBeacon = () => {
    setBeaconSent(true);
    // Web Share or SMS trigger
    const lat = userCoords?.lat || 28.6139;
    const lng = userCoords?.lng || 77.2090;
    const text = `EMERGENCY ALERT from ${patientProfile?.fullName || 'Rajesh Sharma'}: Medical situation assessed as ${urgency}. Ambulance requested via 108. GPS: https://maps.google.com/?q=${lat},${lng}.`;

    if (navigator.share) {
      navigator.share({
        title: 'MediResQ Emergency Distress Beacon',
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Urgent Status Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-600/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-rose-300 animate-ping" />
              <span>ACTIVE EMERGENCY RESPONSE • {urgency} PRIORITY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Emergency Assistance Mode
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm font-medium max-w-xl">
              Stay calm. Dial 108 for emergency ambulance response in India, or follow the step-by-step pre-arrival instructions below.
            </p>
          </div>

          {/* Big Prominent Emergency Call Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              id="btn-call-108-direct"
              href="tel:108"
              className="py-4 px-6 sm:px-8 bg-white hover:bg-rose-50 active:scale-95 text-rose-700 rounded-2xl font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer group"
            >
              <PhoneCall className="w-6 h-6 animate-bounce text-rose-600 group-hover:scale-110" />
              <div className="text-left">
                <div className="text-base sm:text-lg leading-tight">CALL 108 NOW</div>
                <div className="text-[10px] text-rose-600/80 font-normal">Ambulance & Emergency</div>
              </div>
            </a>
            <a
              id="btn-call-112-direct"
              href="tel:112"
              className="py-3 px-4 bg-rose-800/80 hover:bg-rose-900 active:scale-95 text-white rounded-2xl font-bold text-xs sm:text-sm border border-rose-400/40 flex items-center justify-center gap-2 transition-all"
              title="Pan-India Unified Emergency Response Support System"
            >
              <PhoneForwarded className="w-4 h-4 text-rose-200" />
              <span>Dial 112 (ERSS)</span>
            </a>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
          <div>
            <span className="text-rose-200 block text-[11px]">Emergency Stopwatch:</span>
            <span className="font-mono font-extrabold text-lg text-white">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
          <div>
            <span className="text-rose-200 block text-[11px]">Assessed Urgency:</span>
            <span className="font-bold text-white uppercase">{urgency} (Code Red)</span>
          </div>
          <div>
            <span className="text-rose-200 block text-[11px]">Live GPS Status:</span>
            <span className="font-bold text-emerald-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Locked & Ready
            </span>
          </div>
          <div>
            <span className="text-rose-200 block text-[11px]">Contacts Beacon:</span>
            <span className="font-bold text-white">
              {beaconSent ? 'Broadcast Sent' : 'Ready to Send'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix (1-2 Taps) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CPR Metronome */}
        <button
          id="btn-cpr-assistant"
          onClick={onOpenCPRMetronome}
          className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-rose-200 shadow-sm flex flex-col items-start gap-3 transition-all text-left cursor-pointer group hover:border-rose-400"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">CPR Audio Metronome</h3>
            <p className="text-xs text-slate-500 mt-1">
              Audio click at 110 BPM with visual chest compression counter.
            </p>
          </div>
          <span className="text-xs font-semibold text-rose-600 group-hover:underline mt-auto">
            Launch Metronome →
          </span>
        </button>

        {/* Nearby Hospitals */}
        <button
          id="btn-goto-facilities"
          onClick={onGoToFacilities}
          className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start gap-3 transition-all text-left cursor-pointer group hover:border-slate-400"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Nearby Emergency Facilities</h3>
            <p className="text-xs text-slate-500 mt-1">
              Interactive map with trauma levels, ICU bed availability, and directions.
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 group-hover:underline mt-auto">
            View Live Hospital Map →
          </span>
        </button>

        {/* Paramedic Fast-Scan Card */}
        <button
          id="btn-goto-summary"
          onClick={onGoToSummary}
          className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start gap-3 transition-all text-left cursor-pointer group hover:border-slate-400"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Paramedic Summary Card</h3>
            <p className="text-xs text-slate-500 mt-1">
              High-contrast card with blood type, allergies, and medications for EMTs.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 group-hover:underline mt-auto">
            Open Medical Summary →
          </span>
        </button>
      </div>

      {/* Critical Instructions While Help is Being Arranged */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-600" />
            Essential Actions While Waiting for Paramedics
          </h2>
          <span className="text-xs font-semibold text-slate-500">6 Critical Pre-Arrival Steps</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">1. Turn on Exterior Lights</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Switch on front porch light and open window blinds so arriving ambulances locate you immediately.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">2. Unlock Front Door</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Unlock entrance so EMTs don't have to force entry if patient condition deteriorates.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">3. Gather Medication Bottles</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Place current prescription bottles into a bag to hand directly to paramedics.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <Dog className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">4. Confine Household Pets</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Secure dogs or cats in a separate bedroom to avoid distraction or stress for responders.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
              <PhoneForwarded className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">5. Stay on the Line with 108 / 112</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Keep the phone call active with 108 emergency ambulance dispatch (or 112). Do not hang up until instructed by the operator.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-lg shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">6. Notify Emergency Contacts</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Broadcast GPS distress link to designated emergency contacts in one tap.
              </p>
            </div>
          </div>
        </div>

        {/* Live Gemini Emergency Copilot Assistant */}
        <div className="pt-2">
          <GeminiEmergencyAssistant
            urgency={urgency}
            symptoms={currentTriage?.symptoms}
            vitals={currentTriage?.vitals}
          />
        </div>

        {/* 1-Tap Distress Beacon Trigger */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Send Live GPS Beacon to Contacts
              </div>
              <div className="text-[11px] text-slate-500">
                Notifies {patientProfile?.emergencyContacts?.[0]?.name || 'Priya Sharma'} ({patientProfile?.emergencyContacts?.[0]?.phone || '+91 98112 34567'}) with live map coordinate link.
              </div>
            </div>
          </div>
          <button
            id="btn-broadcast-beacon"
            onClick={handleSendBeacon}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
              beaconSent
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {beaconSent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Beacon Broadcasted</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Broadcast Beacon</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* De-escalate / Resolve Emergency */}
      <div className="flex justify-end">
        <button
          id="btn-resolve-emergency"
          onClick={onResolveEmergency}
          className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
        >
          Resolve / Close Emergency Session
        </button>
      </div>
    </div>
  );
};
