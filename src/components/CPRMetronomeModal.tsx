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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200/80 dark:border-rose-900/60 overflow-hidden text-slate-900 dark:text-white transition-colors">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs border border-white/20">
              <Heart className="w-6 h-6 animate-pulse text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight tracking-tight">CPR Compression Assistant</h3>
              <p className="text-xs text-rose-100/90 font-medium">AHA Recommended Cadence: 100–120 BPM</p>
            </div>
          </div>
          <button
            id="cpr-modal-close"
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 flex flex-col items-center text-center">
          {/* Visual Pulsing Circle */}
          <div className="relative my-6 flex items-center justify-center">
            <div
              className={`w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-150 ${
                pulse
                  ? 'scale-105 bg-rose-600 text-white shadow-2xl shadow-rose-500/50 ring-8 ring-rose-400/40'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-4 border-rose-300 dark:border-rose-800'
              }`}
            >
              <span className="text-5xl font-black font-mono tracking-tight">
                {compressionCount > 0 ? compressionCount : '30'}
              </span>
              <span className="text-xs font-black uppercase tracking-wider mt-1.5 opacity-90 px-3 py-0.5 rounded-full bg-black/10 dark:bg-black/30">
                {isBreathTime ? 'GIVE 2 BREATHS' : 'PUSH HARD & FAST'}
              </span>
            </div>
            {pulse && (
              <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-60 pointer-events-none" />
            )}
          </div>

          {/* Cycle Guidance */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 mb-5 text-left text-xs text-slate-700 dark:text-slate-300 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-200/80 dark:border-slate-700/80">
              <span>Standard 30:2 CPR Cycle</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono font-black">110 BPM Metronome</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              <strong className="text-slate-900 dark:text-white">1. Center of chest:</strong> Lock elbows straight, push at least 2 inches (5 cm) deep.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">2. Full recoil:</strong> Allow chest to rise completely between compressions. Give 2 breaths every 30 pushes.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3.5 w-full justify-center">
            <button
              id="cpr-toggle-play"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer active:scale-95 ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
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
              className="p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-rose-600 dark:text-rose-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
          </div>

          <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Keep phone on speakerphone with emergency ambulance dispatch (108 / 112) while performing compressions.
          </p>
        </div>
      </div>
    </div>
  );
};
