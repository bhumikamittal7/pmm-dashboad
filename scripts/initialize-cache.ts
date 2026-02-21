/**
 * Script to initialize the local data cache with all data required for the dashboard.
 * Fetches: issues (with reopen), PRs (with reviews, commits_count, first_review_at, first_approval_at), releases.
 *
 * Loads GITHUB_TOKEN and GITHUB_REPOSITORY from .env.local if present.
 *
 * Usage:
 *   npx tsx scripts/initialize-cache.ts 2025
 *   npx tsx scripts/initialize-cache.ts 2024 2025
 *   npx tsx scripts/initialize-cache.ts
 */

import fs from 'fs';
import path from 'path';
import { writeCachedData, readCachedData, mergeCachedData } from '../app/lib/dataCache';
import { throttledFetch } from '../app/lib/rateLimiter';
import { isBot } from '../app/lib/formatters';
import { Issue, PullRequest, PRReview, Release } from '../types';

// Load .env.local so GITHUB_TOKEN and GITHUB_REPOSITORY are available
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}
loadEnvLocal();

async function initializeCache() {
  const repository = process.env.GITHUB_REPOSITORY || process.argv[2];
  const token = process.env.GITHUB_TOKEN;

  const args = process.argv.slice(2);
  let years: number[];

  if (args.length > 0 && /^\d{4}$/.test(args[0])) {
    years = args.map((y) => parseInt(String(y), 10)).filter((y) => y >= 2021 && y <= 2026);
    if (years.length === 0) {
      console.error('Invalid year(s). Please provide years between 2021 and 2026.');
      process.exit(1);
    }
  } else {
    years = [2022, 2023, 2024, 2025];
  }

  if (!repository || !repository.includes('/')) {
    console.error('Set GITHUB_REPOSITORY in .env.local (e.g. owner/repo) or pass repository as first arg.');
    process.exit(1);
  }

  if (!token) {
    console.error('GITHUB_TOKEN environment variable is required (set in .env.local).');
    process.exit(1);
  }

  const [owner, repo] = repository.split('/');
  const repoName = repo || '';

  const existingCache = readCachedData();
  let allIssues: Issue[] = existingCache?.issues || [];
  let allPRs: PullRequest[] = existingCache?.prs || [];
  let allReleases: Release[] = existingCache?.releases || [];
  let overallStartDate: Date | null = existingCache ? new Date(existingCache.dateRange.start) : null;
  let overallEndDate: Date | null = existingCache ? new Date(existingCache.dateRange.end) : null;

  console.log(`Fetching full dashboard data for: ${repository}`);
  console.log(`Years: ${years.join(', ')}\n`);

  for (const year of years.sort((a, b) => a - b)) {
    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    console.log(`\n--- ${year} ---`);

    try {
      const { issues, prs, releases } = await fetchFullGitHubData(token, owner, repoName, startDate, endDate);

      const merged = mergeCachedData(allIssues, allPRs, allReleases, issues, prs, releases);
      allIssues = merged.issues;
      allPRs = merged.prs;
      allReleases = merged.releases;

      if (!overallStartDate || startDate < overallStartDate) overallStartDate = startDate;
      if (!overallEndDate || endDate > overallEndDate) overallEndDate = endDate;

      console.log(`  Issues: ${issues.length}, PRs: ${prs.length}, Releases: ${releases.length}`);
    } catch (error) {
      console.error(`Error fetching data for ${year}:`, error);
    }
  }

  if (overallStartDate && overallEndDate) {
    writeCachedData(allIssues, allPRs, allReleases, overallStartDate, overallEndDate);
    console.log(`\nDone. Cached ${allIssues.length} issues, ${allPRs.length} PRs, ${allReleases.length} releases`);
    console.log(`Date range: ${overallStartDate.toISOString().split('T')[0]} to ${overallEndDate.toISOString().split('T')[0]}`);
    console.log(`File: data/github-data-cache.json`);
  } else {
    console.error('No data was cached');
    process.exit(1);
  }
}

// --- Full fetch logic (matches API route) ---

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

async function fetchFullGitHubData(
  token: string,
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date
): Promise<{ issues: Issue[]; prs: PullRequest[]; releases: Release[] }> {
  const issues: Issue[] = [];
  const prs: PullRequest[] = [];

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await throttledFetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&since=${startDate.toISOString()}&page=${page}&per_page=100`,
      { headers }
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
          labels: item.labels.map((l) => l.name),
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

  const releases = await fetchReleases(token, owner, repo, startDate, endDate, headers);

  return { issues, prs, releases };
}

async function fetchPRDetails(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  headers: HeadersInit
): Promise<PullRequest | null> {
  const prResponse = await throttledFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers }
  );
  if (!prResponse.ok) return null;
  const prData: GitHubPR = await prResponse.json();

  const reviewsResponse = await throttledFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews?per_page=100`,
    { headers }
  );
  let reviews: PRReview[] = [];
  if (reviewsResponse.ok) {
    const reviewsData: GitHubReview[] = await reviewsResponse.json();
    reviews = reviewsData.map((r) => ({
      user: r.user?.login || 'Unknown',
      state: r.state as PRReview['state'],
      submitted_at: r.submitted_at,
      body: r.body || '',
      is_bot: isBot(r.user?.login || ''),
    }));
  }

  const commitsResponse = await throttledFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits?per_page=1`,
    { headers }
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

  const humanReviews = reviews.filter((r) => !r.is_bot);
  const firstReview =
    humanReviews.length > 0
      ? humanReviews.reduce((earliest, r) =>
          new Date(r.submitted_at) < new Date(earliest.submitted_at) ? r : earliest
        )
      : null;
  const firstApproval = humanReviews
    .filter((r) => r.state === 'APPROVED')
    .reduce<PRReview | null>(
      (earliest, r) =>
        !earliest || new Date(r.submitted_at) < new Date(earliest.submitted_at) ? r : earliest,
      null
    );

  const requestedReviewerLogins = prData.requested_reviewers?.map((r) => r.login).filter(Boolean) || [];
  const reviewerSet = new Set(requestedReviewerLogins);
  reviews.forEach((r) => {
    if (!r.is_bot) reviewerSet.add(r.user);
  });

  return {
    number: prData.number,
    title: prData.title,
    state: prData.state,
    created_at: prData.created_at,
    closed_at: prData.closed_at,
    merged_at: prData.merged_at,
    user: prData.user?.login || 'Unknown',
    avatar_url: prData.user?.avatar_url || '',
    labels: prData.labels.map((l) => l.name),
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
  headers: HeadersInit
): Promise<boolean> {
  try {
    const response = await throttledFetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/events?per_page=100`,
      { headers }
    );
    if (!response.ok) return false;
    const events: GitHubEvent[] = await response.json();
    return events.some((e) => e.event === 'reopened');
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
  headers: HeadersInit
): Promise<Release[]> {
  const releases: Release[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const response = await throttledFetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?page=${page}&per_page=100`,
      { headers }
    );
    if (!response.ok) break;
    const data: GitHubRelease[] = await response.json();
    if (data.length === 0) break;

    for (const r of data) {
      if (!r.published_at) continue;
      const publishedAt = new Date(r.published_at);
      if (publishedAt < startDate) {
        hasMore = false;
        break;
      }
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

initializeCache();
