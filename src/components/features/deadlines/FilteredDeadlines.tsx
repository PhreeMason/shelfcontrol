import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  BookFormat,
  FilterType,
  ReadingDeadlineWithProgress,
  TimeRangeFilter,
} from '@/types/deadline.types';
import { isDateThisMonth, isDateThisWeek } from '@/utils/dateUtils';
import React from 'react';
import DeadlinesList from './DeadlinesList';

interface FilteredDeadlinesProps {
  selectedFilter: FilterType;
  timeRangeFilter: TimeRangeFilter;
  selectedFormats: BookFormat[];
  selectedSources: string[];
}

const FilteredDeadlines: React.FC<FilteredDeadlinesProps> = ({
  selectedFilter,
  timeRangeFilter,
  selectedFormats,
  selectedSources,
}) => {
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    pausedDeadlines,
    didNotFinishDeadlines,
    pendingDeadlines,
    isLoading,
    error,
  } = useDeadlines();

  const applyAllFilters = (
    deadlines: ReadingDeadlineWithProgress[]
  ): ReadingDeadlineWithProgress[] => {
    let filtered = deadlines;

    if (timeRangeFilter !== 'all') {
      filtered = filtered.filter(deadline => {
        if (!deadline.deadline_date) return false;

        if (timeRangeFilter === 'thisWeek') {
          return isDateThisWeek(deadline.deadline_date);
        }

        if (timeRangeFilter === 'thisMonth') {
          return isDateThisMonth(deadline.deadline_date);
        }

        return true;
      });
    }

    if (selectedFormats.length > 0 && selectedFormats.length < 3) {
      filtered = filtered.filter(deadline =>
        selectedFormats.includes(deadline.format as BookFormat)
      );
    }

    if (selectedSources.length > 0) {
      filtered = filtered.filter(deadline =>
        selectedSources.includes(deadline.source)
      );
    }

    return filtered;
  };

  const getFilteredDeadlines = (): ReadingDeadlineWithProgress[] => {
    let filtered: ReadingDeadlineWithProgress[];

    const deadlineMap = new Map<FilterType, ReadingDeadlineWithProgress[]>();
    deadlineMap.set('active', activeDeadlines);
    deadlineMap.set('overdue', overdueDeadlines);
    deadlineMap.set('pending', pendingDeadlines);
    deadlineMap.set('completed', completedDeadlines);
    deadlineMap.set('paused', pausedDeadlines);
    deadlineMap.set('didNotFinish', didNotFinishDeadlines);
    deadlineMap.set('all', deadlines);

    if (deadlineMap.has(selectedFilter)) {
      filtered = deadlineMap.get(selectedFilter)!;
    } else {
      filtered = activeDeadlines;
    }
    return applyAllFilters(filtered);
  };

  const getEmptyMessage = (): string => {
    const emptyMessages = {
      active: 'No active deadlines',
      overdue: 'No overdue deadlines',
      pending: 'No pending deadlines',
      completed: 'No completed deadlines',
      paused: 'No deadlines paused',
      didNotFinish: 'No deadlines marked as did not finish',
      all: 'No deadlines found',
    };

    if (emptyMessages[selectedFilter as keyof typeof emptyMessages]) {
      return emptyMessages[selectedFilter as keyof typeof emptyMessages];
    }
    return 'No deadlines found';
  };

  const filteredDeadlines = getFilteredDeadlines();
  return (
    <DeadlinesList
      deadlines={filteredDeadlines}
      isLoading={isLoading}
      error={error}
      emptyMessage={getEmptyMessage()}
    />
  );
};

export default FilteredDeadlines;
