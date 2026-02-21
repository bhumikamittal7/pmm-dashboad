'use client';

import { format } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

const QUICK_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'YTD', days: -1 },
  { label: '2025', year: 2025 },
  { label: '2024', year: 2024 },
  { label: '2023', year: 2023 },
];

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {

  const handleQuickRange = (range: typeof QUICK_RANGES[number]) => {
    const now = new Date();
    if (range.year) {
      onStartDateChange(new Date(`${range.year}-01-01`));
      onEndDateChange(new Date(`${range.year}-12-31`));
    } else if (range.days !== undefined && range.days === -1) {
      onStartDateChange(new Date(`${now.getFullYear()}-01-01`));
      onEndDateChange(now);
    } else if (range.days !== undefined) {
      const start = new Date(now);
      start.setDate(start.getDate() - range.days);
      onStartDateChange(start);
      onEndDateChange(now);
    }
  };

  const isActiveRange = (range: typeof QUICK_RANGES[number]): boolean => {
    const s = format(startDate, 'yyyy-MM-dd');
    const e = format(endDate, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    if (range.year) {
      return s === `${range.year}-01-01` && e === `${range.year}-12-31`;
    }
    if (range.days === -1) {
      // YTD: start is Jan 1 this year, end is today
      const ytdStart = `${new Date().getFullYear()}-01-01`;
      return s === ytdStart && e === today;
    }
    if (range.days !== undefined && range.days > 0) {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - range.days);
      const wantStart = format(start, 'yyyy-MM-dd');
      const wantEnd = format(end, 'yyyy-MM-dd');
      return s === wantStart && e === wantEnd;
    }
    return false;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={format(startDate, 'yyyy-MM-dd')}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onStartDateChange(d);
          }}
          max={format(endDate, 'yyyy-MM-dd')}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
        <span className="text-gray-400 text-xs">to</span>
        <input
          type="date"
          value={format(endDate, 'yyyy-MM-dd')}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onEndDateChange(d);
          }}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
      </div>
      <div className="flex items-center gap-1">
        {QUICK_RANGES.map((range) => (
          <button
            key={range.label}
            onClick={() => handleQuickRange(range)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              isActiveRange(range)
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
