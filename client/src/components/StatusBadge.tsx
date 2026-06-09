import React from 'react';
import type { Status } from '../types/record';

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let color = 'var(--text-muted)';
  let text = 'NEW';

  if (status === 'reviewed') {
    color = 'var(--label-benign)';
    text = 'REVIEWED';
  } else if (status === 'needs_second_review') {
    color = 'var(--label-suspicious)';
    text = 'NEEDS REVIEW';
  }

  return (
    <span className="status-badge" style={{ color, fontWeight: 'bold' }}>
      {text}
    </span>
  );
};
