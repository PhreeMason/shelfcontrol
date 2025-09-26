import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import DeadlinesList from './DeadlinesList';

type FilterType =
  | 'active'
  | 'overdue'
  | 'pending'
  | 'completed'
  | 'set_aside'
  | 'all';

interface FilteredDeadlinesProps {
  selectedFilter: FilterType;
}

const FilteredDeadlines: React.FC<FilteredDeadlinesProps> = ({
  selectedFilter,
}) => {
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    setAsideDeadlines,
    pendingDeadlines,
    isLoading,
    error,
  } = useDeadlines();

  const getFilteredDeadlines = (): ReadingDeadlineWithProgress[] => {
    switch (selectedFilter) {
      case 'active':
        return activeDeadlines;
      case 'overdue':
        return overdueDeadlines;
      case 'pending':
        return pendingDeadlines;
      case 'completed':
        return completedDeadlines;
      case 'set_aside':
        return setAsideDeadlines;
      case 'all':
        return deadlines;
      default:
        return activeDeadlines;
    }
  };

  const getEmptyMessage = (): string => {
    switch (selectedFilter) {
      case 'active':
        return 'No active deadlines';
      case 'overdue':
        return 'No overdue deadlines';
      case 'pending':
        return 'No pending deadlines';
      case 'completed':
        return 'No completed deadlines';
      case 'set_aside':
        return 'No deadlines paused';
      case 'all':
        return 'No deadlines found';
      default:
        return 'No deadlines found';
    }
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
