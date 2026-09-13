import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Sun, Moon, Eye, HeartHandshake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../types';

interface ThemeSelectorProps {
  variant?: 'dropdown' | 'grid';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getThemeIcon = (id: AppTheme) => {
    switch (id) {
      case 'clinical':
        return <Sun className="w-4 h-4 text-sky-500" />;
      case 'midnight':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'high-contrast':
        return <Eye className="w-4 h-4 text-amber-400" />;
      case 'calm-sage':
        return <HeartHandshake className="w-4 h-4 text-teal-500" />;
    }
  };

  const currentConfig = availableThemes.find((t) => t.id === theme) || availableThemes[0];

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
        {availableThemes.map((t) => {
          const isSelected = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              id={`theme-option-${t.id}`}
              onClick={() => setTheme(t.id)}
              className={`p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'border-rose-600 bg-rose-50/20 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs shrink-0"
                  style={{ backgroundColor: t.bgHex, borderColor: t.surfaceHex }}
                >
                  {getThemeIcon(t.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{t.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.tagline}</p>
                </div>
              </div>
              {isSelected ? (
                <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="theme-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs cursor-pointer"
        title="Switch Environment Theme"
      >
        <Palette className="w-3.5 h-3.5 text-slate-600" />
        <span className="hidden sm:inline-block">{currentConfig.name.split(' ')[0]}</span>
        <span
          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
          style={{ backgroundColor: currentConfig.accentHex }}
        />
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="theme-dropdown-menu"
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Display Theme</span>
              <span className="text-[10px] text-slate-400 font-medium">Auto-persisted</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select an optimized clinical palette for your lighting or emergency context.
            </p>
          </div>

          <div className="space-y-1">
            {availableThemes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  id={`theme-select-${t.id}`}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50/80 text-rose-950 font-bold border border-rose-200'
                      : 'hover:bg-slate-100/80 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-slate-300/60 shadow-2xs"
                      style={{ backgroundColor: t.bgHex }}
                    >
                      {getThemeIcon(t.id)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate">{t.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 font-mono">
                          {t.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{t.tagline}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: t.accentHex }}
                    />
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
