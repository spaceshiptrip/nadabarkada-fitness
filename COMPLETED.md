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
