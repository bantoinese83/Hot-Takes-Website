import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyFunnelBucket } from '../../lib/adminApi';
import { CHART_COLORS, chartMargin, formatDayTick } from './AdminChartTheme';

type Props = {
  data: DailyFunnelBucket[];
  height?: number;
};

export function DailyFunnelBarChart({ data, height = 300 }: Props) {
  const rows = data.map((b) => ({
    ...b,
    label: formatDayTick(b.day),
  }));

  if (rows.length === 0) {
    return <p className="admin-empty">No daily funnel data yet.</p>;
  }

  return (
    <div className="admin-chart-wrap" style={{ height, minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={chartMargin}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#1a1c1f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
            }}
          />
          <Legend />
          <Bar dataKey="queue_joins" name="Joins" fill={CHART_COLORS.join} radius={[4, 4, 0, 0]} />
          <Bar dataKey="paired" name="Paired" fill={CHART_COLORS.paired} radius={[4, 4, 0, 0]} />
          <Bar dataKey="queue_leaves" name="Leaves" fill={CHART_COLORS.leave} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
