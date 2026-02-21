import { NextRequest, NextResponse } from 'next/server';
import { Issue, PullRequest, PRReview, Release } from '@/types';
import { getCachedDataForRange, writeCachedData, mergeCachedData, readCachedData } from '@/app/lib/dataCache';
import { throttledFetch } from '@/app/lib/rateLimiter';
import { isBot } from '@/app/lib/formatters';
import {
  computeKPIs,
  computeContributorMetrics,
  computeLabels,
  computeContributorLeaderboard,
  computeTimeline,
  computeThroughput,
  computeCycleTime,
  computeIssueAging,
  computePRIssueLinkage,
  computePRSizeMergeTime,
  computeMergeTimeByAuthor,
  computeMergeTimeByReviewer,
  computeReviewBreakdown,
  computePRSizeDistribution,
  computeBacklogAging,
} from '@/app/lib/metrics';

interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  user: { login: string; avatar_url?: string } | null;
  labels: Array<{ name: string }>;
  comments: number;
  pull_request?: { url: string };
  body?: string | null;
  milestone?: { title: string } | null;
}

interface GitHubPR extends GitHubIssue {
  merged_at: string | null;
  review_comments: number;
  merged: boolean;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  requested_reviewers?: Array<{ login: string }>;
  draft?: boolean;
}

interface GitHubReview {
  user: { login: string } | null;
  state: string;
  submitted_at: string;
  body: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  author: { login: string } | null;
  prerelease: boolean;
  draft: boolean;
}

interface GitHubEvent {
  event: string;
}

async function fetchGitHubData(
  token: string,
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date,
): Promise<{ issues: Issue[]; prs: PullRequest[]; releases: Release[] }> {
  const issues: Issue[] = [];
  const prs: PullRequest[] = [];

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  // Fetch issues and PRs
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const response = await throttledFetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&since=${startDate.toISOString()}&page=${page}&per_page=100`,
      { headers },
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    const data: GitHubIssue[] = await response.json();
    if (data.length === 0) break;

    for (const item of data) {
      const createdAt = new Date(item.created_at);
      if (createdAt < startDate || createdAt > endDate) continue;

      if (item.pull_request) {
        const pr = await fetchPRDetails(token, owner, repo, item.number, headers);
        if (pr) prs.push(pr);
      } else {
        const reopened = await checkIfReopened(token, owner, repo, item.number, headers);
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
          reopened,
          milestone: item.milestone?.title || null,
        });
      }
    }

    page++;
    if (data.length < 100) hasMore = false;
  }

  // Fetch releases
  const releases = await fetchReleases(token, owner, repo, startDate, endDate, headers);

  return { issues, prs, releases };
}

async function fetchPRDetails(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  headers: HeadersInit,
): Promise<PullRequest | null> {
  const prResponse = await throttledFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers },
  );
  if (!prResponse.ok) return null;
  const prData: GitHubPR = await prResponse.json();

  // Fetch reviews
  const reviewsResponse = await throttledFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews?per_page=100`,
    { headers },
  );
  let reviews: PRReview[] = [];
  if (reviewsResponse.ok) {
    const reviewsData: GitHubReview[] = await reviewsResponse.json();
    reviews = reviewsData.map(r => ({
      user: r.user?.login || 'Unknown',
      state: r.state as PRReview['state'],
      submitted_at: r.submitted_at,
      body: r.body || '',
      is_bot: isBot(r.user?.login || ''),
    }));
  }

  // Fetch commit count
  const commitsResponse = await throttledFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits?per_page=1`,
    { headers },
  );
  let commits_count = 0;
  if (commitsResponse.ok) {
    const linkHeader = commitsResponse.headers.get('link');
    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      commits_count = match ? parseInt(match[1], 10) : 1;
    } else {
      const commitsData = await commitsResponse.json();
      commits_count = Array.isArray(commitsData) ? commitsData.length : 0;
    }
  }

  const humanReviews = reviews.filter(r => !r.is_bot);
  const firstReview = humanReviews.length > 0
    ? humanReviews.reduce((earliest, r) =>
        new Date(r.submitted_at) < new Date(earliest.submitted_at) ? r : earliest
      )
    : null;
  const firstApproval = humanReviews
    .filter(r => r.state === 'APPROVED')
    .reduce<PRReview | null>((earliest, r) =>
      !earliest || new Date(r.submitted_at) < new Date(earliest.submitted_at) ? r : earliest
    , null);

  const requestedReviewerLogins = prData.requested_reviewers?.map(r => r.login).filter(Boolean) || [];
  const reviewerSet = new Set(requestedReviewerLogins);
  reviews.forEach(r => { if (!r.is_bot) reviewerSet.add(r.user); });

  return {
    number: prData.number,
    title: prData.title,
    state: prData.state,
    created_at: prData.created_at,
    closed_at: prData.closed_at,
    merged_at: prData.merged_at,
    user: prData.user?.login || 'Unknown',
    avatar_url: prData.user?.avatar_url || '',
    labels: prData.labels.map(l => l.name),
    comments: prData.comments,
    review_comments: prData.review_comments,
    body: prData.body || '',
    is_pr: true,
    merged: prData.merged,
    additions: prData.additions || 0,
    deletions: prData.deletions || 0,
    changed_files: prData.changed_files || 0,
    requested_reviewers: requestedReviewerLogins,
    reviewers: Array.from(reviewerSet),
    draft: prData.draft || false,
    reviews,
    commits_count,
    first_review_at: firstReview?.submitted_at || null,
    first_approval_at: firstApproval?.submitted_at || null,
  };
}

async function checkIfReopened(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  headers: HeadersInit,
): Promise<boolean> {
  try {
    const response = await throttledFetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/events?per_page=100`,
      { headers },
    );
    if (!response.ok) return false;
    const events: GitHubEvent[] = await response.json();
    return events.some(e => e.event === 'reopened');
  } catch {
    return false;
  }
}

async function fetchReleases(
  token: string,
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date,
  headers: HeadersInit,
): Promise<Release[]> {
  const releases: Release[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const response = await throttledFetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?page=${page}&per_page=100`,
      { headers },
    );
    if (!response.ok) break;
    const data: GitHubRelease[] = await response.json();
    if (data.length === 0) break;

    for (const r of data) {
      if (!r.published_at) continue;
      const publishedAt = new Date(r.published_at);
      if (publishedAt < startDate) { hasMore = false; break; }
      if (publishedAt <= endDate) {
        releases.push({
          tag_name: r.tag_name,
          name: r.name || r.tag_name,
          published_at: r.published_at,
          author: r.author?.login || 'Unknown',
          prerelease: r.prerelease,
          draft: r.draft,
        });
      }
    }
    page++;
    if (data.length < 100) hasMore = false;
  }
  return releases;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const repository =
      typeof body?.repository === 'string' ? body.repository.trim() : '';
    const startDate = body?.startDate;
    const endDate = body?.endDate;

    if (!repository || !repository.includes('/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid repository format. Use "owner/repo"' },
        { status: 400 },
      );
    }

    const [owner, repo] = repository.split('/', 2).map((s) => (s ?? '').trim());
    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Invalid repository format. Use "owner/repo"' },
        { status: 400 },
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 },
      );
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'GITHUB_TOKEN not configured' },
        { status: 500 },
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let issues: Issue[];
    let prs: PullRequest[];
    let releases: Release[];

    const cachedData = getCachedDataForRange(start, end);
    if (cachedData) {
      issues = cachedData.issues;
      prs = cachedData.prs;
      releases = cachedData.releases;
      console.log(`Using cached data for range ${startDate} to ${endDate}`);
    } else {
      const fetched = await fetchGitHubData(token, owner, repo, start, end);
      issues = fetched.issues;
      prs = fetched.prs;
      releases = fetched.releases;

      const existingCache = readCachedData();
      if (existingCache) {
        const merged = mergeCachedData(
          existingCache.issues,
          existingCache.prs,
          existingCache.releases,
          issues,
          prs,
          releases,
        );
        issues = merged.issues;
        prs = merged.prs;
        releases = merged.releases;
      }

      const cacheStart = existingCache
        ? new Date(Math.min(new Date(existingCache.dateRange.start).getTime(), start.getTime()))
        : start;
      const cacheEnd = existingCache
        ? new Date(Math.max(new Date(existingCache.dateRange.end).getTime(), end.getTime()))
        : end;

      writeCachedData(issues, prs, releases, cacheStart, cacheEnd);
      console.log(`Fetched and cached data for range ${startDate} to ${endDate}`);
    }

    // Compute all metrics from raw data
    const kpis = computeKPIs(issues, prs, releases, start, end);
    const labels = computeLabels(issues);
    const contributors = computeContributorLeaderboard(issues, prs);
    const contributorMetrics = computeContributorMetrics(prs, issues);
    const timeline = computeTimeline(prs);
    const throughput = computeThroughput(issues, prs);
    const cycleTime = computeCycleTime(prs);
    const issueAging = computeIssueAging(issues, prs);
    const prIssueLinkage = computePRIssueLinkage(prs);
    const prSizeMergeTime = computePRSizeMergeTime(prs);
    const mergeTimeByAuthor = computeMergeTimeByAuthor(prs);
    const mergeTimeByReviewer = computeMergeTimeByReviewer(prs);
    const reviewBreakdown = computeReviewBreakdown(prs);
    const prSizeDistribution = computePRSizeDistribution(prs);
    const backlogAging = computeBacklogAging(issues);

    return NextResponse.json({
      success: true,
      data: {
        issues,
        prs,
        releases,
        kpis,
        labels,
        contributors,
        contributorMetrics,
        timeline,
        throughput,
        cycleTime,
        issueAging,
        prIssueLinkage,
        prSizeMergeTime,
        mergeTimeByAuthor,
        mergeTimeByReviewer,
        reviewBreakdown,
        prSizeDistribution,
        backlogAging,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      return NextResponse.json(
        { success: false, error: 'Repository not found' },
        { status: 404 },
      );
    }

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed. Please check your GitHub token.' },
        { status: 401 },
      );
    }

    if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('rate limit')) {
      return NextResponse.json(
        { success: false, error: 'API rate limit exceeded. Please wait and try again.' },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { success: false, error: `Error fetching data: ${errorMsg}` },
      { status: 500 },
    );
  }
}
