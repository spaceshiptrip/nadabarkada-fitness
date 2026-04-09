import { Trophy, CalendarDays, Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="mb-8 rounded-3xl border bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-soft md:p-8">
      <div className="grid gap-6 md:grid-cols-[1.4fr,1fr] md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            <Trophy className="h-4 w-4" />
            NadaBarkada Fitness Challenge 
          </div>
        </div>

        <div className="md:col-span-2">
          <h1 className="text-center text-3xl font-bold tracking-tight md:text-5xl">
            <span className="block">April 27 baseline.</span>
            <span className="block">May 4 start.</span>
            <span className="block">June 4 finish.</span>
          </h1>
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-3 sm:grid-cols-3 md:col-span-2 md:max-w-3xl lg:max-w-5xl">
          <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-center gap-2 text-blue-100">
              <CalendarDays className="h-4 w-4" />
              Schedule
            </div>
            <div className="text-sm font-semibold">Apr 27 – Jun 4, 2026</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-center gap-2 text-blue-100">
              <Activity className="h-4 w-4" />
              Daily cap
            </div>
            <div className="text-sm font-semibold">10 points max</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-center gap-2 text-blue-100">
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
