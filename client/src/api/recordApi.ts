import type {
  Record,
  RecordCounts,
  UpdateRecordPayload,
  ImportResult,
  RecordFilters,
  Tag,
} from '../types/record';

export interface AppConfig {
  statusOptions: { value: string; label: string }[];
  labelOptions: { value: string; label: string }[];
  defaultPagination: { page: number; limit: number };
  appName: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Generic fetch helper that converts response to JSON. For exporting, use downloadExport instead.
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchRecords(
  filters: RecordFilters = {},
  signal?: AbortSignal,
): Promise<{ data: Record[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.label) params.append("label", filters.label);
  if (filters.search) params.append("search", filters.search);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  return apiFetch<{ data: Record[]; total: number }>(
    `/api/records?${params.toString()}`,
    signal ? { signal } : undefined,
  );
}

export function fetchCounts(): Promise<RecordCounts> {
  return apiFetch<RecordCounts>('/api/records/counts');
}

export function getTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>('/api/tags');
}

export function fetchConfig(): Promise<AppConfig> {
  return apiFetch<AppConfig>('/api/config');
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
  const response = await fetch(`${BASE_URL}/api/export/${format}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.statusText}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `phishguard-export-${new Date().toISOString().slice(0, 10)}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
