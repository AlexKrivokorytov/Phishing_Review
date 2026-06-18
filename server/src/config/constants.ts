import type { Status, Label } from '../types/record.types';

export const VALID_STATUSES: Status[] = ['new', 'reviewed', 'needs_second_review'];
export const VALID_LABELS: Label[] = ['benign', 'suspicious', 'phishing', 'malware'];

export const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'needs_second_review', label: 'Needs review' },
] as const;

export const LABEL_OPTIONS = [
  { value: 'phishing', label: 'Phishing' },
  { value: 'malware', label: 'Malware' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'benign', label: 'Benign' },
] as const;

export const INITIAL_TAGS = [
  'suspicious_domain',
  'credential_form',
  'url_shortener',
  'brand_impersonation',
  'suspicious_attachment_reference',
];
