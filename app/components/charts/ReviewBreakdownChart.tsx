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
import { ReviewBreakdownData } from '@/types';

interface Props {
  data: ReviewBreakdownData[];
}

export default function ReviewBreakdownChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        No review data available.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="approved" stackId="a" fill="#22c55e" name="Approved" />
          <Bar dataKey="changes_requested" stackId="a" fill="#f59e0b" name="Changes Requested" />
          <Bar dataKey="commented" stackId="a" fill="#6366f1" name="Commented" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
