import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  Lock,
  Heart,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  LogIn,
  Palette,
} from 'lucide-react';
import { PatientProfile, EmergencyContact } from '../types';
import { DEFAULT_DEMO_PROFILE } from '../data/mockData';
import { ThemeSelector } from './ThemeSelector';

interface ProfileViewProps {
  profile: PatientProfile | null;
  token: string | null;
  onLogin: (token: string, user: PatientProfile) => void;
  onLogout: () => void;
  onUpdateProfile: (updated: PatientProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  token,
  onLogin,
  onLogout,
  onUpdateProfile,
}) => {
  const activeProfile = profile || DEFAULT_DEMO_PROFILE;

  // Auth state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState(activeProfile.email || 'rajesh.sharma@example.in');
  const [password, setPassword] = useState('demo123');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Profile Edit fields
  const [fullName, setFullName] = useState(activeProfile.fullName || 'Rajesh Sharma');
  const [dob, setDob] = useState(activeProfile.dob || '1988-04-12');
  const [bloodType, setBloodType] = useState<any>(activeProfile.bloodType || 'B+');
  const [allergiesText, setAllergiesText] = useState(
    activeProfile.allergies.join(', ') || 'Penicillin (Severe Anaphylaxis), Sulfonamides'
  );
  const [medicationsText, setMedicationsText] = useState(
    activeProfile.medications.join(', ') || 'Amlodipine 5mg (Daily), Metformin 500mg'
  );
  const [chronicConditionsText, setChronicConditionsText] = useState(
    activeProfile.chronicConditions.join(', ') || 'Hypertension, Type 2 Diabetes'
  );
  const [organDonor, setOrganDonor] = useState(activeProfile.organDonor ?? true);
  const [resuscitation, setResuscitation] = useState(
    activeProfile.resuscitationPreference || 'Full Code'
  );
  const [lockScreenAccessible, setLockScreenAccessible] = useState(
    activeProfile.lockScreenAccessible ?? true
  );
  const [privacyPIN, setPrivacyPIN] = useState(activeProfile.privacyPIN || '1122');
  const [insuranceProvider, setInsuranceProvider] = useState(
    activeProfile.insuranceProvider || 'Star Health MediClassic / PMJAY'
  );
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(
    activeProfile.insurancePolicyNumber || 'SH-IND-884920-A'
  );
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    activeProfile.emergencyContacts || DEFAULT_DEMO_PROFILE.emergencyContacts
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName: isRegisterMode ? fullName : undefined,
          dob,
          bloodType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin(data.token, data.user);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    const updatedProfile: PatientProfile = {
      id: profile?.id || 'user_1',
      email: profile?.email || email,
      fullName,
      dob,
      bloodType,
      allergies: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
      medications: medicationsText.split(',').map((s) => s.trim()).filter(Boolean),
      chronicConditions: chronicConditionsText.split(',').map((s) => s.trim()).filter(Boolean),
      organDonor,
      resuscitationPreference: resuscitation as any,
      emergencyContacts: contacts,
      insuranceProvider,
      insurancePolicyNumber,
      lockScreenAccessible,
      privacyPIN,
    };

    if (token) {
      try {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedProfile),
        });
      } catch (err) {
        console.warn('Profile updated locally:', err);
      }
    }

    onUpdateProfile(updatedProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const addContact = () => {
    const newContact: EmergencyContact = {
      id: `ec_${Date.now()}`,
      name: '',
      relationship: 'Family',
      phone: '',
      isPrimary: contacts.length === 0,
    };
    setContacts([...contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof EmergencyContact, value: any) => {
    setContacts(
      contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Auth Badge */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-rose-600" />
            Patient Health Profile & Privacy Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted personal medical card and emergency contact dispatch registry.
          </p>
        </div>

        {token ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 block">{fullName}</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                <Shield className="w-3 h-3" /> JWT Authenticated
              </span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            Demo Mode Active (Log in below to persist changes)
          </span>
        )}
      </div>

      {/* If Not Authenticated: Quick Login / Register Box */}
      {!token && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Key className="w-5 h-5 text-rose-500" />
              <span>{isRegisterMode ? 'Create MediResQ Account' : 'Sign In with JWT Authentication'}</span>
            </div>
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              {isRegisterMode ? 'Already have account? Sign in' : 'New patient? Register'}
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Email Address:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{authLoading ? 'Signing In...' : isRegisterMode ? 'Register' : 'Sign In'}</span>
              </button>
            </div>
          </form>

          {authError && (
            <div className="text-xs text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{authError}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Demo Credentials Pre-filled: <code className="text-rose-300">sarah.jenkins@example.com</code> / <code className="text-rose-300">demo123</code>
          </div>
        </div>
      )}

      {/* Patient Clinical Info Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-600" />
          Clinical Identification & Baseline Data
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name:
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date of Birth:
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Blood Type:
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 font-bold text-rose-600"
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Severe Allergies & Medications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Critical Allergies (Comma-separated):
            </label>
            <textarea
              rows={2}
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts, Bee Stings, Latex"
              className="w-full text-xs p-2.5 rounded-xl border border-rose-300 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Medications & Dosages:
            </label>
            <textarea
              rows={2}
              value={medicationsText}
              onChange={(e) => setMedicationsText(e.target.value)}
              placeholder="e.g. Albuterol Inhaler (PRN), Lisinopril 10mg"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>

        {/* Chronic Conditions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Chronic Medical Conditions:
          </label>
          <input
            type="text"
            value={chronicConditionsText}
            onChange={(e) => setChronicConditionsText(e.target.value)}
            placeholder="e.g. Asthma, Type 1 Diabetes, Epilepsy"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Legal & Advanced Directives */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resuscitation Preference (Code Status):
            </label>
            <select
              value={resuscitation}
              onChange={(e) => setResuscitation(e.target.value as any)}
              className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-semibold"
            >
              <option value="Full Code">Full Code (Perform CPR and Intubation)</option>
              <option value="DNR (Do Not Resuscitate)">DNR (Do Not Resuscitate)</option>
              <option value="DNI (Do Not Intubate)">DNI (Do Not Intubate)</option>
            </select>
          </div>

          <div className="flex items-center sm:pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={organDonor}
                onChange={(e) => setOrganDonor(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Registered Organ Donor</span>
            </label>
          </div>
        </div>

        {/* Insurance Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Insurance Provider:
            </label>
            <input
              type="text"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Policy / Member ID:
            </label>
            <input
              type="text"
              value={insurancePolicyNumber}
              onChange={(e) => setInsurancePolicyNumber(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        {/* Emergency Contacts Manager */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Emergency Contacts ({contacts.length})
            </h4>
            <button
              type="button"
              onClick={addContact}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>

          <div className="space-y-2">
            {contacts.map((contact, idx) => (
              <div
                key={contact.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                    placeholder="Contact Name"
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={contact.relationship}
                    onChange={(e) => updateContact(contact.id, 'relationship', e.target.value)}
                    placeholder="Relation (e.g. Spouse)"
                    className="w-full p-2 bg-white rounded-lg border border-slate-200"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Environment & Display Theme Preferences */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Visual Environment & Display Theme
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">4 Contextual Themes</span>
          </div>
          <p className="text-xs text-slate-500">
            Choose a visual mode tailored to your reading conditions: high daytime clarity, low-glare night ambulance, vision assist with high-contrast borders, or anti-panic calm sage.
          </p>
          <ThemeSelector variant="grid" />
        </div>

        {/* Privacy & Lock Screen Controls */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Lock className="w-4 h-4 text-rose-500" />
            <span>Emergency Access & Privacy Controls</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold block">Lock-Screen Paramedic Bypass</span>
              <span className="text-slate-400 text-[11px]">
                Allows first responders to read blood type and allergies without unlocking phone.
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lockScreenAccessible}
                onChange={(e) => setLockScreenAccessible(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-bold text-emerald-400">Enabled</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-800 text-xs">
            <label className="text-slate-300 font-semibold">Security PIN for editing:</label>
            <input
              type="password"
              maxLength={4}
              value={privacyPIN}
              onChange={(e) => setPrivacyPIN(e.target.value)}
              className="w-20 text-center font-mono p-1.5 bg-slate-800 rounded-lg border border-slate-700 text-white font-bold"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            id="btn-save-profile"
            type="button"
            onClick={handleSaveProfile}
            className="py-3 px-6 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Medical Directives</span>
          </button>

          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4" /> Profile Updated Successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
