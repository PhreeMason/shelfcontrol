import { ROUTES } from '@/constants/routes';
import { DEADLINE_STATUS } from '@/constants/status';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { convertMinutesToHoursAndMinutes } from './audiobookTimeUtils';

export const getDeadlineStatus = (
  deadline: ReadingDeadlineWithProgress
): string => {
  if (!deadline.status || deadline.status.length === 0) {
    return DEADLINE_STATUS.READING;
  }
  return (
    deadline.status[deadline.status.length - 1].status ??
    DEADLINE_STATUS.READING
  );
};

export interface StatusFlags {
  isCompleted: boolean;
  isSetAside: boolean;
  isActive: boolean;
  isPending: boolean;
}

export const getStatusFlags = (status: string): StatusFlags => {
  return {
    isCompleted: status === DEADLINE_STATUS.COMPLETE,
    isSetAside: status === DEADLINE_STATUS.PAUSED,
    isActive: status === DEADLINE_STATUS.READING,
    isPending: status === DEADLINE_STATUS.PENDING,
  };
};

export interface ToastConfig {
  swipeable: boolean;
  type: 'success' | 'error';
  text1: string;
  text2: string;
  autoHide: boolean;
  visibilityTime: number;
  position: 'top';
}

export const createSuccessToast = (
  type: 'completed' | 'paused' | 'deleted' | 'reactivated' | 'started',
  bookTitle: string
): ToastConfig => {
  const messages = {
    completed: {
      text1: 'Book completed!',
      text2: `"${bookTitle}" has been marked as complete`,
    },
    paused: {
      text1: 'Book paused',
      text2: `"${bookTitle}" has been paused`,
    },
    deleted: {
      text1: 'Deadline deleted',
      text2: `"${bookTitle}" has been removed`,
    },
    reactivated: {
      text1: 'Deadline reactivated!',
      text2: `"${bookTitle}" is now active again`,
    },
    started: {
      text1: 'Started reading!',
      text2: `"${bookTitle}" is now active`,
    },
  };

  return {
    swipeable: true,
    type: 'success',
    ...messages[type],
    autoHide: true,
    visibilityTime: 1500,
    position: 'top',
  };
};

export const createErrorToast = (
  type: 'complete' | 'pause' | 'delete' | 'reactivate' | 'start',
  error?: { message?: string }
): ToastConfig => {
  const messages = {
    complete: 'Failed to complete deadline',
    pause: 'Failed to pause deadline',
    delete: 'Failed to delete deadline',
    reactivate: 'Failed to reactivate deadline',
    start: 'Failed to start reading',
  };

  return {
    swipeable: true,
    type: 'error',
    text1: messages[type],
    text2: error?.message || 'Please try again',
    autoHide: true,
    visibilityTime: 1500,
    position: 'top',
  };
};

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertConfig {
  title: string;
  message: string;
  buttons: AlertButton[];
}

export const createDeleteConfirmAlert = (
  bookTitle: string,
  onConfirm: () => void
): AlertConfig => ({
  title: 'Delete Deadline',
  message: `Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`,
  buttons: [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: onConfirm,
    },
  ],
});

export const createCompleteConfirmAlert = (
  bookTitle: string,
  onConfirm: () => void
): AlertConfig => ({
  title: 'Complete Book',
  message: `Are you sure you want to mark "${bookTitle}" as complete?`,
  buttons: [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: 'Complete',
      style: 'default',
      onPress: onConfirm,
    },
  ],
});

export const createUpdateDeadlinePromptAlert = (
  deadlineId: string,
  message: string = 'Would you like to update the deadline date?'
): AlertConfig => ({
  title: 'Update Deadline?',
  message,
  buttons: [
    {
      text: 'Not Now',
      style: 'cancel',
    },
    {
      text: 'Yes, Update',
      onPress: () => {
        router.push(`/deadline/${deadlineId}/edit?page=3`);
      },
    },
  ],
});

export const createReadAgainPromptAlert = (
  bookTitle: string,
  onConfirm: () => void
): AlertConfig => ({
  title: 'Read Again?',
  message: `Create a new deadline to read "${bookTitle}" again?`,
  buttons: [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Yes',
      onPress: onConfirm,
    },
  ],
});

export interface ReadAgainParams {
  pathname: string;
  params: {
    page: string;
    bookTitle: string;
    bookAuthor: string;
    format: string;
    source: string;
    flexibility: string;
    totalMinutes?: string;
    totalQuantity?: string;
    book_id: string;
  };
}

export const createReadAgainParams = (
  deadline: ReadingDeadlineWithProgress
): ReadAgainParams => {
  const baseParams = {
    page: '3',
    bookTitle: deadline.book_title,
    bookAuthor: deadline.author || '',
    format: deadline.format,
    source: deadline.source || '',
    flexibility: (deadline as any).flexibility || 'flexible',
    book_id: (deadline as any).book_id || '',
  };

  const formatSpecificParams =
    deadline.format === 'audio'
      ? (() => {
          const { hours, minutes } = convertMinutesToHoursAndMinutes(
            deadline.total_quantity
          );
          return {
            totalQuantity: String(hours),
            totalMinutes: String(minutes),
          };
        })()
      : { totalQuantity: String(deadline.total_quantity) };

  return {
    pathname: `${ROUTES.HOME}deadline/new`,
    params: {
      ...baseParams,
      ...formatSpecificParams,
    },
  };
};

export const getEditDeadlineUrl = (
  deadlineId: string,
  page: number = 3
): string => {
  return `/deadline/${deadlineId}/edit?page=${page}`;
};

export const showToast = (config: ToastConfig): void => {
  Toast.show(config);
};

export const showAlert = (config: AlertConfig): void => {
  Alert.alert(config.title, config.message, config.buttons);
};
