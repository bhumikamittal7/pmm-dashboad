'use client';

import { useState } from 'react';
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
import { PRSizeMergeTimeData } from '@/types';

interface PRSizeMergeTimeChartProps {
  data: PRSizeMergeTimeData[];
}

const COLORS = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3'];

export default function PRSizeMergeTimeChart({ data }: PRSizeMergeTimeChartProps) {
  const [useLogScale, setUseLogScale] = useState(true);
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No PR size and merge time data available for merged PRs.
      </div>
    );
  }

  // Filter out zero or negative sizes and prepare data for log scale
  const validData = data.filter(point => point.Size > 0);
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No valid PR size data available for merged PRs.
      </div>
    );
  }

  // Find min and max for X/Y domain calculation
  const sizes = validData.map(d => d.Size);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  const mergeTimes = validData.map(d => d.Merge_Time_Days);
  const maxMergeTime = Math.max(...mergeTimes);

  const baseYTicks = [1, 2, 3, 5, 10, 15, 20, 30, 60];
  const yTicks = baseYTicks.filter(t => t <= maxMergeTime * 1.1);
  if (yTicks.length === 0) {
    yTicks.push(Math.max(1, Math.round(maxMergeTime)));
  }
  
  // Create clustered data with jitter for better visualization
  // For log scale: use logarithmic bins, for linear: use actual values with minimal jitter
  const createClusteredData = () => {
    if (!useLogScale) {
      // For linear scale, use actual sizes with minimal jitter to prevent overlap
      return validData.map(point => ({
        ...point,
        clusteredSize: point.Size + (Math.random() - 0.5) * (point.Size * 0.02), // 2% jitter
      }));
    }

    // For log scale: Group into logarithmic bins and add jitter within each bin
    const bins = new Map<string, PRSizeMergeTimeData[]>();
    
    validData.forEach(point => {
      // Create logarithmic bins
      let binKey: string;
      if (point.Size <= 10) binKey = '0-10';
      else if (point.Size <= 100) binKey = '10-100';
      else if (point.Size <= 1000) binKey = '100-1k';
      else if (point.Size <= 10000) binKey = '1k-10k';
      else binKey = '10k+';
      
      if (!bins.has(binKey)) {
        bins.set(binKey, []);
      }
      bins.get(binKey)!.push(point);
    });

    // Add jitter within each bin for visual clustering
    const clusteredData: Array<PRSizeMergeTimeData & { clusteredSize: number }> = [];
    
    bins.forEach((points, binKey) => {
      const binCenter = points.reduce((sum, p) => sum + p.Size, 0) / points.length;
      const binSpread = binCenter * 0.15; // 15% spread for clustering
      
      points.forEach((point, index) => {
        // Add jitter around the bin center for visual clustering
        const jitter = (Math.random() - 0.5) * binSpread;
        clusteredData.push({
          ...point,
          clusteredSize: Math.max(1, point.Size + jitter), // Ensure positive for log scale
        });
      });
    });

    return clusteredData.sort((a, b) => a.Size - b.Size);
  };

  const clusteredData = createClusteredData();

  // Custom tooltip to show PR details
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as PRSizeMergeTimeData;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">PR #{point.PR_Number}</p>
          <p className="text-xs text-gray-600 mb-2">{point.PR_Title}</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Size:</span> {point.Size.toLocaleString()} lines
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Merge Time:</span> {point.Merge_Time_Days.toFixed(1)} days
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          PR Size vs Merge Time
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Linear</span>
          <button
            onClick={() => setUseLogScale(!useLogScale)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              useLogScale ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={useLogScale}
            aria-label="Toggle scale type"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useLogScale ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">Log</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          data={clusteredData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="clusteredSize"
            name="PR Size"
            scale={useLogScale ? "log" : "linear"}
            domain={useLogScale 
              ? [Math.max(1, minSize * 0.5), maxSize * 1.5]
              : [Math.max(0, minSize * 0.9), maxSize * 1.1]
            }
            label={{ 
              value: `PR Size (lines changed, ${useLogScale ? 'log' : 'linear'} scale)`, 
              position: 'insideBottom', 
              offset: -5 
            }}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              if (value >= 1) return Math.round(value).toString();
              return value.toFixed(1);
            }}
          />
          <YAxis
            type="number"
            dataKey="Merge_Time_Days"
            name="Merge Time"
            ticks={yTicks}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(0)}d`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="PRs" dataKey="Merge_Time_Days" fill="#6366f1">
            {clusteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Each point represents a merged PR. Hover to see details.
      </p>
    </div>
  );
}
