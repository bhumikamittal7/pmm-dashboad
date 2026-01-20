/**
 * Script to initialize the local data cache with data for Jan 1, 2025 to Dec 31, 2025
 * Run with: npx tsx scripts/initialize-cache.ts
 * 
 * Note: This script requires tsx to be installed: npm install -D tsx
 */

import { writeCachedData } from '../app/lib/dataCache';

async function initializeCache() {
  const repository = process.env.GITHUB_REPOSITORY || process.argv[2];
  const token = process.env.GITHUB_TOKEN;

  if (!repository || !repository.includes('/')) {
    console.error('Please provide a repository in the format: owner/repo');
    console.error('Usage: GITHUB_REPOSITORY=owner/repo npx tsx scripts/initialize-cache.ts');
    process.exit(1);
  }

  if (!token) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const [owner, repo] = repository.split('/');
  
  // Fetch data for Jan 1, 2025 to Dec 31, 2025
  const startDate = new Date('2025-01-01T00:00:00Z');
  const endDate = new Date('2025-12-31T23:59:59Z');

  console.log(`Fetching data for ${repository} from ${startDate.toISOString()} to ${endDate.toISOString()}...`);

  try {
    // We need to import the fetchGitHubData function, but it's not exported
    // Let's create a helper function here
    const { issues, prs } = await fetchGitHubDataHelper(token, owner, repo, startDate, endDate);
    
    writeCachedData(issues, prs, startDate, endDate);
    
    console.log(`✅ Successfully cached ${issues.length} issues and ${prs.length} PRs`);
    console.log(`Cache file: data/github-data-cache.json`);
  } catch (error) {
    console.error('Error initializing cache:', error);
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
