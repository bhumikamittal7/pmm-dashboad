'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FetchDataResponse } from '@/types';
import { fetchRepositoryData } from '../lib/api';
import { getCachedData } from '../lib/cache';

interface DashboardState {
  repository: string;
  setRepository: (repo: string) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  data: FetchDataResponse | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  fetchData: (forceRefresh?: boolean) => Promise<void>;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date('2025-12-31'));
  const [data, setData] = useState<FetchDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        if (config.repository) {
          setRepository(config.repository);
        }
      } catch {
        // User can enter repository manually
      }
    }
    loadConfig();
  }, []);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    if (!repository || !repository.includes('/')) {
      setError('Please enter a valid repository in the format: owner/repo');
      return;
    }

    setLoading(true);
    setError(null);
    setIsFromCache(false);

    try {
      if (!forceRefresh) {
        const cached = getCachedData(repository, startDate, endDate);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }

      const response = await fetchRepositoryData(repository, startDate, endDate, !forceRefresh);
      if (response.success && response.data) {
        setData(response);
        setIsFromCache(false);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [repository, startDate, endDate]);

  return (
    <DashboardContext.Provider
      value={{
        repository,
        setRepository,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        data,
        loading,
        error,
        isFromCache,
        fetchData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
