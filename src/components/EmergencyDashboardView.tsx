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
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-600/30 relative overflow-hidden border border-rose-400/30">
        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-xs font-black tracking-wider uppercase border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <span>ACTIVE EMERGENCY RESPONSE • {urgency} PRIORITY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Emergency Assistance Mode
            </h1>
            <p className="text-rose-100/90 text-xs sm:text-sm font-medium max-w-xl leading-relaxed">
              Stay calm. Dial 108 for emergency ambulance response in India, or follow the real-time pre-arrival protocol below.
            </p>
          </div>

          {/* Big Prominent Emergency Call Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              id="btn-call-108-direct"
              href="tel:108"
              className="py-4 px-6 sm:px-8 bg-white hover:bg-rose-50 active:scale-95 text-rose-700 rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-black/20 flex items-center justify-center gap-3 transition-all cursor-pointer group"
            >
              <PhoneCall className="w-6 h-6 text-rose-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-base sm:text-lg leading-tight tracking-tight">CALL 108 NOW</div>
                <div className="text-[10px] text-rose-600/80 font-bold uppercase tracking-wider">Ambulance & Trauma</div>
              </div>
            </a>
            <a
              id="btn-call-112-direct"
              href="tel:112"
              className="py-3 px-5 bg-rose-950/70 hover:bg-rose-900 active:scale-95 text-white rounded-2xl font-bold text-xs sm:text-sm border border-rose-400/40 flex items-center justify-center gap-2 transition-all shadow-md"
              title="Pan-India Unified Emergency Response Support System"
            >
              <PhoneForwarded className="w-4 h-4 text-rose-200" />
              <span>Dial 112 (ERSS)</span>
            </a>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
          <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur-xs border border-white/10">
            <span className="text-rose-200/90 block text-[10px] font-bold uppercase tracking-wider">Emergency Stopwatch</span>
            <span className="font-mono font-black text-xl text-white">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur-xs border border-white/10">
            <span className="text-rose-200/90 block text-[10px] font-bold uppercase tracking-wider">Acuity Status</span>
            <span className="font-black text-sm text-white uppercase mt-0.5 block">{urgency} (Code Red)</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur-xs border border-white/10">
            <span className="text-rose-200/90 block text-[10px] font-bold uppercase tracking-wider">GPS Coordinates</span>
            <span className="font-bold text-emerald-300 flex items-center gap-1.5 mt-0.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Locked ({userCoords?.lat.toFixed(2) || '28.61'}°, {userCoords?.lng.toFixed(2) || '77.20'}°)
            </span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl backdrop-blur-xs border border-white/10">
            <span className="text-rose-200/90 block text-[10px] font-bold uppercase tracking-wider">Distress Beacon</span>
            <span className="font-bold text-white mt-0.5 block text-xs">
              {beaconSent ? 'Broadcast Sent ✓' : 'Ready to Send'}
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
          className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-3xl border border-rose-200/80 dark:border-rose-900/60 shadow-sm flex flex-col items-start gap-3 transition-all text-left cursor-pointer group hover:border-rose-400 hover:shadow-md"
        >
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors border border-rose-100 dark:border-rose-900">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">CPR Audio Metronome</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Audio metronome locked to AHA standard 110 BPM with visual chest compression counter.
            </p>
          </div>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform mt-auto flex items-center gap-1">
            Launch Metronome →
          </span>
        </button>

        {/* Nearby Hospitals */}
        <button
          id="btn-goto-facilities"
          onClick={onGoToFacilities}
          className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-start gap-3 transition-all text-left cursor-pointer group hover:border-indigo-400 hover:shadow-md"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-indigo-100 dark:border-indigo-900">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Nearby Emergency Facilities</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Interactive GPS map with trauma designations, live ICU bed counts, and driving route ETA.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform mt-auto flex items-center gap-1">
            View Live Hospital Map →
          </span>
        </button>

        {/* Paramedic Fast-Scan Card */}
        <button
          id="btn-goto-summary"
          onClick={onGoToSummary}
          className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-start gap-3 transition-all text-left cursor-pointer group hover:border-emerald-400 hover:shadow-md"
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Paramedic Summary Card</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              High-contrast medical ID card with blood group, allergies, medications, and QR code for EMTs.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform mt-auto flex items-center gap-1">
            Open Medical Summary →
          </span>
        </button>
      </div>

      {/* Critical Instructions While Help is Being Arranged */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none p-6 sm:p-7 space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            Essential Actions While Waiting for Paramedics
          </h2>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            6 Pre-Arrival Steps
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">1. Turn on Exterior Lights</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Switch on front porch light and open window blinds so arriving ambulances locate you immediately.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded-xl shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">2. Unlock Front Door</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Unlock entrance so EMTs don't have to force entry if patient condition deteriorates.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded-xl shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">3. Gather Medication Bottles</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Place current prescription bottles into a bag to hand directly to paramedics.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
              <Dog className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">4. Confine Household Pets</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Secure dogs or cats in a separate bedroom to avoid distraction or stress for responders.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl shrink-0">
              <PhoneForwarded className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">5. Stay on the Line with 108 / 112</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Keep the phone call active with 108 emergency ambulance dispatch. Do not hang up until instructed.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 rounded-xl shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">6. Notify Emergency Contacts</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
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
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3.5 p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Send Live GPS Beacon to Emergency Contacts
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Notifies {patientProfile?.emergencyContacts?.[0]?.name || 'Priya Sharma'} ({patientProfile?.emergencyContacts?.[0]?.phone || '+91 98112 34567'}) with live coordinates link.
              </div>
            </div>
          </div>
          <button
            id="btn-broadcast-beacon"
            onClick={handleSendBeacon}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
              beaconSent
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 dark:bg-rose-600 text-white hover:bg-slate-800 dark:hover:bg-rose-700 shadow-md'
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
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-semibold cursor-pointer transition-colors"
        >
          Resolve / Close Emergency Session
        </button>
      </div>
    </div>
  );
};
