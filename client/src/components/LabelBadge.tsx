import React from 'react';
import type { Label } from '../types/record';

interface LabelBadgeProps {
  label: Label | null;
}

export const LabelBadge: React.FC<LabelBadgeProps> = ({ label }) => {
  let color = 'var(--text-muted)';
  let text = '—';

  if (label === 'phishing') {
    color = 'var(--label-phishing)';
    text = 'PHISHING';
  } else if (label === 'suspicious') {
    color = 'var(--label-suspicious)';
    text = 'SUSPICIOUS';
  } else if (label === 'malware') {
    color = 'var(--label-malware)';
    text = 'MALWARE';
  } else if (label === 'benign') {
    color = 'var(--label-benign)';
    text = 'BENIGN';
  }

  return (
    <span className="label-badge" style={{ color, fontWeight: 'bold' }}>
      {text}
    </span>
  );
};
