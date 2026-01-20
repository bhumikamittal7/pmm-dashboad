import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MergeTimeByUser } from '@/types';
import { CHART_COLORS } from '@/app/lib/chartColors';

interface AuthorMergeTimeChartProps {
  data: MergeTimeByUser[];
}

export default function AuthorMergeTimeChart({ data }: AuthorMergeTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No author merge time data available.
      </div>
    );
  }

  // Show top 15 authors by PR count
  const topAuthors = [...data].sort((a, b) => b.count - a.count).slice(0, 15);

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Average PR Merge Time by Author
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topAuthors}
          margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="user"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: any, name: any, props: any) => {
              if (name === 'avg_merge_days') {
                return [`${(value as number).toFixed(1)} days`, 'Avg Merge Time'];
              }
              if (name === 'count') {
                return [value, 'Merged PRs'];
              }
              return [value, name];
            }}
          />
          <Bar
            dataKey="avg_merge_days"
            fill={CHART_COLORS.primary}
            name="Avg Merge Time (days)"
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Top authors by merged PR count. Hover to see details.
      </p>
    </div>
  );
}

