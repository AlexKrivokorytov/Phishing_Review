import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRecords, fetchCounts } from '../api/recordApi';
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
    Promise.all([fetchRecords(debouncedFilters), fetchCounts()])
      .then(([response, countsData]) => {
        setRecords(response.data);
        setTotalRecords(response.total);
        setCounts(countsData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [debouncedFilters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { records, counts, totalRecords, loading, error, refresh, filters, setFilters };
}
