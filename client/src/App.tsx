import React, { useState, useRef } from 'react';
import { useRecords } from './hooks/useRecords';
import { StatsBar } from './components/StatsBar';
import { RecordTable } from './components/RecordTable';
import { DetailPanel } from './components/DetailPanel';
import { importFile, updateRecord, downloadExport, getTags, fetchConfig, type AppConfig } from './api/recordApi';
import type { Record, Tag, UpdateRecordPayload } from './types/record';
import './App.css';

function App() {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchConfig()
      .then(setAppConfig)
      .catch((err: unknown) => setConfigError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (configError) {
    return <div className="fetch-error" role="alert">Failed to load configuration: {configError}</div>;
  }

  if (!appConfig) {
    return <div className="table-loading">Loading configuration...</div>;
  }

  return <MainApp appConfig={appConfig} />;
}

function MainApp({ appConfig }: { appConfig: AppConfig }) {
  const { records, counts, totalRecords, loading, error, refresh, filters, setFilters } = useRecords(appConfig.defaultPagination);

  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  React.useEffect(() => {
    getTags().then(setTags).catch(console.error);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImporting(true);
    try {
      await importFile(file);
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
    setSaveError(null);
    try {
      const updated = await updateRecord(id, payload);
      setSelectedRecord(updated);
      refresh();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setExportError(null);
    try {
      await downloadExport(format);
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
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="logo-text">{appConfig.appName}</span>
        </div>

        <div className="header-actions">
          {importError && (
            <span className="import-error" role="alert">
              {importError}
            </span>
          )}
          {exportError && (
            <span className="export-error" role="alert">
              {exportError}
            </span>
          )}

          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept=".csv,.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            id="import-btn"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            aria-busy={importing}
          >
            {importing ? 'Importing…' : 'Import File'}
          </button>

          <button
            id="export-json-btn"
            className="btn-primary"
            onClick={() => handleExport('json')}
          >
            Export JSON
          </button>

          <button
            id="export-csv-btn"
            className="btn-primary"
            onClick={() => handleExport('csv')}
          >
            Export CSV
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
            totalRecords={totalRecords}
            loading={loading}
            selectedId={selectedRecord?.id ?? null}
            onSelect={setSelectedRecord}
            filters={filters}
            onFiltersChange={setFilters}
            statusOptions={appConfig.statusOptions}
            labelOptions={appConfig.labelOptions}
          />
        </section>

        <section
          className={`pane pane--right ${selectedRecord ? 'pane--right--active' : ''}`}
          aria-label="Record details"
        >
          {saveError && (
            <span className="save-error" role="alert">
              {saveError}
            </span>
          )}
          <DetailPanel
            record={selectedRecord}
            availableTags={tags}
            onSave={handleSave}
            saving={saving}
            onClose={() => setSelectedRecord(null)}
            statusOptions={appConfig.statusOptions}
            labelOptions={appConfig.labelOptions}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
