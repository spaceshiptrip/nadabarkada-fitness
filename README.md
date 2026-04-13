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

Planned custom domain:

`https://fitness.nadabarkada.com`

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

## Status

### Implemented

- Stable participant IDs are generated in the Apps Script backend and used throughout the app.
- Participant records support `ProfileImage`, `BaselineOverride`, `PhoneNumber`, `Pin`, and `Role`.
- Participant selection persists in browser `localStorage`, so the app restores the previously selected participant on refresh.
- The app supports participant PIN verification before unlocking the daily log form.
- Participants can change their own PIN from the profile panel.
- Participants can edit their display name, device type, and profile picture without changing their stable participant ID.
- The app includes an in-UI `Not registered yet?` SMS flow to contact Jay for registration.
- Baseline values can be computed from Week 0 logs or manually overridden.
- The frontend can run in live mode against Apps Script or in mock mode with browser `localStorage`.
- An Admin Panel exists in the UI for adding participants, editing participant details, and resetting participant PINs.
- GitHub Pages deployment is already configured, including the custom-domain `CNAME` flow for `fitness.nadabarkada.com`.

### Still Open

- Add real admin authentication for admin-only actions. The current Admin Panel exists, but the README plan for a separate admin login/session flow is not implemented yet.
- Add admin seed/reset utilities in Apps Script and the frontend so test data can be created and cleared safely without manual sheet edits.
- Decide whether the Admin Panel should remain visible in the app, be protected behind admin auth, or be removed from the public participant flow.
- Add a proper settings menu if the product still wants a dedicated three-dots/settings surface instead of the current panel layout.
- Add dark mode and a user-visible theme toggle if that is still a launch requirement.
- Add a stronger backend auth model if the app should eventually support true phone-number-plus-PIN login rather than the current participant-selection-plus-PIN unlock pattern.
- Add Strava integration for partial automation of activity minutes and workout detection.

### Deferred / Future

- Full phone-number login and role-based sessions for participants and admins.
- Additional auth hardening such as phone lookup hashes, named admins, rotating credentials, or Google-account restrictions.
- More advanced operational tools beyond the initial admin seed/reset workflow.
- Strava estimated-steps support and review UX after core Strava import works.

### Notes

- The old phased TODO plan in this README predated several features that are now implemented.
- Treat the sections below as the active plan of record, especially `Next Steps`, `Admin Reset/Seed Workflow Proposal`, and `Strava Integration Proposal`.

### Deployment migration: GitHub Pages custom domain

- Host the fitness frontend on GitHub Pages at `https://fitness.nadabarkada.com`.
- This repo now includes `public/CNAME` with `fitness.nadabarkada.com`.
- This repo now builds with Vite `base: '/'` so assets resolve correctly when served from the custom domain root.
- Keep the site statically hosted on GitHub Pages; do not move frontend hosting to GoDaddy.

### Migration steps: GitHub

1. Push this repo to GitHub with the `public/CNAME` file included.
2. Let the GitHub Pages workflow deploy successfully at least once after that push.
3. In the GitHub repository, open `Settings -> Pages`.
4. Confirm `Source` is `GitHub Actions`.
5. Confirm the custom domain is set to `fitness.nadabarkada.com`.
6. Ensure `Enforce HTTPS` is enabled after the DNS is live and GitHub finishes certificate provisioning.

### Migration steps: GoDaddy DNS

For a subdomain like `fitness.nadabarkada.com`, the simplest setup is usually a `CNAME` record. You should not need to host anything in GoDaddy.

1. Open the DNS manager for `nadabarkada.com` in GoDaddy.
2. Add or update a `CNAME` record:
   - `Host`: `fitness`
   - `Points to`: `spaceshiptrip.github.io`
   - `TTL`: default is fine
3. Remove any conflicting `A`, `AAAA`, or `CNAME` records already using the `fitness` host.
4. Save the DNS change.

### Notes about GoDaddy

- For `fitness.nadabarkada.com`, a `CNAME` is usually all you need in GoDaddy.
- You do not need to upload site files to GoDaddy.
- You do not need GoDaddy forwarding for this setup.
- You do not need apex/root-domain `A` records unless you later want `nadabarkada.com` itself hosted on GitHub Pages.

### Validation checklist

- `https://spaceshiptrip.github.io/nadabarkada-fitness/` may no longer be the preferred URL once the custom domain is active.
- `https://fitness.nadabarkada.com` should load the app and all JS/CSS assets without 404s.
- The browser should not show mixed-content or asset-path issues.
- GitHub Pages should show the custom domain as verified and HTTPS-enabled.

### If migration does not work

- Check whether the `fitness` DNS record is a `CNAME` to `spaceshiptrip.github.io`.
- Check whether another DNS record for `fitness` conflicts with it.
- Check GitHub repository `Settings -> Pages` to confirm the custom domain value matches `fitness.nadabarkada.com`.
- Wait for DNS propagation and GitHub certificate provisioning; this can take some time after the first change.

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

- The UI currently has participant-management controls and participant PIN reset in the Admin Panel
- There is not yet a full admin-only seed/reset workflow for bulk test data in the UI or Apps Script
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

### 8) Strava Integration Proposal

- Goal: let participants connect Strava so the app can prefill activity minutes and workout completion from imported Strava activities
- Keep GitHub Pages as the frontend host and keep Google Apps Script as the backend
- Do not move this app to a Node, Django, or Docker backend just to support Strava

Important product constraint:

- Strava does not provide a reliable daily step-count API for this app's use case
- Strava can provide activity data such as sport type, moving time, distance, and sometimes calories
- Because of that, Strava can only partially automate this challenge
- `ActiveMinutes` can be imported from Strava activities
- `WorkoutDone` can be inferred from qualifying Strava activities
- `Steps` cannot be directly imported from Strava and must remain either manual or estimated
- `MobilityDone` should remain manual unless the user explicitly logs recovery activity in Strava

Recommended MVP behavior:

1. Add a `Connect Strava` action for each participant profile
2. Send the participant through Strava OAuth
3. Store Strava tokens server-side in Apps Script or the backing sheet, never in the frontend bundle
4. Add a `Sync Strava` action to fetch recent activities
5. Aggregate imported activities by participant and date
6. Prefill or update `ActiveMinutes` from imported Strava activity moving time
7. Set `WorkoutDone = true` when a qualifying Strava activity exists for that date
8. Leave `MobilityDone` as manual input
9. Leave `Steps` as manual input in the first version unless estimated steps are explicitly enabled
10. Show `Last synced` and `Imported from Strava` indicators in the UI

Estimated-steps option:

- If desired, the app can estimate steps from Strava distance for step-like activities only
- This should be treated as a user-facing estimate, not authoritative truth
- Only estimate for activities such as `Walk`, `Run`, `TrailRun`, and `Hike`
- Do not estimate steps for cycling, swimming, strength training, yoga, rowing, or similar activities
- Suggested approximation:
  - walking or hiking: about `1250 steps/km`
  - running or trail running: about `1300-1400 steps/km`
- Save the estimate separately or flag it with a source value such as `estimated_strava`
- Show a note in the UI such as: `Estimated from Strava distance. Please review and adjust if needed.`
- Manual edits should always override the estimate

Technical implementation outline:

1. Register a Strava application at `developers.strava.com`
2. Add the correct callback URL for the Apps Script web app deployment
3. Store `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` in Apps Script project properties
4. Extend the backend schema to store per-participant Strava linkage metadata
5. Add Apps Script endpoints for:
   - `getStravaAuthUrl`
   - `stravaOauthCallback`
   - `syncParticipantStrava`
   - `disconnectParticipantStrava`
6. Add server-side token refresh logic in Apps Script
7. Add frontend UI for connect, sync, and disconnect states
8. Add a review flow so imported values can be inspected before users rely on them for scoring

Suggested backend data additions:

- Add participant fields such as:
  - `StravaAthleteId`
  - `StravaRefreshToken`
  - `StravaScope`
  - `StravaLastSyncedAt`
  - `StravaConnected`
- Add daily-log fields such as:
  - `MinutesSource`
  - `StepsSource`
  - `ImportedActivityCount`
  - `ImportNote`

Suggested import rules:

- Sum `moving_time` from all qualifying activities on the same local date into daily active minutes
- Mark `WorkoutDone` true if any qualifying activity is at least 20 minutes
- If estimated steps are enabled, sum estimated steps only from eligible activity types
- Never overwrite a user-entered manual `Steps` value without clear confirmation
- Preserve an audit trail that the row was imported or partially imported from Strava

Policy and rollout notes:

- New Strava apps may be limited until Strava approves broader usage beyond the developer's own account
- Do not assume immediate multi-user rollout without reviewing current Strava app approval requirements
- Make imported data private by default and only expose it in challenge views the participant has consented to
- Be explicit in the UI that Strava does not provide exact daily steps for this app

Recommended delivery order:

1. Add README plan and schema notes
2. Add backend participant fields for Strava linkage
3. Add Apps Script auth and token storage
4. Add connect/disconnect UI
5. Add manual sync for one participant
6. Import active minutes and workout detection only
7. Add optional estimated steps with strong review messaging
8. Add polish such as last-synced status and import notes

Not recommended:

- Do not put Strava client secrets in Vite env files used by the browser
- Do not rely on frontend-only OAuth handling for token storage
- Do not silently convert all imported distance to scored steps without a user-facing estimate warning
- Do not treat Strava as a full replacement for manual entry in this challenge

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
