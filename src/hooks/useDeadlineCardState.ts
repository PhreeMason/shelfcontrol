import { useTheme } from '@/hooks/useThemeColor';
import {
  ReadingDeadlineStatus,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import { useMemo } from 'react';

export interface DeadlineCardState {
  latestStatus: string;
  latestStatusRecord: ReadingDeadlineStatus | null;
  isPending: boolean;
  isPaused: boolean;
  isArchived: boolean;
  isInActive: boolean;
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
    const { good, approaching, urgent, overdue, impossible, complete, paused } =
      colors;

    const urgencyTextColorMap: UrgencyColorMap = {
      complete,
      paused,
      did_not_finish: paused,
      overdue,
      urgent,
      good,
      approaching,
      impossible,
      pending: paused,
    };

    const sortedStatuses =
      deadline.status && deadline.status.length > 0
        ? [...deadline.status].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        : [];

    const latestStatus =
      sortedStatuses.length > 0
        ? sortedStatuses[sortedStatuses.length - 1].status ?? 'reading'
        : 'reading';

    const latestStatusRecord =
      sortedStatuses.length > 0
        ? sortedStatuses[sortedStatuses.length - 1]
        : null;

    const isPending = latestStatus === 'pending';
    const isPaused = latestStatus === 'paused';
    const isArchived =
      latestStatus === 'complete' || latestStatus === 'did_not_finish';
    const isInActive = isPending || isPaused;

    let countdownColor = urgencyTextColorMap[urgencyLevel] ?? colors.text;
    let borderColor = urgencyTextColorMap[urgencyLevel] ?? colors.text;

    if (isArchived && urgencyTextColorMap[latestStatus]) {
      borderColor = urgencyTextColorMap[latestStatus];
      countdownColor = urgencyTextColorMap[latestStatus];
    }

    if (isPending && urgencyTextColorMap[latestStatus]) {
      borderColor = urgencyTextColorMap[latestStatus];
      countdownColor = urgencyTextColorMap[latestStatus];
    }

    return {
      latestStatus,
      latestStatusRecord,
      isPending,
      isPaused,
      isArchived,
      isInActive,
      borderColor,
      countdownColor,
    };
  }, [deadline.status, urgencyLevel, colors]);
}
