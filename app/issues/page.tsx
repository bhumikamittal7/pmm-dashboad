'use client';

import { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import KPICard from '../components/KPICard';
import ExpandableChart from '../components/ExpandableChart';
import LabelsChart from '../components/charts/LabelsChart';
import BacklogAgingChart from '../components/charts/BacklogAgingChart';
import ThroughputChart from '../components/charts/ThroughputChart';
import { formatNumber, formatPercent } from '../lib/formatters';
type IssueSortKey = 'number' | 'title' | 'user' | 'state' | 'created_at';

export default function IssuesPage() {
  const { data, loading, repository } = useDashboard();
  const [labelFilter, setLabelFilter] = useState('');
  const [sortKey, setSortKey] = useState<IssueSortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [owner, repo] = repository?.includes('/') ? repository.split('/', 2) : ['', ''];
  const repoUrl = owner && repo ? `https://github.com/${owner}/${repo}` : null;

  if (!data?.data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Fetch data from the top bar to see issue analytics.
      </div>
    );
  }

  const { kpis, labels, backlogAging, throughput, issues, prIssueLinkage } = data.data;

  const filteredIssues = labelFilter
    ? issues.filter(i => i.labels.some(l => l.toLowerCase().includes(labelFilter.toLowerCase())))
    : issues;

  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      switch (sortKey) {
        case 'number':
          return sortAsc ? a.number - b.number : b.number - a.number;
        case 'title':
          return (sortAsc ? 1 : -1) * (a.title || '').localeCompare(b.title || '');
        case 'user':
          return (sortAsc ? 1 : -1) * (a.user || '').localeCompare(b.user || '');
        case 'state':
          return (sortAsc ? 1 : -1) * (a.state || '').localeCompare(b.state || '');
        case 'created_at':
        default:
          return sortAsc
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [filteredIssues, sortKey, sortAsc]);

  const handleSort = (key: IssueSortKey) => {
    if (key === sortKey) setSortAsc(a => !a);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIndicator = (key: IssueSortKey) => (key === sortKey ? (sortAsc ? ' ↑' : ' ↓') : '');

  // Issues with multiple PRs
  const issuePRCounts = new Map<number, number>();
  prIssueLinkage.forEach(link => {
    link.linked_issues.forEach(num => {
      issuePRCounts.set(num, (issuePRCounts.get(num) || 0) + 1);
    });
  });
  const issuesWithMultiplePRs = [...issuePRCounts.entries()].filter(([, count]) => count > 1).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Issue Analytics</h1>
        {loading && <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Refreshing...</span>}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <KPICard label="Open Issues" value={formatNumber(kpis.open_issues)} color={kpis.open_issues > 50 ? 'amber' : 'default'} />
        <KPICard label="New / Week" value={formatNumber(kpis.new_issues_per_week, 1)} />
        <KPICard label="Closed / Week" value={formatNumber(kpis.closed_issues_per_week, 1)} color="green" />
        <KPICard label="Avg Time to Close" value={`${kpis.avg_time_to_close_days.toFixed(1)}d`} />
        <KPICard label="Reopen Rate" value={formatPercent(kpis.reopen_rate)} color={kpis.reopen_rate > 10 ? 'red' : 'default'} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KPICard label="Bug/Feature Ratio" value={formatNumber(kpis.bug_feature_ratio, 2)} />
        <KPICard label="PRs Linked to Issues" value={formatPercent(kpis.pct_prs_linked_to_issues)} />
        <KPICard label="Issues Closed via PR" value={formatPercent(kpis.pct_issues_closed_via_pr)} />
        <KPICard label="Issues w/ Multiple PRs" value={formatNumber(issuesWithMultiplePRs)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="Label Distribution" description="Top labels across issues.">
            <LabelsChart data={labels} />
          </ExpandableChart>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="Backlog Aging" description="Open issues grouped by age bucket.">
            <BacklogAgingChart data={backlogAging} />
          </ExpandableChart>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart title="Issue Throughput" description="Issues closed and PRs merged per month.">
            <ThroughputChart data={throughput} />
          </ExpandableChart>
        </div>
      </div>

      {/* Issue Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Issues</h3>
          <input
            type="text"
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            placeholder="Filter by label..."
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
                  onClick={() => handleSort('state')}
                >
                  State{sortIndicator('state')}
                </th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 whitespace-nowrap">Labels</th>
                <th
                  className="text-left py-3 px-3 font-semibold text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  onClick={() => handleSort('created_at')}
                >
                  Created{sortIndicator('created_at')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedIssues.slice(0, 50).map((issue, i) => (
                <tr
                  key={issue.number}
                  className={`border-b border-gray-100 hover:bg-indigo-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="py-3 px-3">
                    {repoUrl ? (
                      <a
                        href={`${repoUrl}/issues/${issue.number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        #{issue.number}
                      </a>
                    ) : (
                      <span className="text-gray-500">#{issue.number}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-900 max-w-xs truncate" title={issue.title}>
                    {issue.title}
                  </td>
                  <td className="py-3 px-3 text-gray-600">{issue.user}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                      issue.state === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {issue.state}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {issue.labels.slice(0, 3).map(l => (
                        <span key={l} className="px-1.5 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded">
                          {l}
                        </span>
                      ))}
                      {issue.labels.length > 3 && (
                        <span className="text-xs text-gray-400">+{issue.labels.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{new Date(issue.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredIssues.length > 50 && (
            <p className="text-xs text-gray-500 mt-2 text-center">Showing 50 of {filteredIssues.length} issues</p>
          )}
        </div>
      </div>
    </div>
  );
}
