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

  // Custom tooltip to show label name and count clearly
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as LabelData;
      const percent = ((data.Count / topLabels.reduce((sum, item) => sum + item.Count, 0)) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{data.Label}</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Count:</span> {data.Count.toLocaleString()} issues
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Percentage:</span> {percent}%
          </p>
        </div>
      );
    }
    return null;
  };

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
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
