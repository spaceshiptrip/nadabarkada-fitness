import { useRef, useState } from 'react';
import { KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getParticipantProfileImage } from '@/lib/participants';

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
      if (!context) { reject(new Error('Unable to process the selected image.')); return; }
      const scale = Math.max(size / image.width, size / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      context.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => reject(new Error('Unable to process the selected image.'));
    image.src = dataUrl;
  });
}

const BLANK_ADD_FORM = { name: '', deviceType: 'Garmin', profileImage: '', isAdmin: false };

export default function AdminPanel({ participants, onResetPin, onAddParticipant }) {
  // Roster / detail state
  const [selected, setSelected] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // Add participant state
  const [addForm, setAddForm] = useState(BLANK_ADD_FORM);
  const [addImageError, setAddImageError] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const addFileRef = useRef(null);

  const handleSelect = (p) => {
    setSelected(p);
    setResetMessage('');
  };

  const handleReset = async () => {
    if (!selected) return;
    setResetting(true);
    setResetMessage('');
    try {
      const result = await onResetPin(selected.id);
      setResetMessage(result.ok
        ? `PIN reset to 0000 for ${selected.name}.`
        : `Failed: ${result.error || 'unknown error'}`);
    } catch {
      setResetMessage('Error resetting PIN. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleAddImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAddImageError('Please upload an image file.'); return; }
    try {
      setAddImageError('');
      const profileImage = await resizeProfileImage(file);
      setAddForm((prev) => ({ ...prev, profileImage }));
    } catch (err) {
      setAddImageError(err.message || 'Unable to process that image.');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) { setAddError('Name is required.'); return; }
    setAddError('');
    setAdding(true);
    try {
      const result = await onAddParticipant({
        name: addForm.name.trim(),
        deviceType: addForm.deviceType,
        profileImage: addForm.profileImage,
        role: addForm.isAdmin ? 'admin' : 'participant',
        pin: '0000',
      });
      if (!result.ok) { setAddError(result.error || 'Failed to add participant.'); return; }
      setAddSuccess(`${addForm.name.trim()} added! Default PIN is 0000.`);
      setAddForm(BLANK_ADD_FORM);
      if (addFileRef.current) addFileRef.current.value = '';
      setTimeout(() => setAddSuccess(''), 5000);
    } catch {
      setAddError('An error occurred. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Admin Panel
        </CardTitle>
        <CardDescription>Manage participants and reset PINs.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">

        {/* Roster + detail */}
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-800">Roster</div>
            <div className="space-y-2">
              {participants.length === 0 && (
                <div className="text-sm text-muted-foreground">No participants yet.</div>
              )}
              {participants.map((p) => (
                <button
                  key={p.id || p.name}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-white ${
                    selected?.id === p.id ? 'border-primary/30 bg-white shadow-sm' : 'bg-white/60'
                  }`}
                >
                  <img
                    src={getParticipantProfileImage(p.profileImage)}
                    alt={p.name}
                    className="h-10 w-10 flex-shrink-0 rounded-full border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.deviceType}{p.teamName ? ` • ${p.teamName}` : ''}
                    </div>
                  </div>
                  {p.role === 'admin' && (
                    <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Admin
                    </span>
                  )}
                  {selected?.id === p.id && <span className="flex-shrink-0 text-xs text-primary">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            {selected ? (
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={getParticipantProfileImage(selected.profileImage)}
                    alt={selected.name}
                    className="h-16 w-16 flex-shrink-0 rounded-full border object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-800">{selected.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{selected.id}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border bg-slate-50 p-3 text-sm">
                  <div><span className="font-medium">Role:</span> {selected.role || 'participant'}</div>
                  <div><span className="font-medium">Active:</span> {selected.active ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Device:</span> {selected.deviceType || '—'}</div>
                  <div><span className="font-medium">Team:</span> {selected.teamName || '—'}</div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-semibold text-slate-700">Reset PIN</div>
                  <div className="text-xs text-muted-foreground">
                    Resets <strong>{selected.name}</strong>'s PIN to <strong>0000</strong>. They'll be prompted to change it on next login.
                  </div>
                  {resetMessage && (
                    <div className={`rounded-xl p-2 text-xs ${
                      resetMessage.startsWith('Failed') || resetMessage.startsWith('Error')
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {resetMessage}
                    </div>
                  )}
                  <Button variant="outline" size="sm" disabled={resetting} onClick={handleReset}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {resetting ? 'Resetting...' : 'Reset PIN to 0000'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                Select a participant to manage them.
              </div>
            )}
          </div>
        </div>

        {/* Add participant */}
        <form onSubmit={handleAddSubmit} className="grid gap-4 rounded-2xl border bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <UserPlus className="h-4 w-4" />
            Add Participant
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-device">Device type</Label>
              <select
                id="add-device"
                className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
                value={addForm.deviceType}
                onChange={(e) => setAddForm((prev) => ({ ...prev, deviceType: e.target.value }))}
              >
                <option>Garmin</option>
                <option>Apple Watch</option>
                <option>Android / Wear OS</option>
                <option>Manual entry</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-photo">Profile picture (optional)</Label>
            <div className="flex items-center gap-3 rounded-2xl border bg-white p-3">
              <img
                src={getParticipantProfileImage(addForm.profileImage)}
                alt=""
                className="h-12 w-12 flex-shrink-0 rounded-full border object-cover"
              />
              <div className="min-w-0 flex-1">
                <Input
                  id="add-photo"
                  ref={addFileRef}
                  type="file"
                  accept="image/*"
                  className="px-2 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                  onChange={handleAddImageChange}
                />
                {addImageError && <div className="mt-1 text-xs text-red-600">{addImageError}</div>}
              </div>
              {addForm.profileImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setAddForm((prev) => ({ ...prev, profileImage: '' })); if (addFileRef.current) addFileRef.current.value = ''; }}
                  className="flex-shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="add-is-admin"
              type="checkbox"
              className="h-4 w-4 rounded border"
              checked={addForm.isAdmin}
              onChange={(e) => setAddForm((prev) => ({ ...prev, isAdmin: e.target.checked }))}
            />
            <Label htmlFor="add-is-admin" className="cursor-pointer font-normal">
              Admin role
            </Label>
          </div>

          <div className="text-xs text-muted-foreground">
            Default PIN is <strong>0000</strong>. The participant will be reminded to change it on first login.
          </div>

          {addError && <div className="text-xs text-red-600">{addError}</div>}
          {addSuccess && <div className="rounded-xl bg-green-50 p-2 text-xs text-green-700">{addSuccess}</div>}

          <Button type="submit" disabled={adding}>
            <UserPlus className="mr-2 h-4 w-4" />
            {adding ? 'Adding...' : 'Add participant'}
          </Button>
        </form>

      </CardContent>
    </Card>
  );
}
