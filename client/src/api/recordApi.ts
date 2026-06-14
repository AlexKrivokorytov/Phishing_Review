import type {
  Record,
  RecordCounts,
  UpdateRecordPayload,
  ImportResult,
  RecordFilters,
} from '../types/record';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchRecords(filters: RecordFilters = {}): Promise<Record[]> {
  const params = new URLSearchParams();
  if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }

  const response = await fetch(`${BASE_URL}/api/records?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch records: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCounts(): Promise<RecordCounts> {
  const response = await fetch(`${BASE_URL}/api/records/counts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch counts: ${response.statusText}`);
  }
  return response.json();
}



export async function updateRecord(id: string, payload: UpdateRecordPayload): Promise<Record> {
  const response = await fetch(`${BASE_URL}/api/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to update record: ${response.statusText}`);
  }
  return response.json();
}

export async function importFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/api/import/file`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Failed to import file: ${response.statusText}`);
  }
  return response.json();
}

export async function downloadExport(format: 'json' | 'csv'): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/export/${format}`);
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `phishguard-export-${new Date().toISOString().slice(0, 10)}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

