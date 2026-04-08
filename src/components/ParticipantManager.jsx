import { useState } from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const initialForm = {
  name: '',
  deviceType: 'Garmin',
  teamName: '',
  baselineActiveMinutes: '',
  baselineSteps: '',
};

export default function ParticipantManager({ participants, onAddParticipant, loading }) {
  const [form, setForm] = useState(initialForm);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    await onAddParticipant({
      name: form.name.trim(),
      deviceType: form.deviceType.trim(),
      teamName: form.teamName.trim(),
      baselineActiveMinutes: Number(form.baselineActiveMinutes || 0),
      baselineSteps: Number(form.baselineSteps || 0),
      active: true,
    });

    setForm(initialForm);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants
        </CardTitle>
        <CardDescription>Add participants and baseline averages from Week 0.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-slate-50 p-4">
          <div className="grid gap-2">
            <Label htmlFor="participant-name">Name</Label>
            <Input
              id="participant-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter participant name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="participant-device">Device type</Label>
            <select
              id="participant-device"
              className="h-10 rounded-xl border bg-white px-3 text-sm"
              value={form.deviceType}
              onChange={(e) => setForm((prev) => ({ ...prev, deviceType: e.target.value }))}
            >
              <option>Garmin</option>
              <option>Apple Watch</option>
              <option>Android / Wear OS</option>
              <option>Manual entry</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="participant-team">Team name</Label>
            <Input
              id="participant-team"
              value={form.teamName}
              onChange={(e) => setForm((prev) => ({ ...prev, teamName: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="baseline-active">Baseline avg active minutes</Label>
              <Input
                id="baseline-active"
                type="number"
                min="0"
                value={form.baselineActiveMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, baselineActiveMinutes: e.target.value }))}
                placeholder="e.g. 25"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseline-steps">Baseline avg steps</Label>
              <Input
                id="baseline-steps"
                type="number"
                min="0"
                value={form.baselineSteps}
                onChange={(e) => setForm((prev) => ({ ...prev, baselineSteps: e.target.value }))}
                placeholder="e.g. 7200"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Add participant'}
          </Button>
        </form>

        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-3 text-sm font-semibold">Current roster</div>
          <div className="space-y-3">
            {participants.length === 0 && (
              <div className="text-sm text-muted-foreground">No participants yet.</div>
            )}
            {participants.map((participant) => (
              <div key={participant.name} className="rounded-xl border p-3">
                <div className="font-medium">{participant.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {participant.deviceType}
                  {participant.teamName ? ` • ${participant.teamName}` : ''}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Baseline: {participant.baselineActiveMinutes || 0} active min/day,{' '}
                  {participant.baselineSteps || 0} steps/day
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
