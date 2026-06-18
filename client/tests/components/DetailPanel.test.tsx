import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetailPanel } from '../../src/components/DetailPanel';

describe('DetailPanel', () => {
  const mockRecord = {
    id: '1',
    url_or_email: 'test@example.com',
    source: 'user',
    date_collected: '2023-01-01',
    label: 'phishing' as const,
    notes: 'Some notes',
    status: 'new' as const,
    imported_at: '2023-01-01T00:00:00Z',
    reviewed_at: null,
    tags: [{ id: 1, name: 'tag1' }]
  };

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' }
  ];

  const labelOptions = [
    { value: 'phishing', label: 'Phishing' },
    { value: 'benign', label: 'Benign' }
  ];

  const tags = [
    { id: 1, name: 'tag1' },
    { id: 2, name: 'tag2' }
  ];

  it('renders empty state when no record is provided', () => {
    render(<DetailPanel record={null} availableTags={[]} onSave={vi.fn()} saving={false} onClose={vi.fn()} statusOptions={[]} labelOptions={[]} />);
    expect(screen.getByText('← Select a record to review')).toBeInTheDocument();
  });

  it('renders record details', () => {
    render(
      <DetailPanel 
        record={mockRecord} 
        availableTags={tags} 
        onSave={vi.fn()} 
        saving={false} 
        onClose={vi.fn()} 
        statusOptions={statusOptions} 
        labelOptions={labelOptions} 
      />
    );
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Some notes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Phishing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New')).toBeInTheDocument();
  });

  it('calls onSave with updated fields', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(
      <DetailPanel 
        record={mockRecord} 
        availableTags={tags} 
        onSave={handleSave} 
        saving={false} 
        onClose={vi.fn()} 
        statusOptions={statusOptions} 
        labelOptions={labelOptions} 
      />
    );

    const user = userEvent.setup();
    
    // Change label
    const labelSelect = screen.getByLabelText('Label');
    await user.selectOptions(labelSelect, 'benign');
    
    // Change status
    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, 'reviewed');

    // Change notes
    const notesArea = screen.getByLabelText('Notes');
    await user.clear(notesArea);
    await user.type(notesArea, 'Updated notes');

    // Toggle tags
    const tag2Checkbox = screen.getByLabelText('tag2');
    await user.click(tag2Checkbox); // Adds tag2
    const tag1Checkbox = screen.getByLabelText('tag1');
    await user.click(tag1Checkbox); // Removes tag1

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith('1', {
        label: 'benign',
        status: 'reviewed',
        notes: 'Updated notes',
        tagIds: [2] // We had 1, removed 1, added 2
      });
    });
  });

  it('displays error if onSave throws', async () => {
    const handleSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    render(
      <DetailPanel 
        record={mockRecord} 
        availableTags={tags} 
        onSave={handleSave} 
        saving={false} 
        onClose={vi.fn()} 
        statusOptions={statusOptions} 
        labelOptions={labelOptions} 
      />
    );

    const user = userEvent.setup();
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <DetailPanel 
        record={mockRecord} 
        availableTags={tags} 
        onSave={vi.fn()} 
        saving={false} 
        onClose={handleClose} 
        statusOptions={statusOptions} 
        labelOptions={labelOptions} 
      />
    );

    const user = userEvent.setup();
    const closeBtn = screen.getByRole('button', { name: 'Close details' });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
