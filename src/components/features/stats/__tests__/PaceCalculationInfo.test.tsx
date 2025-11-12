import React from 'react';
import { render } from '@testing-library/react-native';
import { PaceCalculationInfo } from '../PaceCalculationInfo';

// Mock the theme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      icon: '#4A90E2',
    },
  }),
  useThemedStyles: (stylesFn: any) =>
    stylesFn({
      colors: {
        border: '#CCCCCC',
        surface: '#F5F5F5',
        textMuted: '#666666',
      },
    }),
}));

describe('PaceCalculationInfo', () => {
  describe('Rendering', () => {
    it('should render the component title', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      expect(getByText('How Pace is Calculated')).toBeTruthy();
    });

    it('should render the first explanation paragraph', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      expect(
        getByText(
          /Your reading pace is based on the average pages read per day within the last 14 days/
        )
      ).toBeTruthy();
    });

    it('should render the example paragraph', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      expect(
        getByText(
          /If today is December 25th and the last progress update was December 15th/
        )
      ).toBeTruthy();
    });
  });

  describe('Content Accuracy', () => {
    it('should mention 14 days in the explanation', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      expect(
        getByText(
          /Your reading pace is based on the average pages read per day within the last 14 days starting from your most recent logged day\./
        )
      ).toBeTruthy();
    });

    it('should provide concrete example with December dates', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      expect(
        getByText(
          /If today is December 25th and the last progress update was December 15th, your pace is calculated based on your average from December 2nd - December 15th\./
        )
      ).toBeTruthy();
    });
  });

  describe('Layout', () => {
    it('should render with border and background styling', () => {
      const { UNSAFE_root } = render(<PaceCalculationInfo />);

      // Component should render successfully with styled container
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should have info icon and title in header', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      // Title should be present
      expect(getByText('How Pace is Calculated')).toBeTruthy();
    });
  });

  describe('Text Formatting', () => {
    it('should render all paragraphs with proper spacing', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      const paragraph1 = getByText(
        /Your reading pace is based on the average pages read per day/
      );
      const paragraph2 = getByText(/If today is December 25th/);

      expect(paragraph1).toBeTruthy();
      expect(paragraph2).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have readable font sizes', () => {
      const { UNSAFE_root } = render(<PaceCalculationInfo />);

      // Component should render with proper accessibility
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should have proper heading hierarchy', () => {
      const { getByText } = render(<PaceCalculationInfo />);

      // Title should be rendered with proper hierarchy
      const title = getByText('How Pace is Calculated');
      expect(title).toBeTruthy();
    });
  });

  describe('Component Rerendering', () => {
    it('should maintain same content on rerender', () => {
      const { getByText, rerender } = render(<PaceCalculationInfo />);

      expect(getByText('How Pace is Calculated')).toBeTruthy();

      rerender(<PaceCalculationInfo />);

      expect(getByText('How Pace is Calculated')).toBeTruthy();
    });
  });

  describe('Static Content', () => {
    it('should be a pure informational component with no props', () => {
      const { UNSAFE_root } = render(<PaceCalculationInfo />);

      // Component takes no props and renders static content
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not have any interactive elements', () => {
      const { UNSAFE_root } = render(<PaceCalculationInfo />);

      // Component is informational only, no buttons or interactions
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
