import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, AlertTriangle, X, CheckCircle } from 'lucide-react';

interface CPRMetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CPRMetronomeModal: React.FC<CPRMetronomeModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [compressionCount, setCompressionCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // 110 BPM = 545.45 ms per beat
  const BPM = 110;
  const intervalMs = Math.round((60 / BPM) * 1000);

  // Play synthetic metronome click using Web Audio API
  const playClick = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz crisp high tone
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCompressionCount((prev) => {
          const next = (prev % 30) + 1;
          return next;
        });
        setPulse(true);
        playClick();
        setTimeout(() => setPulse(false), 180);
      }, intervalMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, soundEnabled]);

  const handleClose = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
  };

  if (!isOpen) return null;

  const cycleNumber = Math.floor(compressionCount / 30);
  const isBreathTime = compressionCount === 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden text-slate-900">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Heart className="w-6 h-6 animate-pulse text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">CPR Compression Assistant</h3>
              <p className="text-xs text-rose-100 font-medium">AHA Recommended Pace: 100-120 BPM</p>
            </div>
          </div>
          <button
            id="cpr-modal-close"
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Visual Pulsing Circle */}
          <div className="relative my-6 flex items-center justify-center">
            <div
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-150 ${
                pulse
                  ? 'scale-105 bg-rose-600 text-white shadow-xl shadow-rose-500/40 ring-8 ring-rose-200'
                  : 'bg-rose-50 text-rose-700 border-4 border-rose-300'
              }`}
            >
              <span className="text-4xl font-extrabold tracking-tight">
                {compressionCount > 0 ? compressionCount : '30'}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-90">
                {isBreathTime ? 'GIVE 2 BREATHS' : 'PUSH HARD & FAST'}
              </span>
            </div>
            {pulse && (
              <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-75 pointer-events-none" />
            )}
          </div>

          {/* Cycle Guidance */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-left text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>Standard 30:2 CPR Rhythm</span>
              <span className="text-rose-600 font-mono">110 BPM Metronome</span>
            </div>
            <p className="text-slate-600">
              1. Center of chest, between nipples. Lock elbows, push at least 2 inches (5 cm) deep.
            </p>
            <p className="text-slate-600">
              2. Allow complete chest recoil between pushes. After 30 compressions, give 2 rescue breaths.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 w-full justify-center">
            <button
              id="cpr-toggle-play"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" /> Pause Metronome
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> Start 110 BPM Rhythm
                </>
              )}
            </button>

            <button
              id="cpr-toggle-sound"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Click Audio' : 'Unmute Click Audio'}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-rose-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
          </div>

          <p className="mt-4 text-[11px] text-slate-500 font-medium">
            Keep phone on speakerphone with emergency ambulance dispatch (108 / 112) while performing compressions.
          </p>
        </div>
      </div>
    </div>
  );
};
