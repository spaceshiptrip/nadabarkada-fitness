import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ruleGroups = [
  {
    title: 'Daily points',
    items: [
      '10–19 active min = 1',
      '20–29 = 2',
      '30–44 = 3',
      '45–59 = 4',
      '60+ = 5',
      'Workout completed = +2',
      '6,000+ steps = +1',
      '8,000+ steps = +2',
      '10,000+ steps = +3',
      'Mobility/stretching = +1',
      'Daily cap = 10',
    ],
  },
  {
    title: 'Weekly bonuses',
    items: [
      '3 active days = +3',
      '5 active days = +6',
      '6+ active days = +8',
      'Active min +10% over baseline = +3',
      'Active min +20% = +5',
      'Active min +30% = +7',
      'Steps +10% over baseline = +2',
      'Steps +20% = +4',
      'Best week so far = +2',
    ],
  },
];

export default function RulesCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Scoring rules</CardTitle>
        <CardDescription>
          Designed to reward effort, consistency, and improvement instead of raw fitness alone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {ruleGroups.map((group) => (
          <div key={group.title} className="rounded-2xl border bg-slate-50 p-4">
            <h3 className="mb-3 font-semibold">{group.title}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {group.items.map((item) => (
                <li key={item} className="leading-relaxed">• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
