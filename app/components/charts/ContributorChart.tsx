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

  // Limit to top 10 contributors
  const topContributors = data.slice(0, 10).reverse();

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topContributors}
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
          <Bar dataKey="PRs" stackId="a" fill="#6366f1" name="Pull Requests" />
          <Bar dataKey="Issues" stackId="a" fill="#4f46e5" name="Issues" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
