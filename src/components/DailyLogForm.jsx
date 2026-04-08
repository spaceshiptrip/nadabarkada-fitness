import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { calculateDailyPoints, getChallengeWeek } from '@/lib/points';
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

  const previewPoints = useMemo(
    () =>
      calculateDailyPoints({
        activeMinutes: Number(form.activeMinutes || 0),
        workoutDone: form.workoutDone,
        steps: Number(form.steps || 0),
        mobilityDone: form.mobilityDone,
      }),
    [form]
  );

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Daily log entry
        </CardTitle>
        <CardDescription>
          Enter daily stats and preview the daily score before submitting.
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
                className="h-10 rounded-xl border bg-white px-3 text-sm"
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
              Workout completed
            </label>

            <label className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.mobilityDone}
                onChange={(e) => setForm((prev) => ({ ...prev, mobilityDone: e.target.checked }))}
              />
              Mobility / stretching completed
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
            <div className="text-sm font-semibold">Score preview</div>
            <div className="mt-2 text-4xl font-bold text-primary">{previewPoints}</div>
            <div className="text-sm text-muted-foreground">out of 10 daily points</div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold">Challenge week</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {challengeWeek === 0
                ? 'Week 0 baseline'
                : challengeWeek > 0
                ? `Week ${challengeWeek}`
                : 'Before challenge start'}
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-muted-foreground">
            Daily points are:
            <ul className="mt-2 space-y-1">
              <li>• activity minutes</li>
              <li>• +2 workout completed</li>
              <li>• step bonus</li>
              <li>• +1 mobility bonus</li>
              <li>• capped at 10</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
