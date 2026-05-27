import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm">
        <p className="text-[#888] text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-bold">
            {p.value}
            {unit && <span className="text-[#888] font-normal ml-1">{unit}</span>}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * ChartLine — wrapper around Recharts LineChart for exercise progress
 * data: [{ label: '...', value: number }]
 * color: line color
 * unit: display unit (e.g. "kg")
 * referenceLine: optional horizontal reference value
 */
export default function ChartLine({ data, color = '#e85d04', unit = 'kg', referenceLine }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#555] text-sm">
        No data yet — log some sessions!
      </div>
    );
  }

  const values = data.map((d) => d.value).filter(Boolean);
  const minVal = values.length > 0 ? Math.min(...values) * 0.95 : 0;
  const maxVal = values.length > 0 ? Math.max(...values) * 1.05 : 100;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[minVal, maxVal]}
          tick={{ fill: '#555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v)}`}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {referenceLine && (
          <ReferenceLine
            y={referenceLine}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: 'Goal', fill: '#f59e0b', fontSize: 10 }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#0a0a0a' }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
