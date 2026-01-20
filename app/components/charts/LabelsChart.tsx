'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { LabelData } from '@/types';

interface LabelsChartProps {
  data: LabelData[];
}

const COLORS = [
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#3730a3',
  '#312e81',
  '#581c87',
  '#7c3aed',
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
];

export default function LabelsChart({ data }: LabelsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No labels found in the selected date range.
      </div>
    );
  }

  // Limit to top 10 labels
  const topLabels = data.slice(0, 10);

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Label Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={topLabels}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ Label, percent }) => `${Label} ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="Count"
          >
            {topLabels.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
