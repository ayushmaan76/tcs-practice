import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface ExamTimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ initialSeconds, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning15 = secondsLeft <= 900 && secondsLeft > 300;
  const isWarning5 = secondsLeft <= 300 && secondsLeft > 60;
  const isCritical = secondsLeft <= 60;

  return (
    <div
      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md font-mono text-sm font-bold shadow-md transition-all ${
        isCritical
          ? 'bg-red-600 text-white animate-pulse shadow-red-600/40'
          : isWarning5
          ? 'bg-amber-600 text-white shadow-amber-600/40'
          : isWarning15
          ? 'bg-amber-950 border border-amber-600 text-amber-300'
          : 'bg-slate-800 border border-slate-700 text-emerald-400'
      }`}
    >
      <Clock className="w-4 h-4" />
      <span>{secondsLeft > 0 ? formatTime(secondsLeft) : 'TIME OVER'}</span>

      {isCritical && (
        <span className="flex items-center gap-1 text-[11px] font-sans font-normal ml-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {"< 1 min remaining!"}
        </span>
      )}
    </div>
  );
};
