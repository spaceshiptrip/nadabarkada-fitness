import { useState } from 'react';
import { Flame, CalendarDays, Users, ChevronDown, ChevronUp, Scale, Trophy, ShieldCheck, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getWeeklyDateRanges } from '@/lib/points';

function SectionHeading({ icon: Icon, label, aside }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
      <Icon className="h-3.5 w-3.5" />
      {label}
      {aside && <span className="ml-auto font-normal normal-case tracking-normal">{aside}</span>}
    </div>
  );
}

function RuleGroup({ label, rows }) {
  return (
    <div>
      {label && (
        <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      )}
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([cell, pts]) => (
            <tr key={cell} className="border-b last:border-b-0">
              <td className="py-1.5 pr-4 text-slate-700">{cell}</td>
              <td className="py-1.5 text-right font-semibold tabular-nums text-primary">{pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RulesCard() {
  const ranges = getWeeklyDateRanges();
  const today = new Date().toISOString().slice(0, 10);
  const [showMobileRules, setShowMobileRules] = useState(false);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Rules at a glance</CardTitle>
        <CardDescription>
          Active day = 10+ activity minutes. Week 0 establishes each participant&apos;s baseline averages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <SectionHeading icon={CalendarDays} label="Challenge timeline" />

          <div className="grid gap-3 sm:grid-cols-2">
            {ranges.map((range, i) => {
              const isCurrent = today >= range.start && today <= range.end;
              const isPast = today > range.end;
              const isBaseline = i === 0;

              let cardClass = 'rounded-2xl border p-4 ';
              if (isCurrent) cardClass += 'border-primary/40 bg-primary/5';
              else if (isBaseline) cardClass += 'border-amber-200 bg-amber-50';
              else if (isPast) cardClass += 'bg-slate-50 opacity-60';
              else cardClass += 'bg-slate-50';

              return (
                <div key={range.label} className={cardClass}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold">{range.label}</div>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Now
                      </span>
                    )}
                    {isBaseline && !isCurrent && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Baseline
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {range.start} – {range.end}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t" />

        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-4">
            <div className="hidden xl:block">
              <FullRules />
            </div>

            <div className="xl:hidden rounded-2xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <SectionHeading icon={Scale} label="Full Rules" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileRules((current) => !current)}
                  aria-expanded={showMobileRules}
                >
                  {showMobileRules ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                  {showMobileRules ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showMobileRules && <div className="mt-4"><FullRules /></div>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 px-4 py-2 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">⚡ Quick Glance Scorecard</span>
              <p className="mt-0.5 text-[11px] text-slate-500">Scan this while logging — full rules on the left</p>
            </div>

            <div className="space-y-3">
              <SectionHeading
                icon={Flame}
                label="Daily scoring"
                aside={<span className="rounded-full border px-2 py-0.5 text-slate-600">cap 10 pts</span>}
              />

              <div className="space-y-4">
                <RuleGroup label="Active minutes" rows={[
                  ['10–19 min', '1 pt'],
                  ['20–29 min', '2 pts'],
                  ['30–44 min', '3 pts'],
                  ['45–59 min', '4 pts'],
                  ['60+ min', '5 pts'],
                ]} />

                <RuleGroup label="Steps" rows={[
                  ['6,000+', '1 pt'],
                  ['8,000+', '2 pts'],
                  ['10,000+', '3 pts'],
                ]} />

                <RuleGroup label="Bonuses" rows={[
                  ['Workout session (20+ min)', '+2 pts'],
                  ['Self-Care (5+ min)', '+1 pt'],
                ]} />
              </div>
            </div>

            <div className="border-t" />

            <div className="space-y-3">
              <SectionHeading icon={CalendarDays} label="Weekly bonuses" />

              <div className="space-y-4">
                <RuleGroup label="Consistency" rows={[
                  ['3 active days', '+3 pts'],
                  ['5 active days', '+6 pts'],
                  ['6+ active days', '+8 pts'],
                ]} />

                <RuleGroup label="Activity gain vs baseline" rows={[
                  ['+10%', '+3 pts'],
                  ['+20%', '+5 pts'],
                  ['+30%', '+7 pts'],
                ]} />

                <RuleGroup label="Step gain vs baseline" rows={[
                  ['+10%', '+1 pt'],
                  ['+20%', '+2 pts'],
                ]} />

                <RuleGroup label="Other" rows={[
                  ['Personal best week', '+2 pts'],
                ]} />
              </div>
            </div>

            <div className="border-t" />

            <div className="space-y-3">
              <SectionHeading icon={Users} label="Teams" />
              <RuleGroup rows={[
                ['Score method', 'Avg pts per member'],
                ['Eligibility', '3 active days / week'],
                ['Format', 'Optional, individual is primary'],
              ]} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-700">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/50" />
      <span>{children}</span>
    </li>
  );
}

function FullRules() {
  return (
    <div className="space-y-6 rounded-2xl border bg-slate-50 p-5">

      {/* Goal */}
      <div className="space-y-2">
        <SectionHeading icon={Scale} label="Goal" />
        <p className="text-sm text-slate-700">
          Reward <strong>effort, consistency, and improvement</strong> — not just raw fitness.
          Participants of all levels compete fairly through daily activity and weekly progress
          relative to their <strong>own baseline</strong>.
        </p>
      </div>

      <div className="border-t" />

      {/* Challenge Structure */}
      <div className="space-y-2">
        <SectionHeading icon={CalendarDays} label="Challenge Structure" />
        <ul className="space-y-1.5">
          <Bullet><strong>Week 0 (Apr 27 – May 3):</strong> Baseline week — tracked but not scored. Sets your personal averages.</Bullet>
          <Bullet><strong>Weeks 1–4 (May 4 – May 31):</strong> Scoring period. Baseline is used to calculate weekly improvement bonuses.</Bullet>
        </ul>
      </div>

      <div className="border-t" />

      {/* Daily Scoring */}
      <div className="space-y-3">
        <SectionHeading icon={Flame} label="Daily Scoring" aside={<span className="rounded-full border px-2 py-0.5 text-slate-600">max 10 pts/day</span>} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-slate-500">Active Minutes</div>
            <table className="w-full text-sm">
              <tbody>
                {[['10–19 min','1 pt'],['20–29 min','2 pts'],['30–44 min','3 pts'],['45–59 min','4 pts'],['60+ min','5 pts']].map(([r,p]) => (
                  <tr key={r} className="border-b last:border-0">
                    <td className="py-1 pr-3 text-slate-700">{r}</td>
                    <td className="py-1 text-right font-semibold text-primary">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 text-xs font-semibold text-slate-500">Steps</div>
              <table className="w-full text-sm">
                <tbody>
                  {[['6,000+','1 pt'],['8,000+','2 pts'],['10,000+','3 pts']].map(([r,p]) => (
                    <tr key={r} className="border-b last:border-0">
                      <td className="py-1 pr-3 text-slate-700">{r}</td>
                      <td className="py-1 text-right font-semibold text-primary">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 text-xs font-semibold text-slate-500">Bonuses</div>
              <table className="w-full text-sm">
                <tbody>
                  {[['Workout session (20+ min)','+ 2 pts'],['Self-Care (5+ min)','+ 1 pt']].map(([r,p]) => (
                    <tr key={r} className="border-b last:border-0">
                      <td className="py-1 pr-3 text-slate-700">{r}</td>
                      <td className="py-1 text-right font-semibold text-primary">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">Max 1 workout bonus per day. Daily cap encourages consistency over extreme efforts.</p>
      </div>

      <div className="border-t" />

      {/* Weekly Bonuses */}
      <div className="space-y-3">
        <SectionHeading icon={CalendarDays} label="Weekly Bonuses" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-slate-500">Consistency</div>
            <table className="w-full text-sm">
              <tbody>
                {[['3 active days','+3 pts'],['5 active days','+6 pts'],['6+ active days','+8 pts']].map(([r,p]) => (
                  <tr key={r} className="border-b last:border-0">
                    <td className="py-1 pr-2 text-slate-700">{r}</td>
                    <td className="py-1 text-right font-semibold text-primary">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 text-xs font-semibold text-slate-500">Activity vs Baseline</div>
            <table className="w-full text-sm">
              <tbody>
                {[['+10%','+3 pts'],['+20%','+5 pts'],['+30%','+7 pts']].map(([r,p]) => (
                  <tr key={r} className="border-b last:border-0">
                    <td className="py-1 pr-2 text-slate-700">{r}</td>
                    <td className="py-1 text-right font-semibold text-primary">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 text-xs font-semibold text-slate-500">Steps vs Baseline</div>
              <table className="w-full text-sm">
                <tbody>
                  {[['+10%','+1 pt'],['+20%','+2 pts']].map(([r,p]) => (
                    <tr key={r} className="border-b last:border-0">
                      <td className="py-1 pr-2 text-slate-700">{r}</td>
                      <td className="py-1 text-right font-semibold text-primary">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border bg-white p-3 text-sm">
              <span className="text-slate-700">Personal best week</span>
              <span className="float-right font-semibold text-primary">+2 pts</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">Active day = 10+ activity minutes.</p>
      </div>

      <div className="border-t" />

      {/* Teams */}
      <div className="space-y-2">
        <SectionHeading icon={Users} label="Teams (Optional)" />
        <ul className="space-y-1.5">
          <Bullet>Teams are <strong>optional</strong> — individual competition is primary.</Bullet>
          <Bullet>Team score = <strong>average points per member</strong> per week.</Bullet>
          <Bullet>A member must log <strong>at least 3 active days</strong> in a week to count toward the team score.</Bullet>
          <Bullet>Solo players remain fully eligible for the main leaderboard.</Bullet>
        </ul>
        <div className="mt-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
          <div className="font-semibold text-blue-900">Optional Team Bonuses</div>
          <div>+2 pts if all members hit 3 active days · +3 pts if team average improves vs prior week</div>
        </div>
      </div>

      <div className="border-t" />

      {/* Fair Play */}
      <div className="space-y-3">
        <SectionHeading icon={ShieldCheck} label="Fair Play" />
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
          <div className="font-semibold text-amber-900">Definitions</div>
          <div><strong>Workout:</strong> 20+ min of intentional activity (run, gym, class, sport)</div>
          <div><strong>Self-Care:</strong> 5+ min of recovery (yoga, stretching, meditation, foam rolling)</div>
          <div><strong>Active day:</strong> 10+ activity minutes</div>
        </div>
        <ul className="space-y-1.5">
          <Bullet>No double-counting activities.</Bullet>
          <Bullet>Max <strong>1 workout bonus per day</strong> — no splitting one workout into multiple entries.</Bullet>
          <Bullet>Steps and minutes should align with realistic movement.</Bullet>
          <Bullet>Use device data or honest manual entry. <strong>Honor system applies.</strong></Bullet>
        </ul>
      </div>

      <div className="border-t" />

      {/* Winning */}
      <div className="space-y-2">
        <SectionHeading icon={Trophy} label="Winning" />
        <ul className="space-y-1.5">
          <Bullet><strong>Individual winner:</strong> highest total points across all scoring weeks.</Bullet>
          <Bullet><strong>Optional team winner:</strong> highest average team score.</Bullet>
          <Bullet><strong>Tie-breakers:</strong> most active days → highest % improvement → longest consistency streak.</Bullet>
        </ul>
      </div>

      <div className="border-t" />

      {/* Example Day */}
      <div className="space-y-3">
        <SectionHeading icon={Lightbulb} label="Example Day" />
        <div className="rounded-xl border bg-white p-4">
          <div className="space-y-1.5 text-sm">
            {[
              ['45-minute run', '4 pts', 'Active minutes'],
              ['Workout bonus', '+2 pts', '20+ min intentional session'],
              ['10,000 steps', '+3 pts', 'Steps'],
              ['Self-Care', '+1 pt', '5+ min stretching'],
            ].map(([act, pts, note]) => (
              <div key={act} className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-slate-800">{act}</span>
                  <span className="ml-2 text-xs text-slate-400">{note}</span>
                </div>
                <span className="flex-shrink-0 font-semibold tabular-nums text-primary">{pts}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="text-sm font-bold text-slate-800">Daily total</span>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">10 pts ✓ cap</span>
          </div>
        </div>
      </div>

      {/* Philosophy callout */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-center text-white">
        <p className="text-sm font-medium leading-relaxed">
          You don't need to be the fittest —<br />
          <strong className="text-base">just the most consistent.</strong>
        </p>
      </div>

    </div>
  );
}
