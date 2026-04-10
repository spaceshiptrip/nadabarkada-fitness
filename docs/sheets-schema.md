# Google Sheets Schema

## Sheet: Participants
Headers:
```text
UserId | Name | DeviceType | TeamName | BaselineActiveMinutes | BaselineSteps | Active | CreatedAt | ProfileImage | BaselineOverride | PhoneNumber | Pin
```

### Notes
- `UserId` is the stable participant identifier used by logs and future auth flows.
- `BaselineActiveMinutes` is the participant’s average daily active minutes during Week 0.
- `BaselineSteps` is the participant’s average daily steps during Week 0.
- `Active` can be `TRUE` or `FALSE`.
- `ProfileImage` stores the participant headshot or fallback image URL/data.
- `BaselineOverride` controls whether manual baseline values override computed Week 0 baselines.
- `PhoneNumber` and `Pin` are reserved for future lightweight authentication.

## Sheet: DailyLogs
Headers:
```text
Date | ParticipantId | Name | ActiveMinutes | WorkoutDone | Steps | MobilityDone | Notes | DailyPoints | ChallengeWeek | CreatedAt
```

### Notes
- `Date` should be in `YYYY-MM-DD`
- `ParticipantId` should reference `Participants.UserId`
- `WorkoutDone` and `MobilityDone` can be `TRUE/FALSE`
- `DailyPoints` is computed server-side when the row is submitted
- `ChallengeWeek` is derived from the date

## Week mapping
- 2026-04-27 through 2026-05-03 = Week 0
- 2026-05-04 through 2026-05-10 = Week 1
- 2026-05-11 through 2026-05-17 = Week 2
- 2026-05-18 through 2026-05-24 = Week 3
- 2026-05-25 through 2026-05-31 = Week 4
- 2026-06-01 through 2026-06-04 = Week 5 / wrap-up

## Leaderboard logic
Total score =
- sum of daily points
- plus weekly consistency bonus
- plus weekly improvement bonus
- plus personal best bonus
