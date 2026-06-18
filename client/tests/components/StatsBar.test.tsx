import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsBar } from '../../src/components/StatsBar';

describe('StatsBar', () => {
  const counts = {
    total: 100,
    new: 20,
    reviewed: 80,
    needs_second_review: 5,
    phishing: 50,
  };

  it('renders all stat cards with correct values', () => {
    render(<StatsBar counts={counts} />);
    
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();

    expect(screen.getByText('Needs review')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Phishing')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
