'use client';

import { useDashboard } from './context/DashboardContext';
import KPICard from './components/KPICard';
import ExpandableChart from './components/ExpandableChart';
import ContributorChart from './components/charts/ContributorChart';
import LabelsChart from './components/charts/LabelsChart';
import TimelineChart from './components/charts/TimelineChart';
import ThroughputChart from './components/charts/ThroughputChart';
import { formatDuration, formatNumber, formatPercent, formatRate } from './lib/formatters';

export default function OverviewPage() {
  const { data, loading, error } = useDashboard();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
        Fetching data from GitHub...
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">GitHub Analytics Dashboard</h2>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          Configure your repository and date range above, then click &quot;Fetch Data&quot; to load analytics.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-1">PR Analytics</h3>
            <p className="text-sm text-gray-500">Merge rate, review quality, cycle times</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Issue Tracking</h3>
            <p className="text-sm text-gray-500">Backlog aging, bug/feature ratio</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Contributors</h3>
            <p className="text-sm text-gray-500">Throughput, review performance</p>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, contributors, labels, timeline, throughput } = data.data;

  // Bus factor: % PRs merged by top 2 contributors
  const sortedByMerged = [...(data.data.contributorMetrics || [])].sort((a, b) => b.prs_merged - a.prs_merged);
  const top2Merged = sortedByMerged.slice(0, 2).reduce((s, c) => s + c.prs_merged, 0);
  const busFactor = kpis.merged_prs > 0 ? (top2Merged / kpis.merged_prs) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
        {loading && (
          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Refreshing...</span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <KPICard
          label="Merge Rate"
          value={formatRate(kpis.merge_rate)}
          subtitle="PRs/weekday"
          color="indigo"
        />
        <KPICard
          label="Pick-up Time"
          value={formatDuration(kpis.pick_up_time_hours)}
          subtitle="to first review"
        />
        <KPICard
          label="Avg PR Size"
          value={formatNumber(kpis.avg_pr_size)}
          subtitle="lines changed"
        />
        <KPICard
          label="Open → Merge"
          value={formatDuration(kpis.open_to_merge_hours)}
          subtitle="median"
        />
        <KPICard
          label="Defect Rate"
          value={formatPercent(kpis.defect_rate)}
          subtitle="bug-linked PRs"
          color={kpis.defect_rate > 30 ? 'red' : 'default'}
        />
        <KPICard
          label="Release Rate"
          value={formatRate(kpis.release_rate)}
          subtitle="per week"
          color="green"
        />
        <KPICard
          label="Open Issues"
          value={formatNumber(kpis.open_issues)}
          color={kpis.open_issues > 50 ? 'amber' : 'default'}
        />
        <KPICard
          label="Merged PRs"
          value={formatNumber(kpis.merged_prs)}
          color="green"
        />
      </div>

      {/* Health Signals */}
      {busFactor > 50 && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <span className="text-amber-600 font-medium text-sm">Bus Factor Warning:</span>
          <span className="text-sm text-amber-800">
            Top 2 contributors account for {busFactor.toFixed(0)}% of merged PRs
          </span>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart
            title="Activity Timeline"
            description="PRs merged per week over the selected time range."
          >
            <TimelineChart data={timeline} />
          </ExpandableChart>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart
            title="Throughput"
            description="Issues closed vs PRs merged per month."
          >
            <ThroughputChart data={throughput} />
          </ExpandableChart>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart
            title="Top Contributors"
            description="Contributors ranked by total PRs and issues."
          >
            <ContributorChart data={contributors} />
          </ExpandableChart>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <ExpandableChart
            title="Label Distribution"
            description="Most common labels across issues."
          >
            <LabelsChart data={labels} />
          </ExpandableChart>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Issues" value={formatNumber(kpis.total_issues)} />
        <KPICard label="Closed Issues" value={formatNumber(kpis.closed_issues)} />
        <KPICard label="Total PRs" value={formatNumber(kpis.total_prs)} />
        <KPICard label="Comment Rate" value={formatNumber(kpis.comment_rate, 1)} subtitle="avg per PR" />
        <KPICard label="Open → Approval" value={formatDuration(kpis.open_to_approval_hours)} subtitle="median" />
        <KPICard label="Avg Resolution" value={`${kpis.avg_issue_resolution_days.toFixed(1)}d`} subtitle="issues" />
        <KPICard label="Bug/Feature Ratio" value={formatNumber(kpis.bug_feature_ratio, 2)} />
        <KPICard label="PRs Linked" value={formatPercent(kpis.pct_prs_linked_to_issues)} subtitle="to issues" />
      </div>
    </div>
  );
}
