import React, { useMemo } from 'react';

interface AudioWaveformVisualizerProps {
  isPlaying: boolean;
  progressPercent: number; // 0 to 100
  durationSeconds?: number;
  currentSeconds?: number;
  barCount?: number;
  onSeek?: (percentage: number) => void;
  accentColor?: string;
  theme?: 'rose' | 'gold' | 'minimal';
  audioElementRef?: React.RefObject<HTMLAudioElement | null>;
  compact?: boolean;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isPlaying,
  progressPercent,
  durationSeconds = 0,
  currentSeconds = 0,
  barCount = 38,
  onSeek,
  compact = false,
}) => {
  // Deterministic, beautiful organic waveform height profile
  const waveformHeights = useMemo(() => {
    // Generate harmonious heights simulating speech cadences
    const bars: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const x = i / (barCount - 1);
      // Envelope curve: softer at edges, higher energy in bursts
      const envelope = Math.sin(x * Math.PI);
      const mod1 = Math.sin(i * 1.35) * 0.25;
      const mod2 = Math.cos(i * 2.8) * 0.18;
      const mod3 = Math.sin(i * 0.45) * 0.2;
      const base = 0.25 + envelope * 0.55 + mod1 + mod2 + mod3;
      const clamped = Math.max(0.18, Math.min(0.95, base));
      bars.push(clamped);
    }
    return bars;
  }, [barCount]);

  const handleBarClick = (index: number) => {
    if (!onSeek) return;
    const seekPercentage = (index / (barCount - 1)) * 100;
    onSeek(Math.min(100, Math.max(0, seekPercentage)));
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    onSeek(Math.min(100, Math.max(0, percentage)));
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex flex-col gap-1.5 select-none">
      {/* Waveform Bar Track */}
      <div
        onClick={handleContainerClick}
        className={`group relative flex items-center justify-between gap-[2.5px] sm:gap-[3.5px] px-2 py-2 rounded-xl transition-colors ${
          onSeek ? 'cursor-pointer hover:bg-rose-50/50' : ''
        } ${compact ? 'h-10' : 'h-14 sm:h-16'}`}
        role={onSeek ? 'slider' : undefined}
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        title={onSeek ? 'Click or drag to jump in voice note' : undefined}
      >
        {waveformHeights.map((normalizedHeight, idx) => {
          const barPercent = (idx / (barCount - 1)) * 100;
          const isPassed = barPercent <= progressPercent;
          const isCurrentCursor = Math.abs(barPercent - progressPercent) < (100 / barCount);

          // Dynamic dancing height modifier when actively playing
          // Give bars subtle staggered micro-variations
          const dynamicAnimationClass = isPlaying
            ? idx % 4 === 0
              ? 'animate-waveform-pulse-1'
              : idx % 4 === 1
              ? 'animate-waveform-pulse-2'
              : idx % 4 === 2
              ? 'animate-waveform-pulse-3'
              : 'animate-waveform-pulse-4'
            : '';

          return (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                handleBarClick(idx);
              }}
              style={{
                height: `${Math.round(normalizedHeight * 100)}%`,
              }}
              className={`relative flex-1 min-w-[2px] max-w-[5px] rounded-full transition-all duration-150 origin-center ${dynamicAnimationClass} ${
                isPassed
                  ? 'bg-gradient-to-t from-[#8B1E3F] via-[#A82A4D] to-[#D4AF37] shadow-[0_0_8px_rgba(139,30,63,0.35)]'
                  : 'bg-[#EADBDD] group-hover:bg-[#DECBCE]'
              } ${isCurrentCursor ? 'scale-y-125 ring-2 ring-[#8B1E3F]/40' : ''}`}
            />
          );
        })}
      </div>

      {/* Timestamp Indicators */}
      <div className="flex items-center justify-between px-1 text-[11px] font-mono text-[#8C6B73]">
        <span className="font-semibold text-[#8B1E3F]">
          {formatTime(currentSeconds)}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-[#A5828B]">
          {isPlaying && (
            <span className="flex items-center gap-1 text-[#8B1E3F] font-sans font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F] animate-ping" />
              <span>Playing</span>
            </span>
          )}
          <span>{formatTime(durationSeconds)}</span>
        </div>
      </div>
    </div>
  );
};
