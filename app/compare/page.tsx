'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { fetchRepositoryData } from '../lib/api';
import { FetchDataResponse, KPIs } from '@/types';

interface ComparisonData {
  label: string;
  startDate: Date;
  endDate: Date;
  kpis: KPIs | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
}

export default function ComparePage() {
  const router = useRouter();
  const [repository, setRepository] = useState('');
  const [comparisons, setComparisons] = useState<ComparisonData[]>([
    {
      label: 'Period 1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      kpis: null,
      loading: false,
      error: null,
      isFromCache: false,
    },
    {
      label: 'Period 2',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      kpis: null,
      loading: false,
      error: null,
      isFromCache: false,
    },
  ]);

  // Load default repository from environment on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        if (config.repository) {
          setRepository(config.repository);
        }
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    }
    loadConfig();
  }, []);

  const handleDateChange = (
    index: number,
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    const newComparisons = [...comparisons];
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      newComparisons[index][field] = date;
      // Reset KPIs when dates change
      newComparisons[index].kpis = null;
      newComparisons[index].error = null;
      newComparisons[index].isFromCache = false;
      setComparisons(newComparisons);
    }
  };

  const handleLabelChange = (index: number, label: string) => {
    const newComparisons = [...comparisons];
    newComparisons[index].label = label;
    setComparisons(newComparisons);
  };

  const fetchKPIs = async (index: number, forceRefresh: boolean = false) => {
    if (!repository || !repository.includes('/')) {
      const newComparisons = [...comparisons];
      newComparisons[index].error = 'Please configure repository first';
      setComparisons(newComparisons);
      return;
    }

    const comparison = comparisons[index];
    const startDate = comparison.startDate;
    const endDate = comparison.endDate;

    if (startDate > endDate) {
      const newComparisons = [...comparisons];
      newComparisons[index].error = 'Start date must be before end date';
      setComparisons(newComparisons);
      return;
    }

    const newComparisons = [...comparisons];
    newComparisons[index].loading = true;
    newComparisons[index].error = null;
    newComparisons[index].isFromCache = false;
    setComparisons(newComparisons);

    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const { getCachedData } = await import('../lib/cache');
        const cached = getCachedData(repository, startDate, endDate);
        if (cached && cached.success && cached.data) {
          newComparisons[index].kpis = cached.data.kpis;
          newComparisons[index].loading = false;
          newComparisons[index].error = null;
          newComparisons[index].isFromCache = true;
          setComparisons(newComparisons);
          return;
        }
      }

      const response = await fetchRepositoryData(
        repository,
        startDate,
        endDate,
        !forceRefresh
      );

      if (response.success && response.data) {
        newComparisons[index].kpis = response.data.kpis;
        newComparisons[index].loading = false;
        newComparisons[index].error = null;
        newComparisons[index].isFromCache = false;
      } else {
        newComparisons[index].error = response.error || 'Failed to fetch data';
        newComparisons[index].loading = false;
      }
    } catch (err) {
      newComparisons[index].error =
        err instanceof Error ? err.message : 'An error occurred';
      newComparisons[index].loading = false;
    }

    setComparisons(newComparisons);
  };

  const addComparison = () => {
    const newComparison: ComparisonData = {
      label: `Period ${comparisons.length + 1}`,
      startDate: new Date(),
      endDate: new Date(),
      kpis: null,
      loading: false,
      error: null,
      isFromCache: false,
    };
    setComparisons([...comparisons, newComparison]);
  };

  const removeComparison = (index: number) => {
    if (comparisons.length > 1) {
      const newComparisons = comparisons.filter((_, i) => i !== index);
      setComparisons(newComparisons);
    }
  };

  const kpiFields: Array<{ key: keyof KPIs; label: string; format?: (val: number) => string }> = [
    { key: 'total_issues', label: 'Total Issues' },
    { key: 'open_issues', label: 'Open Issues' },
    { key: 'closed_issues', label: 'Closed Issues' },
    {
      key: 'avg_issue_resolution_days',
      label: 'Avg Issue Resolution',
      format: (val) => (val > 0 ? `${val.toFixed(1)}d` : 'N/A'),
    },
    { key: 'total_prs', label: 'Total PRs' },
    { key: 'open_prs', label: 'Open PRs' },
    { key: 'merged_prs', label: 'Merged PRs' },
    {
      key: 'avg_pr_merge_days',
      label: 'Avg PR Merge Time',
      format: (val) => (val > 0 ? `${val.toFixed(1)}d` : 'N/A'),
    },
  ];

  const calculateChange = (current: number | null, previous: number | null): number | null => {
    if (current === null || previous === null || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">KPI Comparison</h1>
            <p className="text-sm text-gray-600 mt-1">
              Compare KPIs across different date ranges
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Repository Configuration */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repository (owner/repo)
          </label>
          <input
            type="text"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="e.g., octocat/Hello-World"
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Comparison Periods */}
        <div className="space-y-4 mb-8">
          {comparisons.map((comparison, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={comparison.label}
                    onChange={(e) => handleLabelChange(index, e.target.value)}
                    className="text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none"
                    placeholder="Period label"
                  />
                  <div className="flex gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={format(comparison.startDate, 'yyyy-MM-dd')}
                        onChange={(e) =>
                          handleDateChange(index, 'startDate', e.target.value)
                        }
                        max={format(comparison.endDate, 'yyyy-MM-dd')}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={format(comparison.endDate, 'yyyy-MM-dd')}
                        onChange={(e) =>
                          handleDateChange(index, 'endDate', e.target.value)
                        }
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchKPIs(index, false)}
                    disabled={comparison.loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {comparison.loading ? 'Loading...' : 'Fetch KPIs'}
                  </button>
                  <button
                    onClick={() => fetchKPIs(index, true)}
                    disabled={comparison.loading}
                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    title="Force refresh (bypass cache)"
                  >
                    🔄
                  </button>
                  {comparisons.length > 1 && (
                    <button
                      onClick={() => removeComparison(index)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {comparison.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {comparison.error}
                </div>
              )}

              {comparison.isFromCache && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  Showing cached data (1 hour TTL). Click refresh to fetch fresh data.
                </div>
              )}

              {comparison.kpis && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {kpiFields.map((field) => {
                      const value = comparison.kpis![field.key];
                      const displayValue =
                        field.format && typeof value === 'number'
                          ? field.format(value)
                          : value;
                      return (
                        <div
                          key={field.key}
                          className="text-center p-2 bg-white rounded border border-gray-200"
                        >
                          <div className="text-lg font-bold text-gray-900">
                            {displayValue}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {field.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addComparison}
          className="mb-8 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
        >
          + Add Another Period
        </button>

        {/* Side-by-Side Comparison Table */}
        {comparisons.some((c) => c.kpis !== null) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Side-by-Side Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Metric
                    </th>
                    {comparisons.map((comp, idx) => (
                      <th
                        key={idx}
                        className="text-center py-3 px-4 font-semibold text-gray-900 min-w-[150px]"
                      >
                        {comp.label}
                        <div className="text-xs font-normal text-gray-500 mt-1">
                          {format(comp.startDate, 'MMM d')} -{' '}
                          {format(comp.endDate, 'MMM d, yyyy')}
                        </div>
                      </th>
                    ))}
                    {comparisons.length === 2 &&
                      comparisons[0].kpis &&
                      comparisons[1].kpis && (
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 min-w-[120px]">
                          Change
                        </th>
                      )}
                  </tr>
                </thead>
                <tbody>
                  {kpiFields.map((field) => (
                    <tr
                      key={field.key}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-700">
                        {field.label}
                      </td>
                      {comparisons.map((comp, idx) => {
                        const value = comp.kpis?.[field.key] ?? null;
                        const displayValue =
                          value !== null
                            ? field.format && typeof value === 'number'
                              ? field.format(value)
                              : value
                            : '-';
                        return (
                          <td
                            key={idx}
                            className="py-3 px-4 text-center text-gray-900"
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                      {comparisons.length === 2 &&
                        comparisons[0].kpis &&
                        comparisons[1].kpis && (
                          <td className="py-3 px-4 text-center">
                            {(() => {
                              const val1 = comparisons[0].kpis![field.key];
                              const val2 = comparisons[1].kpis![field.key];
                              const change = calculateChange(
                                typeof val2 === 'number' ? val2 : null,
                                typeof val1 === 'number' ? val1 : null
                              );
                              if (change === null) return '-';
                              const isPositive = change > 0;
                              const color = isPositive
                                ? 'text-green-600'
                                : 'text-red-600';
                              return (
                                <span className={color}>
                                  {isPositive ? '+' : ''}
                                  {change.toFixed(1)}%
                                </span>
                              );
                            })()}
                          </td>
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
