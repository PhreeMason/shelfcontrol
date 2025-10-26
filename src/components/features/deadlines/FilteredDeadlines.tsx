import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  BookFormat,
  FilterType,
  PageRangeFilter,
  ReadingDeadlineWithProgress,
  SortOrder,
  TimeRangeFilter,
} from '@/types/deadline.types';
import { isDateThisMonth, isDateThisWeek } from '@/utils/dateUtils';
import { normalizeServerDate } from '@/utils/dateNormalization';
import React from 'react';
import DeadlinesList from './DeadlinesList';

interface FilteredDeadlinesProps {
  selectedFilter: FilterType;
  timeRangeFilter: TimeRangeFilter;
  selectedFormats: BookFormat[];
  selectedPageRanges: PageRangeFilter[];
  selectedSources: string[];
  excludedStatuses: FilterType[];
  sortOrder: SortOrder;
}

const FilteredDeadlines: React.FC<FilteredDeadlinesProps> = ({
  selectedFilter,
  timeRangeFilter,
  selectedFormats,
  selectedPageRanges,
  selectedSources,
  excludedStatuses,
  sortOrder,
}) => {
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    toReviewDeadlines,
    didNotFinishDeadlines,
    pendingDeadlines,
    pausedDeadlines,
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

    if (selectedFormats.length > 0) {
      filtered = filtered.filter(deadline =>
        selectedFormats.includes(deadline.format as BookFormat)
      );
    }

    if (selectedPageRanges.length > 0) {
      filtered = filtered.filter(deadline => {
        if (deadline.format === 'audio') return true;
        const pages = deadline.total_quantity;
        return selectedPageRanges.some(range => {
          if (range === 'under300') return pages < 300;
          if (range === '300to500') return pages >= 300 && pages <= 500;
          if (range === 'over500') return pages > 500;
          return false;
        });
      });
    }

    if (selectedSources.length > 0) {
      filtered = filtered.filter(
        deadline => deadline.source && selectedSources.includes(deadline.source)
      );
    }

    return filtered;
  };

  const applyStatusExclusions = (
    deadlines: ReadingDeadlineWithProgress[]
  ): ReadingDeadlineWithProgress[] => {
    if (excludedStatuses.length === 0 || selectedFilter !== 'all') {
      return deadlines;
    }

    const deadlineStatusMap = new Map<string, FilterType>();
    const allDeadlinesByStatus = {
      active: activeDeadlines,
      pending: pendingDeadlines,
      paused: pausedDeadlines,
      overdue: overdueDeadlines,
      toReview: toReviewDeadlines,
      completed: completedDeadlines,
      didNotFinish: didNotFinishDeadlines,
    };

    Object.entries(allDeadlinesByStatus).forEach(
      ([status, statusDeadlines]) => {
        statusDeadlines.forEach(deadline => {
          deadlineStatusMap.set(deadline.id, status as FilterType);
        });
      }
    );

    return deadlines.filter(deadline => {
      const status = deadlineStatusMap.get(deadline.id);
      return status ? !excludedStatuses.includes(status) : true;
    });
  };

  const applySorting = (
    deadlines: ReadingDeadlineWithProgress[]
  ): ReadingDeadlineWithProgress[] => {
    if (sortOrder === 'default') {
      return deadlines;
    }

    return [...deadlines].sort((a, b) => {
      const dateA = a.deadline_date
        ? normalizeServerDate(a.deadline_date).valueOf()
        : 0;
      const dateB = b.deadline_date
        ? normalizeServerDate(b.deadline_date).valueOf()
        : 0;

      if (sortOrder === 'soonest') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  };

  const getFilteredDeadlines = (): ReadingDeadlineWithProgress[] => {
    let filtered: ReadingDeadlineWithProgress[];

    const deadlineMap = new Map<FilterType, ReadingDeadlineWithProgress[]>();
    deadlineMap.set('active', activeDeadlines);
    deadlineMap.set('overdue', overdueDeadlines);
    deadlineMap.set('pending', pendingDeadlines);
    deadlineMap.set('paused', pausedDeadlines);
    deadlineMap.set('completed', completedDeadlines);
    deadlineMap.set('toReview', toReviewDeadlines);
    deadlineMap.set('didNotFinish', didNotFinishDeadlines);
    deadlineMap.set('all', deadlines);

    if (deadlineMap.has(selectedFilter)) {
      filtered = deadlineMap.get(selectedFilter)!;
    } else {
      filtered = activeDeadlines;
    }
    filtered = applyAllFilters(filtered);
    filtered = applyStatusExclusions(filtered);
    filtered = applySorting(filtered);
    return filtered;
  };

  const getEmptyMessage = (): string => {
    const emptyMessages = {
      active: 'No active deadlines',
      overdue: 'No overdue deadlines',
      pending: 'No pending deadlines',
      paused: 'No paused deadlines',
      completed: 'No completed deadlines',
      toReview: 'No books waiting for reviews',
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
