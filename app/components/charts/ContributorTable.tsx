'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ContributorMetrics } from '@/types';
import { formatDuration, formatNumber } from '@/app/lib/formatters';

interface Props {
  data: ContributorMetrics[];
}

type SortKey = keyof ContributorMetrics;

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right'; format: (c: ContributorMetrics) => string }[] = [
  { key: 'prs_merged', label: 'PRs merged', align: 'right', format: c => formatNumber(c.prs_merged) },
  { key: 'reviews_performed', label: 'PRs reviewed', align: 'right', format: c => formatNumber(c.reviews_performed) },
  { key: 'response_time_median_hours', label: 'Response time to review (median)', align: 'right', format: c => formatDuration(c.response_time_median_hours) },
  { key: 'time_waiting_on_review_median_hours', label: 'Time waiting on reviews (median)', align: 'right', format: c => formatDuration(c.time_waiting_on_review_median_hours) },
  { key: 'wait_time_to_first_review_median_hours', label: 'Wait time to first review (median)', align: 'right', format: c => formatDuration(c.wait_time_to_first_review_median_hours) },
  { key: 'publish_to_merge_time_median_hours', label: 'Publish to merge time (median)', align: 'right', format: c => formatDuration(c.publish_to_merge_time_median_hours) },
  { key: 'review_cycles_avg', label: 'Review cycles until merge (avg)', align: 'right', format: c => formatNumber(c.review_cycles_avg, 1) },
  { key: 'lines_deleted', label: 'Lines of code deleted', align: 'right', format: c => formatNumber(c.lines_deleted) },
  { key: 'lines_added', label: 'Lines of code added', align: 'right', format: c => formatNumber(c.lines_added) },
];

export default function ContributorTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('prs_merged');
  const [sortAsc, setSortAsc] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        No contributor data available.
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return String(aVal).localeCompare(String(bVal)) * (sortAsc ? 1 : -1);
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (key !== sortKey) return '';
    return sortAsc ? ' ↑' : ' ↓';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th
              className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
              onClick={() => handleSort('username')}
            >
              User{sortIndicator('username')}
            </th>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`py-3 px-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap text-xs ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}{sortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => (
            <tr
              key={c.username}
              className={`border-b border-gray-100 hover:bg-indigo-50 transition-colors cursor-pointer ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="py-3 px-4">
                <Link href={`/contributors/${c.username}`} className="flex items-center gap-2">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {c.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{c.username}</span>
                </Link>
              </td>
              {COLUMNS.map(col => (
                <td
                  key={col.key}
                  className={`py-3 px-3 ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                    col.key === 'lines_deleted' ? 'text-red-600' :
                    col.key === 'lines_added' ? 'text-green-600' :
                    'text-gray-700'
                  }`}
                >
                  {col.format(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
