import React from 'react';
import type { Status } from '../types/record';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_DISPLAY: Record<Status, { color: string; text: string }> = {
  new:                 { color: 'var(--text-muted)',      text: 'NEW'          },
  reviewed:            { color: 'var(--label-benign)',    text: 'REVIEWED'     },
  needs_second_review: { color: 'var(--label-suspicious)', text: 'NEEDS REVIEW' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { color, text } = STATUS_DISPLAY[status];

  return (
    <span className="status-badge" style={{ color, fontWeight: 'bold' }}>
      {text}
    </span>
  );
};
