import { Trophy, CalendarDays, Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="mb-8 rounded-3xl border bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-soft md:p-8">
      <div className="grid gap-6 md:grid-cols-[1.4fr,1fr] md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            <Trophy className="h-4 w-4" />
            Fitness Challenge Tracker
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            April 27 baseline. May 4 start. June 4 finish.
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-100 md:text-base">
            Built for mixed fitness levels with a fair points system based on activity, consistency,
            and improvement versus each participant’s own baseline.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-blue-100">
              <CalendarDays className="h-4 w-4" />
              Schedule
            </div>
            <div className="text-sm font-semibold">Apr 27 – Jun 4, 2026</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-blue-100">
              <Activity className="h-4 w-4" />
              Daily cap
            </div>
            <div className="text-sm font-semibold">10 points max</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-blue-100">
              <Trophy className="h-4 w-4" />
              Goal
            </div>
            <div className="text-sm font-semibold">Consistency + improvement</div>
          </div>
        </div>
      </div>
    </header>
  );
}
