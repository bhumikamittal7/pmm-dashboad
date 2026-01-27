import { NextRequest, NextResponse } from 'next/server';
import { Issue, PullRequest, KPIs, LabelData, ContributorData, TimelineData, IssueAgingData, PRIssueLinkage, PRSizeMergeTimeData, MergeTimeByUser } from '@/types';
import { getCachedDataForRange, writeCachedData, mergeCachedData, readCachedData } from '@/app/lib/dataCache';

interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  user: { login: string } | null;
  labels: Array<{ name: string }>;
  comments: number;
  pull_request?: { url: string };
  body?: string | null;
}

interface GitHubPR extends GitHubIssue {
  merged_at: string | null;
  review_comments: number;
  merged: boolean;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  requested_reviewers?: Array<{ login: string }>;
}

async function fetchGitHubData(
  token: string,
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date
): Promise<{ issues: Issue[]; prs: PullRequest[] }> {
  const issues: Issue[] = [];
  const prs: PullRequest[] = [];

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&since=${startDate.toISOString()}&page=${page}&per_page=100`,
      { 
        headers,
        next: { revalidate: 3600 } // Cache for 1 hour on server
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: GitHubIssue[] = await response.json();
    
    if (data.length === 0) {
      hasMore = false;
      break;
    }

    for (const item of data) {
      const createdAt = new Date(item.created_at);
      
      if (createdAt < startDate || createdAt > endDate) {
        continue;
      }

      if (item.pull_request) {
        // Fetch PR details
        const prResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${item.number}`,
          { 
            headers,
            next: { revalidate: 3600 } // Cache for 1 hour on server
          }
        );
        
        if (prResponse.ok) {
          const prData: GitHubPR = await prResponse.json();
          const reviewers =
            prData.requested_reviewers?.map(r => r.login).filter(Boolean) || [];
          prs.push({
            number: prData.number,
            title: prData.title,
            state: prData.state,
            created_at: prData.created_at,
            closed_at: prData.closed_at,
            merged_at: prData.merged_at,
            user: prData.user?.login || 'Unknown',
            labels: prData.labels.map(l => l.name),
            comments: prData.comments,
            review_comments: prData.review_comments,
            body: prData.body || '',
            is_pr: true,
            merged: prData.merged,
            additions: prData.additions || 0,
            deletions: prData.deletions || 0,
            changed_files: prData.changed_files || 0,
            reviewers,
          });
        }
      } else {
        issues.push({
          number: item.number,
          title: item.title,
          state: item.state,
          created_at: item.created_at,
          closed_at: item.closed_at,
          user: item.user?.login || 'Unknown',
          labels: item.labels.map(l => l.name),
          comments: item.comments,
          is_pr: false,
        });
      }
    }

    page++;
    if (data.length < 100) {
      hasMore = false;
    }
  }

  return { issues, prs };
}

function calculateKPIs(issues: Issue[], prs: PullRequest[]): KPIs {
  const closedIssues = issues.filter(i => i.state === 'closed' && i.closed_at);
  const mergedPRs = prs.filter(p => p.merged && p.merged_at);

  let avgIssueResolution = 0;
  if (closedIssues.length > 0) {
    const totalDays = closedIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at);
      const closed = new Date(issue.closed_at!);
      return sum + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    avgIssueResolution = totalDays / closedIssues.length;
  }

  let avgPRMerge = 0;
  if (mergedPRs.length > 0) {
    const totalDays = mergedPRs.reduce((sum, pr) => {
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at!);
      return sum + (merged.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    avgPRMerge = totalDays / mergedPRs.length;
  }

  return {
    total_issues: issues.length,
    open_issues: issues.filter(i => i.state === 'open').length,
    closed_issues: closedIssues.length,
    total_prs: prs.length,
    open_prs: prs.filter(p => p.state === 'open').length,
    merged_prs: mergedPRs.length,
    avg_issue_resolution_days: avgIssueResolution,
    avg_pr_merge_days: avgPRMerge,
  };
}

function extractLabelsFrequency(issues: Issue[], prs: PullRequest[]): LabelData[] {
  const labelCounts = new Map<string, number>();
  const ignoredLabels = new Set([
    'ON_STAGING',
    'Deployed on PuzzleMe',
    'Deployed on Subs',
    'Deployed on Enterprise',
  ]);

  // Only use issues for label distribution
  issues.forEach(item => {
    item.labels.forEach(label => {
      if (ignoredLabels.has(label)) {
        return;
      }
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    });
  });

  return Array.from(labelCounts.entries())
    .map(([Label, Count]) => ({ Label, Count }))
    .sort((a, b) => b.Count - a.Count);
}

function createContributorLeaderboard(issues: Issue[], prs: PullRequest[]): ContributorData[] {
  const contributorData = new Map<string, { Issues: number; PRs: number }>();

  issues.forEach(issue => {
    const data = contributorData.get(issue.user) || { Issues: 0, PRs: 0 };
    data.Issues++;
    contributorData.set(issue.user, data);
  });

  prs.forEach(pr => {
    const data = contributorData.get(pr.user) || { Issues: 0, PRs: 0 };
    data.PRs++;
    contributorData.set(pr.user, data);
  });

  return Array.from(contributorData.entries())
    .map(([Contributor, { Issues, PRs }]) => ({
      Contributor,
      Issues,
      PRs,
      Total: Issues + PRs,
    }))
    .sort((a, b) => b.Total - a.Total);
}

function createTimelineData(prs: PullRequest[], startDate: Date, endDate: Date): TimelineData[] {
  // Always use weeks for timeline
  const period = 'week';
  
  const periodMap = new Map<string, number>();

  // Only count merged PRs
  prs
    .filter(pr => pr.merged && pr.merged_at)
    .forEach(pr => {
      const mergeDate = new Date(pr.merged_at!);
      const key = formatPeriod(mergeDate, period);
      periodMap.set(key, (periodMap.get(key) || 0) + 1);
    });

  return Array.from(periodMap.entries())
    .map(([Date, count]) => ({
      Date,
      Issues: 0,
      PRs: count,
      Total: count,
    }))
    .sort((a, b) => a.Date.localeCompare(b.Date));
}

function formatPeriod(date: Date, period: 'day' | 'week' | 'month'): string {
  if (period === 'day') {
    return date.toISOString().split('T')[0];
  } else if (period === 'week') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

function createIssueAgingData(issues: Issue[], prs: PullRequest[]): IssueAgingData[] {
  // Create a map of issue numbers to PR merge dates
  const issueToPRMergeDate = new Map<number, Date>();
  
  prs.forEach(pr => {
    if (!pr.merged || !pr.merged_at) return;
    
    // Extract issue numbers from PR body
    const patterns = [
      /#(\d+)/g,
      /closes?\s+#(\d+)/gi,
      /fixes?\s+#(\d+)/gi,
      /resolves?\s+#(\d+)/gi,
      /related\s+to\s+#(\d+)/gi,
    ];
    
    if (!pr.body) return;
    
    patterns.forEach(pattern => {
      const matches = pr.body.matchAll(pattern);
      for (const match of matches) {
        const issueNum = parseInt(match[1]);
        if (!isNaN(issueNum)) {
          const mergeDate = new Date(pr.merged_at!);
          // Keep the earliest merge date if multiple PRs reference the same issue
          const existing = issueToPRMergeDate.get(issueNum);
          if (!existing || mergeDate < existing) {
            issueToPRMergeDate.set(issueNum, mergeDate);
          }
        }
      }
    });
  });

  const now = new Date();
  const issueAgingData: IssueAgingData[] = [];

  // Create individual issue data points
  issues.forEach(issue => {
    const prMergeDate = issueToPRMergeDate.get(issue.number);
    if (!prMergeDate) return; // Skip issues without linked PRs
    
    const ageDays = (now.getTime() - prMergeDate.getTime()) / (1000 * 60 * 60 * 24);
    
    issueAgingData.push({
      Issue_Number: issue.number,
      Issue_Title: issue.title,
      PR_Merge_Date: prMergeDate.toISOString(),
      Age_Days: Math.round(ageDays * 10) / 10, // Round to 1 decimal place
    });
  });

  // Sort by age days (oldest first)
  return issueAgingData.sort((a, b) => b.Age_Days - a.Age_Days);
}

function extractPRIssueLinkage(prs: PullRequest[]): PRIssueLinkage[] {
  const linkages: PRIssueLinkage[] = [];
  const patterns = [
    /#(\d+)/g,
    /closes?\s+#(\d+)/gi,
    /fixes?\s+#(\d+)/gi,
    /resolves?\s+#(\d+)/gi,
    /related\s+to\s+#(\d+)/gi,
  ];

  prs.forEach(pr => {
    if (!pr.body) return;

    const linkedIssues = new Set<string>();
    
    patterns.forEach(pattern => {
      const matches = pr.body.matchAll(pattern);
      for (const match of matches) {
        linkedIssues.add(match[1]);
      }
    });

    if (linkedIssues.size > 0) {
      linkages.push({
        'PR Number': pr.number,
        'PR Title': pr.title,
        'Linked Issues': Array.from(linkedIssues).sort((a, b) => parseInt(a) - parseInt(b)).join(', '),
      });
    }
  });

  return linkages;
}

function createPRSizeMergeTimeData(prs: PullRequest[]): PRSizeMergeTimeData[] {
  const data: PRSizeMergeTimeData[] = [];

  prs
    .filter(
      pr =>
        pr.merged &&
        pr.merged_at &&
        typeof pr.additions === 'number' &&
        typeof pr.deletions === 'number'
    )
    .forEach(pr => {
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at!);
      const mergeTimeDays =
        (merged.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      const size = (pr.additions || 0) + (pr.deletions || 0);

      data.push({
        PR_Number: pr.number,
        PR_Title: pr.title,
        Size: size,
        Merge_Time_Days: mergeTimeDays,
      });
    });

  return data.sort((a, b) => a.Size - b.Size);
}

function createMergeTimeByAuthor(prs: PullRequest[]): MergeTimeByUser[] {
  const stats = new Map<string, { count: number; totalDays: number }>();

  prs
    .filter(pr => pr.merged && pr.merged_at)
    .forEach(pr => {
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at!);
      const mergeTimeDays =
        (merged.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      const user = pr.user || 'Unknown';

      const current = stats.get(user) || { count: 0, totalDays: 0 };
      current.count += 1;
      current.totalDays += mergeTimeDays;
      stats.set(user, current);
    });

  return Array.from(stats.entries())
    .map(([user, { count, totalDays }]) => ({
      user,
      count,
      avg_merge_days: count > 0 ? totalDays / count : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function createMergeTimeByReviewer(prs: PullRequest[]): MergeTimeByUser[] {
  const stats = new Map<string, { count: number; totalDays: number }>();

  prs
    .filter(
      pr =>
        pr.merged &&
        pr.merged_at &&
        Array.isArray(pr.reviewers) &&
        pr.reviewers.length > 0
    )
    .forEach(pr => {
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at!);
      const mergeTimeDays =
        (merged.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

      pr.reviewers!.forEach(reviewer => {
        const name = reviewer || 'Unknown';
        const current = stats.get(name) || { count: 0, totalDays: 0 };
        current.count += 1;
        current.totalDays += mergeTimeDays;
        stats.set(name, current);
      });
    });

  return Array.from(stats.entries())
    .map(([user, { count, totalDays }]) => ({
      user,
      count,
      avg_merge_days: count > 0 ? totalDays / count : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function POST(request: NextRequest) {
  try {
    const { repository, startDate, endDate } = await request.json();

    if (!repository || !repository.includes('/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid repository format. Use "owner/repo"' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'GITHUB_TOKEN not configured' },
        { status: 500 }
      );
    }

    const [owner, repo] = repository.split('/', 2);
    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Invalid repository format' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if we have cached data that covers this range
    const cachedData = getCachedDataForRange(start, end);
    let issues: Issue[];
    let prs: PullRequest[];

    if (cachedData) {
      // Use cached data
      issues = cachedData.issues;
      prs = cachedData.prs;
      console.log(`Using cached data for range ${startDate} to ${endDate}`);
    } else {
      // Fetch from API
      const fetched = await fetchGitHubData(token, owner, repo, start, end);
      issues = fetched.issues;
      prs = fetched.prs;

      // Try to merge with existing cache if it exists
      const existingCache = readCachedData();
      if (existingCache) {
        const merged = mergeCachedData(
          existingCache.issues,
          existingCache.prs,
          issues,
          prs
        );
        issues = merged.issues;
        prs = merged.prs;
      }

      // Update cache with merged data
      // Use the broader date range (cache range or requested range, whichever is wider)
      const cacheStart = existingCache 
        ? new Date(Math.min(new Date(existingCache.dateRange.start).getTime(), start.getTime()))
        : start;
      const cacheEnd = existingCache
        ? new Date(Math.max(new Date(existingCache.dateRange.end).getTime(), end.getTime()))
        : end;
      
      writeCachedData(issues, prs, cacheStart, cacheEnd);
      console.log(`Fetched and cached data for range ${startDate} to ${endDate}`);
    }

    const kpis = calculateKPIs(issues, prs);
    const labels = extractLabelsFrequency(issues, prs);
    const contributors = createContributorLeaderboard(issues, prs);
    const timeline = createTimelineData(prs, start, end);
    const issueAging = createIssueAgingData(issues, prs);
    const prIssueLinkage = extractPRIssueLinkage(prs);
    const prSizeMergeTime = createPRSizeMergeTimeData(prs);
    const mergeTimeByAuthor = createMergeTimeByAuthor(prs);
    const mergeTimeByReviewer = createMergeTimeByReviewer(prs);

    return NextResponse.json({
      success: true,
      data: {
        issues,
        prs,
        kpis,
        labels,
        contributors,
        timeline,
        issueAging,
        prIssueLinkage,
        prSizeMergeTime,
        mergeTimeByAuthor,
        mergeTimeByReviewer,
      },
    });
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error';
    
    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      return NextResponse.json(
        { success: false, error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed. Please check your GitHub token.' },
        { status: 401 }
      );
    }
    
    if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('rate limit')) {
      return NextResponse.json(
        { success: false, error: 'API rate limit exceeded. Please wait and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Error fetching data: ${errorMsg}` },
      { status: 500 }
    );
  }
}
