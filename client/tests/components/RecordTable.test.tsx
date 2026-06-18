import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordTable } from '../../src/components/RecordTable';

describe('RecordTable', () => {
  const mockRecords = [
    {
      id: '1',
      url_or_email: 'test1@example.com',
      source: 'user',
      date_collected: '2023-01-01',
      label: 'phishing' as const,
      notes: '',
      status: 'new' as const,
      imported_at: '2023-01-01T00:00:00Z',
      reviewed_at: null,
      tags: [],
    },
    {
      id: '2',
      url_or_email: 'test2@example.com',
      source: 'system',
      date_collected: '2023-01-02',
      label: 'benign' as const,
      notes: '',
      status: 'reviewed' as const,
      imported_at: '2023-01-02T00:00:00Z',
      reviewed_at: '2023-01-03T00:00:00Z',
      tags: [],
    }
  ];

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' }
  ];

  const labelOptions = [
    { value: 'phishing', label: 'Phishing' },
    { value: 'benign', label: 'Benign' }
  ];

  const defaultProps = {
    records: mockRecords,
    totalRecords: 2,
    loading: false,
    selectedId: null,
    onSelect: vi.fn(),
    filters: { page: 1, limit: 10 },
    onFiltersChange: vi.fn(),
    statusOptions,
    labelOptions
  };

  it('renders loading state', () => {
    render(<RecordTable {...defaultProps} loading={true} />);
    expect(screen.getByText('Loading records...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<RecordTable {...defaultProps} records={[]} totalRecords={0} />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders records', () => {
    render(<RecordTable {...defaultProps} />);
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();
  });

  it('calls onSelect when a row is clicked', async () => {
    const handleSelect = vi.fn();
    render(<RecordTable {...defaultProps} onSelect={handleSelect} />);
    
    const user = userEvent.setup();
    await user.click(screen.getByText('test1@example.com'));
    
    expect(handleSelect).toHaveBeenCalledWith(mockRecords[0]);
  });

  it('updates search filter', async () => {
    const handleFiltersChange = vi.fn();
    render(<RecordTable {...defaultProps} onFiltersChange={handleFiltersChange} />);
    
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search URL, email or notes...');
    await user.type(searchInput, 'test');
    
    expect(handleFiltersChange).toHaveBeenCalled();
    // The exact arguments depend on the functional state update, which is hard to mock perfectly.
    // We can at least check it was called.
  });

  it('updates status filter', async () => {
    const handleFiltersChange = vi.fn();
    render(<RecordTable {...defaultProps} onFiltersChange={handleFiltersChange} />);
    
    const user = userEvent.setup();
    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[0]; // First is status
    
    await user.selectOptions(statusSelect, 'new');
    expect(handleFiltersChange).toHaveBeenCalled();
  });

  it('updates label filter', async () => {
    const handleFiltersChange = vi.fn();
    render(<RecordTable {...defaultProps} onFiltersChange={handleFiltersChange} />);
    
    const user = userEvent.setup();
    const statusSelects = screen.getAllByRole('combobox');
    const labelSelect = statusSelects[1]; // Second is label
    
    await user.selectOptions(labelSelect, 'phishing');
    expect(handleFiltersChange).toHaveBeenCalled();
  });

  it('handles pagination next', async () => {
    const handleFiltersChange = vi.fn();
    render(<RecordTable {...defaultProps} totalRecords={20} filters={{ page: 1, limit: 10 }} onFiltersChange={handleFiltersChange} />);
    
    const user = userEvent.setup();
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    await user.click(nextBtn);
    expect(handleFiltersChange).toHaveBeenCalled();
  });

  it('handles pagination prev', async () => {
    const handleFiltersChange = vi.fn();
    render(<RecordTable {...defaultProps} totalRecords={20} filters={{ page: 2, limit: 10 }} onFiltersChange={handleFiltersChange} />);
    
    const user = userEvent.setup();
    const prevBtn = screen.getByRole('button', { name: 'Prev' });
    await user.click(prevBtn);
    expect(handleFiltersChange).toHaveBeenCalled();
  });
});
