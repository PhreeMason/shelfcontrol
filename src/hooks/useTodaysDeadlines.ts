import { dayjs } from '@/lib/dayjs';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  normalizeServerDate,
  normalizeServerDateStartOfDay,
} from '@/utils/dateNormalization';
import { useMemo } from 'react';

interface TodaysDeadlines {
  audioDeadlines: ReadingDeadlineWithProgress[];
  readingDeadlines: ReadingDeadlineWithProgress[];
  allDeadlines: ReadingDeadlineWithProgress[];
}

export const useTodaysDeadlines = (): TodaysDeadlines => {
  const { activeDeadlines, completedDeadlines } = useDeadlines();

  const allDeadlines = useMemo(() => {
    const today = dayjs().startOf('day');

    return [
      ...activeDeadlines,
      ...completedDeadlines.filter(d => {
        const status = d.status?.length && d.status[d.status.length - 1];
        if (!status) return false;
        const statusDate = normalizeServerDate(status.created_at);
        return statusDate.isValid() && statusDate.isAfter(today);
      }),
    ].filter(d => {
      if (!d.deadline_date) return false;
      const deadlineDate = normalizeServerDateStartOfDay(d.deadline_date);
      return deadlineDate.isValid() && deadlineDate.isAfter(today);
    });
  }, [activeDeadlines, completedDeadlines]);

  const { audioDeadlines, readingDeadlines } = useMemo(() => {
    const audio: ReadingDeadlineWithProgress[] = [];
    const reading: ReadingDeadlineWithProgress[] = [];

    allDeadlines.forEach(deadline => {
      if (deadline.format === 'audio') {
        audio.push(deadline);
      } else {
        reading.push(deadline);
      }
    });

    return { audioDeadlines: audio, readingDeadlines: reading };
  }, [allDeadlines]);

  return {
    audioDeadlines,
    readingDeadlines,
    allDeadlines,
  };
};
