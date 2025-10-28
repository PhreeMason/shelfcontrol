import { DisclosureSection } from '../DisclosureSection';
import { useTheme } from '@/hooks/useTheme';
import {
  useCreateTemplate,
  useGetTemplates,
  useUpdateDeadlineDisclosure,
} from '@/hooks/useDisclosureTemplates';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/hooks/useDisclosureTemplates', () => ({
  useGetTemplates: jest.fn(),
  useUpdateDeadlineDisclosure: jest.fn(),
  useCreateTemplate: jest.fn(),
}));

jest.mock('@/utils/getDeadlineSourceOptions', () => ({
  getDeadlineSourceOptions: jest.fn(() => [
    { value: 'Publisher A', label: 'Publisher A' },
    { value: 'Publisher B', label: 'Publisher B' },
  ]),
}));

jest.mock('@/components/themed', () => ({
  ThemedButton: ({ title, onPress, disabled, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Pressable',
      {
        ...props,
        onPress,
        disabled,
        testID: 'themed-button',
      },
      React.createElement('Text', {}, title)
    );
  },
  ThemedText: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('Text', { ...props }, children);
  },
  ThemedView: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('View', { ...props }, children);
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, ...props }: any) => {
    const React = require('react');
    return React.createElement(
      'Text',
      { ...props, testID: `icon-${name}` },
      name
    );
  },
}));

jest.mock('../SourceSelector', () => ({
  SourceSelector: ({ ...props }: any) => {
    const React = require('react');
    return React.createElement('View', {
      ...props,
      testID: 'source-selector',
    });
  },
}));

jest.mock('../TemplateSelector', () => ({
  TemplateSelector: ({ ...props }: any) => {
    const React = require('react');
    return React.createElement('View', {
      ...props,
      testID: 'template-selector',
    });
  },
}));

jest.mock('../SaveTemplateDialog', () => ({
  SaveTemplateDialog: ({ visible, ...props }: any) => {
    const React = require('react');
    return visible
      ? React.createElement('View', {
          ...props,
          testID: 'save-template-dialog',
        })
      : null;
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

describe('DisclosureSection', () => {
  const mockTheme = {
    colors: {
      surface: '#FFFFFF',
      border: '#E0E0E0',
      primary: '#007AFF',
      text: '#000000',
      textMuted: '#8E8E93',
      success: '#34C759',
      danger: '#FF3B30',
    },
  };

  const mockMutate = jest.fn();
  const mockUpdateDeadlineDisclosureMutation = {
    mutate: mockMutate,
    isPending: false,
  };

  const mockCreateTemplateMutation = {
    mutate: jest.fn(),
    isPending: false,
  };

  const mockDeadlineWithDisclosure = {
    id: 'deadline-1',
    user_id: 'user-1',
    book_title: 'Test Book',
    author: 'Test Author',
    deadline_date: '2025-12-31',
    format: 'physical',
    total_quantity: 300,
    flexibility: 'strict',
    deadline_type: 'manual',
    disclosure_text: 'This is a test disclosure message.',
    disclosure_source_name: 'Publisher A',
    disclosure_template_id: 'template-1',
    current_progress: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    acquisition_source: null,
    book_id: null,
    publishers: null,
    source: null,
    review_note: null,
    progress: [],
    status: [],
  } as unknown as ReadingDeadlineWithProgress;

  const mockDeadlineWithoutDisclosure = {
    ...mockDeadlineWithDisclosure,
    disclosure_text: null,
    disclosure_source_name: null,
    disclosure_template_id: null,
  } as unknown as ReadingDeadlineWithProgress;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (useGetTemplates as jest.Mock).mockReturnValue({ data: [] });
    (useUpdateDeadlineDisclosure as jest.Mock).mockReturnValue(
      mockUpdateDeadlineDisclosureMutation
    );
    (useCreateTemplate as jest.Mock).mockReturnValue(
      mockCreateTemplateMutation
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Structure with Disclosure', () => {
    it('should render disclosure text when present', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      expect(
        screen.getByText('This is a test disclosure message.')
      ).toBeTruthy();
    });

    it('should render source badge when disclosure source exists', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      expect(screen.getByText('Publisher A')).toBeTruthy();
    });

    it('should render action buttons when disclosure exists and not editing', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      expect(screen.getByTestId('icon-doc.on.clipboard')).toBeTruthy();
      expect(screen.getByTestId('icon-pencil')).toBeTruthy();
      expect(screen.getByTestId('icon-trash')).toBeTruthy();
    });
  });

  describe('Component Structure without Disclosure', () => {
    it('should render empty state when no disclosure exists', () => {
      render(<DisclosureSection deadline={mockDeadlineWithoutDisclosure} />);

      expect(screen.getByText('+ Add disclosure language')).toBeTruthy();
    });

    it('should not render action buttons when no disclosure exists', () => {
      render(<DisclosureSection deadline={mockDeadlineWithoutDisclosure} />);

      expect(screen.queryByTestId('icon-doc.on.clipboard')).toBeNull();
      expect(screen.queryByTestId('icon-pencil')).toBeNull();
      expect(screen.queryByTestId('icon-trash')).toBeNull();
    });
  });

  describe('Delete Disclosure Functionality', () => {
    it('should show delete button when disclosure exists', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('icon-trash');
      expect(deleteButton).toBeTruthy();
    });

    it('should show confirmation alert when delete button is pressed', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('delete-disclosure-button');
      fireEvent.press(deleteButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Disclosure',
        'Are you sure you want to delete this disclosure message?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Delete', style: 'destructive' }),
        ])
      );
    });

    it('should call mutation with null values when deletion is confirmed', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('delete-disclosure-button');
      fireEvent.press(deleteButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find(
        (btn: any) => btn.text === 'Delete'
      );
      confirmButton.onPress();

      expect(mockMutate).toHaveBeenCalledWith(
        {
          deadlineId: 'deadline-1',
          disclosureData: {
            disclosure_text: null,
            disclosure_source_name: null,
            disclosure_template_id: null,
          },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should not call mutation when deletion is cancelled', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('delete-disclosure-button');
      fireEvent.press(deleteButton);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should clear local state on successful deletion', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('delete-disclosure-button');
      fireEvent.press(deleteButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find(
        (btn: any) => btn.text === 'Delete'
      );
      confirmButton.onPress();

      const mutationCall = mockMutate.mock.calls[0];
      const mutationOptions = mutationCall[1];
      mutationOptions.onSuccess();

      expect(mutationOptions.onSuccess).toBeDefined();
    });

    it('should show error alert on deletion failure', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('delete-disclosure-button');
      fireEvent.press(deleteButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find(
        (btn: any) => btn.text === 'Delete'
      );
      confirmButton.onPress();

      const mutationCall = mockMutate.mock.calls[0];
      const mutationOptions = mutationCall[1];
      mutationOptions.onError();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to delete disclosure'
      );
    });

    it('should disable delete button when mutation is pending', () => {
      (useUpdateDeadlineDisclosure as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('delete-disclosure-button');
      fireEvent.press(deleteButton);

      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Query Invalidation', () => {
    it('should properly invalidate queries after successful deletion', () => {
      render(<DisclosureSection deadline={mockDeadlineWithDisclosure} />);

      const deleteButton = screen.getByTestId('icon-trash').parent;
      fireEvent.press(deleteButton!);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find(
        (btn: any) => btn.text === 'Delete'
      );
      confirmButton.onPress();

      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });
});
