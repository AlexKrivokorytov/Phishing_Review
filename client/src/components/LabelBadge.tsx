import React from 'react';
import type { Label } from '../types/record';

interface LabelBadgeProps {
  label: Label | null;
}

const LABEL_DISPLAY: Record<Label, { color: string; text: string }> = {
  phishing:   { color: 'var(--label-phishing)',   text: 'PHISHING'   },
  suspicious: { color: 'var(--label-suspicious)', text: 'SUSPICIOUS' },
  malware:    { color: 'var(--label-malware)',    text: 'MALWARE'    },
  benign:     { color: 'var(--label-benign)',     text: 'BENIGN'     },
};

export const LabelBadge: React.FC<LabelBadgeProps> = ({ label }) => {
  const display = label ? LABEL_DISPLAY[label] : { color: 'var(--text-muted)', text: '—' };

  return (
    <span className="label-badge" style={{ color: display.color, fontWeight: 'bold' }}>
      {display.text}
    </span>
  );
};
