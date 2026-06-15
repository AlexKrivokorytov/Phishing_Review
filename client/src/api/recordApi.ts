import type {
  Record,
  RecordCounts,
  UpdateRecordPayload,
  ImportResult,
  RecordFilters,
  Tag,
} from '../types/record';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** Generic fetch helper to eliminate boilerplate error handling */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.statusText}`);
  }
  // Download endpoints return blob, we shouldn't parse as JSON
  return response.headers.get('content-type')?.includes('application/json') 
    ? response.json() 
    : response.blob() as unknown as T;
}

export async function fetchRecords(filters: RecordFilters = {}): Promise<Record[]> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  return apiFetch<Record[]>(`/api/records?${params.toString()}`);
}

export function fetchCounts(): Promise<RecordCounts> {
  return apiFetch<RecordCounts>('/api/records/counts');
}

export function getTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>('/api/tags');
}

export function updateRecord(id: string, payload: UpdateRecordPayload): Promise<Record> {
  return apiFetch<Record>(`/api/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function importFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<ImportResult>('/api/import/file', {
    method: 'POST',
    body: formData,
  });
}

export async function downloadExport(format: 'json' | 'csv'): Promise<void> {
  const blob = await apiFetch<Blob>(`/api/export/${format}`);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `phishguard-export-${new Date().toISOString().slice(0, 10)}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
