import fs from 'fs';
import path from 'path';
import { Issue, PullRequest, Release } from '@/types';

const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'github-data-cache.json');

interface CachedData {
  version: 2;
  issues: Issue[];
  prs: PullRequest[];
  releases: Release[];
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
    if (!fs.existsSync(CACHE_FILE)) return null;
    const fileContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    // Handle old cache format (version 1 or no version)
    if (!parsed.version || parsed.version < 2) {
      return {
        version: 2,
        issues: parsed.issues || [],
        prs: parsed.prs || [],
        releases: parsed.releases || [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        dateRange: parsed.dateRange || { start: new Date().toISOString(), end: new Date().toISOString() },
      };
    }
    return parsed as CachedData;
  } catch (error) {
    console.error('Error reading cached data:', error);
    return null;
  }
}

export function writeCachedData(
  issues: Issue[],
  prs: PullRequest[],
  releases: Release[],
  startDate: Date,
  endDate: Date,
): void {
  try {
    ensureCacheDir();
    const cachedData: CachedData = {
      version: 2,
      issues,
      prs,
      releases,
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

export function getCachedDataForRange(
  requestedStart: Date,
  requestedEnd: Date,
): { issues: Issue[]; prs: PullRequest[]; releases: Release[] } | null {
  const cached = readCachedData();
  if (!cached) return null;

  const cacheStart = new Date(cached.dateRange.start);
  const cacheEnd = new Date(cached.dateRange.end);

  if (cacheStart <= requestedStart && cacheEnd >= requestedEnd) {
    const filteredIssues = cached.issues.filter(issue => {
      const d = new Date(issue.created_at);
      return d >= requestedStart && d <= requestedEnd;
    });
    const filteredPRs = cached.prs.filter(pr => {
      const d = new Date(pr.created_at);
      return d >= requestedStart && d <= requestedEnd;
    });
    const filteredReleases = (cached.releases || []).filter(r => {
      const d = new Date(r.published_at);
      return d >= requestedStart && d <= requestedEnd;
    });
    return { issues: filteredIssues, prs: filteredPRs, releases: filteredReleases };
  }

  return null;
}

export function mergeCachedData(
  cachedIssues: Issue[],
  cachedPRs: PullRequest[],
  cachedReleases: Release[],
  newIssues: Issue[],
  newPRs: PullRequest[],
  newReleases: Release[],
): { issues: Issue[]; prs: PullRequest[]; releases: Release[] } {
  const issueMap = new Map<number, Issue>();
  const prMap = new Map<number, PullRequest>();
  const releaseMap = new Map<string, Release>();

  cachedIssues.forEach(i => issueMap.set(i.number, i));
  cachedPRs.forEach(p => prMap.set(p.number, p));
  (cachedReleases || []).forEach(r => releaseMap.set(r.tag_name, r));

  newIssues.forEach(i => issueMap.set(i.number, i));
  newPRs.forEach(p => prMap.set(p.number, p));
  (newReleases || []).forEach(r => releaseMap.set(r.tag_name, r));

  return {
    issues: Array.from(issueMap.values()),
    prs: Array.from(prMap.values()),
    releases: Array.from(releaseMap.values()),
  };
}
