import { useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getParticipantProfileImage } from '@/lib/participants';

const initialForm = {
  name: '',
  deviceType: 'Garmin',
  teamName: '',
  baselineActiveMinutes: '',
  baselineSteps: '',
  baselineOverride: false,
  profileImage: '',
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });
}

async function resizeProfileImage(file) {
  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const size = 160;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Unable to process the selected image.'));
        return;
      }

      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      context.drawImage(image, x, y, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => reject(new Error('Unable to process the selected image.'));
    image.src = dataUrl;
  });
}

function formatBaselineNumber(value) {
  return Math.round(Number(value || 0));
}

export default function ParticipantManager({ participants, onAddParticipant, loading }) {
  const [form, setForm] = useState(initialForm);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    await onAddParticipant({
      name: form.name.trim(),
      deviceType: form.deviceType.trim(),
      teamName: form.teamName.trim(),
      baselineActiveMinutes: Number(form.baselineActiveMinutes || 0),
      baselineSteps: Number(form.baselineSteps || 0),
      baselineOverride: form.baselineOverride,
      profileImage: form.profileImage,
      active: true,
    });

    setForm(initialForm);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please upload an image file.');
      return;
    }

    try {
      setImageError('');
      const profileImage = await resizeProfileImage(file);
      setForm((prev) => ({ ...prev, profileImage }));
    } catch (error) {
      setImageError(error.message || 'Unable to process that image.');
    }
  };

  const clearImage = () => {
    setForm((prev) => ({ ...prev, profileImage: '' }));
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants
        </CardTitle>
        <CardDescription>
          Baselines are computed from Week 0 logs. Use a manual override only if someone wants to set their own starting point.
        </CardDescription>
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

          <div className="rounded-2xl border bg-white p-3">
            <div className="text-sm font-medium text-slate-700">Baseline source</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Week 0 entries are averaged across the days a participant actually logs. Daily logging is encouraged, not required.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={form.baselineOverride ? 'secondary' : 'outline'}
                size="sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    baselineOverride: !prev.baselineOverride,
                    baselineActiveMinutes: prev.baselineOverride ? '' : prev.baselineActiveMinutes,
                    baselineSteps: prev.baselineOverride ? '' : prev.baselineSteps,
                  }))
                }
              >
                {form.baselineOverride ? 'Use computed baseline' : 'Override computed baseline'}
              </Button>
            </div>

            {form.baselineOverride && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="baseline-active">Manual baseline active minutes</Label>
                  <Input
                    id="baseline-active"
                    type="number"
                    min="0"
                    value={form.baselineActiveMinutes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, baselineActiveMinutes: e.target.value }))
                    }
                    placeholder="e.g. 25"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="baseline-steps">Manual baseline steps</Label>
                  <Input
                    id="baseline-steps"
                    type="number"
                    min="0"
                    value={form.baselineSteps}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, baselineSteps: e.target.value }))
                    }
                    placeholder="e.g. 7200"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="participant-photo">Profile picture</Label>
            <div className="flex items-center gap-3 rounded-2xl border bg-white p-3">
              <img
                src={getParticipantProfileImage(form.profileImage)}
                alt=""
                className="h-14 w-14 rounded-full border object-cover"
              />
              <div className="min-w-0 flex-1">
                <Input
                  id="participant-photo"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="px-2 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                  onChange={handleImageChange}
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  Upload a square-ish headshot. It will be resized for the calendar and sheet sync.
                </div>
                {imageError && <div className="mt-2 text-xs text-red-600">{imageError}</div>}
              </div>
              {form.profileImage && (
                <Button type="button" variant="outline" onClick={clearImage}>
                  Clear
                </Button>
              )}
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
              <div key={participant.id || participant.name} className="rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={getParticipantProfileImage(participant.profileImage)}
                    alt=""
                    className="h-12 w-12 rounded-full border object-cover"
                  />
                  <div className="min-w-0">
                    <div className="font-medium">{participant.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {participant.deviceType}
                      {participant.teamName ? ` • ${participant.teamName}` : ''}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Baseline: {formatBaselineNumber(participant.effectiveBaselineActiveMinutes)} active min/day,{' '}
                  {formatBaselineNumber(participant.effectiveBaselineSteps)} steps/day
                </div>
                <div className="mt-2 rounded-lg border bg-slate-50 px-2 py-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    User ID
                  </div>
                  <div className="mt-1 break-all font-mono text-xs text-slate-700">
                    {participant.id || 'Pending backend ID'}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {participant.baselineSource === 'manual'
                    ? 'Manual override enabled.'
                    : participant.baselineLoggedDays > 0
                    ? `Computed from ${participant.baselineLoggedDays} baseline ${participant.baselineLoggedDays === 1 ? 'entry' : 'entries'}.`
                    : 'No baseline entries yet. Week 0 logs will compute this automatically.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
