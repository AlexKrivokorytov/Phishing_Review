import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRecords, fetchCounts } from '../api/recordApi';
import { getErrorMessage } from '../utils/errors';
import type { Record, RecordCounts, RecordFilters } from '../types/record';

interface UseRecordsReturn {
  records: Record[];
  counts: RecordCounts;
  totalRecords: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  filters: RecordFilters;
  setFilters: React.Dispatch<React.SetStateAction<RecordFilters>>;
}

const DEFAULT_COUNTS: RecordCounts = { total: 0, new: 0, reviewed: 0, phishing: 0, needs_second_review: 0 };

export function useRecords(defaultPagination: { page: number; limit: number }): UseRecordsReturn {
  const [records, setRecords] = useState<Record[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [counts, setCounts] = useState<RecordCounts>(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecordFilters>({ status: '', search: '', ...defaultPagination });
  const [debouncedFilters, setDebouncedFilters] = useState<RecordFilters>(filters);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Debounce all filter changes to avoid firing an API request on every keystroke.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 150);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [filters]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const currentController = new AbortController();
    abortRef.current = currentController;
    const requestId = ++requestIdRef.current;

    Promise.all([
      fetchRecords(debouncedFilters, currentController.signal),
      fetchCounts(),
    ])
      .then(([response, countsData]) => {
        if (
          requestId !== requestIdRef.current ||
          currentController.signal.aborted
        ) {
          return;
        }
        setRecords(response.data);
        setTotalRecords(response.total);
        setCounts(countsData);
      })
      .catch((err: unknown) => {
        if (
          requestId !== requestIdRef.current ||
          currentController.signal.aborted
        ) {
          return;
        }
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (
          requestId === requestIdRef.current &&
          !currentController.signal.aborted
        ) {
          setLoading(false);
        }
      });
  }, [debouncedFilters]);

  useEffect(() => {
    refresh();
    return () => {
      requestIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, [refresh]);

  return { records, counts, totalRecords, loading, error, refresh, filters, setFilters };
}
