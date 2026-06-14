import React, { useState, useRef } from 'react';
import { useRecords } from './hooks/useRecords';
import { StatsBar } from './components/StatsBar';
import { RecordTable } from './components/RecordTable';
import { DetailPanel } from './components/DetailPanel';
import { importCsv, updateRecord, exportRecordsJson } from './api/recordApi';
import type { Record, Tag, UpdateRecordPayload } from './types/record';
import './App.css';

const AVAILABLE_TAGS: Tag[] = [
  { id: 1, name: 'suspicious_domain' },
  { id: 2, name: 'credential_form' },
  { id: 3, name: 'url_shortener' },
  { id: 4, name: 'brand_impersonation' },
  { id: 5, name: 'suspicious_attachment_reference' },
];

function App() {
  const { records, counts, loading, error, refresh, filters, setFilters } = useRecords();

  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImporting(true);
    try {
      await importCsv(file);
      refresh();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (id: string, payload: UpdateRecordPayload): Promise<void> => {
    setSaving(true);
    try {
      const updated = await updateRecord(id, payload);
      setSelectedRecord(updated);
      refresh();
    } catch (err: unknown) {
      alert(`Error saving changes: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExportError(null);
    try {
      await exportRecordsJson();
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <svg
            className="logo-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '24px', height: '24px', marginRight: '8px', color: 'var(--accent)' }}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="logo-text">PhishGuard</span>
        </div>

        <div className="header-actions">
          {importError && (
            <span className="import-error" role="alert" style={{ color: 'var(--label-phishing)', marginRight: '15px' }}>
              {importError}
            </span>
          )}
          {exportError && (
            <span role="alert" style={{ color: 'var(--label-phishing)', fontSize: '12px' }}>
              {exportError}
            </span>
          )}

          <input
            ref={fileInputRef}
            id="csv-file-input"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            id="import-csv-btn"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            aria-busy={importing}
            style={{ cursor: importing ? 'not-allowed' : 'pointer' }}
          >
            {importing ? 'Importing…' : 'Import CSV'}
          </button>

          <button
            id="export-json-btn"
            className="btn-primary"
            onClick={handleExport}
            style={{ cursor: 'pointer'}}
          >
            Export JSON
          </button>

        </div>
      </header>

      <StatsBar counts={counts} />

      <main className="app-main">
        {error && (
          <div className="fetch-error" role="alert">
            Failed to load records: {error}
          </div>
        )}

        <section className="pane pane--left" aria-label="Records list">
          <RecordTable
            records={records}
            loading={loading}
            selectedId={selectedRecord?.id ?? null}
            onSelect={setSelectedRecord}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </section>

        <section className="pane pane--right" aria-label="Record details">
          <DetailPanel
            record={selectedRecord}
            availableTags={AVAILABLE_TAGS}
            onSave={handleSave}
            saving={saving}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
