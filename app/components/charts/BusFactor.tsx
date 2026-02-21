'use client';

import { ContributorMetrics } from '@/types';

interface Props {
  contributorMetrics: ContributorMetrics[];
  totalMerged: number;
}

export default function BusFactor({ contributorMetrics, totalMerged }: Props) {
  if (!contributorMetrics || contributorMetrics.length === 0 || totalMerged === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No contributor data available.
      </div>
    );
  }

  const sorted = [...contributorMetrics].sort((a, b) => b.prs_merged - a.prs_merged);
  const top5 = sorted.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Bus Factor Analysis</span>
        <span className="text-xs text-gray-500">{totalMerged} total merged PRs</span>
      </div>
      {top5.map((c, i) => {
        const pct = (c.prs_merged / totalMerged) * 100;
        return (
          <div key={c.username} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-4">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">{c.username}</span>
                <span className="text-xs text-gray-500">{c.prs_merged} PRs ({pct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${pct > 30 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
