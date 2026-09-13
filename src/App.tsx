import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TriageAssessmentView } from './components/TriageAssessmentView';
import { EmergencyDashboardView } from './components/EmergencyDashboardView';
import { NearbyFacilitiesView } from './components/NearbyFacilitiesView';
import { LocationSharingView } from './components/LocationSharingView';
import { PatientSummaryView } from './components/PatientSummaryView';
import { ProfileView } from './components/ProfileView';
import { CPRMetronomeModal } from './components/CPRMetronomeModal';
import { SystemBlueprintModal } from './components/SystemBlueprintModal';
import { TriageAssessment, PatientProfile, UrgencyLevel } from './types';
import { DEFAULT_DEMO_PROFILE } from './data/mockData';
import { ShieldAlert, Heart, PhoneCall, AlertTriangle, BookOpen } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'triage' | 'dashboard' | 'facilities' | 'location' | 'summary' | 'profile'>('triage');

  // Clinical & Emergency State
  const [currentTriage, setCurrentTriage] = useState<TriageAssessment | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 28.6139,
    lng: 77.2090,
  });

  // User Profile & Auth
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mediresq_token'));
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(() => {
    const saved = localStorage.getItem('mediresq_profile');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_PROFILE;
  });

  // Modals
  const [isCPRModalOpen, setIsCPRModalOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

  // Geolocation acquisition
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation denied or unavailable, using fallback:', error.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Save profile changes
  const handleUpdateProfile = (updated: PatientProfile) => {
    setPatientProfile(updated);
    localStorage.setItem('mediresq_profile', JSON.stringify(updated));
  };

  const handleLogin = (newToken: string, user: PatientProfile) => {
    setToken(newToken);
    setPatientProfile(user);
    localStorage.setItem('mediresq_token', newToken);
    localStorage.setItem('mediresq_profile', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('mediresq_token');
  };

  // Triage Completion Handler
  const handleTriageComplete = (assessment: TriageAssessment) => {
    setCurrentTriage(assessment);
    if (assessment.urgency === 'CRITICAL') {
      setIsEmergencyActive(true);
      setActiveTab('dashboard');
    }
  };

  const handleEmergencySOS = () => {
    setIsEmergencyActive(true);
    setActiveTab('dashboard');
  };

  const handleResolveEmergency = () => {
    setIsEmergencyActive(false);
    setActiveTab('triage');
  };

  const currentUrgency: UrgencyLevel | null = currentTriage?.urgency || (isEmergencyActive ? 'CRITICAL' : null);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-rose-500 selection:text-white antialiased">
      {/* Disclaimer Banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Emergency System Notice:</strong> MediResQ is a clinical triage copilot for rapid response. If you or someone nearby is in immediate life-threatening danger, call <strong>108 / 112</strong> (National Ambulance & Emergency Helpline, India) immediately.
        </span>
      </div>

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeEmergency={isEmergencyActive}
        urgency={currentUrgency}
        onOpenSOSModal={handleEmergencySOS}
        onOpenBlueprint={() => setIsBlueprintModalOpen(true)}
      />

      {/* Active Urgent Notification Ribbon (when in Emergency Mode) */}
      {isEmergencyActive && activeTab !== 'dashboard' && (
        <div className="bg-rose-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 max-w-2xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>EMERGENCY ASSISTANCE SESSION ACTIVE ({currentUrgency})</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="underline hover:text-rose-100 cursor-pointer"
              >
                View Dashboard →
              </button>
              <a
                href="tel:108"
                className="px-3 py-1 bg-white text-rose-700 rounded-lg shadow-xs hover:bg-rose-50 font-bold"
              >
                Call 108
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'triage' && (
          <TriageAssessmentView
            onTriageComplete={handleTriageComplete}
            patientProfile={patientProfile}
            currentTriage={currentTriage}
            onActivateEmergency={(triage) => {
              setCurrentTriage(triage);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <EmergencyDashboardView
            currentTriage={currentTriage}
            patientProfile={patientProfile}
            onOpenCPRMetronome={() => setIsCPRModalOpen(true)}
            onGoToFacilities={() => setActiveTab('facilities')}
            onGoToLocation={() => setActiveTab('location')}
            onGoToSummary={() => setActiveTab('summary')}
            onResolveEmergency={handleResolveEmergency}
            userCoords={userCoords}
          />
        )}

        {activeTab === 'facilities' && (
          <NearbyFacilitiesView
            urgency={currentUrgency}
            userCoords={userCoords}
          />
        )}

        {activeTab === 'location' && (
          <LocationSharingView
            patientProfile={patientProfile}
            urgency={currentUrgency}
            userCoords={userCoords}
            onRequestLocation={requestLocation}
          />
        )}

        {activeTab === 'summary' && (
          <PatientSummaryView
            patientProfile={patientProfile}
            currentTriage={currentTriage}
            urgency={currentUrgency}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={patientProfile}
            token={token}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <strong className="text-slate-800">MediResQ</strong> — Smart Emergency Health Response System
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setIsBlueprintModalOpen(true)}
              className="text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>System Blueprint & Architecture</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCPRModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>CPR Metronome (110 BPM)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Floating CPR Metronome Quick Trigger on desktop */}
      <button
        id="floating-cpr-metronome-trigger"
        onClick={() => setIsCPRModalOpen(true)}
        className="fixed bottom-5 right-5 z-40 p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-xl shadow-rose-600/30 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer border-2 border-white"
        title="Launch Bystander CPR Metronome"
      >
        <Heart className="w-4 h-4 animate-pulse" />
        <span className="hidden sm:inline">CPR Metronome</span>
      </button>

      {/* Modals */}
      <CPRMetronomeModal
        isOpen={isCPRModalOpen}
        onClose={() => setIsCPRModalOpen(false)}
      />

      <SystemBlueprintModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
      />
    </div>
  );
}
