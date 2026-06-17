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
