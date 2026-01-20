import { FetchDataResponse } from '@/types';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_PREFIX = 'github_analytics_';

interface CacheEntry {
  data: FetchDataResponse;
  timestamp: number;
  key: string;
}

function getCacheKey(repository: string, startDate: Date, endDate: Date): string {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  return `${CACHE_PREFIX}${repository}_${start}_${end}`;
}

export function getCachedData(
  repository: string,
  startDate: Date,
  endDate: Date
): FetchDataResponse | null {
  if (typeof window === 'undefined') {
    return null; // Server-side, no cache
  }

  try {
    const cacheKey = getCacheKey(repository, startDate, endDate);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

export function setCachedData(
  repository: string,
  startDate: Date,
  endDate: Date,
  data: FetchDataResponse
): void {
  if (typeof window === 'undefined') {
    return; // Server-side, no cache
  }

  try {
    const cacheKey = getCacheKey(repository, startDate, endDate);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      key: cacheKey,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));

    // Clean up old cache entries (keep only last 10)
    cleanupOldCache();
  } catch (error) {
    console.error('Error writing to cache:', error);
    // If storage is full, try to clean up and retry
    try {
      cleanupOldCache();
      localStorage.setItem(
        getCacheKey(repository, startDate, endDate),
        JSON.stringify({
          data,
          timestamp: Date.now(),
          key: getCacheKey(repository, startDate, endDate),
        })
      );
    } catch (retryError) {
      console.error('Failed to write to cache after cleanup:', retryError);
    }
  }
}

function cleanupOldCache(): void {
  try {
    const entries: Array<{ key: string; timestamp: number }> = [];

    // Collect all cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            entries.push({ key, timestamp: entry.timestamp });
          }
        } catch {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove expired entries and keep only last 10
    const now = Date.now();
    entries.forEach((entry, index) => {
      if (now - entry.timestamp > CACHE_TTL || index < entries.length - 10) {
        localStorage.removeItem(entry.key);
      }
    });
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

export function clearCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
