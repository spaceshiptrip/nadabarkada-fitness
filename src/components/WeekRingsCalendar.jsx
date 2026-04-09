import { useState } from 'react';
import { calculateDailyPoints } from '@/lib/points';
import { getWeeklyDateRanges } from '@/lib/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getParticipantProfileImage } from '@/lib/participants';

// Apple Watch ring colors
const RING_MOVE     = '#FA3E57'; // red   — daily points (main ring)
const RING_EXERCISE = '#92E82C'; // green — active minutes
const RING_STAND    = '#1EEAEF'; // cyan  — steps

function ActivityRings({ log, size = 40 }) {
  const cx = size / 2;
  const cy = size / 2;
  const sw = size < 44 ? 4 : 5;
  const gap = 1;

  const hasData = !!log;
  const points       = hasData ? (log.dailyPoints ?? calculateDailyPoints(log)) : 0;
  const activeMin    = hasData ? (log.activeMinutes || 0) : 0;
  const steps        = hasData ? (log.steps || 0) : 0;

  const rings = [
    { r: cx - sw / 2,               color: RING_MOVE,     progress: Math.min(points / 10, 1) },
    { r: cx - sw / 2 - sw - gap,    color: RING_EXERCISE, progress: Math.min(activeMin / 60, 1) },
    { r: cx - sw / 2 - (sw + gap) * 2, color: RING_STAND, progress: Math.min(steps / 10000, 1) },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {rings.map(({ r, color, progress }) => {
        const circ = 2 * Math.PI * r;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} opacity={0.15} />
            {hasData && (
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={color}
                strokeWidth={sw}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - progress)}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function shortDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WeekRingsCalendar({ logs, participants }) {
  const weeks = getWeeklyDateRanges();
  const [selectedWeek, setSelectedWeek] = useState(0);

  const week = weeks[selectedWeek];
  const days = Array.from({ length: 7 }, (_, i) => addDays(week.start, i));

  const visibleParticipants = participants.length > 0
    ? participants
    : [...new Set(logs.map((l) => l.name))].map((name) => ({ name, profileImage: '' }));

  function getLog(name, date) {
    return logs.find((l) => l.name === name && l.date === date) || null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Week at a glance</CardTitle>
        <CardDescription>
          Daily activity rings per participant.{' '}
          <span style={{ color: RING_MOVE }}>&#9679;</span> Points{' '}
          <span style={{ color: RING_EXERCISE }}>&#9679;</span> Active min{' '}
          <span style={{ color: RING_STAND }}>&#9679;</span> Steps
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Week tabs */}
        <div className="mb-4 flex flex-wrap gap-1">
          {weeks.map((w, i) => (
            <button
              key={w.label}
              onClick={() => setSelectedWeek(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedWeek === i
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {w.label.replace('Week ', 'W').replace('(Baseline)', '0')}
            </button>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th className="w-14 pb-2 text-left text-[10px] font-medium text-muted-foreground sm:w-20 sm:text-xs" />
                {days.map((date, i) => (
                  <th key={date} className="pb-2 text-center">
                    <div className="text-[10px] font-semibold text-slate-700 sm:text-xs">{DAY_LABELS[i]}</div>
                    <div className="text-[10px] text-muted-foreground sm:text-xs">{shortDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleParticipants.map((participant) => (
                <tr key={participant.name} className="border-t">
                  <td className="py-2 pr-1 align-top sm:py-3 sm:pr-2">
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={getParticipantProfileImage(participant.profileImage)}
                        alt={participant.name}
                        className="h-9 w-9 rounded-full border object-cover sm:h-11 sm:w-11"
                      />
                      <span className="text-center text-[10px] font-medium leading-tight text-slate-700 sm:text-xs">
                        {participant.name}
                      </span>
                    </div>
                  </td>
                  {days.map((date) => {
                    const log = getLog(participant.name, date);
                    const pts = log ? (log.dailyPoints ?? calculateDailyPoints(log)) : null;
                    return (
                      <td key={date} className="py-2 text-center sm:py-3">
                        <div className="flex flex-col items-center gap-1">
                          <ActivityRings log={log} size={40} />
                          <span className={`text-[10px] tabular-nums font-semibold sm:text-xs ${pts !== null ? 'text-slate-700' : 'text-slate-300'}`}>
                            {pts !== null ? `${pts} pt` : '—'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
