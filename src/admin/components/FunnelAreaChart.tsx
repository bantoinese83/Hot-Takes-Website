import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PairingHourBucket } from '../../lib/adminApi';
import { CHART_COLORS, chartMargin, formatHourTick } from './AdminChartTheme';

type Props = {
  data: PairingHourBucket[];
  height?: number;
};

export function FunnelAreaChart({ data, height = 280 }: Props) {
  const rows = data.map((b) => ({
    ...b,
    label: formatHourTick(b.hour),
  }));

  if (rows.length === 0) {
    return <p className="admin-empty">No funnel data in this window.</p>;
  }

  return (
    <div className="admin-chart-wrap" style={{ height, minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={rows} margin={chartMargin}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#1a1c1f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
            }}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="queue_joins"
            name="Joins"
            stroke={CHART_COLORS.join}
            fill={CHART_COLORS.join}
            fillOpacity={0.25}
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="queue_leaves"
            name="Leaves"
            stroke={CHART_COLORS.leave}
            fill={CHART_COLORS.leave}
            fillOpacity={0.2}
            stackId="2"
          />
          <Area
            type="monotone"
            dataKey="paired"
            name="Paired"
            stroke={CHART_COLORS.paired}
            fill={CHART_COLORS.paired}
            fillOpacity={0.35}
            stackId="3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
