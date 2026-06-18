import React from 'react';
import type { Record, RecordFilters, Status, Label } from '../types/record';
import { LabelBadge } from './LabelBadge';
import { StatusBadge } from './StatusBadge';

const PAGE_SIZE = 10;

interface RecordTableProps {
  records: Record[];
  totalRecords: number;
  loading: boolean;
  selectedId: string | null;
  onSelect: (record: Record) => void;
  filters: RecordFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<RecordFilters>>;
  statusOptions: { value: string; label: string }[];
  labelOptions: { value: string; label: string }[];
}

export const RecordTable: React.FC<RecordTableProps> = ({
  records,
  totalRecords,
  loading,
  selectedId,
  onSelect,
  filters,
  onFiltersChange,
  statusOptions,
  labelOptions,
}) => {
  const FILTER_STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    ...statusOptions,
  ];

  const FILTER_LABEL_OPTIONS = [
    { value: '', label: 'All labels' },
    ...labelOptions,
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange((prev) => ({ ...prev, status: e.target.value as Status | '', page: 1 }));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange((prev) => ({ ...prev, label: e.target.value as Label | '', page: 1 }));
  };



  const currentPage = filters.page || 1;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1;

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
          {FILTER_STATUS_OPTIONS.map((option) => (
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
          {FILTER_LABEL_OPTIONS.map((option) => (
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
                records.map((record) => (
                  <tr
                    key={record.id}
                    className={record.id === selectedId ? 'selected' : ''}
                    onClick={() => onSelect(record)}
                  >
                    <td className="cell-mono" title={record.url_or_email}>
                      {record.url_or_email}
                    </td>
                    <td><StatusBadge status={record.status} /></td>
                    <td><LabelBadge label={record.label} /></td>
                    <td className="hide-on-mobile">{record.source}</td>
                    <td className="hide-on-mobile record-table-date">{record.date_collected}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalRecords > 0 && (
        <div className="pagination">
          <button
            className="btn-secondary"
            disabled={currentPage === 1}
            onClick={() => onFiltersChange(p => ({ ...p, page: currentPage - 1 }))}
          >
            Prev
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => onFiltersChange(p => ({ ...p, page: currentPage + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
