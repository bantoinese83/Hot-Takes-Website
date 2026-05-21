import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, chartMargin } from './AdminChartTheme';

type Row = { label: string; count: number };

type Props = {
  data: Row[];
  height?: number;
  layout?: 'vertical' | 'horizontal';
  color?: string;
};

export function SimpleBarChart({ data, height = 220, layout = 'vertical', color = CHART_COLORS.accent }: Props) {
  if (data.length === 0) {
    return <p className="admin-empty">No data.</p>;
  }

  const yAxisWidth = layout === 'vertical' ? Math.min(160, Math.max(90, ...data.map((d) => d.label.length * 6))) : undefined;

  return (
    <div className="admin-chart-wrap" style={{ height, minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={layout === 'vertical' ? { ...chartMargin, left: 8 } : { ...chartMargin, left: 72 }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          {layout === 'vertical' ? (
            <>
              <XAxis type="number" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={yAxisWidth} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
              <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} allowDecimals={false} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: '#1a1c1f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
            }}
          />
          <Bar dataKey="count" fill={color} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
