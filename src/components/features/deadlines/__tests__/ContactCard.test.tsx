import { ContactCard } from '../ContactCard';
import { useTheme } from '@/hooks/useTheme';
import { DeadlineContact } from '@/types/contacts.types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { analytics } from '@/lib/analytics/client';

jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/components/themed', () => ({
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

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

jest.mock('@/lib/analytics/client', () => ({
  analytics: {
    track: jest.fn(),
  },
}));

describe('ContactCard', () => {
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

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockContactComplete: DeadlineContact = {
    id: 'contact-1',
    user_id: 'user-1',
    deadline_id: 'deadline-1',
    contact_name: 'John Doe',
    email: 'john@example.com',
    username: '@johndoe',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockContactPartial: DeadlineContact = {
    id: 'contact-2',
    user_id: 'user-1',
    deadline_id: 'deadline-1',
    contact_name: 'Jane Smith',
    email: null,
    username: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('Component Structure', () => {
    it('should render all contact fields when present', () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('john@example.com')).toBeTruthy();
      expect(screen.getByText('@johndoe')).toBeTruthy();
    });

    it('should render only name when other fields are null', () => {
      render(
        <ContactCard
          contact={mockContactPartial}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.queryByText('john@example.com')).toBeNull();
      expect(screen.queryByText('@johndoe')).toBeNull();
    });

    it('should render action buttons', () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('icon-pencil')).toBeTruthy();
      expect(screen.getByTestId('icon-trash.fill')).toBeTruthy();
    });
  });

  describe('Long-Press Copy Functionality', () => {
    it('should copy name to clipboard on long press', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const nameField = screen.getByText('John Doe').parent;
      fireEvent(nameField!, 'longPress');

      await Promise.resolve();

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('John Doe');
    });

    it('should copy email to clipboard on long press', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const emailField = screen.getByText('john@example.com').parent;
      fireEvent(emailField!, 'longPress');

      await Promise.resolve();

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('john@example.com');
    });

    it('should copy username to clipboard on long press', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const usernameField = screen.getByText('@johndoe').parent;
      fireEvent(usernameField!, 'longPress');

      await Promise.resolve();

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('@johndoe');
    });

    it('should trigger haptic feedback on successful copy', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const nameField = screen.getByText('John Doe').parent;
      fireEvent(nameField!, 'longPress');

      await Promise.resolve();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    });

    it('should track analytics on field copy', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const nameField = screen.getByText('John Doe').parent;
      fireEvent(nameField!, 'longPress');

      await Promise.resolve();

      expect(analytics.track).toHaveBeenCalledWith('contact_field_copied', {
        field_type: 'name',
      });
    });

    it('should track different field types in analytics', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const emailField = screen.getByText('john@example.com').parent;
      fireEvent(emailField!, 'longPress');

      await Promise.resolve();

      expect(analytics.track).toHaveBeenCalledWith('contact_field_copied', {
        field_type: 'email',
      });

      const usernameField = screen.getByText('@johndoe').parent;
      fireEvent(usernameField!, 'longPress');

      await Promise.resolve();

      expect(analytics.track).toHaveBeenCalledWith('contact_field_copied', {
        field_type: 'username',
      });
    });
  });

  describe('Copy Success Badge', () => {
    it('should show copy success badge after copying', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const nameField = screen.getByText('John Doe').parent;
      fireEvent(nameField!, 'longPress');

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeTruthy();
      });
    });

    it('should hide copy success badge after 1 second', async () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const nameField = screen.getByText('John Doe').parent;
      fireEvent(nameField!, 'longPress');

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeTruthy();
      });

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.queryByText('Copied!')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error alert when clipboard fails', async () => {
      (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Clipboard error')
      );

      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const nameField = screen.getByText('John Doe').parent;
      fireEvent(nameField!, 'longPress');

      await Promise.resolve();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to copy to clipboard'
      );
    });

    it('should not show copy badge on error', async () => {
      (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Clipboard error')
      );

      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const nameField = screen.getByText('John Doe').parent;
      fireEvent(nameField!, 'longPress');

      await Promise.resolve();

      expect(screen.queryByText('Copied!')).toBeNull();
    });
  });

  describe('Action Buttons', () => {
    it('should call onEdit when edit button is pressed', () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByTestId('icon-pencil').parent;
      fireEvent.press(editButton!);

      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('should call onDelete when delete button is pressed', () => {
      render(
        <ContactCard
          contact={mockContactComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('icon-trash.fill').parent;
      fireEvent.press(deleteButton!);

      expect(mockOnDelete).toHaveBeenCalled();
    });
  });
});
