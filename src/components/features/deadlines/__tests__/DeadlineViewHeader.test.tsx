import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DeadlineViewHeader from '../DeadlineViewHeader';

describe('DeadlineViewHeader', () => {
  it('should render with edit button when onEdit is provided', () => {
    const mockOnBack = jest.fn();
    const mockOnEdit = jest.fn();

    const { getByText } = render(
      <DeadlineViewHeader onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    const editButton = getByText('Edit');
    expect(editButton).toBeTruthy();

    fireEvent.press(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should not render edit button when onEdit is not provided', () => {
    const mockOnBack = jest.fn();

    const { queryByText } = render(<DeadlineViewHeader onBack={mockOnBack} />);

    const editButton = queryByText('Edit');
    expect(editButton).toBeNull();
  });

  it('should render with custom title', () => {
    const mockOnBack = jest.fn();
    const mockOnEdit = jest.fn();

    const { getByText } = render(
      <DeadlineViewHeader
        title="Custom Title"
        onBack={mockOnBack}
        onEdit={mockOnEdit}
      />
    );

    expect(getByText('Custom Title')).toBeTruthy();
  });
});
