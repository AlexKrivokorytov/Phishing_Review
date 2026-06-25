import type {
  Record,
  RecordCounts,
  UpdateRecordPayload,
  ImportResult,
  RecordFilters,
  Tag,
} from '../types/record';
import { formatExportDate } from '../utils/date';

export interface AppConfig {
  statusOptions: { value: string; label: string }[];
  labelOptions: { value: string; label: string }[];
  defaultPagination: { page: number; limit: number };
  appName: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Central API path constants so route changes live in one place.
export const API_ROUTES = {
  records: '/api/records',
  recordsCounts: '/api/records/counts',
  recordById: (id: string) => `/api/records/${id}`,
  tags: '/api/tags',
  config: '/api/config',
  importFile: '/api/import/file',
  exportByFormat: (format: 'json' | 'csv') => `/api/export/${format}`,
} as const;

const JSON_CONTENT_TYPE = 'application/json';

// Builds URLSearchParams from the shared RecordFilters shape. Pagination is
// optional so the same helper can serve list and export endpoints.
function buildFilterParams(
  filters: RecordFilters,
  options: { withPagination?: boolean } = {},
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.label) params.append('label', filters.label);
  if (filters.search) params.append('search', filters.search);
  if (options.withPagination) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
  }
  return params;
}

// Reads the error body from a failed response, falling back to statusText.
async function extractApiError(response: Response): Promise<string> {
  const errorData: { error?: string } = await response.json().catch(() => ({}));
  return errorData.error || `Request failed: ${response.statusText}`;
}

// Generic fetch helper that converts response to JSON. For exporting, use downloadExport instead.
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(await extractApiError(response));
  }
  return response.json() as Promise<T>;
}

export async function fetchRecords(
  filters: RecordFilters = {},
  signal?: AbortSignal,
): Promise<{ data: Record[]; total: number }> {
  const params = buildFilterParams(filters, { withPagination: true });
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<{ data: Record[]; total: number }>(
    `${API_ROUTES.records}${query}`,
    signal ? { signal } : undefined,
  );
}

export function fetchCounts(): Promise<RecordCounts> {
  return apiFetch<RecordCounts>(API_ROUTES.recordsCounts);
}

export function getTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>(API_ROUTES.tags);
}

export function fetchConfig(): Promise<AppConfig> {
  return apiFetch<AppConfig>(API_ROUTES.config);
}

export function updateRecord(id: string, payload: UpdateRecordPayload): Promise<Record> {
  return apiFetch<Record>(API_ROUTES.recordById(id), {
    method: 'PATCH',
    headers: { 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify(payload),
  });
}

export function importFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<ImportResult>(API_ROUTES.importFile, {
    method: 'POST',
    body: formData,
  });
}

export async function downloadExport(format: 'json' | 'csv', filters: RecordFilters = {}): Promise<void> {
  const params = buildFilterParams(filters);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${BASE_URL}${API_ROUTES.exportByFormat(format)}${query}`);
  if (!response.ok) {
    throw new Error(await extractApiError(response));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `phishguard-export-${formatExportDate()}.${format}`;
  anchor.click();
  // Defer revocation so the browser has time to start the download navigation.
  // A short fixed delay is more reliable than setTimeout(0) across browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
