'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TimelineData } from '@/types';
import { format, parseISO } from 'date-fns';

interface TimelineChartProps {
  data: TimelineData[];
}

export default function TimelineChart({ data }: TimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No timeline data available.
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    Date: format(parseISO(item.Date), 'MMM dd'),
  }));

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="Date"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Issues"
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={{ fill: '#4f46e5', r: 3 }}
            name="Issues"
          />
          <Line
            type="monotone"
            dataKey="PRs"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ fill: '#6366f1', r: 3 }}
            name="Pull Requests"
          />
          <Line
            type="monotone"
            dataKey="Total"
            stroke="#818cf8"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ fill: '#818cf8', r: 3 }}
            name="Total Activity"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
