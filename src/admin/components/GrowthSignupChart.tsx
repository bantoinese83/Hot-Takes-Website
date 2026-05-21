import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LaunchWaitlistDailyBucket } from '../../lib/adminApi';
import { CHART_COLORS, chartMargin } from './AdminChartTheme';

type Props = {
  data: LaunchWaitlistDailyBucket[];
  height?: number;
};

function formatDay(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function GrowthSignupChart({ data, height = 200 }: Props) {
  const rows = data.map((b) => ({
    ...b,
    label: formatDay(b.day),
  }));

  if (rows.length === 0) {
    return <p className="admin-empty">No launch signups in the last 30 days.</p>;
  }

  return (
    <div className="admin-chart-wrap" style={{ height, minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={chartMargin}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} allowDecimals={false} width={32} />
          <Tooltip
            contentStyle={{
              background: '#1a1c1f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e8eaed' }}
            formatter={(value: number) => [value, 'Signups']}
          />
          <Bar dataKey="signups" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
