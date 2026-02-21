'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDashboard } from '../../context/DashboardContext';
import KPICard from '../../components/KPICard';
import { formatDuration, formatNumber, formatPercent, isBot } from '../../lib/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';

export default function ContributorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data, repository } = useDashboard();
  const [owner, repo] = repository?.includes('/') ? repository.split('/', 2) : ['', ''];
  const repoUrl = owner && repo ? `https://github.com/${owner}/${repo}` : null;

  if (!data?.data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Fetch data from the top bar to see contributor details.
      </div>
    );
  }

  const contributor = data.data.contributorMetrics.find(c => c.username === username);
  if (!contributor) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Contributor &quot;{username}&quot; not found.</p>
        <Link href="/contributors" className="text-indigo-600 hover:underline">Back to Contributors</Link>
      </div>
    );
  }

  // Build PR activity data per month for this user
  const userPRs = data.data.prs.filter(p => p.user === username);
  const userIssues = data.data.issues.filter(i => i.user === username);
  // PRs this user reviewed (same definition as "Reviews Performed": at least one review, any type)
  const prsReviewed = data.data.prs
    .filter(pr =>
      pr.user !== username &&
      (pr.requested_reviewers || []).includes(username) &&
      (pr.reviews || []).some(r => r.user === username && !isBot(r.user))
    )
    .map(pr => {
      const myReviews = (pr.reviews || []).filter(r => r.user === username && !isBot(r.user));
      const firstReview = [...myReviews].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())[0];
      return { pr, reviewedAt: firstReview?.submitted_at ?? '', reviewState: firstReview?.state ?? 'COMMENTED' };
    })
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
  const monthlyActivity = new Map<string, { opened: number; merged: number; reviewed: number }>();
  userPRs.forEach(pr => {
    const d = new Date(pr.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur = monthlyActivity.get(key) || { opened: 0, merged: 0, reviewed: 0 };
    cur.opened++;
    if (pr.merged) cur.merged++;
    monthlyActivity.set(key, cur);
  });

  // Reviews given by this user per month
  data.data.prs.forEach(pr => {
    (pr.reviews || []).forEach(r => {
      if (r.user === username) {
        const d = new Date(r.submitted_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const cur = monthlyActivity.get(key) || { opened: 0, merged: 0, reviewed: 0 };
        cur.reviewed++;
        monthlyActivity.set(key, cur);
      }
    });
  });

  const activityData = Array.from(monthlyActivity.entries())
    .map(([month, vals]) => ({ month, ...vals }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // PR sizes over time
  const prSizeData = userPRs
    .filter(p => p.merged && p.merged_at)
    .map(p => ({
      date: new Date(p.merged_at!).toLocaleDateString(),
      size: (p.additions || 0) + (p.deletions || 0),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div>
      <div className="mb-6">
        <Link href="/contributors" className="text-sm text-indigo-600 hover:underline">
          &larr; Back to Contributors
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {contributor.avatar_url ? (
          <img src={contributor.avatar_url} alt="" className="w-16 h-16 rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {username[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{username}</h1>
          <p className="text-sm text-gray-500">
            {contributor.prs_opened} PRs opened &middot; {contributor.reviews_performed} reviews performed
          </p>
        </div>
      </div>

      {/* As Author */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">As Author</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <KPICard label="PRs Opened" value={formatNumber(contributor.prs_opened)} />
        <KPICard label="PRs Merged" value={formatNumber(contributor.prs_merged)} color="green" />
        <KPICard label="Avg PR Size" value={formatNumber(contributor.avg_pr_size)} subtitle="lines" />
        <KPICard label="Avg Merge Time" value={formatDuration(contributor.avg_merge_time_hours)} />
        <KPICard label="Rework Rate" value={formatPercent(contributor.rework_rate * 100)} />
        <KPICard label="Lines Added" value={formatNumber(contributor.lines_added)} color="green" />
        <KPICard label="Lines Deleted" value={formatNumber(contributor.lines_deleted)} color="red" />
        <KPICard label="Wait for Review" value={formatDuration(contributor.wait_time_to_first_review_median_hours)} subtitle="median" />
        <KPICard label="Publish → Merge" value={formatDuration(contributor.publish_to_merge_time_median_hours)} subtitle="median" />
        <KPICard label="Review Cycles" value={formatNumber(contributor.review_cycles_avg, 1)} subtitle="avg/PR" />
      </div>

      {/* As Reviewer */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">As Reviewer</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KPICard label="Reviews Performed" value={formatNumber(contributor.reviews_performed)} color="indigo" />
        <KPICard label="Response Time" value={formatDuration(contributor.response_time_median_hours)} subtitle="median" />
        <KPICard label="Avg Review Response" value={formatDuration(contributor.avg_review_response_hours)} />
        <KPICard label="% PRs Reviewed" value={formatPercent(contributor.pct_prs_reviewed)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="merged" fill="#22c55e" name="Merged" />
                <Bar dataKey="reviewed" fill="#6366f1" name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">PR Size Over Time</h3>
          <div className="h-64">
            {prSizeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prSizeData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="size" stroke="#6366f1" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No merged PRs to show.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pull requests opened by this user */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pull requests opened</h3>
        <div className="overflow-x-auto">
          {userPRs.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Title</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">State</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Size</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Created</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Merged</th>
                </tr>
              </thead>
              <tbody>
                {userPRs
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((pr) => (
                    <tr key={pr.number} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        {repoUrl ? (
                          <a
                            href={`${repoUrl}/pull/${pr.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            #{pr.number}
                          </a>
                        ) : (
                          <span className="text-gray-700">#{pr.number}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={pr.title}>
                        {pr.title}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            pr.merged
                              ? 'bg-purple-100 text-purple-700'
                              : pr.state === 'open'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {pr.merged ? 'Merged' : pr.state}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        +{pr.additions ?? 0} / −{pr.deletions ?? 0}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {new Date(pr.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {pr.merged_at ? new Date(pr.merged_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-gray-500">No pull requests in the selected date range.</p>
          )}
        </div>
      </div>

      {/* Pull requests reviewed by this user */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pull requests reviewed</h3>
        <div className="overflow-x-auto">
          {prsReviewed.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Title</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Author</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">PR State</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Your review</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Reviewed at</th>
                </tr>
              </thead>
              <tbody>
                {prsReviewed.map(({ pr, reviewedAt, reviewState }) => (
                  <tr key={pr.number} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      {repoUrl ? (
                        <a
                          href={`${repoUrl}/pull/${pr.number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          #{pr.number}
                        </a>
                      ) : (
                        <span className="text-gray-700">#{pr.number}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={pr.title}>
                      {pr.title}
                    </td>
                    <td className="py-2 px-3 text-gray-600">{pr.user}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          pr.merged
                            ? 'bg-purple-100 text-purple-700'
                            : pr.state === 'open'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {pr.merged ? 'Merged' : pr.state}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          reviewState === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : reviewState === 'CHANGES_REQUESTED'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {reviewState === 'APPROVED' ? 'Approved' : reviewState === 'CHANGES_REQUESTED' ? 'Changes requested' : 'Commented'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">
                      {reviewedAt ? new Date(reviewedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-gray-500">No pull requests reviewed in the selected date range.</p>
          )}
        </div>
      </div>

      {/* Issues opened by this user */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues opened</h3>
        <div className="overflow-x-auto">
          {userIssues.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Title</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">State</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Labels</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Created</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Closed</th>
                </tr>
              </thead>
              <tbody>
                {userIssues
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((issue) => (
                    <tr key={issue.number} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        {repoUrl ? (
                          <a
                            href={`${repoUrl}/issues/${issue.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            #{issue.number}
                          </a>
                        ) : (
                          <span className="text-gray-700">#{issue.number}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={issue.title}>
                        {issue.title}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            issue.state === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {issue.state}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {issue.labels.slice(0, 3).map((l) => (
                            <span
                              key={l}
                              className="px-1.5 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded"
                            >
                              {l}
                            </span>
                          ))}
                          {issue.labels.length > 3 && (
                            <span className="text-xs text-gray-400">+{issue.labels.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {issue.closed_at ? new Date(issue.closed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-gray-500">No issues in the selected date range.</p>
          )}
        </div>
      </div>
    </div>
  );
}
