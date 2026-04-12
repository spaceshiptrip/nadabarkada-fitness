import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { CHALLENGE_CONFIG } from '@/lib/config';

function getTimeLeft(targetDateStr) {
  const target = new Date(targetDateStr + 'T00:00:00');
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function CountdownBlock({ label, time, large }) {
  if (!time) return (
    <div className={`text-center ${large ? '' : 'opacity-70'}`}>
      <div className={`font-bold tabular-nums tracking-tight text-white ${large ? 'text-3xl md:text-5xl' : 'text-lg md:text-2xl'}`}>
        Started!
      </div>
      <div className={`mt-1 font-semibold uppercase tracking-widest text-blue-200 ${large ? 'text-xs' : 'text-[10px]'}`}>
        {label}
      </div>
    </div>
  );

  return (
    <div className={`text-center ${large ? '' : 'opacity-80'}`}>
      <div className={`font-bold tabular-nums tracking-tight text-white ${large ? 'text-3xl md:text-5xl' : 'text-lg md:text-2xl'}`}>
        {pad(time.days)}<span className="mx-0.5 opacity-50">:</span>{pad(time.hours)}<span className="mx-0.5 opacity-50">:</span>{pad(time.minutes)}<span className="mx-0.5 opacity-50">:</span>{pad(time.seconds)}
      </div>
      <div className={`mt-1 font-semibold uppercase tracking-widest text-blue-200 ${large ? 'text-xs' : 'text-[10px]'}`}>
        {label}
      </div>
    </div>
  );
}

export default function Header() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const challengeTime = getTimeLeft(CHALLENGE_CONFIG.challengeStartDate);
  const baselineTime = getTimeLeft(CHALLENGE_CONFIG.baselineStartDate);

  return (
    <header className="mb-8 rounded-3xl border bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-soft md:p-8">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
        <Trophy className="h-4 w-4" />
        NadaBarkada Fitness Challenge
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-around">
        <CountdownBlock
          label={`Until challenge start · ${CHALLENGE_CONFIG.challengeStartDate}`}
          time={challengeTime}
          large
        />

        <div className="h-px w-full bg-white/20 sm:h-12 sm:w-px" />

        <CountdownBlock
          label={`Until baseline start · ${CHALLENGE_CONFIG.baselineStartDate}`}
          time={baselineTime}
          large={false}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/15 pt-4 sm:grid-cols-3">
        {[
          { date: CHALLENGE_CONFIG.baselineStartDate, label: 'Baseline Week', emoji: '📋' },
          { date: CHALLENGE_CONFIG.challengeStartDate, label: 'Week 1 Starts', emoji: '🟢' },
          { date: CHALLENGE_CONFIG.challengeEndDate, label: 'Challenge Ends', emoji: '🏆' },
        ].map(({ date, label, emoji }) => (
          <div key={date} className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 px-4 py-3 text-center">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xl font-bold tabular-nums text-white md:text-2xl">{date}</span>
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-200">{label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
