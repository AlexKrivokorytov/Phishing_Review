import React from 'react';
import type { Record, RecordFilters, Status, Label } from '../types/record';
import { LabelBadge } from './LabelBadge';
import { StatusBadge } from './StatusBadge';

const PAGE_SIZE = 10;

interface RecordTableProps {
  records: Record[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (record: Record) => void;
  filters: RecordFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<RecordFilters>>;
}

const STATUS_OPTIONS: Array<{ value: Status | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'needs_second_review', label: 'Needs review' },
];

const LABEL_OPTIONS: Array<{ value: Label | ''; label: string }> = [
  { value: '', label: 'All labels' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'malware', label: 'Malware' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'benign', label: 'Benign' },
];

export const RecordTable: React.FC<RecordTableProps> = ({
  records,
  loading,
  selectedId,
  onSelect,
  filters,
  onFiltersChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange((prev) => ({ ...prev, status: e.target.value as Status | '' }));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange((prev) => ({ ...prev, label: e.target.value as Label | '' }));
  };

  const truncateUrl = (url: string, maxLength: number = 35): string => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset to first page when search/filter changes or records update
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, records.length]);

  const totalPages = Math.ceil(records.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentRecords = records.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="record-table-container">
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search URL, email or notes..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          className="filter-input"
        />
        <select
          value={filters.status || ''}
          onChange={handleStatusChange}
          className="filter-select"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={filters.label || ''}
          onChange={handleLabelChange}
          className="filter-select"
        >
          {LABEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-scroll">
        {loading ? (
          <div className="table-loading">Loading records...</div>
        ) : (
          <table className="record-table">
            <thead>
              <tr>
                <th>URL / Email</th>
                <th>Status</th>
                <th>Label</th>
                <th className="hide-on-mobile">Source</th>
                <th className="hide-on-mobile">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">No records found</td>
                </tr>
              ) : (
                currentRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={record.id === selectedId ? 'selected' : ''}
                    onClick={() => onSelect(record)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="cell-mono" title={record.url_or_email}>
                      {truncateUrl(record.url_or_email)}
                    </td>
                    <td><StatusBadge status={record.status} /></td>
                    <td><LabelBadge label={record.label} /></td>
                    <td className="hide-on-mobile">{record.source}</td>
                    <td className="hide-on-mobile" style={{ whiteSpace: 'nowrap' }}>{record.date_collected}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {records.length > 0 && (
        <div className="pagination">
          <button
            className="btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Prev
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
