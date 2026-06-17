import React from 'react';
import type { RecordCounts } from '../types/record';

interface StatsBarProps {
  counts: RecordCounts;
}

export const StatsBar: React.FC<StatsBarProps> = ({ counts }) => {
  return (
    <div className="stats-bar" role="region" aria-label="Summary statistics">
      <div className="stat-card" style={{ borderLeft: '3px solid var(--accent)' }}>
        <span className="stat-value cell-mono">{counts.total}</span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat-card" style={{ borderLeft: '3px solid var(--text-muted)' }}>
        <span className="stat-value cell-mono">{counts.new}</span>
        <span className="stat-label">New</span>
      </div>
      <div className="stat-card" style={{ borderLeft: '3px solid var(--label-benign)' }}>
        <span className="stat-value cell-mono">{counts.reviewed}</span>
        <span className="stat-label">Reviewed</span>
      </div>
      <div className="stat-card" style={{ borderLeft: '3px solid var(--label-suspicious)' }}>
        <span className="stat-value cell-mono">{counts.needs_second_review}</span>
        <span className="stat-label">Needs review</span>
      </div>
      <div className="stat-card" style={{ borderLeft: '3px solid var(--label-phishing)' }}>
        <span className="stat-value cell-mono">{counts.phishing}</span>
        <span className="stat-label">Phishing</span>
      </div>
    </div>
  );
};
