import { useTheme } from '@/hooks/useThemeColor';
import {
  ReadingDeadlineStatus,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import { normalizeServerDate } from '@/utils/dateNormalization';
import { useMemo } from 'react';

export interface DeadlineCardState {
  latestStatus: string;
  latestStatusRecord: ReadingDeadlineStatus | null;
  isPending: boolean;
  isToReview: boolean;
  isArchived: boolean;
  isNotReading: boolean;
  borderColor: string;
  countdownColor: string;
}

type UrgencyColorMap = {
  [key: string]: string;
};

export function useDeadlineCardState(
  deadline: ReadingDeadlineWithProgress,
  urgencyLevel: string
): DeadlineCardState {
  const { colors } = useTheme();

  return useMemo(() => {
    const {
      good,
      approaching,
      urgent,
      overdue,
      impossible,
      complete,
      toReview,
      pending,
      didNotFinish,
    } = colors;

    const urgencyTextColorMap: UrgencyColorMap = {
      complete,
      to_review: toReview,
      did_not_finish: didNotFinish,
      overdue,
      urgent,
      good,
      approaching,
      impossible,
      pending,
    };

    const sortedStatuses =
      deadline.status && deadline.status.length > 0
        ? [...deadline.status].sort(
            (a, b) =>
              normalizeServerDate(a.created_at).valueOf() -
              normalizeServerDate(b.created_at).valueOf()
          )
        : [];

    const latestStatus =
      sortedStatuses.length > 0
        ? (sortedStatuses[sortedStatuses.length - 1].status ?? 'reading')
        : 'reading';

    const latestStatusRecord =
      sortedStatuses.length > 0
        ? sortedStatuses[sortedStatuses.length - 1]
        : null;

    const isPending = latestStatus === 'pending';
    const isToReview = latestStatus === 'to_review';
    const isArchived =
      latestStatus === 'complete' || latestStatus === 'did_not_finish';
    const isNotReading = isPending || isToReview;

    let countdownColor = urgencyTextColorMap[urgencyLevel] ?? colors.text;
    let borderColor = urgencyTextColorMap[urgencyLevel] ?? colors.text;

    if (isArchived && urgencyTextColorMap[latestStatus]) {
      borderColor = urgencyTextColorMap[latestStatus];
      countdownColor = urgencyTextColorMap[latestStatus];
    }

    return {
      latestStatus,
      latestStatusRecord,
      isPending,
      isToReview,
      isArchived,
      isNotReading,
      borderColor,
      countdownColor,
    };
  }, [deadline.status, urgencyLevel, colors]);
}
