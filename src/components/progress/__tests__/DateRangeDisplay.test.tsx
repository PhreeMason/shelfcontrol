import React from 'react';
import { render, screen } from '@testing-library/react-native';
import dayjs from 'dayjs';
import DateRangeDisplay from '../DateRangeDisplay';

describe('DateRangeDisplay', () => {
  it('renders start and due dates correctly', () => {
    const startDate = dayjs().subtract(6, 'days').toISOString();
    const dueDate = dayjs('2025-11-30').toISOString();

    render(
      <DateRangeDisplay
        startDate={startDate}
        startLabel="Started:"
        dueDate={dueDate}
      />
    );

    // Start date should be relative (e.g., "6 days ago")
    expect(screen.getByText(/Started:/)).toBeTruthy();
    expect(screen.getByText(/days ago/)).toBeTruthy();

    // Due date should be absolute (e.g., "Nov 30, 2025")
    expect(screen.getByText(/Due:/)).toBeTruthy();
    expect(screen.getByText(/Nov 30, 2025/)).toBeTruthy();
  });

  it('renders with "Added:" label when provided', () => {
    const startDate = dayjs().subtract(2, 'weeks').toISOString();
    const dueDate = dayjs('2025-12-15').toISOString();

    render(
      <DateRangeDisplay
        startDate={startDate}
        startLabel="Added:"
        dueDate={dueDate}
      />
    );

    expect(screen.getByText(/Added:/)).toBeTruthy();
  });

  it('formats recent dates correctly', () => {
    const startDate = dayjs().subtract(1, 'day').toISOString();
    const dueDate = dayjs('2025-12-01').toISOString();

    render(
      <DateRangeDisplay
        startDate={startDate}
        startLabel="Started:"
        dueDate={dueDate}
      />
    );

    expect(screen.getByText(/a day ago/)).toBeTruthy();
  });

  it('formats old dates correctly', () => {
    const startDate = dayjs().subtract(3, 'months').toISOString();
    const dueDate = dayjs('2026-01-15').toISOString();

    render(
      <DateRangeDisplay
        startDate={startDate}
        startLabel="Started:"
        dueDate={dueDate}
      />
    );

    expect(screen.getByText(/months ago/)).toBeTruthy();
    expect(screen.getByText(/Jan 15, 2026/)).toBeTruthy();
  });

  it('handles today date correctly', () => {
    const startDate = dayjs().toISOString();
    const dueDate = dayjs('2025-12-31').toISOString();

    render(
      <DateRangeDisplay
        startDate={startDate}
        startLabel="Started:"
        dueDate={dueDate}
      />
    );

    // Should show "a few seconds ago" or similar
    expect(screen.getByText(/Started:/)).toBeTruthy();
  });

  it('renders with correct layout structure', () => {
    const startDate = dayjs().subtract(1, 'week').toISOString();
    const dueDate = dayjs('2025-12-20').toISOString();

    const { getByText } = render(
      <DateRangeDisplay
        startDate={startDate}
        startLabel="Started:"
        dueDate={dueDate}
      />
    );

    // Both elements should be rendered
    const startElement = getByText(/Started:/);
    const dueElement = getByText(/Due:/);

    expect(startElement).toBeTruthy();
    expect(dueElement).toBeTruthy();
  });
});
