import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import dayjs from 'dayjs';
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
        return status && dayjs(status.created_at).isAfter(today);
      })
    ].filter(d => d.deadline_date && dayjs(d.deadline_date).isAfter(today));
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