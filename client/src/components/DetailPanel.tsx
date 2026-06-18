import React, { useState, useEffect } from 'react';
import type { Record, Tag, Label, Status, UpdateRecordPayload } from '../types/record';

interface DetailPanelProps {
  record: Record | null;
  availableTags: Tag[];
  onSave: (id: string, payload: UpdateRecordPayload) => Promise<void>;
  saving: boolean;
  onClose: () => void;
  statusOptions: { value: string; label: string }[];
  labelOptions: { value: string; label: string }[];
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  record,
  availableTags,
  onSave,
  saving,
  onClose,
  statusOptions,
  labelOptions,
}) => {
  const [label, setLabel] = useState<Label | ''>('');
  const [status, setStatus] = useState<Status>('new');
  const [notes, setNotes] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setLabel(record.label ?? '');
      setStatus(record.status);
      setNotes(record.notes || '');
      setSelectedTagIds(record.tags ? record.tags.map((t) => t.id) : []);
      setErrorMsg(null);
    }
  }, [record]);

  if (!record) {
    return (
      <div className="detail-panel detail-panel--empty">
        <p className="empty-hint">← Select a record to review</p>
      </div>
    );
  }

  const handleSave = async () => {
    setErrorMsg(null);
    try {
      await onSave(record.id, {
        label: label === '' ? null : label,
        status,
        notes,
        tagIds: selectedTagIds,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="detail-panel">
      {onClose && (
        <div className="detail-panel-header">
          <button className="btn-close" onClick={onClose} aria-label="Close details">
            ✖ Close
          </button>
        </div>
      )}
      <section className="detail-section">
        <h2 className="detail-title">Record Details</h2>

        <div className="detail-field">
          <span className="field-label">URL / Email</span>
          <span className="field-value cell-mono">{record.url_or_email}</span>
        </div>
        <div className="detail-field">
          <span className="field-label">Source</span>
          <span className="field-value">{record.source}</span>
        </div>
        <div className="detail-field">
          <span className="field-label">Date Collected</span>
          <span className="field-value">{record.date_collected}</span>
        </div>
        <div className="detail-field">
          <span className="field-label">Imported At</span>
          <span className="field-value">{new Date(record.imported_at).toLocaleString()}</span>
        </div>
        {record.reviewed_at && (
          <div className="detail-field">
            <span className="field-label">Reviewed At</span>
            <span className="field-value">{new Date(record.reviewed_at).toLocaleString()}</span>
          </div>
        )}
      </section>

      <section className="detail-section">
        <h3 className="detail-subtitle">Review Assignment</h3>

        {errorMsg && (
          <div className="detail-error-message" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="detail-field">
          <label className="field-label" htmlFor="detail-label">Label</label>
          <select
            id="detail-label"
            className="field-select"
            value={label}
            onChange={(e) => setLabel(e.target.value as Label | '')}
          >
            <option value="">-- No Label --</option>
            {labelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="detail-field">
          <label className="field-label" htmlFor="detail-status">Status</label>
          <select
            id="detail-status"
            className="field-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="detail-field detail-field--column">
          <label className="field-label" htmlFor="detail-notes">Notes</label>
          <textarea
            id="detail-notes"
            className="field-textarea"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="detail-field detail-field--column">
          <span className="field-label">Evidence Tags</span>
          <div className="tags-checkbox-list">
          {availableTags.map((tag) => (
              <label
                key={tag.id}
                htmlFor={`tag-cb-${tag.id}`}
                className="tag-checkbox-item"
              >
                <input
                  type="checkbox"
                  id={`tag-cb-${tag.id}`}
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                />
                <span className="tag-name-text">{tag.name}</span>
              </label>
            ))}

          </div>
        </div>

        <button
          id="detail-save-btn"
          className="btn-primary detail-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </section>
    </div>
  );
};
