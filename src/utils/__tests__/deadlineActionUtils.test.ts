import { router } from 'expo-router';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  createCompleteConfirmAlert,
  createDeleteConfirmAlert,
  createErrorToast,
  createReadAgainParams,
  createReadAgainPromptAlert,
  createSuccessToast,
  createUpdateDeadlinePromptAlert,
  getDeadlineStatus,
  getEditDeadlineUrl,
  getStatusFlags,
  showAlert,
  showToast,
} from '../deadlineActionUtils';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('deadlineActionUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeadlineStatus', () => {
    it('should return reading for deadline with no status array', () => {
      const deadline = { status: [] } as any;
      expect(getDeadlineStatus(deadline)).toBe('reading');
    });

    it('should return reading for deadline with null status', () => {
      const deadline = { status: null } as any;
      expect(getDeadlineStatus(deadline)).toBe('reading');
    });

    it('should return reading for deadline with undefined status', () => {
      const deadline = {} as any;
      expect(getDeadlineStatus(deadline)).toBe('reading');
    });

    it('should return the latest status from status array', () => {
      const deadline = {
        status: [
          { status: 'requested' },
          { status: 'reading' },
          { status: 'set_aside' },
        ],
      } as any;
      expect(getDeadlineStatus(deadline)).toBe('set_aside');
    });

    it('should return single status from array', () => {
      const deadline = {
        status: [{ status: 'complete' }],
      } as any;
      expect(getDeadlineStatus(deadline)).toBe('complete');
    });
  });

  describe('getStatusFlags', () => {
    it('should return correct flags for complete status', () => {
      const flags = getStatusFlags('complete');
      expect(flags).toEqual({
        isCompleted: true,
        isSetAside: false,
        isActive: false,
        isPending: false,
      });
    });

    it('should return correct flags for set_aside status', () => {
      const flags = getStatusFlags('set_aside');
      expect(flags).toEqual({
        isCompleted: false,
        isSetAside: true,
        isActive: false,
        isPending: false,
      });
    });

    it('should return correct flags for reading status', () => {
      const flags = getStatusFlags('reading');
      expect(flags).toEqual({
        isCompleted: false,
        isSetAside: false,
        isActive: true,
        isPending: false,
      });
    });

    it('should return correct flags for requested status', () => {
      const flags = getStatusFlags('requested');
      expect(flags).toEqual({
        isCompleted: false,
        isSetAside: false,
        isActive: false,
        isPending: true,
      });
    });

    it('should return all false flags for unknown status', () => {
      const flags = getStatusFlags('unknown');
      expect(flags).toEqual({
        isCompleted: false,
        isSetAside: false,
        isActive: false,
        isPending: false,
      });
    });
  });

  describe('createSuccessToast', () => {
    it('should create success toast for completed type', () => {
      const toast = createSuccessToast('completed', 'Harry Potter');
      expect(toast).toEqual({
        swipeable: true,
        type: 'success',
        text1: 'Book completed!',
        text2: '"Harry Potter" has been marked as complete',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create success toast for paused type', () => {
      const toast = createSuccessToast('paused', 'Lord of the Rings');
      expect(toast).toEqual({
        swipeable: true,
        type: 'success',
        text1: 'Book paused',
        text2: '"Lord of the Rings" has been paused',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create success toast for deleted type', () => {
      const toast = createSuccessToast('deleted', 'The Hobbit');
      expect(toast).toEqual({
        swipeable: true,
        type: 'success',
        text1: 'Deadline deleted',
        text2: '"The Hobbit" has been removed',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create success toast for reactivated type', () => {
      const toast = createSuccessToast('reactivated', 'Dune');
      expect(toast).toEqual({
        swipeable: true,
        type: 'success',
        text1: 'Deadline reactivated!',
        text2: '"Dune" is now active again',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create success toast for started type', () => {
      const toast = createSuccessToast('started', 'Foundation');
      expect(toast).toEqual({
        swipeable: true,
        type: 'success',
        text1: 'Started reading!',
        text2: '"Foundation" is now active',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });
  });

  describe('createErrorToast', () => {
    it('should create error toast with default message', () => {
      const toast = createErrorToast('complete');
      expect(toast).toEqual({
        swipeable: true,
        type: 'error',
        text1: 'Failed to complete deadline',
        text2: 'Please try again',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create error toast with custom error message', () => {
      const error = { message: 'Network error occurred' };
      const toast = createErrorToast('pause', error);
      expect(toast).toEqual({
        swipeable: true,
        type: 'error',
        text1: 'Failed to pause deadline',
        text2: 'Network error occurred',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create error toast for delete type', () => {
      const toast = createErrorToast('delete');
      expect(toast).toEqual({
        swipeable: true,
        type: 'error',
        text1: 'Failed to delete deadline',
        text2: 'Please try again',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create error toast for reactivate type', () => {
      const toast = createErrorToast('reactivate');
      expect(toast).toEqual({
        swipeable: true,
        type: 'error',
        text1: 'Failed to reactivate deadline',
        text2: 'Please try again',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should create error toast for start type', () => {
      const toast = createErrorToast('start');
      expect(toast).toEqual({
        swipeable: true,
        type: 'error',
        text1: 'Failed to start reading',
        text2: 'Please try again',
        autoHide: true,
        visibilityTime: 1500,
        position: 'top',
      });
    });

    it('should handle error object with undefined message', () => {
      const error = {};
      const toast = createErrorToast('complete', error);
      expect(toast.text2).toBe('Please try again');
    });

    it('should handle undefined error object', () => {
      const toast = createErrorToast('complete', undefined);
      expect(toast.text2).toBe('Please try again');
    });
  });

  describe('createDeleteConfirmAlert', () => {
    it('should create delete confirmation alert', () => {
      const mockOnConfirm = jest.fn();
      const alert = createDeleteConfirmAlert('Test Book', mockOnConfirm);

      expect(alert).toEqual({
        title: 'Delete Deadline',
        message:
          'Are you sure you want to delete "Test Book"? This action cannot be undone.',
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: mockOnConfirm,
          },
        ],
      });
    });

    it('should call onConfirm when delete button is pressed', () => {
      const mockOnConfirm = jest.fn();
      const alert = createDeleteConfirmAlert('Test Book', mockOnConfirm);

      alert.buttons[1].onPress?.();
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('createCompleteConfirmAlert', () => {
    it('should create complete confirmation alert', () => {
      const mockOnConfirm = jest.fn();
      const alert = createCompleteConfirmAlert('Test Book', mockOnConfirm);

      expect(alert).toEqual({
        title: 'Complete Book',
        message: 'Are you sure you want to mark "Test Book" as complete?',
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Complete',
            style: 'default',
            onPress: mockOnConfirm,
          },
        ],
      });
    });

    it('should call onConfirm when complete button is pressed', () => {
      const mockOnConfirm = jest.fn();
      const alert = createCompleteConfirmAlert('Test Book', mockOnConfirm);

      alert.buttons[1].onPress?.();
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('createUpdateDeadlinePromptAlert', () => {
    it('should create update deadline prompt with default message', () => {
      const alert = createUpdateDeadlinePromptAlert('deadline-123');

      expect(alert).toEqual({
        title: 'Update Deadline?',
        message: 'Would you like to update the deadline date?',
        buttons: [
          {
            text: 'Not Now',
            style: 'cancel',
          },
          {
            text: 'Yes, Update',
            onPress: expect.any(Function),
          },
        ],
      });
    });

    it('should create update deadline prompt with custom message', () => {
      const customMessage =
        "Would you like to update the deadline date since you're resuming this book?";
      const alert = createUpdateDeadlinePromptAlert(
        'deadline-456',
        customMessage
      );

      expect(alert.message).toBe(customMessage);
    });

    it('should navigate to edit page when Yes button is pressed', () => {
      const alert = createUpdateDeadlinePromptAlert('deadline-789');

      alert.buttons[1].onPress?.();
      expect(router.push).toHaveBeenCalledWith(
        '/deadline/deadline-789/edit?page=3'
      );
    });
  });

  describe('createReadAgainPromptAlert', () => {
    it('should create read again prompt alert', () => {
      const mockOnConfirm = jest.fn();
      const alert = createReadAgainPromptAlert('Test Book', mockOnConfirm);

      expect(alert).toEqual({
        title: 'Read Again?',
        message: 'Create a new deadline to read "Test Book" again?',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: mockOnConfirm,
          },
        ],
      });
    });

    it('should call onConfirm when Yes button is pressed', () => {
      const mockOnConfirm = jest.fn();
      const alert = createReadAgainPromptAlert('Test Book', mockOnConfirm);

      alert.buttons[1].onPress?.();
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('createReadAgainParams', () => {
    it('should create params for physical book', () => {
      const deadline = {
        book_title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        format: 'physical',
        total_quantity: 180,
        flexibility: 'strict',
        book_id: 'book-123',
      } as any;

      const params = createReadAgainParams(deadline);

      expect(params).toEqual({
        pathname: '/deadline/new',
        params: {
          page: '3',
          bookTitle: 'The Great Gatsby',
          bookAuthor: 'F. Scott Fitzgerald',
          format: 'physical',
          flexibility: 'strict',
          totalQuantity: '180',
          book_id: 'book-123',
        },
      });
    });

    it('should create params for audio book', () => {
      const deadline = {
        book_title: 'Becoming',
        author: 'Michelle Obama',
        format: 'audio',
        total_quantity: 1140,
        flexibility: 'flexible',
        book_id: 'book-456',
      } as any;

      const params = createReadAgainParams(deadline);

      expect(params).toEqual({
        pathname: '/deadline/new',
        params: {
          page: '3',
          bookTitle: 'Becoming',
          bookAuthor: 'Michelle Obama',
          format: 'audio',
          flexibility: 'flexible',
          totalQuantity: '19',
          totalMinutes: '0',
          book_id: 'book-456',
        },
      });
    });

    it('should handle missing author', () => {
      const deadline = {
        book_title: 'Anonymous Book',
        author: null,
        format: 'ebook',
        total_quantity: 300,
      } as any;

      const params = createReadAgainParams(deadline);

      expect(params.params.bookAuthor).toBe('');
    });

    it('should handle missing flexibility with default', () => {
      const deadline = {
        book_title: 'Test Book',
        author: 'Test Author',
        format: 'physical',
        total_quantity: 200,
      } as any;

      const params = createReadAgainParams(deadline);

      expect(params.params.flexibility).toBe('flexible');
    });

    it('should handle missing book_id with empty string', () => {
      const deadline = {
        book_title: 'Test Book',
        author: 'Test Author',
        format: 'physical',
        total_quantity: 200,
      } as any;

      const params = createReadAgainParams(deadline);

      expect(params.params.book_id).toBe('');
    });

    it('should create params for ebook format', () => {
      const deadline = {
        book_title: 'Digital Book',
        author: 'Digital Author',
        format: 'ebook',
        total_quantity: 250,
      } as any;

      const params = createReadAgainParams(deadline);

      expect(params.params.totalQuantity).toBe('250');
      expect(params.params.totalMinutes).toBeUndefined();
    });
  });

  describe('getEditDeadlineUrl', () => {
    it('should create edit URL with default page 3', () => {
      const url = getEditDeadlineUrl('deadline-123');
      expect(url).toBe('/deadline/deadline-123/edit?page=3');
    });

    it('should create edit URL with custom page', () => {
      const url = getEditDeadlineUrl('deadline-456', 2);
      expect(url).toBe('/deadline/deadline-456/edit?page=2');
    });

    it('should handle page 1', () => {
      const url = getEditDeadlineUrl('deadline-789', 1);
      expect(url).toBe('/deadline/deadline-789/edit?page=1');
    });
  });

  describe('showToast', () => {
    it('should call Toast.show with provided config', () => {
      const config = {
        swipeable: true,
        type: 'success' as const,
        text1: 'Test',
        text2: 'Message',
        autoHide: true,
        visibilityTime: 2000,
        position: 'top' as const,
      };

      showToast(config);

      expect(Toast.show).toHaveBeenCalledWith(config);
    });
  });

  describe('showAlert', () => {
    it('should call Alert.alert with provided config', () => {
      const config = {
        title: 'Test Alert',
        message: 'Test message',
        buttons: [
          { text: 'Cancel', style: 'cancel' as const },
          { text: 'OK', style: 'default' as const },
        ],
      };

      showAlert(config);

      expect(Alert.alert).toHaveBeenCalledWith(
        config.title,
        config.message,
        config.buttons
      );
    });
  });
});
