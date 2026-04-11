# nadabarkada-fitness

Fitness Challenge Tracker

A React + Vite frontend with a Google Apps Script + Google Sheets backend for a month-long fitness challenge. The scoring model is designed to reward effort, consistency, and improvement rather than raw fitness alone.

## Fitness Challenge Rules

### Goal

Reward effort, consistency, and improvement, not just raw fitness.

Participants of all levels can compete fairly through daily activity and weekly progress relative to their own baseline.

### Challenge Structure

- Week 0 (Apr 27-May 3): Baseline tracking with no scoring
- Weeks 1-4 (May 4-May 31): Scoring period

Baseline is used to calculate weekly improvement bonuses.

### Daily Scoring

Maximum 10 points per day.

#### Activity Minutes

- 10-19 minutes = 1 point
- 20-29 minutes = 2 points
- 30-44 minutes = 3 points
- 45-59 minutes = 4 points
- 60+ minutes = 5 points

#### Steps

- 6,000+ = 1 point
- 8,000+ = 2 points
- 10,000+ = 3 points

#### Workout Bonus

- +2 points for a workout session of 20+ minutes
- Must be intentional: run, gym, class, sport, and similar activities
- Max 1 workout bonus per day

#### Self-Care

- +1 point for stretching, yoga, or mobility of 5+ minutes
- Max 1 per day

#### Daily Cap

- Maximum 10 points per day
- Encourages consistency over extreme efforts

### Weekly Bonuses

#### Active Days

- 3 days = +3
- 5 days = +6
- 6+ days = +8

Active day = 10+ activity minutes.

#### Improvement vs Baseline

Activity minutes increase:

- +10% = +3
- +20% = +5
- +30% = +7

Steps increase:

- +10% = +1
- +20% = +2

#### Best Week Bonus

- +2 points for beating your previous highest weekly score

### Teams

Teams are optional and meant to increase motivation and participation without replacing individual competition.

#### Individual Competition

- The main winner is based on total individual points

#### Team Competition

- Team score = average points per member
- A member must log at least 3 active days in a week to count toward team score
- Recommended optional adjustment: exclude the lowest scorer each week

#### Optional Team Bonuses

- +2 if all team members hit 3 active days
- +3 if team average improves versus the prior week

#### Solo Players

- Participants can compete without joining a team
- Solo players remain eligible for the main leaderboard

### Fair Play Rules

Definitions:

- Workout: 20+ minutes of intentional activity
- Self-Care: 5+ minutes of recovery or stretching
- Active day: 10+ activity minutes

General rules:

- No double counting activities
- Max 1 workout bonus per day
- Activities should reflect real effort
- Honor system applies

Anti-gaming:

- No splitting one workout into multiple entries
- Steps and minutes should align with realistic movement
- Use device data or honest manual entry

### Scoring Philosophy

- Beginners can compete through consistency
- Advanced participants must improve beyond baseline
- Everyone has multiple ways to earn points daily

You do not need to be the fittest, just the most consistent.

### Winning

Individual winner:

- Highest total points across all scoring weeks

Optional team winner:

- Highest average team score

Tie-breakers:

1. Most active days
2. Highest percentage improvement
3. Longest consistency streak, if tracked

### Example Day

- 45 minute run = 4
- Workout bonus = +2
- 10,000 steps = +3
- Self-Care = +1

Total = 10 points after the daily cap

## Project structure

```text
fitness-challenge-app/
|-- apps-script/
|-- docs/
|-- public/
|-- src/
|-- .env.example
|-- components.json
|-- index.html
|-- jsconfig.json
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
`-- vite.config.js
```

## Frontend features

- Add and manage participants
- Capture daily activity logs
- Automatically compute daily points
- Pull leaderboard and weekly summaries from Google Apps Script
- Show challenge schedule and scoring rules
- Includes a sample mock mode for local UI testing

## Backend features

The included Google Apps Script:

- stores participants in a Google Sheet tab
- stores daily logs in a Google Sheet tab
- computes leaderboard and weekly rollups
- exposes JSON endpoints via `doGet` and `doPost`

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start dev server

```bash
npm run dev
```

### 3) Build

```bash
npm run build
```

## GitHub Pages deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds and deploys the frontend to GitHub Pages on every push to `main`.

For the first deploy:

1. Open the repository on GitHub.
2. Go to `Settings -> Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` and wait for the `Deploy to GitHub Pages` workflow to finish.

For this repository, the site will publish at:

`https://spaceshiptrip.github.io/nadabarkada-fitness/`

## Environment

Local development uses [.env.local](/Users/jtorres/Workspaces/pnb/fitness/nadabarkada-fitness/.env.local) and GitHub Pages production builds use [.env.production](/Users/jtorres/Workspaces/pnb/fitness/nadabarkada-fitness/.env.production).

Current live Apps Script endpoint:

```bash
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwZsxnxev0uhG2sKsrjrrAncTrctkoyPquaHuFO_fC3sznq2kCL1Gpb9W10bEGl2_ME1w/exec
```

If `VITE_APP_SCRIPT_URL` is omitted, the UI falls back to mock/demo mode and stores data in browser `localStorage`.

## Google Apps Script setup

See:

- `apps-script/SETUP.md`
- `docs/deployment-guide.md`
- `docs/sheets-schema.md`

High level:

1. Create a Google Sheet.
2. Add tabs:
   - `Participants`
   - `DailyLogs`
3. Copy `apps-script/Code.gs` and `apps-script/appsscript.json` into Apps Script.
4. Set the spreadsheet ID in `Code.gs`.
5. Deploy as a web app.

## TODO

### Phase 1: Simple participant flow

- Skip full participant authentication at launch.
- Pre-create participant records directly in the backend sheet.
- Generate and keep a stable `ParticipantId` for each participant.
- Make the top header avatar/name area the main participant selector dropdown.
- Persist the selected participant in `localStorage` so the app restores that participant on refresh.
- If no participant is stored in `localStorage`, keep the app in an unselected state on load.
- Tell participants to select themselves from the participant list in the app.
- Let participants log daily activity without logging in.
- If no participant is selected, disable all `My Rings` controls and views.
- If no participant is selected, disable all `Daily Log Entry` inputs except `Select participant`.
- If no participant is selected, still allow viewing the leaderboard and weekly leaderboard rings.
- Add a visible callout that points the user to `Select participant` when nothing is selected.
- Add a `Not listed? Request registration` option near the participant selector instead of self-service participant creation.
- Make that option open the user's SMS app with a prefilled message to Jay, for example:
  - `Hi Jay, can you register me for the fitness challenge? My name is [Your Name].`
- On mobile, use an `sms:` link with a prefilled body.
- On desktop, also show the phone number and a copyable fallback in case SMS deep linking is not available.
- Create a Profile/Settings panel so a selected participant can update their displayed name and profile picture.
- Once a participant is selected, repurpose the current admin/profile area into a participant-facing Profile panel.
- Make sure profile changes do not change the participant's stable `ParticipantId`.
- Keep phone number and PIN fields in the backend schema for future use, even if login is not enabled yet.
- If needed, hide or remove the in-app Admin Panel for Phase 1 and manage participant creation directly in the sheet/backend.

### Phase 1 reasoning

- The challenge is honor-system based, so the biggest UX risk is friction, not abuse.
- Requiring full login on day one may reduce participation more than it improves control.
- Keeping participant creation admin-controlled preserves clean participant records and stable `ParticipantId` values.
- Avoiding self-service registration in Phase 1 reduces duplicate users, inconsistent names, and identity cleanup work.
- A header participant selector with `localStorage` keeps the app feeling personal without making users log in every time.
- A `Request registration` SMS flow gives unregistered users a clear path forward without exposing account creation in the app.
- This keeps Phase 1 simple while preserving a clean upgrade path to Phase 2 login with phone number and PIN.

### Phase 1.5: Lightweight guardrails

- Decide whether profile editing should require a lightweight check, or remain honor-system only.
- Consider remembering the last selected participant locally on the device for convenience.
- Keep all log joins and participant identity keyed by `ParticipantId`, not display name.
- Allow the admin to seed participant display name, phone number, and PIN in the backend ahead of future auth work.

### Phase 2: Authentication and roles

- Create a login screen that authenticates with phone number and PIN.
- Add a `Role` field in the sheet/backend so users can be either `admin` or `participant`.
- If the logged-in user role is `admin`, show the Admin Panel.
- If the logged-in user role is `participant`, hide the Admin Panel.
- Users should log in with phone number and PIN, while the UI shows their name and profile picture after login.
- Allow a logged-in user to change their login phone number and PIN from their profile/settings area.
- Changing phone number or PIN should update the stored backend hashes without changing the participant's stable `ParticipantId`.

### Backend auth workflow

- Add an admin workflow to seed a participant’s display name, phone number, and PIN.
- In the backend, generate the participant ID, hash the phone number for login lookup, and hash/obfuscate the PIN after the initial seed flow.
- Follow the existing Google Apps Script pattern in `../pickle.nadabarkada.com/pickle/backend/google-apps-script/Code.gs`:
  - run `setPinSalt_()` once to create the script salt
  - use `generateMyHash()` as the reference pattern for producing the stored PIN hash
- Add a dedicated admin migration/helper method in this project’s `Code.gs` to hash or obfuscate seeded phone/PIN credentials after the initial seed pass.
6. Put the deployment URL into `VITE_APP_SCRIPT_URL`.

## Workflow

Current development can stay fully local. If `VITE_APP_SCRIPT_URL` is not set, the app runs in mock mode and keeps participant and daily log data in browser `localStorage`.

## Next Steps

This section is the current handoff note for the next work session.

### Resume Context

- To reopen the most recent Codex interactive session in this repo, run:
- `codex -C /Users/jtorres/Workspaces/pnb/fitness/nadabarkada-fitness resume --last`
- If you are already in the repo directory, `codex resume --last` is enough
- Start the next session by asking Codex to continue from the `README.md` handoff note and implement the admin reset/seed workflow
- Local `codex resume --last` session history is machine-specific and does not reliably carry across desktop and laptop
- For cross-machine continuity, commit and push this repo, pull it on the other machine, then start Codex in the repo and continue from this `README.md` handoff note
- Suggested cross-machine restart prompt:
- `Continue from the README.md Next Steps handoff note. Implement the admin reset/seed workflow using the pickle repo auth pattern referenced there.`

### 1) Backend smoke test

- Open the deployed Apps Script URL with these query params:
- `?action=participants`
- `?action=dailyLogs`
- `?action=leaderboard`
- `?action=weeklySummary`
- Confirm each returns JSON with `ok: true`
- On a fresh sheet, `participants` and `dailyLogs` should be empty arrays

### 2) Local frontend test

- Run `npm run dev`
- Confirm the app loads against the live Apps Script URL from `.env.local`
- Add 1-2 test participants
- Add baseline-week logs and scoring-week logs
- Verify the sheet gets rows in `Participants` and `DailyLogs`
- Verify leaderboard totals and weekly summary values look correct
- Verify editing the same participant/date replaces the existing daily log instead of duplicating it

### 3) Production GitHub Pages test

- Push to `main` and let the `Deploy to GitHub Pages` workflow finish
- Open `https://spaceshiptrip.github.io/nadabarkada-fitness/`
- Confirm the production site can load participants and submit daily logs
- Verify browser requests are hitting the deployed Apps Script URL from `.env.production`
- Repeat one participant add and one daily log submission from production

### 4) Test-data workflow

- There is not yet an admin reset button in the UI
- Test data can be created directly through the UI by adding test participants and logs
- For isolated frontend-only testing, remove `VITE_APP_SCRIPT_URL` locally and use mock mode with browser `localStorage`
- To clear mock-mode test data, clear browser `localStorage` for this site

### 5) Pre-launch cleanup

- Before launch, clear test rows from the Google Sheet tabs `Participants` and `DailyLogs`
- Keep the header row intact in both tabs
- Do not rename the tabs
- If you used mock mode locally, also clear the browser `localStorage` so old demo data does not reappear during local testing
- After cleanup, rerun the backend smoke test and one final frontend add/log verification

### 6) Potential follow-up improvement

- Add a simple admin-only reset or seed utility for test participants and logs so future test cycles do not require manual sheet cleanup

### 7) Admin Reset/Seed Workflow Proposal

- Goal: add a small admin-only utility to seed test participants/logs and clear test data before launch
- Keep the first version simple and treat it as lightweight operational tooling, not full user auth
- Reference auth implementation to reuse: [pickle backend Code.gs](/Users/jtorres/Workspaces/pnb/pickle/pickle/backend/google-apps-script/Code.gs)

Recommended first version:

- Add an admin panel in the frontend that is hidden behind a simple login gate
- Require an admin PIN before showing reset/seed actions
- Store the admin PIN in Apps Script `PropertiesService`, not in the sheet and not in the frontend bundle
- Add dedicated Apps Script `POST` actions such as `adminSeedTestData` and `adminClearAllData`
- Prefer a small session-based admin flow modeled after the pickle repo instead of sending the PIN on every destructive request
- Validate the PIN server-side before creating the admin session or performing any destructive operation

Suggested seed behavior:

- Seed 2-4 realistic test participants
- Seed baseline-week rows and scoring-week rows for each participant
- Use deterministic sample data so leaderboard results are easy to sanity-check
- Add a flag or naming pattern like `TEST - Maria` so seeded rows are easy to identify if partial cleanup is ever needed

Suggested clear behavior:

- Clear all rows below the header in `Participants`
- Clear all rows below the header in `DailyLogs`
- Keep the header row intact
- Optionally support a safer mode later that clears only rows tagged as test data

Admin auth notes:

- Do not rely on frontend-only checks because the GitHub Pages site is public
- Do not hardcode the admin PIN in `.env.production` because Vite env values are exposed to the client bundle
- Keep the admin PIN in Apps Script project properties and compare on the server
- For a first pass, a single shared admin PIN is enough
- If needed later, expand this to named admins, rotating PINs, or Google-account-based restrictions

Implementation note for next session:

- Reuse the pickle repo auth helpers where useful:
- `verifyPin_()`
- `sha256Hex_()`
- `getPinSalt_()`
- `setPinSalt_()`
- `auth_loginWithPin_()`
- `requireAuth_()`
- `auth_whoami_()`
- `auth_logout_()`
- Keep the fitness app implementation smaller than pickle and only port what is needed for admin tooling
- Reuse the existing reserved auth direction in the schema where practical, but keep admin auth separate from participant auth
- Participant `PhoneNumber` and `Pin` fields should not be used as the global admin credential
- Add a visible confirmation step before any destructive reset action

### Baseline Week

- Week 0 (Apr 27-May 3) is for baseline gathering and habit building
- Participants do not need to log every day during baseline week
- Baseline averages are computed from the baseline days they actually log
- Baseline week entries do not count toward the scored competition

### Baseline Calculation

- Baseline active minutes = average active minutes across that participant's Week 0 entries
- Baseline steps = average steps across that participant's Week 0 entries
- These computed baseline values are used for weekly improvement bonuses in Weeks 1-4

### Manual Override

- Participant profiles default to computed baseline values
- There is an `Override computed baseline` option in the participant form
- If enabled, a participant can enter manual baseline active minutes and manual baseline steps
- When override is enabled, the manual values are used instead of the computed Week 0 averages

### Participant Setup Flow

1. Add the participant with name, device type, optional team, and optional profile picture.
2. Leave baseline override off in the normal case.
3. During Week 0, let the participant submit baseline logs as they are able.
4. Review the computed baseline shown in the participant roster.
5. If needed, enable manual override and enter a custom baseline for that participant.

### Local Mock Mode Notes

- Added participants persist locally across page refreshes
- Uploaded profile pictures persist locally across page refreshes
- Daily log entries persist locally across page refreshes
- Leaderboard and weekly summaries use the locally stored participant data and logs
- When Google Sheets is connected later, `Code.gs` is already aligned to support `ProfileImage` and `BaselineOverride`
