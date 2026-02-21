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
import { BacklogAgingBucket } from '@/types';

interface Props {
  data: BacklogAgingBucket[];
}

const BUCKET_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];

export default function BacklogAgingChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        No backlog data available.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => [value, 'Issues']} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
