/**
 * Client-side TypeScript types for PhishGuard.
 * Mirror of server/src/types/record.types.ts — keep in sync manually.
 */

export type Label = 'benign' | 'suspicious' | 'phishing' | 'malware';

export type Status = 'new' | 'reviewed' | 'needs_second_review';

export interface Tag {
  id: number;
  name: string;
}

export interface Record {
  id: string;
  url_or_email: string;
  source: string;
  date_collected: string;
  imported_at: string;
  label: Label | null;
  status: Status;
  notes: string;
  reviewed_at: string | null;
  tags: Tag[];
}

export interface RecordCounts {
  total: number;
  new: number;
  reviewed: number;
  phishing: number;
}

export interface UpdateRecordPayload {
  label?: Label | null;
  status?: Status;
  notes?: string;
  tagIds?: number[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  message: string;
}

export interface RecordFilters {
  status?: Status | '';
  search?: string;
}
