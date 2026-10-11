import React, { useState, useEffect } from 'react';
import { CelebrationConfig } from '../types';
import {
  Lock,
  Unlock,
  Sparkles,
  Heart,
  Calendar,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  Eye,
  Check,
} from 'lucide-react';
import { romanticAmbientSynth } from '../utils/audioEngine';

interface ScheduledLockScreenProps {
  config: CelebrationConfig;
  isPreview?: boolean;
  onUnlock: () => void;
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUnlocked: boolean;
}

const calculateTimeRemaining = (targetIso: string): TimeRemaining => {
  const targetTime = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = targetTime - now;

  if (isNaN(targetTime) || diff <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUnlocked: true,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
    isUnlocked: false,
  };
};

export const ScheduledLockScreen: React.FC<ScheduledLockScreenProps> = ({
  config,
  isPreview = false,
  onUnlock,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(config.unlockAt || new Date().toISOString())
  );
  const [isMuted, setIsMuted] = useState(() => romanticAmbientSynth.isMuted());
  const [isPlayingTeaser, setIsPlayingTeaser] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  const recipientName = config.recipientName || 'My Person';
  const occasion = config.occasion || 'birthday';
  const unlockDateObj = config.unlockAt ? new Date(config.unlockAt) : null;

  // Format unlock date nicely
  const formattedUnlockDate = unlockDateObj && !isNaN(unlockDateObj.getTime())
    ? unlockDateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Your Special Day';

  const formattedUnlockTime = unlockDateObj && !isNaN(unlockDateObj.getTime())
    ? unlockDateObj.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '12:00 AM';

  // Live countdown timer
  useEffect(() => {
    if (!config.unlockAt) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(config.unlockAt!);
      setTimeLeft(remaining);

      if (remaining.isUnlocked) {
        clearInterval(interval);
        onUnlock();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config.unlockAt, onUnlock]);

  const toggleTeaserMusic = () => {
    if (isPlayingTeaser) {
      romanticAmbientSynth.stop();
      setIsPlayingTeaser(false);
    } else {
      romanticAmbientSynth.start();
      setIsPlayingTeaser(true);
    }
  };

  // Add to Calendar (.ics format download)
  const handleAddToCalendar = () => {
    if (!unlockDateObj || isNaN(unlockDateObj.getTime())) return;

    const startIso = unlockDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(unlockDateObj.getTime() + 60 * 60 * 1000);
    const endIso = end.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Eyan Mi//Celebration Lock//EN',
      'BEGIN:VEVENT',
      `UID:eyan-mi-${config.id}-${Date.now()}@eyanmi.com`,
      `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:❤️ Unseal Birthday Celebration for ${recipientName}`,
      `DESCRIPTION:Your personalized digital celebration and wax-sealed epistle on Eyan Mi is ready to unlock! Open your link: ${window.location.href}`,
      `URL:${window.location.href}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `eyan_mi_${recipientName.toLowerCase().replace(/\s+/g, '_')}_unlock.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCalendarAdded(true);
    setTimeout(() => setCalendarAdded(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#1F0A12] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-radial from-[#8B1E3F]/40 via-transparent to-black pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Sound Preview Toggle */}
      <button
        type="button"
        onClick={toggleTeaserMusic}
        className="fixed top-4 left-4 z-40 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all shadow-md active:scale-95 cursor-pointer"
        title={isPlayingTeaser ? 'Pause ambient melody' : 'Play ambient teaser melody'}
      >
        {isPlayingTeaser ? (
          <Volume2 className="w-4 h-4 text-[#E6C687] animate-pulse" />
        ) : (
          <VolumeX className="w-4 h-4 text-[#FFB3C1]" />
        )}
      </button>

      {/* Main Lock Showcase Card */}
      <div className="relative max-w-xl w-full mx-auto text-center space-y-6 sm:space-y-8 my-auto p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#2D0E19]/90 to-[#1A060F]/95 border-2 border-[#D4AF37]/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-md">
        {/* Metallic Corner Highlights */}
        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#E6C687] rounded-tl-md pointer-events-none" />
        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#E6C687] rounded-tr-md pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#E6C687] rounded-bl-md pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#E6C687] rounded-br-md pointer-events-none" />

        {/* 3D Wax Seal with Golden Lock */}
        <div className="relative flex justify-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#A62B50] via-[#8B1E3F] to-[#591026] text-white flex items-center justify-center shadow-2xl border-3 border-[#D4AF37]/70 group">
            {/* Outer golden halo */}
            <div className="absolute -inset-2 rounded-full border border-[#D4AF37]/40 animate-pulse" />
            <div className="absolute -inset-4 rounded-full border border-[#D4AF37]/20 pointer-events-none" />

            <div className="flex flex-col items-center justify-center">
              <Lock className="w-9 h-9 sm:w-11 sm:h-11 text-[#FFD782] drop-shadow-md transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#FFE8B8] mt-1 font-bold">
                Sealed
              </span>
            </div>
          </div>
        </div>

        {/* Title & Delivery Note */}
        <div className="space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#FFD7DF] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687]" />
            <span>Special Delivery Under Royal Seal</span>
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687]" />
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-[#FFF5F6] leading-snug break-words">
            For {recipientName} ❤️
          </h1>

          <p className="text-xs sm:text-sm text-[#E8C5CE] max-w-md mx-auto leading-relaxed">
            Someone who deeply adores you has sent a wax-sealed celebration early!
            This digital epistle is scheduled to unlock precisely on your special day.
          </p>
        </div>

        {/* Real-Time Live Countdown Timer */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((unit, idx) => (
              <div
                key={idx}
                className="p-2 sm:p-3 rounded-2xl bg-black/40 border border-[#D4AF37]/35 shadow-inner flex flex-col items-center justify-center"
              >
                <div className="font-mono text-2xl sm:text-4xl font-extrabold text-[#FFDF99] tracking-tight">
                  {String(unit.value).padStart(2, '0')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-serif uppercase tracking-widest text-[#E8C5CE]/80 mt-0.5">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          {/* Formatted Date Stamp */}
          <div className="pt-2 text-xs text-[#E6C687] flex items-center justify-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>
              Unlocks on <strong>{formattedUnlockDate}</strong> at <strong>{formattedUnlockTime}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons: Add Reminder & Creator Override */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleAddToCalendar}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            {calendarAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reminder Saved to Calendar!</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5 text-[#E6C687]" />
                <span>Add Unlock Reminder to Calendar</span>
              </>
            )}
          </button>

          {/* Creator Preview Override (visible in preview mode or for testing) */}
          {isPreview && (
            <button
              type="button"
              onClick={onUnlock}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#8B1E3F] hover:bg-[#A6244A] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 border border-[#FF94AB]/40"
              title="Test the unlocked celebrant experience now"
            >
              <Unlock className="w-3.5 h-3.5 text-[#FFD782]" />
              <span>Preview Unlocked Experience</span>
            </button>
          )}
        </div>

        {/* Subtle Eyan mi Seal Stamp */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#A67C85]">
          <Heart className="w-3 h-3 fill-[#8B1E3F] text-[#8B1E3F]" />
          <span>Eyan mi · Sealed with Genuine Love & Honor</span>
        </div>
      </div>
    </div>
  );
};
