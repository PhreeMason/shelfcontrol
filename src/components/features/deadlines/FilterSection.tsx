// components/FilterSection.tsx
import { ThemedButton } from '@/components/themed/ThemedButton';
import React from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

type FilterType =
  | 'active'
  | 'overdue'
  | 'pending'
  | 'completed'
  | 'paused'
  | 'all';

interface FilterOption {
  key: FilterType;
  label: string;
}

interface FilterSectionProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  animatedStyle?: any;
  onLayout?: (event: LayoutChangeEvent) => void;
  availableFilters?: FilterType[];
}

const filterOptions: FilterOption[] = [
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'paused', label: 'Paused' },
  { key: 'all', label: 'All' },
];

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedFilter,
  onFilterChange,
  animatedStyle,
  onLayout,
  availableFilters,
}) => {
  const visibleOptions = availableFilters
    ? filterOptions.filter(option => availableFilters.includes(option.key))
    : filterOptions;
  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      onLayout={onLayout}
    >
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContentContainer}
          style={styles.filterScrollView}
        >
          {visibleOptions.map(option => (
            <ThemedButton
              key={option.key}
              title={option.label}
              style={styles.filterButton}
              variant={selectedFilter === option.key ? 'primary' : 'outline'}
              onPress={() => onFilterChange(option.key)}
            />
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    maxHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterContentContainer: {
    gap: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  },
});

export default FilterSection;
