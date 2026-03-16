// src/components/DevicesPieChart.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DeviceClick } from '../types/index.js';

interface DevicesPieChartProps {
  data: DeviceClick[];
}

const COLORS: Record<string, string> = {
  desktop: '#0ea5e9',
  mobile: '#6366f1',
  tablet: '#f59e0b',
};

const FALLBACK_COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#10b981'];

export function DevicesPieChart({ data }: DevicesPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        Nenhum dado de dispositivo ainda.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="count"
          nameKey="device"
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.device}
              fill={COLORS[entry.device] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Legend
          formatter={(value) => (
            <span className="text-sm text-gray-600 capitalize">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
