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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      {/* Top Banner if Active Emergency */}
      {activeEmergency && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-inner animate-pulse">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="tracking-wide">
                ACTIVE EMERGENCY DISPATCH MODE • PRIORITY: {urgency || 'CRITICAL'}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-3 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] transition-colors cursor-pointer"
            >
              Open Rescue Dashboard →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => setActiveTab('triage')}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25 group-hover:scale-105 transition-all duration-200">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Medi<span className="text-rose-600">ResQ</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  EMERGENCY AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
                Smart Clinical Triage & Paramedic Response
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              title="View Hackathon Architecture, Schema & Pitch"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Blueprint</span>
            </button>

            {/* 1-Tap Emergency Call Button (108 India National Ambulance) */}
            <button
              id="btn-quick-sos"
              onClick={onOpenSOSModal}
              className="relative group px-3.5 sm:px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer border border-rose-500/40"
              title="Call India Emergency Ambulance Helpline (108)"
            >
              <PhoneCall className="w-4 h-4 animate-bounce shrink-0" />
              <span>CALL 108</span>
              <span className="hidden md:inline-block text-[9px] font-black uppercase tracking-wider bg-black/25 px-1.5 py-0.5 rounded-md">
                24x7
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
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
