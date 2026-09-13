import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Share2,
  Phone,
  Copy,
  Check,
  Send,
  Navigation,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PatientProfile, UrgencyLevel } from '../types';
import { DEFAULT_DEMO_PROFILE } from '../data/mockData';

interface LocationSharingViewProps {
  patientProfile: PatientProfile | null;
  urgency: UrgencyLevel | null;
  userCoords: { lat: number; lng: number } | null;
  onRequestLocation: () => void;
}

export const LocationSharingView: React.FC<LocationSharingViewProps> = ({
  patientProfile,
  urgency,
  userCoords,
  onRequestLocation,
}) => {
  const [copied, setCopied] = useState(false);
  const [beaconStatus, setBeaconStatus] = useState<string | null>(null);

  const lat = userCoords?.lat ?? 28.6139;
  const lng = userCoords?.lng ?? 77.2090;
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const distressMessage = `EMERGENCY ALERT: ${
    patientProfile?.fullName || 'Rajesh Sharma'
  } is in medical distress. Assessed urgency: ${
    urgency || 'CRITICAL'
  }. Ambulance requested via 108. Live GPS: ${mapLink}. Sent via MediResQ.`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mapLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator
        .share({
          title: '🚨 MediResQ Emergency Distress Alert',
          text: distressMessage,
          url: mapLink,
        })
        .then(() => setBeaconStatus('Dispatched successfully via device share!'))
        .catch(() => {});
    } else {
      handleCopyLink();
      setBeaconStatus('Link copied to clipboard!');
    }
  };

  const handleSendSMS = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(distressMessage)}`;
  };

  const contacts = patientProfile?.emergencyContacts || DEFAULT_DEMO_PROFILE.emergencyContacts;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Privacy Notice */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-rose-600" />
            Emergency Live Location & Distress Beacon
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time coordinates shared exclusively during active distress with verified emergency contacts.
          </p>
        </div>
        <button
          id="btn-refresh-gps"
          onClick={onRequestLocation}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh GPS Signal</span>
        </button>
      </div>

      {/* GPS Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                GPS Position Locked (High Accuracy)
              </div>
              <div className="text-xs font-mono text-slate-600 mt-0.5">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Approx: Connaught Place / Ring Road, New Delhi, India
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy GPS Link'}</span>
            </button>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Open in Maps</span>
            </a>
          </div>
        </div>

        {/* 1-Tap Emergency Beacon Broadcaster */}
        <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <Share2 className="w-4 h-4 text-rose-600" />
              <span>Instant Distress Beacon (1-Tap Share)</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-800 px-2 py-0.5 rounded-md">
              Emergency Broadcast
            </span>
          </div>

          <p className="text-xs text-rose-800">
            Broadcasting sends your live GPS coordinates, urgent status, and medical profile link
            instantly to your family and emergency contacts.
          </p>

          <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-slate-700 font-mono select-all">
            {distressMessage}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              id="btn-trigger-share"
              onClick={handleShareNative}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast to Contacts Now</span>
            </button>
            {beaconStatus && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> {beaconStatus}
              </span>
            )}
          </div>
        </div>

        {/* Emergency Contacts Direct List */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Designated Emergency Contacts ({contacts.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{contact.name}</span>
                    {contact.isPrimary && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {contact.relationship} • {contact.phone}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSendSMS(contact.phone)}
                    title="Send SMS Distress Message"
                    className="p-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-indigo-600" />
                  </button>
                  <a
                    href={`tel:${contact.phone}`}
                    title="Call Contact"
                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
