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
import { CHART_COLORS } from '@/app/lib/chartColors';

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
            stroke={CHART_COLORS.secondary}
            strokeWidth={2.5}
            dot={{ fill: CHART_COLORS.secondary, r: 3 }}
            name="Issues"
          />
          <Line
            type="monotone"
            dataKey="PRs"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            dot={{ fill: CHART_COLORS.primary, r: 3 }}
            name="Pull Requests"
          />
          <Line
            type="monotone"
            dataKey="Total"
            stroke={CHART_COLORS.tertiary}
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ fill: CHART_COLORS.tertiary, r: 3 }}
            name="Total Activity"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
