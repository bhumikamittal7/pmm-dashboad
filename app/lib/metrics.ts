import {
  Issue,
  PullRequest,
  Release,
  ComputedKPIs,
  ContributorMetrics,
  LabelData,
  ContributorData,
  TimelineData,
  ThroughputData,
  CycleTimeData,
  IssueAgingData,
  PRIssueLinkage,
  PRSizeMergeTimeData,
  MergeTimeByUser,
  ReviewBreakdownData,
  PRSizeDistributionData,
  BacklogAgingBucket,
} from '@/types';
import { median, weekdaysInRange, weeksInRange, hoursBetween, daysBetween, isBot } from './formatters';

const ISSUE_LINK_PATTERNS = [
  /#(\d+)/g,
  /closes?\s+#(\d+)/gi,
  /fixes?\s+#(\d+)/gi,
  /resolves?\s+#(\d+)/gi,
  /related\s+to\s+#(\d+)/gi,
];

function extractLinkedIssueNumbers(body: string | null): number[] {
  if (!body) return [];
  const nums = new Set<number>();
  for (const pattern of ISSUE_LINK_PATTERNS) {
    const matches = body.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const m of matches) {
      const n = parseInt(m[1]);
      if (!isNaN(n)) nums.add(n);
    }
  }
  return Array.from(nums);
}

// === KPI COMPUTATION ===

export function computeKPIs(
  issues: Issue[],
  prs: PullRequest[],
  releases: Release[],
  startDate: Date,
  endDate: Date,
): ComputedKPIs {
  const closedIssues = issues.filter(i => i.state === 'closed' && i.closed_at);
  const mergedPRs = prs.filter(p => p.merged && p.merged_at);
  const openIssues = issues.filter(i => i.state === 'open');

  const weekdays = weekdaysInRange(startDate, endDate);
  const weeks = weeksInRange(startDate, endDate);

  // Merge rate
  const merge_rate = mergedPRs.length / weekdays;

  // Comment rate
  const comment_rate = prs.length > 0
    ? prs.reduce((s, p) => s + p.comments + p.review_comments, 0) / prs.length
    : 0;

  // Pick-up time: median time to first human review
  const pickUpTimes = prs
    .filter(p => p.first_review_at)
    .map(p => hoursBetween(p.created_at, p.first_review_at!))
    .filter(h => h > 0);
  const pick_up_time_hours = median(pickUpTimes);

  // Avg PR size (exclude >2500 LOC)
  const prSizes = prs
    .map(p => (p.additions || 0) + (p.deletions || 0))
    .filter(s => s <= 2500 && s > 0);
  const avg_pr_size = prSizes.length > 0
    ? prSizes.reduce((a, b) => a + b, 0) / prSizes.length
    : 0;

  // Open-to-approval time
  const approvalTimes = prs
    .filter(p => p.first_approval_at)
    .map(p => hoursBetween(p.created_at, p.first_approval_at!))
    .filter(h => h > 0);
  const open_to_approval_hours = median(approvalTimes);

  // Open-to-merge time
  const mergeTimes = mergedPRs
    .map(p => hoursBetween(p.created_at, p.merged_at!))
    .filter(h => h > 0);
  const open_to_merge_hours = median(mergeTimes);

  // Avg issue resolution
  const issueResolutionDays = closedIssues.map(i => daysBetween(i.created_at, i.closed_at!)).filter(d => d > 0);
  const avg_issue_resolution_days = issueResolutionDays.length > 0
    ? issueResolutionDays.reduce((a, b) => a + b, 0) / issueResolutionDays.length
    : 0;

  // Avg PR merge time in days
  const mergeDays = mergedPRs.map(p => daysBetween(p.created_at, p.merged_at!)).filter(d => d > 0);
  const avg_pr_merge_days = mergeDays.length > 0
    ? mergeDays.reduce((a, b) => a + b, 0) / mergeDays.length
    : 0;

  // Review breakdown (exclude bots and author self-reviews)
  const allReviews = prs.flatMap(p =>
    (p.reviews || []).filter(r => !isBot(r.user) && r.user !== p.user)
  );
  const reviews_approved = allReviews.filter(r => r.state === 'APPROVED').length;
  const reviews_changes_requested = allReviews.filter(r => r.state === 'CHANGES_REQUESTED').length;
  const reviews_commented = allReviews.filter(r => r.state === 'COMMENTED').length;

  // Release rate
  const prodReleases = releases.filter(r => !r.draft && !r.prerelease);
  const release_rate = prodReleases.length / weeks;

  // Defect rate
  const issueMap = new Map(issues.map(i => [i.number, i]));
  const defectPRs = mergedPRs.filter(pr => {
    const linked = extractLinkedIssueNumbers(pr.body);
    return linked.some(num => {
      const issue = issueMap.get(num);
      return issue && issue.labels.some(l => l.toLowerCase() === 'bug');
    });
  });
  const defect_rate = mergedPRs.length > 0 ? (defectPRs.length / mergedPRs.length) * 100 : 0;

  // Bug vs feature ratio
  const bugIssues = issues.filter(i => i.labels.some(l => l.toLowerCase() === 'bug'));
  const featureIssues = issues.filter(i =>
    i.labels.some(l => ['enhancement', 'feature', 'feature request'].includes(l.toLowerCase()))
  );
  const bug_feature_ratio = featureIssues.length > 0 ? bugIssues.length / featureIssues.length : 0;

  // New/closed issues per week
  const new_issues_per_week = issues.length / weeks;
  const closed_issues_per_week = closedIssues.length / weeks;

  // Avg time to close
  const avg_time_to_close_days = avg_issue_resolution_days;

  // Reopen rate
  const reopenedIssues = issues.filter(i => i.reopened);
  const reopen_rate = issues.length > 0 ? (reopenedIssues.length / issues.length) * 100 : 0;

  // PR-Issue linkage
  const prsWithLinks = prs.filter(p => extractLinkedIssueNumbers(p.body).length > 0);
  const pct_prs_linked_to_issues = prs.length > 0 ? (prsWithLinks.length / prs.length) * 100 : 0;
  const prs_without_linked_issue = prs.length - prsWithLinks.length;

  // Issues closed via PR
  const issuesClosedViaPR = new Set<number>();
  prs.forEach(pr => {
    extractLinkedIssueNumbers(pr.body).forEach(num => issuesClosedViaPR.add(num));
  });
  const closedIssueNumbers = new Set(closedIssues.map(i => i.number));
  const issuesActuallyClosedViaPR = [...issuesClosedViaPR].filter(n => closedIssueNumbers.has(n));
  const pct_issues_closed_via_pr = closedIssues.length > 0
    ? (issuesActuallyClosedViaPR.length / closedIssues.length) * 100
    : 0;

  return {
    total_issues: issues.length,
    open_issues: openIssues.length,
    closed_issues: closedIssues.length,
    total_prs: prs.length,
    open_prs: prs.filter(p => p.state === 'open').length,
    merged_prs: mergedPRs.length,
    merge_rate,
    comment_rate,
    pick_up_time_hours,
    avg_pr_size,
    open_to_approval_hours,
    open_to_merge_hours,
    avg_issue_resolution_days,
    avg_pr_merge_days,
    reviews_approved,
    reviews_changes_requested,
    reviews_commented,
    release_rate,
    defect_rate,
    bug_feature_ratio,
    new_issues_per_week,
    closed_issues_per_week,
    avg_time_to_close_days,
    reopen_rate,
    pct_prs_linked_to_issues,
    pct_issues_closed_via_pr,
    prs_without_linked_issue,
  };
}

// === CONTRIBUTOR METRICS ===

export function computeContributorMetrics(
  prs: PullRequest[],
  issues: Issue[],
): ContributorMetrics[] {
  const usernames = new Set<string>();
  prs.forEach(p => {
    usernames.add(p.user);
    (p.reviews || []).forEach(r => { if (!isBot(r.user)) usernames.add(r.user); });
  });

  const totalPRs = prs.length;
  const mergedPRs = prs.filter(p => p.merged && p.merged_at);

  return Array.from(usernames).map(username => {
    const avatarPR = prs.find(p => p.user === username);

    // As Author
    const authorPRs = prs.filter(p => p.user === username);
    const authorMerged = authorPRs.filter(p => p.merged && p.merged_at);
    const prSizes = authorMerged.map(p => (p.additions || 0) + (p.deletions || 0));
    const avg_pr_size = prSizes.length > 0 ? prSizes.reduce((a, b) => a + b, 0) / prSizes.length : 0;

    const mergeTimesHours = authorMerged
      .map(p => hoursBetween(p.created_at, p.merged_at!))
      .filter(h => h > 0);
    const avg_merge_time_hours = mergeTimesHours.length > 0
      ? mergeTimesHours.reduce((a, b) => a + b, 0) / mergeTimesHours.length
      : 0;

    // Rework rate: commits after first review / total commits
    const reworkRates = authorPRs
      .filter(p => p.first_review_at && p.commits_count > 0)
      .map(p => {
        const reviewTime = new Date(p.first_review_at!).getTime();
        const commitsAfterReview = (p.reviews || [])
          .filter(r => new Date(r.submitted_at).getTime() > reviewTime).length;
        return Math.min(commitsAfterReview / p.commits_count, 1);
      });
    const rework_rate = reworkRates.length > 0
      ? reworkRates.reduce((a, b) => a + b, 0) / reworkRates.length
      : 0;

    const lines_added = authorMerged.reduce((s, p) => s + (p.additions || 0), 0);
    const lines_deleted = authorMerged.reduce((s, p) => s + (p.deletions || 0), 0);

    // As Reviewer: only count when the user was explicitly assigned (requested_reviewers)
    // and is not the PR author (exclude self-reviews).
    const assignedReviewerPRs = prs.filter(p =>
      p.user !== username && (p.requested_reviewers || []).includes(username)
    );
    const allUserReviews = prs.flatMap(p => {
      if (p.user === username || !(p.requested_reviewers || []).includes(username)) return [];
      return (p.reviews || []).filter(r => r.user === username && !isBot(r.user));
    });
    // Count PRs where this user submitted at least one review (any type: approved, changes requested, or commented)
    const reviewedPRs = assignedReviewerPRs.filter(p =>
      (p.reviews || []).some(r => r.user === username && !isBot(r.user))
    );
    const reviews_performed = reviewedPRs.length;
    const comments_per_review = reviews_performed > 0
      ? allUserReviews.filter(r => r.body && r.body.trim().length > 0).length / reviews_performed
      : 0;
    const pct_prs_reviewed = totalPRs > 0 ? (reviewedPRs.length / totalPRs) * 100 : 0;

    // Review response time
    const reviewResponseTimes = allUserReviews
      .map(r => {
        const pr = prs.find(p => (p.reviews || []).includes(r));
        if (!pr) return -1;
        return hoursBetween(pr.created_at, r.submitted_at);
      })
      .filter(h => h > 0);
    const avg_review_response_hours = reviewResponseTimes.length > 0
      ? reviewResponseTimes.reduce((a, b) => a + b, 0) / reviewResponseTimes.length
      : 0;
    const response_time_median_hours = median(reviewResponseTimes);

    // Wait time to first review (for this user's PRs)
    const waitTimes = authorPRs
      .filter(p => p.first_review_at)
      .map(p => hoursBetween(p.created_at, p.first_review_at!))
      .filter(h => h > 0);
    const wait_time_to_first_review_median_hours = median(waitTimes);
    const time_waiting_on_review_median_hours = wait_time_to_first_review_median_hours;

    // Publish to merge time
    const publishToMergeTimes = authorMerged
      .map(p => hoursBetween(p.created_at, p.merged_at!))
      .filter(h => h > 0);
    const publish_to_merge_time_median_hours = median(publishToMergeTimes);

    // Review cycles (unique review rounds per PR)
    const reviewCycles = authorMerged.map(p => {
      const reviews = (p.reviews || []).filter(r => !isBot(r.user));
      const uniqueRounds = new Set(reviews.map(r => r.submitted_at.split('T')[0]));
      return uniqueRounds.size;
    });
    const review_cycles_avg = reviewCycles.length > 0
      ? reviewCycles.reduce((a, b) => a + b, 0) / reviewCycles.length
      : 0;

    return {
      username,
      avatar_url: avatarPR?.avatar_url || '',
      prs_opened: authorPRs.length,
      prs_merged: authorMerged.length,
      avg_pr_size,
      avg_merge_time_hours,
      rework_rate,
      lines_added,
      lines_deleted,
      reviews_performed,
      avg_review_response_hours,
      comments_per_review,
      pct_prs_reviewed,
      response_time_median_hours,
      time_waiting_on_review_median_hours,
      wait_time_to_first_review_median_hours,
      publish_to_merge_time_median_hours,
      review_cycles_avg,
    };
  }).sort((a, b) => b.prs_merged - a.prs_merged);
}

// === CHART DATA GENERATORS ===

const IGNORED_LABELS = new Set([
  'ON_STAGING', 'Deployed on PuzzleMe', 'Deployed on Subs', 'Deployed on Enterprise',
]);

export function computeLabels(issues: Issue[]): LabelData[] {
  const counts = new Map<string, number>();
  issues.forEach(i => {
    i.labels.forEach(l => {
      if (!IGNORED_LABELS.has(l)) counts.set(l, (counts.get(l) || 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([Label, Count]) => ({ Label, Count }))
    .sort((a, b) => b.Count - a.Count);
}

export function computeContributorLeaderboard(issues: Issue[], prs: PullRequest[]): ContributorData[] {
  const data = new Map<string, { Issues: number; PRs: number }>();
  issues.forEach(i => {
    const d = data.get(i.user) || { Issues: 0, PRs: 0 };
    d.Issues++;
    data.set(i.user, d);
  });
  prs.forEach(p => {
    const d = data.get(p.user) || { Issues: 0, PRs: 0 };
    d.PRs++;
    data.set(p.user, d);
  });
  return Array.from(data.entries())
    .map(([Contributor, { Issues, PRs }]) => ({ Contributor, Issues, PRs, Total: Issues + PRs }))
    .sort((a, b) => b.Total - a.Total);
}

export function computeTimeline(prs: PullRequest[]): TimelineData[] {
  const periodMap = new Map<string, number>();
  prs.filter(p => p.merged && p.merged_at).forEach(p => {
    const d = new Date(p.merged_at!);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    periodMap.set(key, (periodMap.get(key) || 0) + 1);
  });
  return Array.from(periodMap.entries())
    .map(([Date, count]) => ({ Date, Issues: 0, PRs: count, Total: count }))
    .sort((a, b) => a.Date.localeCompare(b.Date));
}

export function computeThroughput(issues: Issue[], prs: PullRequest[]): ThroughputData[] {
  const periodMap = new Map<string, { closed: number; merged: number }>();
  issues.filter(i => i.state === 'closed' && i.closed_at).forEach(i => {
    const d = new Date(i.closed_at!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur = periodMap.get(key) || { closed: 0, merged: 0 };
    cur.closed++;
    periodMap.set(key, cur);
  });
  prs.filter(p => p.merged && p.merged_at).forEach(p => {
    const d = new Date(p.merged_at!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur = periodMap.get(key) || { closed: 0, merged: 0 };
    cur.merged++;
    periodMap.set(key, cur);
  });
  return Array.from(periodMap.entries())
    .map(([Period, { closed, merged }]) => ({ Period, Closed_Issues: closed, Merged_PRs: merged }))
    .sort((a, b) => a.Period.localeCompare(b.Period));
}

export function computeCycleTime(prs: PullRequest[]): CycleTimeData[] {
  const periodMap = new Map<string, number[]>();
  prs.filter(p => p.merged && p.merged_at).forEach(p => {
    const d = new Date(p.merged_at!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const days = daysBetween(p.created_at, p.merged_at!);
    if (days > 0) {
      const arr = periodMap.get(key) || [];
      arr.push(days);
      periodMap.set(key, arr);
    }
  });
  return Array.from(periodMap.entries())
    .map(([Period, days]) => ({
      Period,
      Avg_Cycle_Time_Days: days.reduce((a, b) => a + b, 0) / days.length,
    }))
    .sort((a, b) => a.Period.localeCompare(b.Period));
}

export function computeIssueAging(issues: Issue[], prs: PullRequest[]): IssueAgingData[] {
  const issueToPRMerge = new Map<number, Date>();
  prs.forEach(pr => {
    if (!pr.merged || !pr.merged_at) return;
    extractLinkedIssueNumbers(pr.body).forEach(num => {
      const mergeDate = new Date(pr.merged_at!);
      const existing = issueToPRMerge.get(num);
      if (!existing || mergeDate < existing) issueToPRMerge.set(num, mergeDate);
    });
  });

  const now = new Date();
  return issues
    .filter(i => issueToPRMerge.has(i.number))
    .map(i => {
      const prMergeDate = issueToPRMerge.get(i.number)!;
      return {
        Issue_Number: i.number,
        Issue_Title: i.title,
        PR_Merge_Date: prMergeDate.toISOString(),
        Age_Days: Math.round(((now.getTime() - prMergeDate.getTime()) / (1000 * 60 * 60 * 24)) * 10) / 10,
      };
    })
    .sort((a, b) => b.Age_Days - a.Age_Days);
}

export function computePRIssueLinkage(prs: PullRequest[]): PRIssueLinkage[] {
  return prs
    .map(pr => {
      const linked = extractLinkedIssueNumbers(pr.body);
      if (linked.length === 0) return null;
      return { pr_number: pr.number, pr_title: pr.title, linked_issues: linked.sort((a, b) => a - b) };
    })
    .filter((x): x is PRIssueLinkage => x !== null);
}

export function computePRSizeMergeTime(prs: PullRequest[]): PRSizeMergeTimeData[] {
  return prs
    .filter(p => p.merged && p.merged_at && p.additions !== undefined && p.deletions !== undefined)
    .map(p => ({
      PR_Number: p.number,
      PR_Title: p.title,
      Size: (p.additions || 0) + (p.deletions || 0),
      Merge_Time_Days: daysBetween(p.created_at, p.merged_at!),
    }))
    .filter(d => d.Merge_Time_Days > 0)
    .sort((a, b) => a.Size - b.Size);
}

export function computeMergeTimeByAuthor(prs: PullRequest[]): MergeTimeByUser[] {
  const stats = new Map<string, { count: number; totalDays: number }>();
  prs.filter(p => p.merged && p.merged_at).forEach(p => {
    const days = daysBetween(p.created_at, p.merged_at!);
    if (days <= 0) return;
    const cur = stats.get(p.user) || { count: 0, totalDays: 0 };
    cur.count++;
    cur.totalDays += days;
    stats.set(p.user, cur);
  });
  return Array.from(stats.entries())
    .map(([user, { count, totalDays }]) => ({ user, count, avg_merge_days: totalDays / count }))
    .sort((a, b) => b.count - a.count);
}

export function computeMergeTimeByReviewer(prs: PullRequest[]): MergeTimeByUser[] {
  const stats = new Map<string, { count: number; totalDays: number }>();
  const assigned = (p: PullRequest) => (p.requested_reviewers || []) as string[];
  prs.filter(p => p.merged && p.merged_at && assigned(p).length > 0).forEach(p => {
    const days = daysBetween(p.created_at, p.merged_at!);
    if (days <= 0) return;
    assigned(p).forEach(reviewer => {
      if (!reviewer || isBot(reviewer) || reviewer === p.user) return;
      const cur = stats.get(reviewer) || { count: 0, totalDays: 0 };
      cur.count++;
      cur.totalDays += days;
      stats.set(reviewer, cur);
    });
  });
  return Array.from(stats.entries())
    .map(([user, { count, totalDays }]) => ({ user, count, avg_merge_days: totalDays / count }))
    .sort((a, b) => b.count - a.count);
}

export function computeReviewBreakdown(prs: PullRequest[]): ReviewBreakdownData[] {
  const periodMap = new Map<string, { approved: number; changes_requested: number; commented: number }>();
  prs.forEach(p => {
    (p.reviews || []).forEach(r => {
      if (isBot(r.user) || r.user === p.user) return;
      const d = new Date(r.submitted_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      const cur = periodMap.get(key) || { approved: 0, changes_requested: 0, commented: 0 };
      if (r.state === 'APPROVED') cur.approved++;
      else if (r.state === 'CHANGES_REQUESTED') cur.changes_requested++;
      else if (r.state === 'COMMENTED') cur.commented++;
      periodMap.set(key, cur);
    });
  });
  return Array.from(periodMap.entries())
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function computePRSizeDistribution(prs: PullRequest[]): PRSizeDistributionData[] {
  const buckets = [
    { label: '0-50', min: 0, max: 50 },
    { label: '51-100', min: 51, max: 100 },
    { label: '101-250', min: 101, max: 250 },
    { label: '251-500', min: 251, max: 500 },
    { label: '501-1000', min: 501, max: 1000 },
    { label: '1000+', min: 1001, max: Infinity },
  ];
  const counts = new Map(buckets.map(b => [b.label, 0]));
  prs.forEach(p => {
    const size = (p.additions || 0) + (p.deletions || 0);
    for (const b of buckets) {
      if (size >= b.min && size <= b.max) {
        counts.set(b.label, (counts.get(b.label) || 0) + 1);
        break;
      }
    }
  });
  return buckets.map(b => ({ bucket: b.label, count: counts.get(b.label) || 0 }));
}

export function computeBacklogAging(issues: Issue[]): BacklogAgingBucket[] {
  const openIssues = issues.filter(i => i.state === 'open');
  const now = new Date();
  const buckets = [
    { label: '<7d', min: 0, max: 7 },
    { label: '7-30d', min: 7, max: 30 },
    { label: '30-90d', min: 30, max: 90 },
    { label: '90-180d', min: 90, max: 180 },
    { label: '>180d', min: 180, max: Infinity },
  ];
  const counts = new Map(buckets.map(b => [b.label, 0]));
  openIssues.forEach(i => {
    const ageDays = (now.getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
    for (const b of buckets) {
      if (ageDays >= b.min && ageDays < b.max) {
        counts.set(b.label, (counts.get(b.label) || 0) + 1);
        break;
      }
    }
  });
  return buckets.map(b => ({ bucket: b.label, count: counts.get(b.label) || 0 }));
}
