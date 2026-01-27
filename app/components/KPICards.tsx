import { KPIs } from '@/types';

interface KPICardsProps {
  kpis: KPIs;
}

export default function KPICards({ kpis }: KPICardsProps) {
  const kpiData = [
    { label: 'Total Issues', value: kpis.total_issues, color: '#6366f1' },
    { label: 'Open Issues', value: kpis.open_issues, color: '#4f46e5' },
    { label: 'Closed Issues', value: kpis.closed_issues, color: '#3730a3' },
    {
      label: 'Avg Issue Resolution',
      value: kpis.avg_issue_resolution_days > 0
        ? `${kpis.avg_issue_resolution_days.toFixed(1)}d`
        : 'N/A',
      color: '#10b981',
    },
    { label: 'Total PRs', value: kpis.total_prs, color: '#6366f1' },
    { label: 'Open PRs', value: kpis.open_prs, color: '#4f46e5' },
    { label: 'Merged PRs', value: kpis.merged_prs, color: '#3730a3' },
    {
      label: 'Avg PR Merge Time',
      value: kpis.avg_pr_merge_days > 0
        ? `${kpis.avg_pr_merge_days.toFixed(1)}d`
        : 'N/A',
      color: '#f59e0b',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm"
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
