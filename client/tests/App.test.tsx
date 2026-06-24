/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import * as api from '../src/api/recordApi';

vi.mock('../src/api/recordApi');
vi.mock('../src/hooks/useRecords', () => ({
  useRecords: vi.fn(() => ({
    records: [],
    counts: { total: 0, new: 0, reviewed: 0, phishing: 0, needs_second_review: 0 },
    totalRecords: 0,
    loading: false,
    error: null,
    refresh: vi.fn(),
    filters: { page: 1, limit: 10 },
    setFilters: vi.fn(),
  })),
}));

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockConfig = {
    appName: 'PhishGuard',
    statusOptions: [{ value: 'new', label: 'New' }],
    labelOptions: [{ value: 'phishing', label: 'Phishing' }],
    defaultPagination: { page: 1, limit: 10 }
  };

  it('renders loading state initially', () => {
    // Return a promise that doesn't resolve immediately
    vi.mocked(api.fetchConfig).mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
  });

  it('renders error if config fails', async () => {
    vi.mocked(api.fetchConfig).mockRejectedValueOnce(new Error('Config error'));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load configuration: Config error')).toBeInTheDocument();
    });
  });

  it('renders main app and allows export', async () => {
    vi.mocked(api.fetchConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(api.getTags).mockResolvedValueOnce([]);
    vi.mocked(api.downloadExport).mockResolvedValueOnce();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('PhishGuard')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const exportJsonBtn = screen.getByRole('button', { name: 'Export JSON' });
    await user.click(exportJsonBtn);

    expect(api.downloadExport).toHaveBeenCalledWith('json', expect.objectContaining({}));
  });

  it('handles export error', async () => {
    vi.mocked(api.fetchConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(api.getTags).mockResolvedValueOnce([]);
    vi.mocked(api.downloadExport).mockRejectedValueOnce(new Error('Export failed'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('PhishGuard')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const exportCsvBtn = screen.getByRole('button', { name: 'Export CSV' });
    await user.click(exportCsvBtn);

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  it('handles file import', async () => {
    vi.mocked(api.fetchConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(api.getTags).mockResolvedValueOnce([]);
    vi.mocked(api.importFile).mockResolvedValueOnce({ success: true, imported: 1, skippedDuplicates: 0, skippedInvalid: 0, message: 'Done' });

    render(<App />);
    
    await waitFor(() => expect(screen.getByText('PhishGuard')).toBeInTheDocument());

    const user = userEvent.setup();
    
    // We cannot easily test click on fileInput via user.click(button) because it just calls click() on the hidden input.
    // Instead, we can fire a change event on the file input itself.
    // Testing Library handles file uploads via user.upload
    
    const file = new File(['hello'], 'hello.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('#file-input') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    expect(api.importFile).toHaveBeenCalledWith(file);
    await waitFor(() => expect(api.importFile).toHaveBeenCalled());
  });

  it('handles file import error as string', async () => {
    vi.mocked(api.fetchConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(api.getTags).mockResolvedValueOnce([]);
    vi.mocked(api.importFile).mockRejectedValueOnce('Import string error');

    render(<App />);
    
    await waitFor(() => expect(screen.getByText('PhishGuard')).toBeInTheDocument());

    const user = userEvent.setup();
    const file = new File(['hello'], 'hello.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('#file-input') as HTMLInputElement;
    
    await user.upload(fileInput, file);
    
    await waitFor(() => expect(screen.getByText('Import string error')).toBeInTheDocument());
  });

  it('handles save from detail panel', async () => {
    const mockRecordsList = [{ id: '1', url_or_email: 'test.com', status: 'new', label: null, source: 'sys', date_collected: '2023' }];
    
    // Override the global mock for this test
    const { useRecords } = await import('../src/hooks/useRecords');
    (useRecords as any).mockReturnValue({
      records: mockRecordsList,
      counts: { total: 1, new: 1, reviewed: 0, phishing: 0, needs_second_review: 0 },
      totalRecords: 1,
      loading: false,
      error: null,
      refresh: vi.fn(),
      filters: { page: 1, limit: 10 },
      setFilters: vi.fn(),
    });

    vi.mocked(api.fetchConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(api.getTags).mockResolvedValueOnce([]);
    vi.mocked(api.updateRecord).mockResolvedValueOnce({ ...mockRecordsList[0], status: 'reviewed' } as any);

    render(<App />);
    
    await waitFor(() => expect(screen.getByText('PhishGuard')).toBeInTheDocument());

    const user = userEvent.setup();
    
    // Select record
    await user.click(screen.getByText('test.com'));

    // Detail panel should be visible. Click Save.
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await user.click(saveBtn);

    expect(api.updateRecord).toHaveBeenCalledWith('1', expect.objectContaining({ status: 'new' }));

    // Test close panel
    const closeBtn = screen.getByRole('button', { name: 'Close details' });
    await user.click(closeBtn);
    expect(screen.getByText('← Select a record to review')).toBeInTheDocument();
  });

  it('triggers file input click when import button is clicked', async () => {
    vi.mocked(api.fetchConfig).mockResolvedValueOnce(mockConfig);
    vi.mocked(api.getTags).mockResolvedValueOnce([]);

    render(<App />);
    await waitFor(() => expect(screen.getByText('PhishGuard')).toBeInTheDocument());

    const importBtn = screen.getByRole('button', { name: 'Import File' });
    const fileInput = document.querySelector('#file-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const user = userEvent.setup();
    await user.click(importBtn);

    expect(clickSpy).toHaveBeenCalled();
  });
});
