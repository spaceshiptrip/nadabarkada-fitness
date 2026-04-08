import { Flame, CalendarDays, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Rules at a glance</CardTitle>
        <CardDescription>
          Active day = 10+ activity minutes. Full rules in the README.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

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
              ['Mobility / recovery (5+ min)', '+1 pt'],
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

      </CardContent>
    </Card>
  );
}
