'use client';

import { useDashboard } from '../context/DashboardContext';
import ContributorTable from '../components/charts/ContributorTable';
import BusFactor from '../components/charts/BusFactor';

export default function ContributorsPage() {
  const { data, loading } = useDashboard();

  if (!data?.data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Fetch data from the top bar to see contributor analytics.
      </div>
    );
  }

  const { contributorMetrics, kpis } = data.data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contributors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contributorMetrics.length} contributors &middot; {kpis.merged_prs} merged PRs
          </p>
        </div>
        {loading && <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Refreshing...</span>}
      </div>

      {/* Bus Factor */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <BusFactor contributorMetrics={contributorMetrics} totalMerged={kpis.merged_prs} />
      </div>

      {/* Contributor Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Throughput</h3>
        <ContributorTable data={contributorMetrics} />
      </div>
    </div>
  );
}
