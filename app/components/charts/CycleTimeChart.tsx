'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CycleTimeData } from '@/types';

interface CycleTimeChartProps {
  data: CycleTimeData[];
}

export default function CycleTimeChart({ data }: CycleTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No cycle time data available for merged PRs.
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">PR Cycle Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="Period"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)} days`} />
          <Line
            type="monotone"
            dataKey="Avg_Cycle_Time_Days"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: '#6366f1', r: 4 }}
            name="Avg Cycle Time"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
