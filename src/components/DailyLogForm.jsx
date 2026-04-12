import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardCheck, Info, KeyRound, LogOut, MessageSquare, Trash2 } from 'lucide-react';
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
import { ADMIN_PHONE_E164, ADMIN_SMS_BODY } from '@/lib/config';

const SMS_HREF = `sms:${ADMIN_PHONE_E164}?body=${encodeURIComponent(ADMIN_SMS_BODY)}`;

function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white hover:bg-blue-600"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        aria-label="More info"
      >
        i
      </button>
      {visible && (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-60 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 shadow-lg">
          <div className="absolute -bottom-1.5 right-2 h-3 w-3 rotate-45 border-b border-r border-blue-200 bg-blue-50" />
          {text}
        </div>
      )}
    </div>
  );
}

function todayIso() {
  return toLocalIsoDate(new Date());
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const initialState = {
  date: todayIso(),
  activeMinutes: '',
  workoutDone: false,
  steps: '',
  mobilityDone: false,
  notes: '',
};

function friendlyDate(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DailyLogForm({ participant, participantLogs, onSubmit, onDelete, loading, confirmedParticipantId, isAuthenticated, isAdmin, onAuthenticate, onLogout, onDateChange }) {
  const [form, setForm] = useState(initialState);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  // Pre-fill form from existing log when date or participant changes
  useEffect(() => {
    if (!participant) return;
    const existing = (participantLogs || []).find(
      (log) => String(log.date || '').slice(0, 10) === form.date
    );
    if (existing) {
      setForm({
        date: form.date,
        activeMinutes: existing.activeMinutes != null ? String(existing.activeMinutes) : '',
        workoutDone: Boolean(existing.workoutDone),
        steps: existing.steps != null ? String(existing.steps) : '',
        mobilityDone: Boolean(existing.mobilityDone),
        notes: existing.notes || '',
      });
    } else {
      setForm((prev) => ({ ...initialState, date: prev.date }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, participant?.id, participantLogs]);

  const showConfirmedTitle =
    Boolean(participant && confirmedParticipantId && participant.id === confirmedParticipantId);

  const existingEntry = useMemo(() => {
    return (participantLogs || []).find(
      (log) => String(log.date || '').slice(0, 10) === form.date
    ) || null;
  }, [participantLogs, form.date]);

  const breakdown = useMemo(() => {
    const activity = calculateActivityPoints(Number(form.activeMinutes || 0));
    const workout = calculateWorkoutPoints(form.workoutDone);
    const steps = calculateStepsPoints(Number(form.steps || 0));
    const mobility = calculateMobilityPoints(form.mobilityDone);
    const total = Math.min(activity + workout + steps + mobility, 10);
    return { activity, workout, steps, mobility, total };
  }, [form]);

  const challengeWeek = getChallengeWeek(form.date);

  const submitPin = async (event) => {
    event.preventDefault();
    if (!participant || !pinInput.trim()) return;
    setPinError('');
    setPinLoading(true);
    try {
      const result = await onAuthenticate(participant.id, pinInput.trim(), stayLoggedIn);
      if (!result.ok) {
        setPinError('Incorrect PIN. Try again.');
        setPinInput('');
      }
    } catch {
      setPinError('Could not verify PIN. Check your connection.');
    } finally {
      setPinLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!participant) return;
    if (!isAdmin && form.date > todayIso()) return;
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
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              {participant
                ? `Daily log entry for ${participant.name}${showConfirmedTitle ? ' · confirmed' : ''}`
                : 'Daily log entry'}
            </CardTitle>
          </div>
          {isAuthenticated && onLogout && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Log out
            </Button>
          )}
        </div>
        <CardDescription>
          {!participant
            ? 'Select your name in the header to start logging.'
            : !isAuthenticated
            ? `Enter your PIN to unlock the log form for ${participant.name}.`
            : existingEntry
            ? `Editing your entry for ${form.date}. Changes will overwrite the saved entry.`
            : 'Enter daily stats and preview your score before submitting.'}
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
      ) : !isAuthenticated ? (
        <CardContent>
          <form onSubmit={submitPin} className="grid gap-4 rounded-2xl border bg-slate-50 p-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-white">
                <KeyRound className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-sm font-semibold text-slate-800">Enter your PIN</div>
              <div className="text-xs text-slate-500">
                Enter the PIN assigned to {participant.name} to access the log form.
              </div>
            </div>
            <div className="grid gap-2">
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                className="text-center text-lg tracking-widest"
                autoFocus
              />
              {pinError && (
                <p className="text-center text-xs font-medium text-red-600">{pinError}</p>
              )}
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border"
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
              />
              Stay logged in on this device
            </label>
            <Button type="submit" disabled={pinLoading || !pinInput.trim()}>
              {pinLoading ? 'Verifying…' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      ) : (
        <CardContent className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <form onSubmit={submit} className="grid min-w-0 gap-4 rounded-2xl border bg-slate-50 p-4">

            {/* Collapsible instructions */}
            <div className="rounded-2xl border bg-white">
              <button
                type="button"
                onClick={() => setShowInstructions((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700"
                aria-expanded={showInstructions}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  How to log your day
                </span>
                {showInstructions ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showInstructions && (
                <div className="grid gap-4 border-t px-4 pb-4 pt-3 text-sm text-slate-700">
                  <p className="text-xs text-slate-500">
                    Log your totals at any point during the day or all at once at the end — whatever works for you.
                  </p>

                  <div>
                    <div className="mb-1.5 font-semibold text-slate-800">Active Minutes</div>
                    <p className="mb-2 text-xs text-slate-500">
                      Count any movement that gets your body going — not just sitting or standing still. Tally it up throughout the day or enter the total at the end.
                    </p>
                    <ul className="space-y-0.5 text-xs text-slate-600">
                      {[
                        'Gym workouts, fitness classes, home workouts',
                        'Walks — lunch walk, walking the dog, walk to the store',
                        'Biking — commute, errands, trails',
                        'Sports, recreational activities, dancing, swimming',
                        'Pacing or moving during a phone/video call',
                        'Yard work, housework, active chores',
                      ].map((ex) => (
                        <li key={ex} className="flex items-start gap-1.5">
                          <span className="mt-0.5 text-blue-400">•</span> {ex}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <strong>Standing desk?</strong> Passive standing doesn't count — your body isn't actively moving. But if you're pacing, doing calf raises, or walking during a meeting, that counts!
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 font-semibold text-slate-800">Steps</div>
                    <p className="text-xs text-slate-500">
                      Log your total steps for the day. Check your phone's Health app, Garmin, Apple Watch, or fitness tracker at the end of the day.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="log-date">Date</Label>
              <Input
                id="log-date"
                type="date"
                className="min-w-0"
                value={form.date}
                max={isAdmin ? undefined : todayIso()}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, date: e.target.value }));
                  onDateChange?.(e.target.value);
                }}
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
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.workoutDone}
                    onChange={(e) => setForm((prev) => ({ ...prev, workoutDone: e.target.checked }))}
                  />
                  Workout session (20+ min)
                </label>
                <InfoTooltip text="A purposeful workout session of 20+ minutes — gym, run, swim, fitness class, home workout, etc." />
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.mobilityDone}
                    onChange={(e) => setForm((prev) => ({ ...prev, mobilityDone: e.target.checked }))}
                  />
                  Self-Care (5+ min)
                </label>
                <InfoTooltip text="5+ minutes of intentional recovery — yoga, stretching, foam rolling, meditation, breathing exercises, ice bath, or massage." />
              </div>
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

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : existingEntry ? 'Update entry' : 'Submit daily log'}
              </Button>
              {existingEntry && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowDeleteModal(true)}
                  aria-label="Delete this entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {/* Delete confirmation modal */}
          {showDeleteModal && existingEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
              <div className="relative w-full max-w-sm rounded-3xl border bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Delete this entry?</div>
                    <div className="text-sm text-slate-500">{friendlyDate(existingEntry.date)}</div>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border bg-slate-50 p-3 text-sm space-y-1 text-slate-700">
                  <div className="flex justify-between"><span>Active minutes</span><span className="font-semibold">{existingEntry.activeMinutes ?? 0} min</span></div>
                  <div className="flex justify-between"><span>Steps</span><span className="font-semibold">{(existingEntry.steps ?? 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Workout session</span><span className="font-semibold">{existingEntry.workoutDone ? '✓ Yes' : 'No'}</span></div>
                  <div className="flex justify-between"><span>Self-Care</span><span className="font-semibold">{existingEntry.mobilityDone ? '✓ Yes' : 'No'}</span></div>
                  <div className="flex justify-between border-t pt-1 mt-1"><span className="font-semibold">Daily points</span><span className="font-bold text-primary">{existingEntry.dailyPoints ?? '—'} pts</span></div>
                  {existingEntry.notes && <div className="pt-1 text-xs text-slate-500 italic">"{existingEntry.notes}"</div>}
                </div>

                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  ⚠️ This is <strong>permanent</strong>. Once deleted, this entry and its points are gone for good — there's no undo.
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Keep it
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      const result = await onDelete?.(participant.id, existingEntry.date);
                      setDeleting(false);
                      if (result?.ok) setShowDeleteModal(false);
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete it'}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
