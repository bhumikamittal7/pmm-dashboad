import fs from 'fs';
import path from 'path';
import { Issue, PullRequest } from '@/types';

const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'github-data-cache.json');

interface CachedData {
  issues: Issue[];
  prs: PullRequest[];
  lastUpdated: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readCachedData(): CachedData | null {
  try {
    ensureCacheDir();
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }
    const fileContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(fileContent) as CachedData;
  } catch (error) {
    console.error('Error reading cached data:', error);
    return null;
  }
}

export function writeCachedData(issues: Issue[], prs: PullRequest[], startDate: Date, endDate: Date): void {
  try {
    ensureCacheDir();
    const cachedData: CachedData = {
      issues,
      prs,
      lastUpdated: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing cached data:', error);
  }
}

export function getCachedDataForRange(requestedStart: Date, requestedEnd: Date): {
  issues: Issue[];
  prs: PullRequest[];
} | null {
  const cached = readCachedData();
  if (!cached) {
    return null;
  }

  const cacheStart = new Date(cached.dateRange.start);
  const cacheEnd = new Date(cached.dateRange.end);

  // Check if cached data covers the requested range
  if (cacheStart <= requestedStart && cacheEnd >= requestedEnd) {
    // Filter cached data to only include items in the requested range
    const filteredIssues = cached.issues.filter(issue => {
      const issueDate = new Date(issue.created_at);
      return issueDate >= requestedStart && issueDate <= requestedEnd;
    });

    const filteredPRs = cached.prs.filter(pr => {
      const prDate = new Date(pr.created_at);
      return prDate >= requestedStart && prDate <= requestedEnd;
    });

    return {
      issues: filteredIssues,
      prs: filteredPRs,
    };
  }

  return null;
}

export function mergeCachedData(
  cachedIssues: Issue[],
  cachedPRs: PullRequest[],
  newIssues: Issue[],
  newPRs: PullRequest[]
): { issues: Issue[]; prs: PullRequest[] } {
  // Create maps to avoid duplicates
  const issueMap = new Map<number, Issue>();
  const prMap = new Map<number, PullRequest>();

  // Add cached data
  cachedIssues.forEach(issue => issueMap.set(issue.number, issue));
  cachedPRs.forEach(pr => prMap.set(pr.number, pr));

  // Add/update with new data
  newIssues.forEach(issue => issueMap.set(issue.number, issue));
  newPRs.forEach(pr => prMap.set(pr.number, pr));

  return {
    issues: Array.from(issueMap.values()),
    prs: Array.from(prMap.values()),
  };
}
