# Completed Work Log

## Phase 1 Work

All items below were implemented as part of the Phase 1 simple participant flow described in `README.md`.

---

### 1. Layout Restructure — Daily Log Entry Column

**Files changed:** `src/App.jsx`

Moved the Daily Log Entry card out of the bottom tab strip and into the main two-column dashboard layout. The left column now stacks: Daily Log Entry → Challenge Overview → Week Rings Calendar. The right column holds the Rules Card. This makes logging the primary visible action rather than a buried tab.

Previously the layout was:
- Two-column grid: `[ChallengeOverview | RulesCard]`
- Full-width: `WeekRingsCalendar`
- Tabs: Daily Log, Participants, Leaderboard, Weekly Summaries

After restructure:
- Two-column grid:
  - Left: `[DailyLogForm, ChallengeOverview, WeekRingsCalendar]`
  - Right: `[RulesCard]`
- Tabs below (Participants, Leaderboard, Weekly Summaries only)

---

### 2. Mobile Overflow Fixes

**Files changed:** `src/components/DailyLogForm.jsx`, `src/App.jsx`, `src/index.css`

Fixed horizontal overflow on mobile that caused the Daily Log Entry card to bleed off the right edge of the screen and the title panel to appear narrower than the viewport when zoomed out.

**Root causes identified and fixed:**

- **Missing `w-full` on `<select>`** — The participant selector `<select>` in `DailyLogForm` did not have `w-full`, so it sized to the natural width of the longest option text and could exceed its container. Added `w-full` to match the `Input` component behavior.
- **Missing `min-w-0` on flex/grid column child** — The left column `<div className="flex flex-col gap-6">` in the two-column grid was a grid child without `min-w-0`. CSS grid items default to `min-width: auto`, meaning they will not shrink below their content's intrinsic width. Added `min-w-0` to allow proper shrinking.
- **No `overflow-x` containment at page root** — Nothing on `html`, `body`, or `#root` prevented any overflowing child from expanding the page body beyond the viewport width. Added `overflow-x: hidden` to all three in `src/index.css`.

---

### 3. Participant Selection Moved to Fixed Nav Bar

**Files changed:** `src/App.jsx`

The participant selector was removed from inside `DailyLogForm` and relocated to the right side of the fixed top navigation bar, which is persistent and visible at all times regardless of scroll position.

**Implementation details:**

- Added `showParticipantMenu` state to `App`.
- The right side of the nav bar is now a button showing the selected participant's avatar and name, or a "Select Participant ▾" label when nothing is selected.
- Clicking the button toggles a custom dropdown panel that lists:
  - A "Select Participant" deselect option (with checkmark when active)
  - Every participant in `derivedParticipants` with their avatar, name, and a checkmark on the currently selected entry
  - A "Not listed? Text Jay to register" SMS deep link at the bottom of the list (see §6)
- A transparent full-screen overlay (`fixed inset-0 z-40`) sits behind the dropdown and closes it when the user taps or clicks outside.
- Selecting a participant calls the existing `handleParticipantSelection(id)` handler which updates `selectedParticipantId` and clears `confirmedParticipantId` if the selection changed.

---

### 4. DailyLogForm Simplified — Participant Prop

**Files changed:** `src/components/DailyLogForm.jsx`

Removed participant selection entirely from inside the form. The component no longer manages or renders a participant dropdown.

**Props before:**
```js
{ participants, onSubmit, loading, selectedParticipantId, onSelectedParticipantChange, confirmedParticipantId }
```

**Props after:**
```js
{ participant, onSubmit, loading, confirmedParticipantId }
```

**Other changes inside the component:**

- Removed the `participantValue` and `selectedParticipant` local derivations; the `participant` object is used directly.
- The date+participant two-column row was collapsed to a single full-width date field.
- The form `submit` handler now reads `participant.id` and `participant.name` directly rather than deriving them from the `form.name` state field.
- The `name` field was removed from `initialState` and form state since participant identity is now owned by the global `selectedParticipantId` in `App`.
- `showConfirmedTitle` is now computed as `participant && confirmedParticipantId && participant.id === confirmedParticipantId`.
- On submit reset, only `date` is preserved (name no longer needs to persist since participant is globally set).
- `App.jsx` call site updated to pass `participant={selectedParticipant}` instead of the list and handlers.

---

### 5. No-Participant Disabled States

**Files changed:** `src/components/DailyLogForm.jsx`, `src/components/MyRingsPanel.jsx`

When no participant is selected, the Daily Log Entry and My Rings cards show a disabled placeholder instead of their interactive content, per the Phase 1 plan.

**DailyLogForm:**

- When `!participant`, the `CardContent` renders a centered placeholder with:
  - A message directing the user to select their name from the header.
  - A registration block (see §6 below).
- The actual form (date, activity fields, score preview) is not rendered at all — it is not just visually disabled but absent from the DOM.
- The `CardHeader` still renders (title, description, avatar) so the card remains identifiable.

**MyRingsPanel:**

- When `!selectedParticipant`, a placeholder `CardContent` is shown with a message directing the user to select their name from the header.
- The main content `CardContent` (rings visualization, week/day/month views, stat cards) receives a `hidden` class and is not visible or interactive.
- Updated the stale description text that previously referenced "Daily Log Entry" as the selection point; it now reads "Select your name from the header."

---

### 6. SMS Registration Callout

**Files changed:** `src/components/DailyLogForm.jsx`, `src/App.jsx`

Participants who are not yet registered see a "Text Jay to join" prompt instead of a blank or broken state.

**SMS link target:**
```
sms:+18186539874?body=Hi Jay, can you add me to the NadaBarkada Fitness Challenge? My name is [Your Name].
```

**Where it appears:**

1. **Inside DailyLogForm** (no-participant state) — A registration block within the disabled placeholder shows a primary-styled anchor button "Text Jay to join" with a `MessageSquare` icon, and `(818) 653-9874` as a plain-text fallback for desktop users where `sms:` links may not launch.

2. **Inside the participant dropdown** (nav bar) — A small "Not listed? Text Jay to register" link sits at the bottom of the participant list, separated by a divider. This is visible any time the dropdown is open, not just when no participant is selected.

---

### 7. Profile Setup Callout (Amber Banner)

**Files changed:** `src/App.jsx`

When a participant IS selected but has not yet uploaded a custom profile picture (i.e., their `profileImage` is still the default SVG avatar), an amber callout banner appears above the main dashboard grid.

**Content:**
- Default avatar thumbnail
- Greeting using the participant's first name: "Hey [First], personalize your profile!"
- Subtext: "Add a photo and confirm your display name before the challenge starts."
- "Set up my profile" button that sets `showProfile = true` and smooth-scrolls to the `#profile-panel` section

The banner disappears automatically once the participant saves a custom profile picture — no dismiss button is needed.

---

### 8. Admin Panel Replaced with Profile Panel

**Files changed:** `src/App.jsx`, `src/components/ProfilePanel.jsx` (new), `src/lib/api.js`

The admin panel section at the bottom of the page was replaced with a participant-facing "My Profile" panel. Participant creation is now admin-only (managed directly in the Google Sheet), consistent with the Phase 1 plan.

#### New component: `src/components/ProfilePanel.jsx`

A Card component with two columns:

- **Left — Edit form:**
  - Shows the selected participant's current avatar and stable ID (read-only)
  - Display name field (editable)
  - Device type select (Garmin, Apple Watch, Android/Wear OS, Manual entry)
  - Profile picture upload with live preview — images are resized and center-cropped to 160×160px JPEG at 82% quality using a `<canvas>` element
  - "Save profile" button with a 3-second "Saved!" confirmation flash
  - If no participant is selected, a placeholder message is shown instead of the form

- **Right — Challenge roster (read-only):**
  - Lists all participants with avatar, name, device type, and optional team name
  - The currently selected participant is highlighted with a primary-tinted border and a "You" pill

The component accepts `key={selectedParticipant?.id}` from its call site in `App`, which causes React to remount it (and reset form state) whenever the selected participant changes.

#### New API function: `updateParticipant` in `src/lib/api.js`

```js
export async function updateParticipant(payload)
```

- **Mock mode (no `VITE_APP_SCRIPT_URL`):** Finds the participant by `id` in localStorage, merges the payload, normalizes the result, and writes back to `MOCK_PARTICIPANTS_KEY`.
- **Live mode:** POSTs `{ action: 'updateParticipant', ...payload }` to the Apps Script endpoint.
- Returns `{ ok, data, source }` consistent with other API functions.

#### App.jsx wiring:

- `showAdmin` / `setShowAdmin` state replaced with `showProfile` / `setShowProfile`.
- `handleAddParticipant` replaced with `handleUpdateParticipant` which calls `updateParticipant` and then `loadAll()`.
- `ParticipantManager` import removed; `ProfilePanel` import added.
- `addParticipant` import removed from `src/lib/api`; `updateParticipant` added.
- Nav menu item "Admin" renamed to "My Profile"; scroll target changed from `#admin-panels` to `#profile-panel`.
- `ProfilePanel` receives `key={selectedParticipant?.id}` so form state resets on participant switch.

---

### 9. Additional Imports and Constants

**Files changed:** `src/App.jsx`

- Added `DEFAULT_PROFILE_IMAGE` to the import from `@/lib/participants` — used by the amber profile setup callout to detect whether the selected participant still has the default avatar.
- `getParticipantProfileImage` was already imported and continues to be used in the nav bar avatar.

---

## Phase 2 Work

---

### 10. Backend Date Off-by-One Bug Fix

**Files changed:** `apps-script/Code.gs`

**Root cause:** Google Sheets' `getValues()` returns date cells as JavaScript `Date` objects, not strings. When `getDailyLogs_()` returned `row.Date` directly, `JSON.stringify` serialized it as a UTC ISO string (e.g. `"2026-04-11T07:00:00.000Z"`). The frontend's `normalizeDateValue` then parsed this as April 11 instead of April 10 — every log came back dated one day in the future.

This caused the MyRingsPanel Day view to show 0 points: the "today" filter compared against the local date (`2026-04-10`) but the log came back dated `2026-04-11`, so it was excluded.

**Fix — added `formatDate_()` helper:**

```js
function formatDate_(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).slice(0, 10);
}
```

`Utilities.formatDate` with `Session.getScriptTimeZone()` formats the date in the script's local timezone (America/Los_Angeles) rather than UTC, producing the correct `YYYY-MM-DD` string.

**Two call sites updated:**

1. `getDailyLogs_()` — changed `date: row.Date` to `date: formatDate_(row.Date)` so all logs return properly formatted date strings.

2. `upsertDailyLogRow_()` — the existing-row lookup compared `String(values[i][dateIndex])` (which would produce a JS Date `.toString()` like `"Fri Apr 10 2026 00:00:00 GMT+0000"`) against the payload's `'2026-04-10'` string, so upsert (overwrite existing entry for same participant+date) was silently broken and always appended a new row instead. Changed to `formatDate_(values[i][dateIndex])` to normalize both sides of the comparison.

---

### 11. `updateParticipant` Backend Action

**Files changed:** `apps-script/Code.gs`

Added the missing `updateParticipant` POST action to `doPost`. Previously the frontend `ProfilePanel` called `POST { action: 'updateParticipant', ...payload }` but the backend had no handler for it, so profile saves silently failed in live mode.

**`doPost` handler added:**

```js
if (action === 'updateParticipant') {
  const saved = updateParticipant_(payload);
  return json_({ ok: true, data: saved, source: 'live' });
}
```

**`updateParticipant_()` function added:**

- Looks up the participant row by `UserId` column
- Patches any provided fields: `name`, `deviceType`, `teamName`, `profileImage`, `baselineOverride`, `baselineActiveMinutes`, `baselineSteps`
- Writes the updated row back with `sheet.getRange(...).setValues([row])`
- Throws if `id` is missing or participant is not found
- Returns the updated participant object

---

### 12. Centralized App Configuration in `config.js`

**Files changed:** `src/lib/config.js`, `src/lib/api.js`, `src/components/DailyLogForm.jsx`, `src/App.jsx`

Previously the app had three sources of truth for configuration:
- Challenge dates in `src/lib/config.js`
- `VITE_APP_SCRIPT_URL` env var only in `.env.local` and `.env.production`
- Admin phone number `+18186539874` and SMS body hardcoded as string literals in 3 separate files

**`src/lib/config.js` — expanded to include all app-level config:**

```js
// Google Apps Script "web app" URL — update this after each redeployment
export const APP_SCRIPT_URL = 'https://script.google.com/macros/s/...';

export const CHALLENGE_CONFIG = {
  baselineStartDate: '2026-04-27',
  challengeStartDate: '2026-05-04',
  challengeEndDate: '2026-05-31',
};

export const ADMIN_PHONE_E164 = '+18186539874';
export const ADMIN_SMS_BODY = 'Hi Jay, can you add me to the NadaBarkada Fitness Challenge? My name is [Your Name].';
export const APP_TIMEZONE = 'America/Los_Angeles';
```

**`src/lib/api.js`** — URL resolution changed from env-var-only to env-var-with-config-fallback:

```js
import { APP_SCRIPT_URL as CONFIG_APP_SCRIPT_URL } from '@/lib/config';
const APP_SCRIPT_URL = (import.meta.env.VITE_APP_SCRIPT_URL || CONFIG_APP_SCRIPT_URL || '').trim();
```

The env var still takes precedence (useful for local dev override), but `config.js` is now the canonical source.

**`src/components/DailyLogForm.jsx`** and **`src/App.jsx`** — hardcoded SMS strings replaced:

```js
// Before (in 3 places across 2 files):
href="sms:+18186539874?body=Hi Jay, can you add me..."

// After:
import { ADMIN_PHONE_E164, ADMIN_SMS_BODY } from '@/lib/config';
href={`sms:${ADMIN_PHONE_E164}?body=${encodeURIComponent(ADMIN_SMS_BODY)}`}
```

Also added `encodeURIComponent` wrapping the SMS body, which was previously missing and could cause issues with spaces and special characters in the pre-filled message.

**Redeployment workflow going forward:** update `APP_SCRIPT_URL` in `src/lib/config.js`, commit, push. No GitHub secrets or env files to hunt down.

---

### 13. Real Spreadsheet ID Committed to `Code.gs`

**Files changed:** `apps-script/Code.gs`

Replaced the placeholder `'REPLACE_WITH_YOUR_SPREADSHEET_ID'` with the actual Google Sheet ID `'1wqTMjXCBFA8PZg2L5Tg0WLZPAxO_TEantDIeNenRdZ4'`. The spreadsheet ID is not a credential or secret — it is just an identifier. Keeping a placeholder in the repo meant the checked-in code was not actually runnable without manual editing after every clone or re-read.

---

### 14. New Apps Script Deployment — URL Updated

**Files changed:** `src/lib/config.js`, `.env.local`, `.env.production`

After redeploying the Apps Script (Version 2, Apr 11 2026), the new web app URL was updated in all three locations:

- `src/lib/config.js` — `APP_SCRIPT_URL` (canonical source, committed)
- `.env.local` — `VITE_APP_SCRIPT_URL` (local dev override, gitignored)
- `.env.production` — `VITE_APP_SCRIPT_URL` (used at build time for GitHub Pages deploy)

New deployment ID: `AKfycbw21r9qqPHrekgAXG4OXIiJFsrnI6F_4Hml94fbKzYV40hV8MARWWRNMVDRoCYb9Pao1A`

---

## 2026-04-11 Session

---

### 15. Auth, Logout, and PIN Flow

**Files changed:** `src/App.jsx`, `src/components/DailyLogForm.jsx`, `src/components/ProfilePanel.jsx`

- `handleLogout()` now clears `selectedParticipantId` (in addition to `authenticatedParticipantId`) so the header resets to "Select Participant" on logout.
- "Stay logged in" checkbox in the PIN form persists `participantId` to `localStorage`; both auth state values initialize from localStorage on load.
- Logout button added inside `DailyLogForm` card header (visible when authenticated).
- `handlePinChanged()` now calls `loadAll()` after setting the localStorage flag, refreshing data after every PIN update.
- PIN reminder banner (indigo): shown on first login when `pin-changed` flag is absent from localStorage; auto-opens My Profile and scrolls to it; dismissed after PIN is changed or banner is closed.
- Bouncing indigo bubble added to the PIN change form in `ProfilePanel` when `showPinReminder` is active (`showPinBubble` prop).

---

### 16. Global Server Spinner

**Files changed:** `src/App.jsx`

Added `isFetching`, `isAuthenticating` states. Derived `serverBusy = isFetching || isAuthenticating || loadingParticipants || submittingLog`. A `Loader2` spinning icon appears in the center of the top nav title during any server communication.

---

### 17. Bouncing "Select Participant" Bubble

**Files changed:** `src/App.jsx`

When no participant is selected and the dropdown is closed, an animated white speech bubble (`animate-bounce`) appears below the participant avatar button saying "Select participant", with a downward-pointing triangle arrow. Hidden once the menu opens or a participant is chosen.

---

### 18. Mobile Auto-Scroll Behaviors

**Files changed:** `src/App.jsx`

- On screens narrower than 768px: selecting a participant (but not yet authenticated) smooth-scrolls to `#daily-log-entry` for PIN entry.
- When `showPinReminder` fires after first login: auto-opens My Profile (`setShowProfile(true)`) and smooth-scrolls to `#profile-panel`.

---

### 19. Header — Countdown Timers + Milestone Dates

**Files changed:** `src/components/Header.jsx`

Replaced schedule/goal cards with:
- Two live countdown timers (DD:HH:MM:SS) — large for challenge start, smaller for baseline start. Ticks every second via `setInterval`.
- Milestone cards row (3-column grid on sm+): 📋 Baseline Week, 🟢 Week 1 Starts, 🏆 Challenge Ends — each showing the date large and bold (`text-xl`/`text-2xl`) with emoji and label.
- Dates read from `CHALLENGE_CONFIG` so no hardcoding.

---

### 20. Leaderboard & Weekly Rings — Pre-Challenge Lock State

**Files changed:** `src/components/LeaderboardTable.jsx`, `src/components/WeekRingsCalendar.jsx`

Both components compute `challengeActive = new Date() >= new Date(challengeStartDate + 'T00:00:00')`. When false, they show a lock icon with "Challenge not active yet — unlocks 2026-05-04" instead of data. Automatically reveals on May 4.

---

### 21. Admin Panel — Collapsible, Repositioned, Red Border

**Files changed:** `src/App.jsx`

- Admin Panel moved to after My Profile in page order.
- Collapsible toggle header with `border-2 border-red-400` and red-tinted button; collapsed by default (`showAdmin = false`).
- Nav menu order updated to reflect new position.

---

### 22. Admin Panel — Avatar Edit

**Files changed:** `src/components/AdminPanel.jsx`

Added avatar upload to the participant edit detail pane. Mirrors the Add Participant photo upload (file input → `resizeProfileImage` canvas resize → base64). Image is only sent in the `updateParticipant` payload if a new file is chosen; existing avatar is preserved otherwise. Edit form state includes `profileImage: ''`; cleared when selection changes.

---

### 23. Participant Dropdown — Alphabetical Order

**Files changed:** `src/App.jsx`

Participant list in the header dropdown now sorted A→Z via `[...derivedParticipants].sort((a, b) => a.name.localeCompare(b.name))`.

---

### 24. Daily Log — Collapsible Instructions + Tooltips

**Files changed:** `src/components/DailyLogForm.jsx`

Added collapsible "How to log your day" section (collapsed by default) at top of log form containing:
- Active Minutes guidance: examples include workouts, walks, biking, sports, pacing on calls, yard/housework. Amber callout: standing desk (passive) doesn't count; pacing/walking meetings do.
- Steps guidance: check phone Health app, Garmin, or Apple Watch at end of day.
- Log totals throughout the day or all at once at the end.

Workout Session and Self-Care checkboxes each have a blue `i` circle button (`InfoTooltip` component) that shows a floating tooltip on hover (desktop) and tap-toggle (mobile):
- Workout: "A purposeful workout session of 20+ minutes — gym, run, swim, fitness class, home workout, etc."
- Self-Care: "5+ minutes of intentional recovery — yoga, stretching, foam rolling, meditation, breathing exercises, ice bath, or massage."
