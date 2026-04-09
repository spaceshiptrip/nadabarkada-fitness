import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import {
  calculateActivityPoints,
  calculateWorkoutPoints,
  calculateStepsPoints,
  calculateMobilityPoints,
  getChallengeWeek,
} from '@/lib/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const initialState = {
  date: todayIso(),
  name: '',
  activeMinutes: '',
  workoutDone: true,
  steps: '',
  mobilityDone: false,
  notes: '',
};

export default function DailyLogForm({ participants, onSubmit, loading }) {
  const [form, setForm] = useState(initialState);

  const breakdown = useMemo(() => {
    const activity = calculateActivityPoints(Number(form.activeMinutes || 0));
    const workout = calculateWorkoutPoints(form.workoutDone);
    const steps = calculateStepsPoints(Number(form.steps || 0));
    const mobility = calculateMobilityPoints(form.mobilityDone);
    const total = Math.min(activity + workout + steps + mobility, 10);
    return { activity, workout, steps, mobility, total };
  }, [form]);

  const challengeWeek = getChallengeWeek(form.date);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name) return;

    await onSubmit({
      date: form.date,
      name: form.name,
      activeMinutes: Number(form.activeMinutes || 0),
      workoutDone: form.workoutDone,
      steps: Number(form.steps || 0),
      mobilityDone: form.mobilityDone,
      notes: form.notes.trim(),
    });

    setForm((prev) => ({
      ...initialState,
      date: prev.date,
      name: prev.name,
    }));
  };

  const breakdownRows = [
    { label: 'Activity', value: breakdown.activity, max: 5 },
    { label: 'Workout bonus', value: breakdown.workout, max: 2 },
    { label: 'Steps', value: breakdown.steps, max: 3 },
    { label: 'Mobility bonus', value: breakdown.mobility, max: 1 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Daily log entry
        </CardTitle>
        <CardDescription>
          Enter daily stats and preview the daily score before submitting. Week 0 entries build each participant&apos;s baseline, and they do not need to log every day.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="log-date">Date</Label>
              <Input
                id="log-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="log-name">Participant</Label>
              <select
                id="log-name"
                className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              >
                <option value="">Select participant</option>
                {participants.map((participant) => (
                  <option key={participant.name} value={participant.name}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="active-minutes">Active minutes</Label>
              <Input
                id="active-minutes"
                type="number"
                min="0"
                value={form.activeMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, activeMinutes: e.target.value }))}
                placeholder="e.g. 32"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="steps">Steps</Label>
              <Input
                id="steps"
                type="number"
                min="0"
                value={form.steps}
                onChange={(e) => setForm((prev) => ({ ...prev, steps: e.target.value }))}
                placeholder="e.g. 9800"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.workoutDone}
                onChange={(e) => setForm((prev) => ({ ...prev, workoutDone: e.target.checked }))}
              />
              Workout session (20+ min)
            </label>

            <label className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.mobilityDone}
                onChange={(e) => setForm((prev) => ({ ...prev, mobilityDone: e.target.checked }))}
              />
              Mobility / recovery (5+ min)
            </label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="min-h-24 rounded-xl border bg-white px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes"
            />
          </div>

          <Button type="submit" disabled={loading || participants.length === 0}>
            {loading ? 'Saving...' : 'Submit daily log'}
          </Button>
        </form>

        <div className="space-y-4 rounded-2xl border bg-white p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Score preview
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tabular-nums text-primary">
                {breakdown.total}
              </span>
              <span className="text-sm text-muted-foreground">/ 10 pts</span>
            </div>
            {breakdown.total === 10 && (
              <div className="mt-1 text-xs font-medium text-accent">Daily cap reached</div>
            )}
          </div>

          <div className="space-y-1.5 border-t pt-3">
            {breakdownRows.map(({ label, value, max }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className={value > 0 ? 'text-slate-700' : 'text-muted-foreground'}>
                  {label}
                </span>
                <span className={'tabular-nums font-semibold ' + (value > 0 ? 'text-primary' : 'text-muted-foreground')}>
                  {value > 0 ? '+' + value : '0 / ' + max}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-slate-50 px-3 py-2.5">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Challenge week
            </div>
            <div className="mt-0.5 text-sm font-medium text-slate-700">
              {challengeWeek === 0
                ? 'Week 0 — Baseline'
                : challengeWeek > 0
                ? 'Week ' + challengeWeek
                : 'Before challenge start'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
