'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { IssueAgingData } from '@/types';
import { CHART_COLORS } from '@/app/lib/chartColors';

interface IssueAgingChartProps {
  data: IssueAgingData[];
}

const BUCKET_COLORS: Record<string, string> = {
  '0-7 days': CHART_COLORS.success,
  '7-30 days': CHART_COLORS.warning,
  '30+ days': CHART_COLORS.error,
};

export default function IssueAgingChart({ data }: IssueAgingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No issue aging data available.
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Aging Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Age_Bucket" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="Count">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BUCKET_COLORS[entry.Age_Bucket] || CHART_COLORS.primary}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
