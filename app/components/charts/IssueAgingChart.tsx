'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { IssueAgingData } from '@/types';
import { CHART_COLORS } from '@/app/lib/chartColors';
import { format, parseISO } from 'date-fns';

interface IssueAgingChartProps {
  data: IssueAgingData[];
}

function getColorForAge(ageDays: number): string {
  if (ageDays <= 7) {
    return CHART_COLORS.success;
  } else if (ageDays <= 30) {
    return CHART_COLORS.warning;
  } else {
    return CHART_COLORS.error;
  }
}

export default function IssueAgingChart({ data }: IssueAgingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No issue aging data available.
      </div>
    );
  }

  // Format data for scatter plot - use PR merge date as X axis and age as Y axis
  const scatterData = data.map((item) => ({
    x: new Date(item.PR_Merge_Date).getTime(),
    y: item.Age_Days,
    issueNumber: item.Issue_Number,
    issueTitle: item.Issue_Title,
    prMergeDate: item.PR_Merge_Date,
    ageDays: item.Age_Days,
  }));

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Aging by PR Merge Date</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          data={scatterData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
            angle={-45}
            textAnchor="end"
            height={80}
            label={{ value: 'PR Merge Date', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fontSize: 12 }}
            label={{ value: 'Age (Days)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="font-semibold">Issue #{data.issueNumber}</p>
                    <p className="text-sm text-gray-600 mb-1">{data.issueTitle}</p>
                    <p className="text-sm">
                      <span className="font-medium">PR Merge Date:</span>{' '}
                      {format(parseISO(data.prMergeDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Age:</span> {data.ageDays.toFixed(1)} days
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Issues" data={scatterData} fill={CHART_COLORS.primary}>
            {scatterData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColorForAge(entry.y)}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }}></div>
          <span>0-7 days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.warning }}></div>
          <span>7-30 days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.error }}></div>
          <span>30+ days</span>
        </div>
      </div>
    </div>
  );
}
