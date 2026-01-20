'use client';

import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import HelpModal from './HelpModal';

interface ConfigSidebarProps {
  repository: string;
  setRepository: (repo: string) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  onFetch: (forceRefresh?: boolean) => void;
  loading: boolean;
}

export default function ConfigSidebar({
  repository,
  setRepository,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onFetch,
  loading,
}: ConfigSidebarProps) {
  const [envRepository, setEnvRepository] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        setEnvRepository(config.repository || null);
      } catch (err) {
        console.error('Failed to load config:', err);
        setEnvRepository(null);
      }
    }
    loadConfig();
  }, [repository]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setStartDate(date);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setEndDate(date);
    }
  };

  const isDateRangeValid = startDate <= endDate;
  const dateRangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <aside className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Help"
              aria-label="Open help"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Repository Settings</h3>
          
          {envRepository ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
              <p className="text-sm text-green-800">
                <strong>Repository:</strong> {envRepository}
              </p>
            </div>
          ) : (
            <>
              {repository ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                  <p className="text-sm text-green-800">
                    <strong>Repository:</strong> {repository}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                  <p className="text-sm text-red-800">Repository not configured.</p>
                  <p className="text-xs text-red-700 mt-1">
                    Set GITHUB_REPOSITORY in .env.local or enter manually below.
                  </p>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="repository" className="block text-sm font-medium text-gray-700 mb-2">
                  Repository (owner/repo)
                </label>
                <input
                  id="repository"
                  type="text"
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  placeholder="e.g., octocat/Hello-World"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Date Range</h3>
          
          {/* Quick Date Range Options */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Quick Select</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const start = new Date('2025-01-01');
                  const end = new Date('2025-12-31');
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                2025 (Full Year)
              </button>
              <button
                type="button"
                onClick={() => {
                  const end = new Date();
                  const start = subMonths(end, 3);
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                Last 3 Months
              </button>
              <button
                type="button"
                onClick={() => {
                  const end = new Date();
                  const start = subMonths(end, 6);
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                Last 6 Months
              </button>
              <button
                type="button"
                onClick={() => {
                  const end = new Date();
                  const start = subMonths(end, 12);
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                Last 12 Months
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={handleStartDateChange}
                max={format(endDate, 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={handleEndDateChange}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {!isDateRangeValid && (
            <p className="mt-2 text-sm text-red-600">Start date must be before end date!</p>
          )}

          {isDateRangeValid && dateRangeDays > 365 && (
            <p className="mt-2 text-sm text-amber-600">
              Large date range selected ({dateRangeDays} days). This may take longer to process.
            </p>
          )}

          {isDateRangeValid && dateRangeDays < 1 && (
            <p className="mt-2 text-sm text-red-600">Date range must be at least 1 day.</p>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => onFetch(false)}
            disabled={loading || !(envRepository || repository) || !isDateRangeValid || dateRangeDays < 1}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Fetching...' : 'Fetch Repository Data'}
          </button>
          <button
            onClick={() => onFetch(true)}
            disabled={loading || !(envRepository || repository) || !isDateRangeValid || dateRangeDays < 1}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            title="Force refresh (bypass cache)"
          >
            Force Refresh
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">How to Use</h4>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            {envRepository ? (
              <>
                <li>Repository is configured from <code className="bg-blue-100 px-1 rounded">GITHUB_REPOSITORY</code> env var</li>
                <li>Select your desired date range</li>
                <li>Click "Fetch Repository Data" to load analytics</li>
              </>
            ) : (
              <>
                <li>Enter your repository in the format: owner/repo</li>
                <li>Select your desired date range</li>
                <li>Click "Fetch Repository Data" to load analytics</li>
              </>
            )}
          </ol>
        </div>
      </div>
    </aside>
    <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
