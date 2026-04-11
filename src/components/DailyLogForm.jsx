import { useMemo, useState } from 'react';
import { ClipboardCheck, MessageSquare } from 'lucide-react';
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
import { getParticipantProfileImage } from '@/lib/participants';

const SMS_HREF =
  'sms:+18186539874?body=Hi Jay, can you add me to the NadaBarkada Fitness Challenge? My name is [Your Name].';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const initialState = {
  date: todayIso(),
  activeMinutes: '',
  workoutDone: true,
  steps: '',
  mobilityDone: false,
  notes: '',
};

export default function DailyLogForm({ participant, onSubmit, loading, confirmedParticipantId }) {
  const [form, setForm] = useState(initialState);

  const showConfirmedTitle =
    Boolean(participant && confirmedParticipantId && participant.id === confirmedParticipantId);

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
    if (!participant) return;
    await onSubmit({
      date: form.date,
      participantId: participant.id,
      name: participant.name,
      activeMinutes: Number(form.activeMinutes || 0),
      workoutDone: form.workoutDone,
      steps: Number(form.steps || 0),
      mobilityDone: form.mobilityDone,
      notes: form.notes.trim(),
    });
    setForm((prev) => ({ ...initialState, date: prev.date }));
  };

  const breakdownRows = [
    { label: 'Activity', value: breakdown.activity, max: 5 },
    { label: 'Workout bonus', value: breakdown.workout, max: 2 },
    { label: 'Steps', value: breakdown.steps, max: 3 },
    { label: 'Self-Care bonus', value: breakdown.mobility, max: 1 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <img
            src={getParticipantProfileImage(participant?.profileImage)}
            alt={participant?.name || 'Participant'}
            className="h-12 w-12 flex-shrink-0 rounded-full border object-cover"
          />
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              {participant
                ? `Daily log entry for ${participant.name}${showConfirmedTitle ? ' · confirmed' : ''}`
                : 'Daily log entry'}
            </CardTitle>
          </div>
        </div>
        <CardDescription>
          {participant
            ? 'Enter daily stats and preview your score before submitting.'
            : 'Select your name in the header to start logging.'}
        </CardDescription>
      </CardHeader>

      {!participant ? (
        <CardContent>
          <div className="grid gap-4 rounded-2xl border bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              Select your name from the header at the top to start logging your activity.
            </p>
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Not registered yet?
              </p>
              <p className="mt-1 text-sm text-slate-600">Text Jay to get added to the challenge.</p>
              <div className="mt-3 flex flex-col items-center gap-2">
                <a
                  href={SMS_HREF}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  <MessageSquare className="h-4 w-4" />
                  Text Jay to join
                </a>
                <p className="text-xs text-muted-foreground">(818) 653-9874</p>
              </div>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <form onSubmit={submit} className="grid min-w-0 gap-4 rounded-2xl border bg-slate-50 p-4">
            <div className="grid gap-2">
              <Label htmlFor="log-date">Date</Label>
              <Input
                id="log-date"
                type="date"
                className="min-w-0"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2">
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
              <div className="grid min-w-0 gap-2">
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
                Self-Care (5+ min)
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

            <Button type="submit" disabled={loading}>
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
                  <span
                    className={
                      'tabular-nums font-semibold ' +
                      (value > 0 ? 'text-primary' : 'text-muted-foreground')
                    }
                  >
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
      )}
    </Card>
  );
}
