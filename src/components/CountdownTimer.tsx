import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function CountdownTimer() {
  // Target: July 28th, 2026 at 23:59:59 (Midnight)
  const targetDate = new Date(2026, 6, 28, 23, 59, 59).getTime(); // Month is 0-indexed (6 = July)

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#00594E] p-6 md:p-8 text-white shadow-2xl border border-slate-700/50">
        {/* Background ambient glow effects */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#00594E]/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#B5A160]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Text Information */}
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Calendar size={14} />
              <span>Fecha Límite de Cierre</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Cierre de Inscripciones
            </h3>
            <p className="text-sm text-slate-300 font-medium flex items-center justify-center md:justify-start gap-2">
              <Clock size={16} className="text-[#B5A160]" />
              <span>Las inscripciones estarán abiertas hasta el <strong className="text-white font-bold underline decoration-amber-400 decoration-2">28 de julio a media noche (11:59 PM)</strong>.</span>
            </p>
          </div>

          {/* Timer Display */}
          {timeLeft.isExpired ? (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold text-lg">
              <AlertCircle size={24} />
              <span>¡Inscripciones Finalizadas!</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 md:gap-4 text-center min-w-[280px] md:min-w-[340px]">
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-inner flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-amber-400 tracking-tight font-mono">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Días</span>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-inner flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-white tracking-tight font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Horas</span>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-inner flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-white tracking-tight font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Min.</span>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-inner flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-emerald-400 tracking-tight font-mono animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Seg.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
