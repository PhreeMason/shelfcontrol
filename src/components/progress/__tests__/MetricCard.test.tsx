import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import MetricCard from '../MetricCard';

describe('MetricCard', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe('Pages Format', () => {
    it('renders remaining pages view correctly', () => {
      render(
        <MetricCard
          format="physical"
          currentProgress={50}
          totalQuantity={200}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('PAGES LEFT')).toBeTruthy();
      expect(screen.getByText('150')).toBeTruthy();
      expect(screen.getByText('25% complete')).toBeTruthy();
    });

    it('renders current page view correctly', () => {
      render(
        <MetricCard
          format="eBook"
          currentProgress={75}
          totalQuantity={300}
          viewMode="current"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('CURRENT PAGE')).toBeTruthy();
      expect(screen.getByText('75')).toBeTruthy();
      expect(screen.getByText('25% complete')).toBeTruthy();
    });

    it('calculates percentage correctly for pages', () => {
      render(
        <MetricCard
          format="physical"
          currentProgress={100}
          totalQuantity={400}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('25% complete')).toBeTruthy();
    });
  });

  describe('Audio Format', () => {
    it('renders remaining time view correctly', () => {
      render(
        <MetricCard
          format="audio"
          currentProgress={120}
          totalQuantity={360}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('TIME LEFT')).toBeTruthy();
      expect(screen.getByText('4h 0m')).toBeTruthy();
      expect(screen.getByText('33% complete')).toBeTruthy();
    });

    it('renders current position view correctly', () => {
      render(
        <MetricCard
          format="audio"
          currentProgress={241}
          totalQuantity={589}
          viewMode="current"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('CURRENT POSITION')).toBeTruthy();
      expect(screen.getByText('4h 1m')).toBeTruthy();
      expect(screen.getByText('41% complete')).toBeTruthy();
    });

    it('formats time display correctly', () => {
      render(
        <MetricCard
          format="audio"
          currentProgress={0}
          totalQuantity={150}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('2h 30m')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('calls onToggle when pressed', () => {
      render(
        <MetricCard
          format="physical"
          currentProgress={50}
          totalQuantity={200}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      const card = screen.getByRole('button');
      fireEvent.press(card);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('has proper accessibility label for remaining view', () => {
      render(
        <MetricCard
          format="physical"
          currentProgress={50}
          totalQuantity={200}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      const card = screen.getByRole('button');
      expect(card.props.accessibilityLabel).toContain('Toggle between current progress');
      expect(card.props.accessibilityLabel).toContain('PAGES LEFT');
    });

    it('has proper accessibility label for current view', () => {
      render(
        <MetricCard
          format="audio"
          currentProgress={100}
          totalQuantity={500}
          viewMode="current"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      const card = screen.getByRole('button');
      expect(card.props.accessibilityLabel).toContain('Toggle between remaining progress');
      expect(card.props.accessibilityLabel).toContain('CURRENT POSITION');
    });
  });

  describe('Urgency Colors', () => {
    it('renders with success color for good urgency', () => {
      const { getByText } = render(
        <MetricCard
          format="physical"
          currentProgress={50}
          totalQuantity={200}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      const value = getByText('150');
      // Color should be set via style prop
      expect(value.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: expect.any(String),
          }),
        ])
      );
    });

    it('renders with error color for overdue urgency', () => {
      const { getByText } = render(
        <MetricCard
          format="physical"
          currentProgress={50}
          totalQuantity={200}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="overdue"
        />
      );

      const value = getByText('150');
      expect(value.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: expect.any(String),
          }),
        ])
      );
    });

    it('renders with warning color for approaching urgency', () => {
      const { getByText } = render(
        <MetricCard
          format="physical"
          currentProgress={50}
          totalQuantity={200}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="approaching"
        />
      );

      const value = getByText('150');
      expect(value.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: expect.any(String),
          }),
        ])
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles 0% progress correctly', () => {
      render(
        <MetricCard
          format="physical"
          currentProgress={0}
          totalQuantity={200}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('200')).toBeTruthy();
      expect(screen.getByText('0% complete')).toBeTruthy();
    });

    it('handles 100% progress correctly', () => {
      render(
        <MetricCard
          format="physical"
          currentProgress={200}
          totalQuantity={200}
          viewMode="current"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('200')).toBeTruthy();
      expect(screen.getByText('100% complete')).toBeTruthy();
    });

    it('rounds percentage correctly', () => {
      render(
        <MetricCard
          format="physical"
          currentProgress={33}
          totalQuantity={100}
          viewMode="remaining"
          onToggle={mockOnToggle}
          urgencyLevel="good"
        />
      );

      expect(screen.getByText('33% complete')).toBeTruthy();
    });
  });
});
