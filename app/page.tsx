'use client';

import { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import ConfigSidebar from './components/ConfigSidebar';
import MobileWarning from './components/MobileWarning';
import KPICards from './components/KPICards';
import ThroughputChart from './components/charts/ThroughputChart';
import CycleTimeChart from './components/charts/CycleTimeChart';
import ContributorChart from './components/charts/ContributorChart';
import LabelsChart from './components/charts/LabelsChart';
import TimelineChart from './components/charts/TimelineChart';
import IssueAgingChart from './components/charts/IssueAgingChart';
import PRSizeMergeTimeChart from './components/charts/PRSizeMergeTimeChart';
import AuthorMergeTimeChart from './components/charts/AuthorMergeTimeChart';
import ReviewerMergeTimeChart from './components/charts/ReviewerMergeTimeChart';
import ExpandableChart from './components/ExpandableChart';
import DataTables from './components/DataTables';
import { fetchRepositoryData } from './lib/api';
import { FetchDataResponse } from '@/types';

export default function Home() {
  const [repository, setRepository] = useState('');
  // Default to Jan 1 - Dec 31, 2025
  const [startDate, setStartDate] = useState<Date>(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date('2025-12-31'));
  const [data, setData] = useState<FetchDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

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
        // Silently fail - user can still enter repository manually
        console.error('Failed to load config:', err);
      }
    }
    loadConfig();
  }, []);

  const handleFetch = async (forceRefresh: boolean = false) => {
    const repoToUse = repository;
    if (!repoToUse || !repoToUse.includes('/')) {
      setError('Please enter a valid repository in the format: owner/repo');
      return;
    }

    setLoading(true);
    setError(null);
    setIsFromCache(false);

    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const { getCachedData } = await import('./lib/cache');
        const cached = getCachedData(repository, startDate, endDate);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }

      const response = await fetchRepositoryData(repository, startDate, endDate, !forceRefresh);
      if (response.success && response.data) {
        setData(response);
        setIsFromCache(false);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileWarning />
      <div className="flex h-screen bg-white">
        <ConfigSidebar
        repository={repository}
        setRepository={setRepository}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onFetch={handleFetch}
        loading={loading}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">
            GitHub Repository Analytics Dashboard
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              {data ? 'Refreshing data from GitHub...' : 'Fetching data from GitHub...'}
            </div>
          )}

          {data?.data ? (
            <>
              {isFromCache && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  Showing cached data (1 hour TTL). Click "Force Refresh" to fetch fresh data.
                </div>
              )}
              <KPICards kpis={data.data.kpis} />
              
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Analytics Dashboard
                </h2>

                <div className="mb-6">
                  <h3 className="text-xl font-medium text-gray-800 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="Throughput: PRs Merged vs Issues Closed">
                        <ThroughputChart data={data.data.throughput} />
                      </ExpandableChart>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="PR Cycle Time">
                        <CycleTimeChart data={data.data.cycleTime} />
                      </ExpandableChart>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-medium text-gray-800 mb-4">
                    Contribution & Organization
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="Top Contributors">
                        <ContributorChart data={data.data.contributors} />
                      </ExpandableChart>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="Label Distribution">
                        <LabelsChart data={data.data.labels} />
                      </ExpandableChart>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-medium text-gray-800 mb-4">
                    Trends & Aging
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="Issue Aging Distribution">
                        <IssueAgingChart data={data.data.issueAging} />
                      </ExpandableChart>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="Activity Timeline">
                        <TimelineChart data={data.data.timeline} />
                      </ExpandableChart>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-medium text-gray-800 mb-4">
                    PR Analysis
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="Average PR Merge Time by Author">
                        <AuthorMergeTimeChart data={data.data.mergeTimeByAuthor} />
                      </ExpandableChart>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="Average PR Merge Time by Reviewer">
                        <ReviewerMergeTimeChart data={data.data.mergeTimeByReviewer} />
                      </ExpandableChart>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 mt-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <ExpandableChart title="PR Size vs Merge Time">
                        <PRSizeMergeTimeChart data={data.data.prSizeMergeTime} />
                      </ExpandableChart>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <DataTables
                    issues={data.data.issues}
                    prs={data.data.prs}
                    prIssueLinkage={data.data.prIssueLinkage}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  GitHub Repository Analytics
                </h2>
                <p className="text-gray-600 mb-8">
                  Gain deep insights into your repository's performance with comprehensive analytics
                  on throughput, cycle time, contributions, and issue management.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Throughput Analysis</h3>
                    <p className="text-sm text-gray-600">Track PR merges vs issue closures over time</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Cycle Time Metrics</h3>
                    <p className="text-sm text-gray-600">Monitor PR merge time efficiency</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Contributor Insights</h3>
                    <p className="text-sm text-gray-600">Top contributor leaderboard</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Label Analytics</h3>
                    <p className="text-sm text-gray-600">Label distribution and usage patterns</p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm">
                  Use the sidebar to configure your repository and fetch data
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </>
  );
}
