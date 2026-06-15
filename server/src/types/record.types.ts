/**
 * Shared TypeScript types, enums, and DTOs for the PhishGuard server.
 * All database-facing types live here — import from this file everywhere.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** The label a reviewer assigns to a record after analysis. */
export type Label = 'benign' | 'suspicious' | 'phishing' | 'malware';

/** The workflow state of a record. */
export type Status = 'new' | 'reviewed' | 'needs_second_review';

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

/** A single phishing-review record as stored in the database. */
export interface Record {
  readonly id: string;
  readonly url_or_email: string;
  readonly source: string;
  readonly date_collected: string;
  readonly imported_at: string;
  label: Label | null;
  status: Status;
  notes: string;
  reviewed_at: string | null;
}

/** A tag from the `tags` dictionary table. */
export interface Tag {
  readonly id: number;
  readonly name: string;
}

/** A record enriched with its associated tags. */
export interface RecordWithTags extends Record {
  tags: Tag[];
}

// ---------------------------------------------------------------------------
// DTOs — Data Transfer Objects (what controllers receive from HTTP bodies)
// ---------------------------------------------------------------------------

/**
 * Payload for the PATCH /api/records/:id endpoint.
 * All fields are optional — only provided fields will be updated.
 */
export interface UpdateRecordDto {
  label?: Label | null;
  status?: Status;
  notes?: string;
  tagIds?: number[];
}

// ---------------------------------------------------------------------------
// Query filters
// ---------------------------------------------------------------------------

/** Parameters accepted by GET /api/records for filtering/searching. */
export interface RecordFilters {
  status?: Status;
  search?: string;
}
