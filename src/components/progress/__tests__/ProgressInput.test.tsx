import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Control } from 'react-hook-form';
import ProgressInput from '../ProgressInput';

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      background: '#ffffff',
      border: '#cccccc',
      textMuted: '#666666',
    },
  }),
}));

jest.mock('@/constants/Colors', () => ({
  Typography: {
    titleLarge: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  },
}));

jest.mock('../AudiobookProgressInput', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockAudiobookProgressInput(props: any) {
    return React.createElement(View, {
      testID: props.testID || 'audiobook-progress-input',
    });
  };
});

jest.mock('../PagesProgressInput', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockPagesProgressInput(props: any) {
    return React.createElement(View, {
      testID: props.testID || 'pages-progress-input',
    });
  };
});

jest.mock('../PercentageProgressInput', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockPercentageProgressInput(props: any) {
    return React.createElement(View, {
      testID: props.testID || 'percentage-progress-input',
    });
  };
});

jest.mock('../TimeRemainingInput', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockTimeRemainingInput(props: any) {
    return React.createElement(View, {
      testID: props.testID || 'time-remaining-input',
    });
  };
});

jest.mock('../InputModeToggle', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return function MockInputModeToggle({ modes, onModeChange }: any) {
    return React.createElement(
      'View',
      { testID: 'input-mode-toggle' },
      modes.map((mode: any) =>
        React.createElement(
          TouchableOpacity,
          {
            key: mode.key,
            testID: `mode-${mode.key}`,
            onPress: () => onModeChange(mode.key),
          },
          React.createElement(Text, null, mode.label)
        )
      )
    );
  };
});

jest.mock('@/utils/formUtils', () => ({
  requiresAudiobookInput: jest.fn(),
  transformProgressInputText: jest.fn(),
  transformProgressValueToText: jest.fn(),
}));

const mockGetProgressInputMode = jest.fn();
const mockSetProgressInputMode = jest.fn();

jest.mock('@/providers/PreferencesProvider', () => ({
  usePreferences: () => ({
    getProgressInputMode: mockGetProgressInputMode,
    setProgressInputMode: mockSetProgressInputMode,
  }),
}));

jest.mock('react-hook-form', () => ({
  Controller: ({ render }: any) => {
    const mockField = {
      value: 50,
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };
    return render({ field: mockField });
  },
}));

describe('ProgressInput', () => {
  const mockControl = {} as Control<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProgressInputMode.mockReturnValue('direct');
  });

  describe('when format is audio', () => {
    beforeEach(() => {
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(true);
    });

    it('should render AudiobookProgressInput', () => {
      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(screen.getByTestId('audiobook-progress-input')).toBeTruthy();
    });
  });

  describe('when format is not audio', () => {
    beforeEach(() => {
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(false);
    });

    it('should render PagesProgressInput for physical format in direct mode', () => {
      mockGetProgressInputMode.mockReturnValue('direct');

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });

    it('should render PagesProgressInput for eBook format in direct mode', () => {
      mockGetProgressInputMode.mockReturnValue('direct');

      render(
        <ProgressInput
          format="eBook"
          control={mockControl}
          totalQuantity={258}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });
  });

  describe('Input Mode Toggle Integration', () => {
    it('should render InputModeToggle component', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('input-mode-toggle')).toBeTruthy();
    });

    it('should get current mode from preferences provider', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(mockGetProgressInputMode).toHaveBeenCalledWith('physical');
    });

    it('should render PagesProgressInput in direct mode for physical books', () => {
      mockGetProgressInputMode.mockReturnValue('direct');

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
      expect(screen.queryByTestId('percentage-progress-input')).toBeNull();
    });

    it('should render PercentageProgressInput in percentage mode', () => {
      mockGetProgressInputMode.mockReturnValue('percentage');

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
      expect(screen.queryByTestId('pages-progress-input')).toBeNull();
    });

    it('should call setProgressInputMode when mode changes', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      const percentageButton = screen.getByTestId('mode-percentage');
      fireEvent.press(percentageButton);

      expect(mockSetProgressInputMode).toHaveBeenCalledWith(
        'physical',
        'percentage'
      );
    });

    it('should persist mode change across renders', () => {
      const { rerender } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      mockGetProgressInputMode.mockReturnValue('percentage');

      rerender(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
    });
  });

  describe('Audiobook Mode Switching', () => {
    beforeEach(() => {
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(true);
    });

    it('should render AudiobookProgressInput in direct mode', () => {
      mockGetProgressInputMode.mockReturnValue('direct');

      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('audiobook-progress-input')).toBeTruthy();
    });

    it('should render PercentageProgressInput in percentage mode for audio', () => {
      mockGetProgressInputMode.mockReturnValue('percentage');

      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
      expect(screen.queryByTestId('audiobook-progress-input')).toBeNull();
    });

    it('should render TimeRemainingInput in remaining mode for audio', () => {
      mockGetProgressInputMode.mockReturnValue('remaining');

      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('time-remaining-input')).toBeTruthy();
      expect(screen.queryByTestId('audiobook-progress-input')).toBeNull();
    });

    it('should have three mode options for audiobooks', () => {
      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('mode-direct')).toBeTruthy();
      expect(screen.getByTestId('mode-percentage')).toBeTruthy();
      expect(screen.getByTestId('mode-remaining')).toBeTruthy();
    });

    it('should switch to remaining mode for audiobooks', () => {
      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      const remainingButton = screen.getByTestId('mode-remaining');
      fireEvent.press(remainingButton);

      expect(mockSetProgressInputMode).toHaveBeenCalledWith(
        'audio',
        'remaining'
      );
    });
  });

  describe('Format-Specific Mode Availability', () => {
    it('should have two modes for physical books', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('mode-direct')).toBeTruthy();
      expect(screen.getByTestId('mode-percentage')).toBeTruthy();
      expect(screen.queryByTestId('mode-remaining')).toBeNull();
    });

    it('should have two modes for eBooks', () => {
      render(
        <ProgressInput
          format="eBook"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('mode-direct')).toBeTruthy();
      expect(screen.getByTestId('mode-percentage')).toBeTruthy();
      expect(screen.queryByTestId('mode-remaining')).toBeNull();
    });

    it('should get mode from preferences for each format type', () => {
      const { rerender } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(mockGetProgressInputMode).toHaveBeenCalledWith('physical');

      rerender(
        <ProgressInput
          format="eBook"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(mockGetProgressInputMode).toHaveBeenCalledWith('eBook');

      rerender(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(mockGetProgressInputMode).toHaveBeenCalledWith('audio');
    });
  });

  describe('Controller Integration', () => {
    it('should pass value, onChange, and onBlur from Controller to child components', () => {
      mockGetProgressInputMode.mockReturnValue('direct');
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(false);

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });

    it('should pass totalQuantity prop to all child input components', () => {
      mockGetProgressInputMode.mockReturnValue('percentage');

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={500}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
    });

    it('should pass format prop to PercentageProgressInput', () => {
      mockGetProgressInputMode.mockReturnValue('percentage');

      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
    });
  });

  describe('Edge Cases and Mode Transitions', () => {
    it('should handle transition from direct to percentage mode', () => {
      mockGetProgressInputMode.mockReturnValue('direct');
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(false);

      const { rerender } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();

      mockGetProgressInputMode.mockReturnValue('percentage');

      rerender(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
      expect(screen.queryByTestId('pages-progress-input')).toBeNull();
    });

    it('should handle transition from direct to remaining mode for audiobooks', () => {
      mockGetProgressInputMode.mockReturnValue('direct');
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(true);

      const { rerender } = render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('audiobook-progress-input')).toBeTruthy();

      mockGetProgressInputMode.mockReturnValue('remaining');

      rerender(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('time-remaining-input')).toBeTruthy();
      expect(screen.queryByTestId('audiobook-progress-input')).toBeNull();
    });

    it('should not render remaining mode for non-audio formats', () => {
      mockGetProgressInputMode.mockReturnValue('remaining');
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(false);

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.queryByTestId('time-remaining-input')).toBeNull();
      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });

    it('should handle zero totalQuantity', () => {
      mockGetProgressInputMode.mockReturnValue('direct');
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(false);

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={0}
        />
      );

      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });
  });

  describe('Mode Label Generation', () => {
    it('should generate correct labels for physical book modes', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByText('Page')).toBeTruthy();
      expect(screen.getByText('%')).toBeTruthy();
    });

    it('should generate correct labels for audio book modes', () => {
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(true);

      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByText('Time')).toBeTruthy();
      expect(screen.getByText('%')).toBeTruthy();
      expect(screen.getByText('Left')).toBeTruthy();
    });

    it('should generate correct labels for eBook modes', () => {
      render(
        <ProgressInput
          format="eBook"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByText('Page')).toBeTruthy();
      expect(screen.getByText('%')).toBeTruthy();
    });
  });

  describe('Available Modes Calculation', () => {
    it('should calculate available modes correctly for physical books', () => {
      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      const toggle = screen.getByTestId('input-mode-toggle');
      expect(toggle).toBeTruthy();

      expect(screen.getByTestId('mode-direct')).toBeTruthy();
      expect(screen.getByTestId('mode-percentage')).toBeTruthy();
      expect(screen.queryByTestId('mode-remaining')).toBeNull();
    });

    it('should calculate available modes correctly for audiobooks', () => {
      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('mode-direct')).toBeTruthy();
      expect(screen.getByTestId('mode-percentage')).toBeTruthy();
      expect(screen.getByTestId('mode-remaining')).toBeTruthy();
    });

    it('should recalculate modes when format changes', () => {
      const { rerender } = render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.queryByTestId('mode-remaining')).toBeNull();

      rerender(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('mode-remaining')).toBeTruthy();
    });
  });

  describe('Percentage Mode for All Formats', () => {
    it('should render PercentageProgressInput for physical books in percentage mode', () => {
      mockGetProgressInputMode.mockReturnValue('percentage');

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
    });

    it('should render PercentageProgressInput for eBooks in percentage mode', () => {
      mockGetProgressInputMode.mockReturnValue('percentage');

      render(
        <ProgressInput
          format="eBook"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
    });

    it('should render PercentageProgressInput for audiobooks in percentage mode', () => {
      mockGetProgressInputMode.mockReturnValue('percentage');

      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('percentage-progress-input')).toBeTruthy();
      expect(screen.queryByTestId('audiobook-progress-input')).toBeNull();
      expect(screen.queryByTestId('time-remaining-input')).toBeNull();
    });
  });

  describe('Time Remaining Mode (Audio Only)', () => {
    it('should only render TimeRemainingInput for audio format', () => {
      mockGetProgressInputMode.mockReturnValue('remaining');

      render(
        <ProgressInput
          format="audio"
          control={mockControl}
          totalQuantity={600}
        />
      );

      expect(screen.getByTestId('time-remaining-input')).toBeTruthy();
      expect(screen.queryByTestId('audiobook-progress-input')).toBeNull();
      expect(screen.queryByTestId('percentage-progress-input')).toBeNull();
    });

    it('should fallback to PagesProgressInput when remaining mode set for non-audio', () => {
      mockGetProgressInputMode.mockReturnValue('remaining');
      const { requiresAudiobookInput } = require('@/utils/formUtils');
      requiresAudiobookInput.mockReturnValue(false);

      render(
        <ProgressInput
          format="physical"
          control={mockControl}
          totalQuantity={400}
        />
      );

      expect(screen.queryByTestId('time-remaining-input')).toBeNull();
      expect(screen.getByTestId('pages-progress-input')).toBeTruthy();
    });
  });
});
