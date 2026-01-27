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
import { ContributorData } from '@/types';
import { CHART_COLORS } from '@/app/lib/chartColors';

interface ContributorChartProps {
  data: ContributorData[];
}

export default function ContributorChart({ data }: ContributorChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No contributor data found.
      </div>
    );
  }

  // Filter to only show PRs, limit to top 10 contributors
  const prOnlyData = data
    .map(item => ({
      Contributor: item.Contributor,
      PRs: item.PRs,
    }))
    .filter(item => item.PRs > 0)
    .sort((a, b) => b.PRs - a.PRs)
    .slice(0, 10)
    .reverse();

  if (prOnlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No contributor data found.
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={prOnlyData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="Contributor"
            tick={{ fontSize: 12 }}
            width={90}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="PRs" fill={CHART_COLORS.primary} name="Pull Requests" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
