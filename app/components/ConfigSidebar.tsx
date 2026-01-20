'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

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
    <aside className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration</h2>

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

        <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Performance</h4>
          <p className="text-xs text-gray-700 mb-2">
            Data is cached for 1 hour to minimize API calls and improve performance.
          </p>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 mt-3">Security</h4>
          <p className="text-xs text-gray-700">
            Your GitHub token is stored securely in environment variables and never exposed to the client.
          </p>
        </div>
      </div>
    </aside>
  );
}
