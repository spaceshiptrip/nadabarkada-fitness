import { useRef, useState } from 'react';
import { UserCircle, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getParticipantProfileImage } from '@/lib/participants';
// participants prop removed — roster panel was moved to AdminPanel
import { changeParticipantPin } from '@/lib/api';

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

export default function ProfilePanel({ participant, onUpdateProfile, onPinChanged, loading }) {
  const [form, setForm] = useState({
    name: participant?.name || '',
    deviceType: participant?.deviceType || 'Garmin',
    profileImage: '',
  });
  const [imageError, setImageError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const [pinForm, setPinForm] = useState({ newPin: '', confirmPin: '' });
  const [pinError, setPinError] = useState('');
  const [pinSaved, setPinSaved] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const previewImage = form.profileImage || getParticipantProfileImage(participant?.profileImage);

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

  const submit = async (event) => {
    event.preventDefault();
    if (!participant) return;
    await onUpdateProfile({
      id: participant.id,
      name: form.name.trim() || participant.name,
      deviceType: form.deviceType,
      profileImage: form.profileImage || participant.profileImage || '',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setForm((prev) => ({ ...prev, profileImage: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitPin = async (event) => {
    event.preventDefault();
    if (!participant) return;
    const { newPin, confirmPin } = pinForm;
    if (!newPin.trim()) { setPinError('Please enter a new PIN.'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match. Please try again.'); return; }
    setPinError('');
    setPinLoading(true);
    try {
      const result = await changeParticipantPin(participant.id, newPin.trim());
      if (!result.ok) { setPinError(result.error || 'Failed to update PIN.'); return; }
      setPinSaved(true);
      setPinForm({ newPin: '', confirmPin: '' });
      if (onPinChanged) onPinChanged(participant.id);
      setTimeout(() => setPinSaved(false), 3000);
    } catch (err) {
      setPinError('An error occurred. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          My Profile
        </CardTitle>
        <CardDescription>
          {participant
            ? 'Update your display name, device type, and profile picture.'
            : 'Select a participant from the header to edit your profile.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {participant ? (
          <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <form onSubmit={submit} className="grid min-w-0 gap-4 rounded-2xl border bg-slate-50 p-4">
            <div className="flex items-center gap-4 rounded-2xl border bg-white p-3">
              <img
                src={previewImage}
                alt={participant.name}
                className="h-14 w-14 flex-shrink-0 rounded-full border object-cover"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-800">{participant.name}</div>
                <div className="truncate text-xs text-muted-foreground">{participant.id}</div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-name">Display name</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-device">Device type</Label>
              <select
                id="profile-device"
                className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
                value={form.deviceType}
                onChange={(e) => setForm((prev) => ({ ...prev, deviceType: e.target.value }))}
              >
                <option>Garmin</option>
                <option>Apple Watch</option>
                <option>Android / Wear OS</option>
                <option>Manual entry</option>
              </select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="profile-photo">Profile picture</Label>
              <div className="flex items-start gap-3 rounded-2xl border bg-white p-3">
                <img
                  src={previewImage}
                  alt=""
                  className="h-14 w-14 flex-shrink-0 rounded-full border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Input
                    id="profile-photo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="px-2 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                    onChange={handleImageChange}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Upload a square-ish headshot. It will be cropped and resized automatically.
                  </div>
                  {imageError && <div className="mt-2 text-xs text-red-600">{imageError}</div>}
                </div>
                {form.profileImage && (
                  <Button type="button" variant="outline" size="sm" onClick={clearImage} className="flex-shrink-0">
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : saved ? 'Saved!' : 'Save profile'}
            </Button>
          </form>

          <form onSubmit={submitPin} className="grid min-w-0 gap-4 rounded-2xl border bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <KeyRound className="h-4 w-4" />
              Change PIN
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-pin">New PIN</Label>
              <Input
                id="new-pin"
                type="password"
                inputMode="numeric"
                value={pinForm.newPin}
                onChange={(e) => setPinForm((prev) => ({ ...prev, newPin: e.target.value }))}
                placeholder="Enter new PIN"
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-pin">Confirm new PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                value={pinForm.confirmPin}
                onChange={(e) => setPinForm((prev) => ({ ...prev, confirmPin: e.target.value }))}
                placeholder="Re-enter new PIN"
                autoComplete="new-password"
              />
            </div>

            {pinError && <div className="text-xs text-red-600">{pinError}</div>}

            <Button type="submit" disabled={pinLoading}>
              {pinLoading ? 'Saving...' : pinSaved ? 'PIN updated!' : 'Update PIN'}
            </Button>
          </form>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border bg-slate-50 p-8 text-sm text-muted-foreground">
            Select a participant from the header to edit your profile.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
