import { useGetAllDeadlineTags } from '@/hooks/useTags';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  BookFormat,
  PageRangeFilter,
  ReadingDeadlineWithProgress,
  SortOrder,
  TimeRangeFilter,
} from '@/types/deadline.types';
import { SystemShelfId } from '@/types/shelves.types';
import { normalizeServerDate } from '@/utils/dateNormalization';
import { isDateThisMonth, isDateThisWeek } from '@/utils/dateUtils';
import { sortByPace } from '@/utils/deadlineSortingAdvanced';
import React from 'react';
import DeadlinesList from './DeadlinesList';

interface FilteredDeadlinesProps {
  selectedShelf: SystemShelfId;
  timeRangeFilter: TimeRangeFilter;
  selectedFormats: BookFormat[];
  selectedPageRanges: PageRangeFilter[];
  selectedTypes: string[];
  selectedTags: string[];
  excludedStatuses: SystemShelfId[];
  sortOrder: SortOrder;
  searchQuery: string;
}

const FilteredDeadlines: React.FC<FilteredDeadlinesProps> = ({
  selectedShelf,
  timeRangeFilter,
  selectedFormats,
  selectedPageRanges,
  selectedTypes,
  selectedTags,
  excludedStatuses,
  sortOrder,
  searchQuery,
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
    appliedDeadlines,
    rejectedDeadlines,
    withdrewDeadlines,
    isLoading,
    error,
  } = useDeadlines();
  const { data: deadlineTags = [] } = useGetAllDeadlineTags();

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

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(
        deadline => deadline.type && selectedTypes.includes(deadline.type)
      );
    }

    if (selectedTags.length > 0) {
      const deadlineIdsByTag = new Map<string, Set<string>>();
      selectedTags.forEach(tagId => {
        const deadlineIds = deadlineTags
          .filter(dt => dt.tag_id === tagId)
          .map(dt => dt.deadline_id);
        deadlineIdsByTag.set(tagId, new Set(deadlineIds));
      });

      filtered = filtered.filter(deadline => {
        return selectedTags.some(tagId => {
          const deadlineIds = deadlineIdsByTag.get(tagId);
          return deadlineIds?.has(deadline.id);
        });
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(deadline => {
        const title = deadline.book_title?.toLowerCase() || '';
        const author = deadline.author?.toLowerCase() || '';
        return title.includes(query) || author.includes(query);
      });
    }

    return filtered;
  };

  const applyStatusExclusions = (
    deadlines: ReadingDeadlineWithProgress[]
  ): ReadingDeadlineWithProgress[] => {
    if (excludedStatuses.length === 0 || selectedShelf !== 'all') {
      return deadlines;
    }

    const deadlineStatusMap = new Map<string, SystemShelfId>();
    const allDeadlinesByStatus = {
      active: activeDeadlines,
      pending: pendingDeadlines,
      paused: pausedDeadlines,
      applied: appliedDeadlines,
      overdue: overdueDeadlines,
      toReview: toReviewDeadlines,
      completed: completedDeadlines,
      didNotFinish: didNotFinishDeadlines,
      rejected: rejectedDeadlines,
      withdrew: withdrewDeadlines,
    };

    Object.entries(allDeadlinesByStatus).forEach(
      ([status, statusDeadlines]) => {
        statusDeadlines.forEach(deadline => {
          deadlineStatusMap.set(deadline.id, status as SystemShelfId);
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

    if (sortOrder === 'lowestPace') {
      return [...deadlines].sort((a, b) => sortByPace(a, b, 'asc'));
    }

    if (sortOrder === 'highestPace') {
      return [...deadlines].sort((a, b) => sortByPace(a, b, 'desc'));
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

    const deadlineMap = new Map<SystemShelfId, ReadingDeadlineWithProgress[]>();
    deadlineMap.set('active', activeDeadlines);
    deadlineMap.set('overdue', overdueDeadlines);
    deadlineMap.set('pending', pendingDeadlines);
    deadlineMap.set('paused', pausedDeadlines);
    deadlineMap.set('applied', appliedDeadlines);
    deadlineMap.set('completed', completedDeadlines);
    deadlineMap.set('toReview', toReviewDeadlines);
    deadlineMap.set('didNotFinish', didNotFinishDeadlines);
    deadlineMap.set('rejected', rejectedDeadlines);
    deadlineMap.set('withdrew', withdrewDeadlines);
    deadlineMap.set('all', deadlines);

    if (deadlineMap.has(selectedShelf)) {
      filtered = deadlineMap.get(selectedShelf)!;
    } else {
      filtered = activeDeadlines;
    }
    filtered = applyAllFilters(filtered);
    filtered = applyStatusExclusions(filtered);
    filtered = applySorting(filtered);
    return filtered;
  };

  const getEmptyMessage = (): string => {
    const emptyMessages: Record<SystemShelfId, string> = {
      active: 'No active due dates',
      overdue: 'No overdue due dates',
      pending: 'No pending due dates',
      paused: 'No paused due dates',
      applied: 'No applied books',
      completed: 'No completed books',
      toReview: 'No books waiting for reviews',
      didNotFinish: 'No books marked as did not finish',
      rejected: 'No rejected books',
      withdrew: 'No withdrawn books',
      all: 'No books found',
    };

    return emptyMessages[selectedShelf] || 'No books found';
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
