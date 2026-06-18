/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecords } from '../../src/hooks/useRecords';
import * as api from '../../src/api/recordApi';

vi.mock('../../src/api/recordApi');

describe('useRecords', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('initializes with default state and calls refresh', async () => {
    vi.mocked(api.fetchRecords).mockResolvedValueOnce({
      data: [{ id: '1', url_or_email: 'test.com' } as any],
      total: 1,
    });
    vi.mocked(api.fetchCounts).mockResolvedValueOnce({ total: 1 } as any as any);

    const { result } = renderHook(() => useRecords({ page: 1, limit: 10 }));

    expect(result.current.loading).toBe(true);
    expect(result.current.records).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.totalRecords).toBe(1);
    expect(result.current.counts.total).toBe(1);
  });

  it('handles errors during refresh', async () => {
    vi.mocked(api.fetchRecords).mockRejectedValueOnce(new Error('Fetch failed'));
    
    const { result } = renderHook(() => useRecords({ page: 1, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Fetch failed');
  });

  it('handles errors during refresh as string', async () => {
    vi.mocked(api.fetchRecords).mockRejectedValueOnce('String error message');
    
    const { result } = renderHook(() => useRecords({ page: 1, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('String error message');
  });

  it('debounces filter changes', async () => {
    vi.mocked(api.fetchRecords).mockResolvedValue({ data: [], total: 0 });
    vi.mocked(api.fetchCounts).mockResolvedValue({ total: 0 } as any as any);

    const { result } = renderHook(() => useRecords({ page: 1, limit: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Clear initial call
    vi.mocked(api.fetchRecords).mockClear();

    act(() => {
      result.current.setFilters({ status: 'new' });
    });

    // Should not be called immediately due to debounce
    expect(api.fetchRecords).not.toHaveBeenCalled();

    // Wait for debounce timer (150ms)
    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    expect(api.fetchRecords).toHaveBeenCalledTimes(1);
  });

  it('clears timeout on unmount', async () => {
    vi.mocked(api.fetchRecords).mockResolvedValue({ data: [], total: 0 });
    vi.mocked(api.fetchCounts).mockResolvedValue({ total: 0 } as any as any);

    const { result, unmount } = renderHook(() => useRecords({ page: 1, limit: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFilters({ status: 'reviewed' });
    });

    // Unmount before debounce timer completes
    unmount();

    // Fast-forward or wait
    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    // We shouldn't see fetchRecords called again after the initial one because unmount cleared the timer
    // and cleanup happens. Wait, fetchRecords is called on initial mount. We should check if it's called 1 time only.
    expect(api.fetchRecords).toHaveBeenCalledTimes(1);
  });
});
