import { useFetchBookById } from '@/hooks/useBooks';
import { useDeadlineCardState } from '@/hooks/useDeadlineCardState';
import { useReviewTracking } from '@/hooks/useReviewTracking';
import { analytics } from '@/lib/analytics/client';
import { dayjs } from '@/lib/dayjs';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getCoverImageUrl } from '@/utils/coverImageUtils';
import { calculateLocalDaysLeft } from '@/utils/dateNormalization';
import {
  formatCapacityMessage,
  formatRemainingDisplay,
} from '@/utils/deadlineDisplayUtils';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { GestureResponderEvent, ViewStyle } from 'react-native';

interface DeadlineCardViewModel {
  display: {
    title: string;
    primaryText: string;
    secondaryText: string;
    coverImageUrl: string | null | undefined;
  };
  progress: {
    progressPercentage: number;
    currentProgress: number;
  };
  styling: {
    borderColor: string;
    countdownColor: string;
    cardContainerStyle: ViewStyle;
  };
  componentProps: {
    bookCover: {
      coverImageUrl: string | null | undefined;
      deadline: ReadingDeadlineWithProgress;
      daysLeft: number;
    };
    countdown: {
      latestStatus: string;
      daysLeft: number;
      countdownColor: string;
      borderColor: string;
      reviewDaysLeft?: number;
      unpostedPlatformCount?: number;
    };
    actionSheet: {
      deadline: ReadingDeadlineWithProgress;
      visible: boolean;
    };
  };
  handlers: {
    onCardPress: () => void;
    onMorePress: (e: GestureResponderEvent) => void;
  };
  state: {
    showActionSheet: boolean;
    setShowActionSheet: (show: boolean) => void;
  };
  flags: {
    isArchived: boolean;
  };
}

interface UseDeadlineCardViewModelParams {
  deadline: ReadingDeadlineWithProgress;
  disableNavigation?: boolean;
}

export function useDeadlineCardViewModel({
  deadline,
  disableNavigation = false,
}: UseDeadlineCardViewModelParams): DeadlineCardViewModel {
  const { getDeadlineCalculations, formatUnitsPerDayForDisplay } =
    useDeadlines();
  const router = useRouter();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const { data: bookData } = useFetchBookById(deadline.book_id);

  const {
    daysLeft,
    unitsPerDay,
    urgencyLevel,
    remaining,
    progressPercentage,
    currentProgress,
  } = getDeadlineCalculations(deadline);

  const {
    latestStatus,
    latestStatusRecord,
    isArchived,
    isNotReading,
    borderColor,
    countdownColor,
  } = useDeadlineCardState(deadline, urgencyLevel);

  const isToReview = useMemo(
    () => latestStatus === 'to_review',
    [latestStatus]
  );
  const { reviewDueDate, unpostedCount, totalPlatformCount } =
    useReviewTracking(deadline.id, isToReview);

  const handleCardPress = () => {
    if (!disableNavigation) {
      analytics.track('deadline_card_clicked', {
        deadline_status: latestStatus as
          | 'pending'
          | 'reading'
          | 'completed'
          | 'paused'
          | 'dnf',
        deadline_format: deadline.format as 'physical' | 'eBook' | 'audio',
        deadline_title: deadline.book_title,
      });
      router.push(`/deadline/${deadline.id}`);
    }
  };

  const handleMorePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setShowActionSheet(true);
  };

  const baseCapacityMessage = formatUnitsPerDayForDisplay(
    unitsPerDay,
    deadline.format,
    remaining,
    daysLeft
  );

  const capacityMessage = formatCapacityMessage(
    baseCapacityMessage,
    isNotReading
  );

  const primaryText = useMemo(() => {
    if (urgencyLevel === 'overdue') {
      return formatRemainingDisplay(remaining, deadline.format);
    }

    if (latestStatus === 'to_review') {
      if (totalPlatformCount === 0) {
        return 'No reviews to post';
      }
      if (unpostedCount === 0) {
        return 'All reviews posted';
      }
      const postedCount = totalPlatformCount - unpostedCount;
      if (unpostedCount === 1) {
        return `${postedCount} of ${totalPlatformCount} reviews posted`;
      }
      return `${postedCount} of ${totalPlatformCount} reviews posted`;
    }

    return capacityMessage;
  }, [
    urgencyLevel,
    remaining,
    deadline.format,
    capacityMessage,
    latestStatus,
    totalPlatformCount,
    unpostedCount,
  ]);

  const reviewDaysLeft = useMemo(() => {
    if (latestStatus === 'to_review' && reviewDueDate) {
      return calculateLocalDaysLeft(reviewDueDate);
    }
    return undefined;
  }, [latestStatus, reviewDueDate]);

  const secondaryText = useMemo(() => {
    if (isArchived) {
      const label = latestStatus === 'complete' ? 'Completed' : 'Archived';
      const date = latestStatusRecord
        ? dayjs(latestStatusRecord.created_at).format('MMM D, YYYY')
        : 'N/A';
      return `${label}: ${date}`;
    }
    if (latestStatus === 'to_review' && reviewDueDate) {
      return `Review by: ${dayjs(reviewDueDate).format('MMM D, YYYY')}`;
    }
    return `Due: ${dayjs(deadline.deadline_date).format('MMM D, YYYY')}`;
  }, [
    isArchived,
    latestStatus,
    latestStatusRecord,
    deadline.deadline_date,
    reviewDueDate,
  ]);

  const cardContainerStyle = useMemo(
    () => ({
      borderColor,
    }),
    [borderColor]
  );

  // Prioritize deadline's custom cover over book's cover
  const coverImageUrl = getCoverImageUrl(
    deadline.cover_image_url || bookData?.cover_image_url
  );

  return {
    display: {
      title: deadline.book_title,
      primaryText,
      secondaryText,
      coverImageUrl,
    },
    progress: {
      progressPercentage,
      currentProgress,
    },
    styling: {
      borderColor,
      countdownColor,
      cardContainerStyle,
    },
    componentProps: {
      bookCover: {
        coverImageUrl,
        deadline,
        daysLeft,
      },
      countdown: {
        latestStatus,
        daysLeft,
        countdownColor,
        borderColor,
        ...(reviewDaysLeft !== undefined && { reviewDaysLeft }),
        ...(unpostedCount !== undefined && {
          unpostedPlatformCount: unpostedCount,
        }),
      },
      actionSheet: {
        deadline,
        visible: showActionSheet,
      },
    },
    handlers: {
      onCardPress: handleCardPress,
      onMorePress: handleMorePress,
    },
    state: {
      showActionSheet,
      setShowActionSheet,
    },
    flags: {
      isArchived,
    },
  };
}
