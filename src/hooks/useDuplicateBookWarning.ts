import { dayjs } from '@/lib/dayjs';
import { SelectedBook } from '@/types/bookSearch';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import Toast from 'react-native-toast-message';

interface DuplicateCheckParams {
  selectedBook: SelectedBook;
  allDeadlines: ReadingDeadlineWithProgress[];
}

export const showDuplicateBookWarning = ({
  selectedBook,
  allDeadlines,
}: DuplicateCheckParams): void => {
  const duplicateDeadlines = allDeadlines.filter(deadline => {
    if (selectedBook.id && deadline.book_id === selectedBook.id) {
      return true;
    }

    const titleMatch =
      deadline.book_title.toLowerCase() === selectedBook.title.toLowerCase();
    const authorMatch =
      deadline.author?.toLowerCase() === selectedBook.author?.toLowerCase();

    return titleMatch && authorMatch;
  });

  if (duplicateDeadlines.length === 0) {
    return;
  }

  const firstDeadline = duplicateDeadlines[0];
  const latestStatus =
    firstDeadline.status?.[firstDeadline.status.length - 1]?.status ||
    'unknown';
  const dueDate = firstDeadline.deadline_date
    ? dayjs(firstDeadline.deadline_date).format('MMM D, YYYY')
    : 'No due dates';

  const latestProgress =
    firstDeadline.progress?.[firstDeadline.progress.length - 1];
  const progress = latestProgress
    ? `${Math.round(
        (latestProgress.current_progress / firstDeadline.total_quantity) * 100
      )}% complete`
    : '';

  const statusText = latestStatus.replace(/_/g, ' ');
  const detailsText = [`Status: ${statusText}`, `Due: ${dueDate}`, progress]
    .filter(Boolean)
    .join(' • ');

  Toast.show({
    swipeable: true,
    type: 'warning',
    text1: 'You have already added this ARC!',
    text2: detailsText,
    visibilityTime: 5000,
    position: 'top',
  });
};
