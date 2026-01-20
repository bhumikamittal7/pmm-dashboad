'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ThroughputData } from '@/types';
import { CHART_COLORS } from '@/app/lib/chartColors';

interface ThroughputChartProps {
  data: ThroughputData[];
}

export default function ThroughputChart({ data }: ThroughputChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No throughput data available for the selected date range.
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Throughput: PRs Merged vs Issues Closed
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="Period"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Merged_PRs" fill={CHART_COLORS.primary} name="Merged PRs" />
          <Bar dataKey="Closed_Issues" fill={CHART_COLORS.secondary} name="Closed Issues" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
