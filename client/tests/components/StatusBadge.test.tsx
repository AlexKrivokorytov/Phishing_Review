/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../src/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders correctly for new status', () => {
    render(<StatusBadge status="new" />);
    const badge = screen.getByText('NEW');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ color: 'var(--text-muted)' });
  });

  it('renders correctly for reviewed status', () => {
    render(<StatusBadge status="reviewed" />);
    const badge = screen.getByText('REVIEWED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ color: 'var(--label-benign)' });
  });

  it('renders fallback or throws for unknown status (TS prevents this)', () => {
    expect(() => render(<StatusBadge status={"unknown_status" as any} />)).toThrow();
  });
});
