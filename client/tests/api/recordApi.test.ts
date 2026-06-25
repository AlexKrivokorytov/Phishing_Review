import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../src/api/recordApi';
import type { RecordFilters, UpdateRecordPayload } from '../../src/types/record';

describe('recordApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.fetch = vi.fn();
  });

  const mockResponse = (data: unknown, ok: boolean = true) => {
    return Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
      status: ok ? 200 : 500,
    } as unknown as Response);
  };

  it('fetchConfig calls the correct endpoint', async () => {
    const config = { appName: 'Test' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse(config));

    const result = await api.fetchConfig();
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3001/api/config', undefined);
    expect(result).toEqual(config);
  });

  it('fetchConfig throws on error and falls back to statusText', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse({}, false));
    await expect(api.fetchConfig()).rejects.toThrow('Request failed: undefined');
  });

  it('fetchRecords appends filters to URL', async () => {
    const data = { data: [], total: 0 };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse(data));

    const filters: RecordFilters = { status: 'new', limit: 10, page: 2 };
    await api.fetchRecords(filters);

    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3001/api/records?status=new&page=2&limit=10', undefined);
  });

  it('fetchRecords handles multiple filters', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse({ data: [], total: 0 }));
    await api.fetchRecords({ status: 'new', label: 'phishing', search: 'test', page: 2, limit: 20 });
    
    // We expect the URL to contain all appended params
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=new&label=phishing&search=test&page=2&limit=20'),
      undefined
    );
  });

  it('fetchCounts calls the correct endpoint', async () => {
    const counts = { total: 1 };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse(counts));

    const result = await api.fetchCounts();
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3001/api/records/counts', undefined);
    expect(result).toEqual(counts);
  });

  it('updateRecord uses PATCH and passes dto', async () => {
    const dto: UpdateRecordPayload = { status: 'reviewed' };
    const responseData = { id: '1', status: 'reviewed' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse(responseData));

    const result = await api.updateRecord('1', dto);
    
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3001/api/records/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    expect(result).toEqual(responseData);
  });

  it('getTags calls the correct endpoint', async () => {
    const tags = [{ id: 1, name: 'tag1' }];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse(tags));

    const result = await api.getTags();
    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3001/api/tags', undefined);
    expect(result).toEqual(tags);
  });

  it('importFile uses POST and FormData', async () => {
    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse({ success: true }));

    await api.importFile(file);

    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3001/api/import/file', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  });

  it('downloadExport creates object URL and triggers download', async () => {
    vi.useFakeTimers();
    const mockBlob = new Blob(['data'], { type: 'text/csv' });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    } as Response);

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    globalThis.URL.revokeObjectURL = vi.fn();
    
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

    const promise = api.downloadExport('csv');
    await vi.runAllTimersAsync();
    await promise;

    expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3001/api/export/csv');
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockAnchor.download).toContain('phishguard-export-');
    expect(mockAnchor.download).toContain('.csv');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    vi.useRealTimers();
  });

  it('downloadExport throws error if request fails and uses statusText fallback', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(await mockResponse({}, false));
    await expect(api.downloadExport('json')).rejects.toThrow('Request failed: undefined');
  });
});
