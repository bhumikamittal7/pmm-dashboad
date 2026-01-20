import { NextRequest, NextResponse } from 'next/server';
import { Issue, PullRequest, KPIs, LabelData, ContributorData, TimelineData, ThroughputData, CycleTimeData, IssueAgingData, PRIssueLinkage } from '@/types';

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

  [...issues, ...prs].forEach(item => {
    item.labels.forEach(label => {
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

function createTimelineData(issues: Issue[], prs: PullRequest[]): TimelineData[] {
  const dateMap = new Map<string, { Issues: number; PRs: number }>();

  issues.forEach(issue => {
    const date = issue.created_at.split('T')[0];
    const data = dateMap.get(date) || { Issues: 0, PRs: 0 };
    data.Issues++;
    dateMap.set(date, data);
  });

  prs.forEach(pr => {
    const date = pr.created_at.split('T')[0];
    const data = dateMap.get(date) || { Issues: 0, PRs: 0 };
    data.PRs++;
    dateMap.set(date, data);
  });

  return Array.from(dateMap.entries())
    .map(([Date, { Issues, PRs }]) => ({
      Date,
      Issues,
      PRs,
      Total: Issues + PRs,
    }))
    .sort((a, b) => a.Date.localeCompare(b.Date));
}

function createThroughputData(
  issues: Issue[],
  prs: PullRequest[],
  startDate: Date,
  endDate: Date
): ThroughputData[] {
  const daysRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const period = daysRange <= 7 ? 'day' : daysRange <= 90 ? 'week' : 'month';

  const periodMap = new Map<string, { Closed_Issues: number; Merged_PRs: number }>();

  issues
    .filter(i => i.state === 'closed' && i.closed_at)
    .forEach(issue => {
      const date = new Date(issue.closed_at!);
      const key = formatPeriod(date, period);
      const data = periodMap.get(key) || { Closed_Issues: 0, Merged_PRs: 0 };
      data.Closed_Issues++;
      periodMap.set(key, data);
    });

  prs
    .filter(p => p.merged && p.merged_at)
    .forEach(pr => {
      const date = new Date(pr.merged_at!);
      const key = formatPeriod(date, period);
      const data = periodMap.get(key) || { Closed_Issues: 0, Merged_PRs: 0 };
      data.Merged_PRs++;
      periodMap.set(key, data);
    });

  return Array.from(periodMap.entries())
    .map(([Period, data]) => ({ Period, ...data }))
    .sort((a, b) => a.Period.localeCompare(b.Period));
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

function createCycleTimeData(
  prs: PullRequest[],
  startDate: Date,
  endDate: Date
): CycleTimeData[] {
  const mergedPRs = prs.filter(
    p => p.merged && p.merged_at && 
    new Date(p.created_at) >= startDate && 
    new Date(p.merged_at) <= endDate
  );

  if (mergedPRs.length === 0) return [];

  const daysRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const period = daysRange <= 7 ? 'day' : daysRange <= 30 ? 'week' : 'month';

  const periodMap = new Map<string, number[]>();

  mergedPRs.forEach(pr => {
    const created = new Date(pr.created_at);
    const merged = new Date(pr.merged_at!);
    const cycleTime = (merged.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    const key = formatPeriod(merged, period);
    
    if (!periodMap.has(key)) {
      periodMap.set(key, []);
    }
    periodMap.get(key)!.push(cycleTime);
  });

  return Array.from(periodMap.entries())
    .map(([Period, times]) => ({
      Period,
      Avg_Cycle_Time_Days: times.reduce((a, b) => a + b, 0) / times.length,
    }))
    .sort((a, b) => a.Period.localeCompare(b.Period));
}

function createIssueAgingData(issues: Issue[]): IssueAgingData[] {
  const openIssues = issues.filter(i => i.state === 'open');
  const now = new Date();

  const buckets = {
    '0-7 days': 0,
    '7-30 days': 0,
    '30+ days': 0,
  };

  openIssues.forEach(issue => {
    const created = new Date(issue.created_at);
    const ageDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageDays <= 7) {
      buckets['0-7 days']++;
    } else if (ageDays <= 30) {
      buckets['7-30 days']++;
    } else {
      buckets['30+ days']++;
    }
  });

  return Object.entries(buckets).map(([Age_Bucket, Count]) => ({ Age_Bucket, Count }));
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

    const { issues, prs } = await fetchGitHubData(token, owner, repo, start, end);

    const kpis = calculateKPIs(issues, prs);
    const labels = extractLabelsFrequency(issues, prs);
    const contributors = createContributorLeaderboard(issues, prs);
    const timeline = createTimelineData(issues, prs);
    const throughput = createThroughputData(issues, prs, start, end);
    const cycleTime = createCycleTimeData(prs, start, end);
    const issueAging = createIssueAgingData(issues);
    const prIssueLinkage = extractPRIssueLinkage(prs);

    return NextResponse.json({
      success: true,
      data: {
        issues,
        prs,
        kpis,
        labels,
        contributors,
        timeline,
        throughput,
        cycleTime,
        issueAging,
        prIssueLinkage,
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
