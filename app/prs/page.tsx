'use client';

import { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import KPICard from '../components/KPICard';
import ExpandableChart from '../components/ExpandableChart';
import ReviewBreakdownChart from '../components/charts/ReviewBreakdownChart';
import PRSizeDistributionChart from '../components/charts/PRSizeDistributionChart';
import PRSizeMergeTimeChart from '../components/charts/PRSizeMergeTimeChart';
import CycleTimeChart from '../components/charts/CycleTimeChart';
import AuthorMergeTimeChart from '../components/charts/AuthorMergeTimeChart';
import ReviewerMergeTimeChart from '../components/charts/ReviewerMergeTimeChart';
import { formatDuration, formatNumber, formatRate, isBot } from '../lib/formatters';
import type { PullRequest } from '@/types';

type PRSortKey = 'number' | 'title' | 'user' | 'status' | 'size' | 'reviewsCount' | 'created_at';

export default function PRsPage() {
  const { data, loading, repository } = useDashboard();
  const [authorFilter, setAuthorFilter] = useState('');
  const [sortKey, setSortKey] = useState<PRSortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [owner, repo] = repository?.includes('/') ? repository.split('/', 2) : ['', ''];
  const repoUrl = owner && repo ? `https://github.com/${owner}/${repo}` : null;

  if (!data?.data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Fetch data from the top bar to see PR analytics.
      </div>
    );
  }

  const { kpis, reviewBreakdown, prSizeDistribution, prSizeMergeTime, cycleTime, mergeTimeByAuthor, mergeTimeByReviewer, prs } = data.data;

  const filteredPRs = authorFilter
    ? prs.filter(p => p.user.toLowerCase().includes(authorFilter.toLowerCase()))
    : prs;

  const sortedPRs = useMemo(() => {
    return [...filteredPRs].sort((a, b) => {
      switch (sortKey) {
        case 'number':
          return sortAsc ? a.number - b.number : b.number - a.number;
        case 'title':
          return (sortAsc ? 1 : -1) * (a.title || '').localeCompare(b.title || '');
        case 'user':
          return (sortAsc ? 1 : -1) * (a.user || '').localeCompare(b.user || '');
        case 'status': {
          const order = (p: PullRequest) => (p.merged ? 2 : p.state === 'open' ? 1 : 0);
          return sortAsc ? order(a) - order(b) : order(b) - order(a);
        }
        case 'size': {
          const size = (p: PullRequest) => (p.additions || 0) + (p.deletions || 0);
          return sortAsc ? size(a) - size(b) : size(b) - size(a);
        }
        case 'reviewsCount':
          return sortAsc
            ? (a.reviews?.length ?? 0) - (b.reviews?.length ?? 0)
            : (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0);
        case 'created_at':
        default:
          return sortAsc
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [filteredPRs, sortKey, sortAsc]);

  const handleSort = (key: PRSortKey) => {
    if (key === sortKey) setSortAsc(a => !a);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIndicator = (key: PRSortKey) => (key === sortKey ? (sortAsc ? ' ↑' : ' ↓') : '');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pull Request Analytics</h1>
        {loading && <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Refreshing...</span>}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <KPICard label="Merge Rate" value={formatRate(kpis.merge_rate)} subtitle="PRs/weekday" color="indigo" />
        <KPICard label="Comment Rate" value={formatNumber(kpis.comment_rate, 1)} subtitle="avg per PR" />
        <KPICard label="Pick-up Time" value={formatDuration(kpis.pick_up_time_hours)} subtitle="to first review" />
        <KPICard label="Open → Merge" value={formatDuration(kpis.open_to_merge_hours)} subtitle="median" />
        <KPICard label="Avg PR Size" value={formatNumber(kpis.avg_pr_size)} subtitle="lines changed" />
      </div>

      {/* Review Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <KPICard label="Approved" value={formatNumber(kpis.reviews_approved)} color="green" />
        <KPICard label="Changes Requested" value={formatNumber(kpis.reviews_changes_requested)} color="amber" />
        <KPICard label="Commented" value={formatNumber(kpis.reviews_commented)} color="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="Review Breakdown by Week" description="Stacked count of review types per week.">
            <ReviewBreakdownChart data={reviewBreakdown} />
          </ExpandableChart>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="PR Size Distribution" description="Distribution of PR sizes in lines changed.">
            <PRSizeDistributionChart data={prSizeDistribution} />
          </ExpandableChart>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="Cycle Time Trend" description="Average days from PR open to merge, by month.">
            <CycleTimeChart data={cycleTime} />
          </ExpandableChart>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="PR Size vs Merge Time" description="Scatter plot of PR size against merge time.">
            <PRSizeMergeTimeChart data={prSizeMergeTime} />
          </ExpandableChart>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="Merge Time by Author" description="Average merge time grouped by PR author.">
            <AuthorMergeTimeChart data={mergeTimeByAuthor} />
          </ExpandableChart>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="Merge Time by Reviewer" description="Average merge time grouped by reviewer.">
            <ReviewerMergeTimeChart data={mergeTimeByReviewer} />
          </ExpandableChart>
        </div>
      </div>

      {/* PR Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pull Requests</h3>
          <input
            type="text"
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            placeholder="Filter by author..."
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th
                  className="text-left py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  onClick={() => handleSort('number')}
                >
                  #{sortIndicator('number')}
                </th>
                <th
                  className="text-left py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 max-w-xs"
                  onClick={() => handleSort('title')}
                >
                  Title{sortIndicator('title')}
                </th>
                <th
                  className="text-left py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  onClick={() => handleSort('user')}
                >
                  Author{sortIndicator('user')}
                </th>
                <th
                  className="text-left py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  onClick={() => handleSort('status')}
                >
                  Status{sortIndicator('status')}
                </th>
                <th
                  className="text-right py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  onClick={() => handleSort('size')}
                >
                  Size{sortIndicator('size')}
                </th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 whitespace-nowrap">Reviewer(s)</th>
                <th
                  className="text-right py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  onClick={() => handleSort('reviewsCount')}
                >
                  Reviews{sortIndicator('reviewsCount')}
                </th>
                <th
                  className="text-left py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  onClick={() => handleSort('created_at')}
                >
                  Created{sortIndicator('created_at')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPRs.slice(0, 50).map((pr, i) => {
                const reviewers = [...new Set((pr.reviews || []).filter(r => !isBot(r.user) && r.user !== pr.user).map(r => r.user))];
                return (
                  <tr
                    key={pr.number}
                    className={`border-b border-gray-100 hover:bg-indigo-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="py-3 px-3">
                      {repoUrl ? (
                        <a
                          href={`${repoUrl}/pull/${pr.number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          #{pr.number}
                        </a>
                      ) : (
                        <span className="text-gray-500">#{pr.number}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-900 max-w-xs truncate" title={pr.title}>
                      {pr.title}
                    </td>
                    <td className="py-3 px-3 text-gray-600">{pr.user}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                        pr.merged ? 'bg-purple-100 text-purple-700' :
                        pr.state === 'open' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {pr.merged ? 'Merged' : pr.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      +{pr.additions || 0} / −{pr.deletions || 0}
                    </td>
                    <td className="py-3 px-3 text-gray-600 max-w-[180px]">
                      {reviewers.length > 0 ? (
                        <span className="truncate block" title={reviewers.join(', ')}>
                          {reviewers.join(', ')}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">{(pr.reviews || []).length}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{new Date(pr.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPRs.length > 50 && (
            <p className="text-xs text-gray-500 mt-2 text-center">Showing 50 of {filteredPRs.length} PRs</p>
          )}
        </div>
      </div>
    </div>
  );
}
