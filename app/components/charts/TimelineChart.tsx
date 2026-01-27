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

  // Format dates for display - timeline now always uses weeks
  const formattedData = data.map((item) => {
    let displayDate: string;
    const parts = item.Date.split('-');
    
    if (parts.length === 3) {
      // It's a week start date string like "2025-01-01"
      try {
        const weekStart = parseISO(item.Date);
        displayDate = format(weekStart, 'MMM dd, yyyy');
      } catch {
        displayDate = item.Date;
      }
    } else if (parts.length === 2) {
      // It's a month string like "2025-01" (shouldn't happen now, but keep for compatibility)
      try {
        displayDate = format(new Date(`${item.Date}-01`), 'MMM yyyy');
      } catch {
        displayDate = item.Date;
      }
    } else {
      displayDate = item.Date;
    }
    
    return {
      ...item,
      Date: displayDate,
    };
  });

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
            dataKey="PRs"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            dot={{ fill: CHART_COLORS.primary, r: 3 }}
            name="Merged PRs"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
