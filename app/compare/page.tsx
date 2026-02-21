'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { fetchRepositoryData } from '../lib/api';
import { ComputedKPIs } from '@/types';
import { formatDuration, formatNumber, formatPercent, formatRate } from '../lib/formatters';

interface ComparisonData {
  label: string;
  startDate: Date;
  endDate: Date;
  kpis: ComputedKPIs | null;
  loading: boolean;
  error: string | null;
}

// For some metrics, lower is better (merge time). For others, higher is better (merge rate).
const LOWER_IS_BETTER = new Set<keyof ComputedKPIs>([
  'pick_up_time_hours', 'open_to_approval_hours', 'open_to_merge_hours',
  'avg_issue_resolution_days', 'avg_pr_merge_days', 'avg_time_to_close_days',
  'defect_rate', 'reopen_rate', 'open_issues', 'open_prs',
  'prs_without_linked_issue', 'avg_pr_size',
]);

interface KPIField {
  key: keyof ComputedKPIs;
  label: string;
  format: (val: number) => string;
  section: string;
}

const KPI_FIELDS: KPIField[] = [
  // PR Metrics
  { key: 'total_prs', label: 'Total PRs', format: v => formatNumber(v), section: 'Pull Requests' },
  { key: 'merged_prs', label: 'Merged PRs', format: v => formatNumber(v), section: 'Pull Requests' },
  { key: 'open_prs', label: 'Open PRs', format: v => formatNumber(v), section: 'Pull Requests' },
  { key: 'merge_rate', label: 'Merge Rate (PRs/weekday)', format: v => formatRate(v), section: 'Pull Requests' },
  { key: 'comment_rate', label: 'Comment Rate (avg/PR)', format: v => formatNumber(v, 1), section: 'Pull Requests' },
  { key: 'pick_up_time_hours', label: 'Pick-up Time', format: v => formatDuration(v), section: 'Pull Requests' },
  { key: 'avg_pr_size', label: 'Avg PR Size (LOC)', format: v => formatNumber(v), section: 'Pull Requests' },
  { key: 'open_to_approval_hours', label: 'Open → Approval', format: v => formatDuration(v), section: 'Pull Requests' },
  { key: 'open_to_merge_hours', label: 'Open → Merge', format: v => formatDuration(v), section: 'Pull Requests' },
  { key: 'avg_pr_merge_days', label: 'Avg Merge Time (days)', format: v => `${v.toFixed(1)}d`, section: 'Pull Requests' },

  // Reviews
  { key: 'reviews_approved', label: 'Approved', format: v => formatNumber(v), section: 'Reviews' },
  { key: 'reviews_changes_requested', label: 'Changes Requested', format: v => formatNumber(v), section: 'Reviews' },
  { key: 'reviews_commented', label: 'Commented', format: v => formatNumber(v), section: 'Reviews' },

  // Issues
  { key: 'total_issues', label: 'Total Issues', format: v => formatNumber(v), section: 'Issues' },
  { key: 'open_issues', label: 'Open Issues', format: v => formatNumber(v), section: 'Issues' },
  { key: 'closed_issues', label: 'Closed Issues', format: v => formatNumber(v), section: 'Issues' },
  { key: 'new_issues_per_week', label: 'New Issues/Week', format: v => formatNumber(v, 1), section: 'Issues' },
  { key: 'closed_issues_per_week', label: 'Closed Issues/Week', format: v => formatNumber(v, 1), section: 'Issues' },
  { key: 'avg_time_to_close_days', label: 'Avg Time to Close', format: v => `${v.toFixed(1)}d`, section: 'Issues' },
  { key: 'reopen_rate', label: 'Reopen Rate', format: v => formatPercent(v), section: 'Issues' },
  { key: 'bug_feature_ratio', label: 'Bug/Feature Ratio', format: v => formatNumber(v, 2), section: 'Issues' },

  // Quality
  { key: 'release_rate', label: 'Release Rate (/week)', format: v => formatRate(v), section: 'Quality' },
  { key: 'defect_rate', label: 'Defect Rate', format: v => formatPercent(v), section: 'Quality' },
  { key: 'pct_prs_linked_to_issues', label: 'PRs Linked to Issues', format: v => formatPercent(v), section: 'Quality' },
  { key: 'pct_issues_closed_via_pr', label: 'Issues Closed via PR', format: v => formatPercent(v), section: 'Quality' },
  { key: 'prs_without_linked_issue', label: 'PRs w/o Linked Issue', format: v => formatNumber(v), section: 'Quality' },
];

export default function ComparePage() {
  const [repository, setRepository] = useState('');
  const [comparisons, setComparisons] = useState<ComparisonData[]>([
    { label: 'Period 1', startDate: new Date('2025-01-01'), endDate: new Date('2025-06-30'), kpis: null, loading: false, error: null },
    { label: 'Period 2', startDate: new Date('2025-07-01'), endDate: new Date('2025-12-31'), kpis: null, loading: false, error: null },
  ]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        if (config.repository) setRepository(config.repository);
      } catch { /* ignore */ }
    }
    loadConfig();
  }, []);

  const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const newComps = [...comparisons];
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      newComps[index] = { ...newComps[index], [field]: date, kpis: null, error: null };
      setComparisons(newComps);
    }
  };

  const fetchKPIs = async (index: number) => {
    if (!repository || !repository.includes('/')) {
      const newComps = [...comparisons];
      newComps[index] = { ...newComps[index], error: 'Configure repository first' };
      setComparisons(newComps);
      return;
    }

    const newComps = [...comparisons];
    newComps[index] = { ...newComps[index], loading: true, error: null };
    setComparisons(newComps);

    try {
      const response = await fetchRepositoryData(repository, comparisons[index].startDate, comparisons[index].endDate, true);
      const updated = [...comparisons];
      if (response.success && response.data) {
        updated[index] = { ...updated[index], kpis: response.data.kpis, loading: false };
      } else {
        updated[index] = { ...updated[index], error: response.error || 'Failed', loading: false };
      }
      setComparisons(updated);
    } catch (err) {
      const updated = [...comparisons];
      updated[index] = { ...updated[index], error: err instanceof Error ? err.message : 'Error', loading: false };
      setComparisons(updated);
    }
  };

  const addComparison = () => {
    setComparisons([...comparisons, {
      label: `Period ${comparisons.length + 1}`,
      startDate: new Date(),
      endDate: new Date(),
      kpis: null,
      loading: false,
      error: null,
    }]);
  };

  const removeComparison = (index: number) => {
    if (comparisons.length > 1) {
      setComparisons(comparisons.filter((_, i) => i !== index));
    }
  };

  const calculateChange = (current: number, previous: number): number | null => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const getChangeColor = (key: keyof ComputedKPIs, change: number): string => {
    const lowerBetter = LOWER_IS_BETTER.has(key);
    const isImprovement = lowerBetter ? change < 0 : change > 0;
    return isImprovement ? 'text-green-600' : 'text-red-600';
  };

  const sections = Array.from(new Set(KPI_FIELDS.map(f => f.section)));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Comparison</h1>
          <p className="text-sm text-gray-500 mt-1">Compare metrics across different time periods</p>
        </div>
      </div>

      {/* Repository */}
      {repository && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-500">Repository: </span>
          <span className="text-sm font-semibold text-gray-900">{repository}</span>
        </div>
      )}

      {/* Period Cards */}
      <div className="space-y-4 mb-6">
        {comparisons.map((comp, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={comp.label}
                  onChange={(e) => {
                    const newComps = [...comparisons];
                    newComps[index] = { ...newComps[index], label: e.target.value };
                    setComparisons(newComps);
                  }}
                  className="text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                    <input type="date" value={format(comp.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => handleDateChange(index, 'startDate', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                    <input type="date" value={format(comp.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => fetchKPIs(index)} disabled={comp.loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                  {comp.loading ? 'Loading...' : 'Fetch'}
                </button>
                {comparisons.length > 1 && (
                  <button onClick={() => removeComparison(index)}
                    className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Remove
                  </button>
                )}
              </div>
            </div>
            {comp.error && <p className="mt-2 text-sm text-red-600">{comp.error}</p>}
          </div>
        ))}
      </div>

      <button onClick={addComparison}
        className="mb-8 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100">
        + Add Period
      </button>

      {/* Comparison Table */}
      {comparisons.some(c => c.kpis !== null) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Side-by-Side Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                  {comparisons.map((comp, idx) => (
                    <th key={idx} className="text-center py-3 px-4 font-semibold text-gray-900 min-w-[130px]">
                      {comp.label}
                      <div className="text-xs font-normal text-gray-500 mt-0.5">
                        {format(comp.startDate, 'MMM d')} - {format(comp.endDate, 'MMM d, yyyy')}
                      </div>
                    </th>
                  ))}
                  {comparisons.length === 2 && comparisons.every(c => c.kpis) && (
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 min-w-[100px]">Change</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  <>
                    <tr key={`section-${section}`}>
                      <td colSpan={comparisons.length + 2} className="pt-4 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                        {section}
                      </td>
                    </tr>
                    {KPI_FIELDS.filter(f => f.section === section).map(field => (
                      <tr key={field.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-medium text-gray-700">{field.label}</td>
                        {comparisons.map((comp, idx) => {
                          const value = comp.kpis?.[field.key] ?? null;
                          return (
                            <td key={idx} className="py-2.5 px-4 text-center text-gray-900">
                              {value !== null ? field.format(value as number) : '-'}
                            </td>
                          );
                        })}
                        {comparisons.length === 2 && comparisons.every(c => c.kpis) && (
                          <td className="py-2.5 px-4 text-center">
                            {(() => {
                              const v1 = comparisons[0].kpis![field.key] as number;
                              const v2 = comparisons[1].kpis![field.key] as number;
                              const change = calculateChange(v2, v1);
                              if (change === null) return '-';
                              const color = getChangeColor(field.key, change);
                              return (
                                <span className={`font-medium ${color}`}>
                                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                </span>
                              );
                            })()}
                          </td>
                        )}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
