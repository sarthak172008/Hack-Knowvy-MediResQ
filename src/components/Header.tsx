import React, { useState } from 'react';
import {
  Activity,
  PhoneCall,
  MapPin,
  FileText,
  User,
  ShieldAlert,
  Layers,
  Hospital,
  AlertOctagon,
  Menu,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';
import { UrgencyLevel } from '../types';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeEmergency: boolean;
  urgency: UrgencyLevel | null;
  onOpenSOSModal: () => void;
  onOpenBlueprint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeEmergency,
  urgency,
  onOpenSOSModal,
  onOpenBlueprint,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'triage', label: 'Triage & Assess', icon: Activity },
    { id: 'copilot', label: 'Gemini Copilot', icon: Sparkles },
    { id: 'dashboard', label: 'Emergency Dashboard', icon: ShieldAlert, badge: activeEmergency },
    { id: 'facilities', label: 'Nearby Facilities', icon: Hospital },
    { id: 'location', label: 'Live Location', icon: MapPin },
    { id: 'summary', label: 'EMT Summary Card', icon: FileText },
    { id: 'profile', label: 'Patient Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner if Active Emergency */}
      {activeEmergency && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            <span>ACTIVE EMERGENCY DISPATCH MODE: Priority Level {urgency || 'CRITICAL'}</span>
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="underline hover:text-rose-100 font-bold tracking-wide cursor-pointer"
          >
            View Dashboard & Instructions →
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('triage')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Medi<span className="text-rose-600">ResQ</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                  SMART EMERGENCY RESPONSE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
                Rapid Clinical Triage & Paramedic Handoff
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons: Theme Selector, Blueprint & 1-Tap SOS */}
          <div className="flex items-center gap-2">
            {/* Theme Selector Popover */}
            <ThemeSelector variant="dropdown" />

            <button
              id="btn-blueprint"
              onClick={onOpenBlueprint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              title="View Hackathon Architecture, Schema & Pitch"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>System Blueprint</span>
            </button>

            {/* 1-Tap Emergency Call Button (108 India National Ambulance) */}
            <button
              id="btn-quick-sos"
              onClick={onOpenSOSModal}
              className="px-3.5 sm:px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm shadow-rose-600/30 flex items-center gap-2 transition-all"
              title="Call India Emergency Ambulance Helpline (108)"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>CALL 108</span>
              <span className="hidden md:inline-block text-[10px] bg-rose-800/80 px-1.5 py-0.5 rounded font-mono">
                AMBULANCE
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-rose-500" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenBlueprint();
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>View System Blueprint & Database Schema</span>
            </button>
          </div>

          <div className="pt-3 pb-1 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Select Display Theme
            </div>
            <ThemeSelector variant="grid" />
          </div>
        </div>
      )}
    </header>
  );
};
