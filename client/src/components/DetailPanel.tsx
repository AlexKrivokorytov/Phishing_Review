import React, { useState, useEffect } from 'react';
import type { Record, Tag, Label, Status, UpdateRecordPayload } from '../types/record';

interface DetailPanelProps {
  record: Record | null;
  availableTags: Tag[];
  onSave: (id: string, payload: UpdateRecordPayload) => Promise<void>;
  saving: boolean;
  onClose?: () => void;
}

const LABEL_OPTIONS: Array<{ value: Label | ''; label: string }> = [
  { value: '', label: '— Unset —' },
  { value: 'benign', label: 'Benign' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'malware', label: 'Malware' },
];

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'needs_second_review', label: 'Needs review' },
];

export const DetailPanel: React.FC<DetailPanelProps> = ({
  record,
  availableTags,
  onSave,
  saving,
  onClose,
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
          <div className="error-message" role="alert" style={{ color: 'var(--label-phishing)', marginBottom: '10px' }}>
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
            {LABEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
          <div className="tags-checkbox-list" style={{ marginTop: '5px' }}>
          {availableTags.map((tag) => (
              <label
                key={tag.id}
                htmlFor={`tag-cb-${tag.id}`}
                className="tag-checkbox-item"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  id={`tag-cb-${tag.id}`}
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                />
                <span className="tag-name" style={{ fontSize: '0.9rem' }}>{tag.name}</span>
              </label>
            ))}

          </div>
        </div>

        <button
          id="detail-save-btn"
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ cursor: 'pointer', marginTop: '15px' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </section>
    </div>
  );
};
