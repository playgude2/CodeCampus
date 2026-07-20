import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/shared/empty-state';
import { scorePercent, type StudentScore } from '../types';

/** Percentage buckets students are distributed into. */
const BUCKETS = [
  { label: '0–20%', min: 0, max: 20 },
  { label: '20–40%', min: 20, max: 40 },
  { label: '40–60%', min: 40, max: 60 },
  { label: '60–80%', min: 60, max: 80 },
  { label: '80–100%', min: 80, max: 100 },
] as const;

interface ChartDatum {
  range: string;
  students: number;
}

export function ScoreDistributionChart({ students }: { students: StudentScore[] }) {
  const data = useMemo<ChartDatum[]>(() => {
    const counts = BUCKETS.map(() => 0);
    for (const s of students) {
      const pct = scorePercent(s.assignmentScore.finalScore, s.assignmentScore.maxScore);
      // Last bucket is inclusive of 100 so a perfect score lands in 80–100%.
      let idx = BUCKETS.findIndex((b) => pct >= b.min && pct < b.max);
      if (idx === -1) idx = BUCKETS.length - 1;
      counts[idx] += 1;
    }
    return BUCKETS.map((b, i) => ({ range: b.label, students: counts[i] }));
  }, [students]);

  if (students.length === 0) {
    return (
      <EmptyState
        title="No data to chart"
        description="Grades will be visualized here once students are enrolled and scored."
      />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
            contentStyle={{
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              color: 'var(--color-popover-foreground)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
            formatter={(value) => [value, 'Students']}
          />
          <Bar
            dataKey="students"
            fill="var(--color-primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={64}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
