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
  allAudioDeadlines: ReadingDeadlineWithProgress[];
  allReadingDeadlines: ReadingDeadlineWithProgress[];
  allDeadlines: ReadingDeadlineWithProgress[];
  overdueReadingDeadlines: ReadingDeadlineWithProgress[];
  overdueAudioDeadlines: ReadingDeadlineWithProgress[];
}

export const useTodaysDeadlines = (): TodaysDeadlines => {
  const { activeDeadlines, completedDeadlines, overdueDeadlines } = useDeadlines();

  const allDeadlines = useMemo(() => {
    const today = dayjs().startOf('day');

    return [
      ...activeDeadlines,
      ...completedDeadlines.filter(d => {
        const status = d.status?.length && d.status[d.status.length - 1];
        if (!status) return false;
        const statusDate = normalizeServerDate(status.created_at);
        return statusDate.isValid() && statusDate.isSameOrAfter(today);
      }),
    ].filter(d => {
      if (!d.deadline_date) return false;
      const deadlineDate = normalizeServerDateStartOfDay(d.deadline_date);
      return deadlineDate.isValid() && deadlineDate.isSameOrAfter(today);
    });
  }, [activeDeadlines, completedDeadlines]);

  // Filter to only include active deadlines for goal calculation
  // Exclude: paused, did_not_finish, rejected, withdrew
  // Include: reading, pending, to_review, and complete (but only today's completions are in allDeadlines)
  const activeDeadlinesOnly = useMemo(() => {
    const activeStatuses = ['reading', 'pending', 'to_review', 'complete'];

    return allDeadlines.filter(deadline => {
      const latestStatus =
        deadline.status?.length && deadline.status[deadline.status.length - 1];
      if (!latestStatus || !latestStatus.status) return false;
      return activeStatuses.includes(latestStatus.status);
    });
  }, [allDeadlines]);

  const {
    audioDeadlines,
    readingDeadlines,
    allAudioDeadlines,
    allReadingDeadlines,
  } = useMemo(() => {
    const audio: ReadingDeadlineWithProgress[] = [];
    const reading: ReadingDeadlineWithProgress[] = [];
    const allAudio: ReadingDeadlineWithProgress[] = [];
    const allReading: ReadingDeadlineWithProgress[] = [];

    // Split active deadlines (for goals)
    activeDeadlinesOnly.forEach(deadline => {
      if (deadline.format === 'audio') {
        audio.push(deadline);
      } else {
        reading.push(deadline);
      }
    });

    // Split all deadlines (for progress tracking)
    allDeadlines.forEach(deadline => {
      if (deadline.format === 'audio') {
        allAudio.push(deadline);
      } else {
        allReading.push(deadline);
      }
    });

    return {
      audioDeadlines: audio,
      readingDeadlines: reading,
      allAudioDeadlines: allAudio,
      allReadingDeadlines: allReading,
    };
  }, [activeDeadlinesOnly, allDeadlines]);

  // Split overdue deadlines by format
  const { overdueReadingDeadlines, overdueAudioDeadlines } = useMemo(() => {
    const overdueReading: ReadingDeadlineWithProgress[] = [];
    const overdueAudio: ReadingDeadlineWithProgress[] = [];

    if (overdueDeadlines) {
      overdueDeadlines.forEach(deadline => {
        if (deadline.format === 'audio') {
          overdueAudio.push(deadline);
        } else {
          overdueReading.push(deadline);
        }
      });
    }

    return {
      overdueReadingDeadlines: overdueReading,
      overdueAudioDeadlines: overdueAudio,
    };
  }, [overdueDeadlines]);

  return {
    audioDeadlines,
    readingDeadlines,
    allAudioDeadlines,
    allReadingDeadlines,
    allDeadlines,
    overdueReadingDeadlines,
    overdueAudioDeadlines,
  };
};
