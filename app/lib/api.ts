import { FetchDataRequest, FetchDataResponse } from '@/types';
import { getCachedData, setCachedData } from './cache';

const API_BASE_URL = '';

export async function fetchRepositoryData(
  repository: string,
  startDate: Date,
  endDate: Date,
  useCache: boolean = true
): Promise<FetchDataResponse> {
  // Check cache first
  if (useCache) {
    const cached = getCachedData(repository, startDate, endDate);
    if (cached) {
      return cached;
    }
  }

  const request: FetchDataRequest = {
    repository,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/fetch-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      };
    }

    const data: FetchDataResponse = await response.json();
    
    // Cache successful responses
    if (data.success && useCache) {
      setCachedData(repository, startDate, endDate, data);
    }
    
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
