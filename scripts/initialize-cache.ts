/**
 * Script to initialize the local data cache with data for specified years
 * 
 * Usage:
 *   Single year: GITHUB_REPOSITORY=owner/repo npx tsx scripts/initialize-cache.ts 2024
 *   Multiple years: GITHUB_REPOSITORY=owner/repo npx tsx scripts/initialize-cache.ts 2024 2023 2022
 *   All years 2022-2025: GITHUB_REPOSITORY=owner/repo npx tsx scripts/initialize-cache.ts
 * 
 * Note: This script requires tsx to be installed: npm install -D tsx
 */

import { writeCachedData, readCachedData, mergeCachedData } from '../app/lib/dataCache';

async function initializeCache() {
  const repository = process.env.GITHUB_REPOSITORY || process.argv[2];
  const token = process.env.GITHUB_TOKEN;

  // Get years from command line arguments or default to 2022-2025
  const args = process.argv.slice(2);
  let years: number[];
  
  if (args.length > 0 && /^\d{4}$/.test(args[0])) {
    // Years provided as arguments
    years = args.map(y => parseInt(y)).filter(y => y >= 2021 && y <= 2025);
    if (years.length === 0) {
      console.error('Invalid year(s). Please provide years between 2021 and 2025.');
      process.exit(1);
    }
  } else {
    // Default: cache 2022-2025
    years = [2022, 2023, 2024, 2025];
  }

  if (!repository || !repository.includes('/')) {
    console.error('Please provide a repository in the format: owner/repo');
    console.error('Usage: GITHUB_REPOSITORY=owner/repo npx tsx scripts/initialize-cache.ts [year1] [year2] ...');
    console.error('Example: GITHUB_REPOSITORY=owner/repo npx tsx scripts/initialize-cache.ts 2024 2023 2022');
    process.exit(1);
  }

  if (!token) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const [owner, repo] = repository.split('/');
  
  // Read existing cache if it exists
  let existingCache = readCachedData();
  let allIssues = existingCache?.issues || [];
  let allPRs = existingCache?.prs || [];
  let overallStartDate: Date | null = existingCache ? new Date(existingCache.dateRange.start) : null;
  let overallEndDate: Date | null = existingCache ? new Date(existingCache.dateRange.end) : null;

  console.log(`\n📦 Caching data for years: ${years.join(', ')}\n`);

  for (const year of years.sort()) {
    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    console.log(`Fetching data for ${year} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})...`);

    try {
      const { issues, prs } = await fetchGitHubDataHelper(token, owner, repo, startDate, endDate);
      
      // Merge with existing data
      const merged = mergeCachedData(allIssues, allPRs, issues, prs);
      allIssues = merged.issues;
      allPRs = merged.prs;
      
      // Update overall date range
      if (!overallStartDate || startDate < overallStartDate) {
        overallStartDate = startDate;
      }
      if (!overallEndDate || endDate > overallEndDate) {
        overallEndDate = endDate;
      }
      
      console.log(`✅ Cached ${issues.length} issues and ${prs.length} PRs for ${year}`);
    } catch (error) {
      console.error(`❌ Error fetching data for ${year}:`, error);
      // Continue with other years
    }
  }

  // Write merged cache
  if (overallStartDate && overallEndDate) {
    writeCachedData(allIssues, allPRs, overallStartDate, overallEndDate);
    console.log(`\n✅ Successfully cached total of ${allIssues.length} issues and ${allPRs.length} PRs`);
    console.log(`📅 Date range: ${overallStartDate.toISOString().split('T')[0]} to ${overallEndDate.toISOString().split('T')[0]}`);
    console.log(`💾 Cache file: data/github-data-cache.json\n`);
  } else {
    console.error('❌ No data was cached');
    process.exit(1);
  }
}

// Helper function to fetch data (similar to fetchGitHubData but accessible here)
async function fetchGitHubDataHelper(
  token: string,
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date
): Promise<{ issues: any[]; prs: any[] }> {
  const issues: any[] = [];
  const prs: any[] = [];

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&since=${startDate.toISOString()}&page=${page}&per_page=100`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: any[] = await response.json();
    
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
        const prResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${item.number}`,
          { headers }
        );
        
        if (prResponse.ok) {
          const prData: any = await prResponse.json();
          prs.push({
            number: prData.number,
            title: prData.title,
            state: prData.state,
            created_at: prData.created_at,
            closed_at: prData.closed_at,
            merged_at: prData.merged_at,
            user: prData.user?.login || 'Unknown',
            labels: prData.labels.map((l: any) => l.name),
            comments: prData.comments,
            review_comments: prData.review_comments,
            body: prData.body || '',
            is_pr: true,
            merged: prData.merged,
            additions: prData.additions || 0,
            deletions: prData.deletions || 0,
            changed_files: prData.changed_files || 0,
            reviewers: prData.requested_reviewers?.map((r: any) => r.login) || [],
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
          labels: item.labels.map((l: any) => l.name),
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

initializeCache();
