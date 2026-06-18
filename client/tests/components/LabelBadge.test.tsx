/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LabelBadge } from '../../src/components/LabelBadge';

describe('LabelBadge', () => {
  it('renders correctly with a known label', () => {
    render(<LabelBadge label="phishing" />);
    const badge = screen.getByText('PHISHING');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ color: 'var(--label-phishing)' });
  });

  it('renders "—" when label is unknown (though TS prevents this normally, fallback handles it)', () => {
    render(<LabelBadge label={"unknown_label" as any} />);
    const badge = screen.getByText('—');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ color: 'var(--text-muted)' });
  });

  it('renders "—" when label is null', () => {
    render(<LabelBadge label={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
