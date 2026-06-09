import { useState, useEffect, useCallback } from 'react';
import { fetchRecords, fetchCounts } from '../api/recordApi';
import type { Record, RecordCounts, RecordFilters } from '../types/record';

interface UseRecordsReturn {
  records: Record[];
  counts: RecordCounts;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  filters: RecordFilters;
  setFilters: React.Dispatch<React.SetStateAction<RecordFilters>>;
}

const DEFAULT_COUNTS: RecordCounts = { total: 0, new: 0, reviewed: 0, phishing: 0 };

export function useRecords(): UseRecordsReturn {
  const [records, setRecords] = useState<Record[]>([]);
  const [counts, setCounts] = useState<RecordCounts>(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecordFilters>({ status: '', search: '' });

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchRecords(filters), fetchCounts()])
      .then(([recordsData, countsData]) => {
        setRecords(recordsData);
        setCounts(countsData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { records, counts, loading, error, refresh, filters, setFilters };
}
