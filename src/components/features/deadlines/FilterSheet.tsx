import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useGetAllDeadlineTags, useGetAllTags } from '@/hooks/useTags';
import { useTheme } from '@/hooks/useThemeColor';
import {
  BookFormat,
  PageRangeFilter,
  ReadingDeadlineWithProgress,
  SortOrder,
  TimeRangeFilter,
} from '@/types/deadline.types';
import { SystemShelfId } from '@/types/shelves.types';
import { isDateThisMonth, isDateThisWeek } from '@/utils/dateUtils';
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  deadlines: ReadingDeadlineWithProgress[];

  selectedShelf: SystemShelfId;

  timeRangeFilter: TimeRangeFilter;
  onTimeRangeChange: (filter: TimeRangeFilter) => void;

  selectedFormats: BookFormat[];
  onFormatsChange: (formats: BookFormat[]) => void;

  selectedPageRanges: PageRangeFilter[];
  onPageRangesChange: (ranges: PageRangeFilter[]) => void;

  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;

  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;

  excludedStatuses: SystemShelfId[];
  onExcludedStatusesChange: (statuses: SystemShelfId[]) => void;

  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;

  statusCounts?: Record<SystemShelfId, number>;

  availableTypes: string[];
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  deadlines,
  selectedShelf,
  timeRangeFilter,
  onTimeRangeChange,
  selectedFormats,
  onFormatsChange,
  selectedPageRanges,
  onPageRangesChange,
  selectedTypes,
  onTypesChange,
  selectedTags,
  onTagsChange,
  excludedStatuses,
  onExcludedStatusesChange,
  sortOrder,
  onSortOrderChange,
  statusCounts,
  availableTypes,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(1000);
  const { data: allTags = [] } = useGetAllTags();
  const { data: deadlineTags = [] } = useGetAllDeadlineTags();

  const getFilterDisplayName = (filter: string): string => {
    const displayNames: Record<string, string> = {
      applied: 'Applied',
      pending: 'Pending',
      active: 'Active',
      paused: 'Paused',
      overdue: 'Past due',
      toReview: 'To Review',
      completed: 'Completed',
      didNotFinish: 'DNF',
      all: 'All',
    };
    return displayNames[filter] || 'All';
  };

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(1000, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleFormat = (format: BookFormat) => {
    if (selectedFormats.includes(format)) {
      onFormatsChange(selectedFormats.filter(f => f !== format));
    } else {
      onFormatsChange([...selectedFormats, format]);
    }
  };

  const togglePageRange = (range: PageRangeFilter) => {
    if (selectedPageRanges.includes(range)) {
      onPageRangesChange(selectedPageRanges.filter(r => r !== range));
    } else {
      onPageRangesChange([...selectedPageRanges, range]);
    }
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(t => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const toggleExcludedStatus = (status: SystemShelfId) => {
    if (excludedStatuses.includes(status)) {
      onExcludedStatusesChange(excludedStatuses.filter(s => s !== status));
    } else {
      onExcludedStatusesChange([...excludedStatuses, status]);
    }
  };

  const getFormatCount = (format: BookFormat): number => {
    return deadlines.filter(d => d.format === format).length;
  };

  const getTypeCount = (type: string): number => {
    return deadlines.filter(d => d.type === type).length;
  };

  const getTagCount = (tagId: string): number => {
    const deadlineIdsWithTag = new Set(
      deadlineTags.filter(dt => dt.tag_id === tagId).map(dt => dt.deadline_id)
    );
    return deadlines.filter(d => deadlineIdsWithTag.has(d.id)).length;
  };

  const getPageRangeCount = (range: PageRangeFilter): number => {
    return deadlines.filter(d => {
      if (d.format === 'audio') return false;
      const pages = d.total_quantity;
      if (range === 'under300') return pages < 300;
      if (range === '300to500') return pages >= 300 && pages <= 500;
      if (range === 'over500') return pages > 500;
      return false;
    }).length;
  };

  const getTimeRangeCount = (range: TimeRangeFilter): number => {
    if (range === 'all') {
      return deadlines.length;
    }
    return deadlines.filter(deadline => {
      if (!deadline.deadline_date) return false;
      if (range === 'thisWeek') {
        return isDateThisWeek(deadline.deadline_date);
      }
      if (range === 'thisMonth') {
        return isDateThisMonth(deadline.deadline_date);
      }
      return true;
    }).length;
  };

  const applyFilters = (
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

    return filtered;
  };

  const applyStatusExclusionsToCount = (count: number): number => {
    if (
      excludedStatuses.length === 0 ||
      selectedShelf !== 'all' ||
      !statusCounts
    ) {
      return count;
    }

    let excludedCount = 0;
    excludedStatuses.forEach(status => {
      excludedCount += statusCounts[status] || 0;
    });

    return Math.max(0, count - excludedCount);
  };

  const getFilteredCount = (): number => {
    const baseCount = applyFilters(deadlines).length;
    return applyStatusExclusionsToCount(baseCount);
  };

  const hasActiveFilters =
    timeRangeFilter !== 'all' ||
    selectedFormats.length > 0 ||
    selectedPageRanges.length > 0 ||
    selectedTypes.length > 0 ||
    selectedTags.length > 0 ||
    excludedStatuses.length > 0 ||
    sortOrder !== 'default';

  const clearAllFilters = () => {
    onTimeRangeChange('all');
    onFormatsChange([]);
    onPageRangesChange([]);
    onTypesChange([]);
    onTagsChange([]);
    onExcludedStatusesChange([]);
    onSortOrderChange('default');
  };

  const formatLabels: Record<BookFormat, string> = {
    physical: 'Physical',
    eBook: 'eBook',
    audio: 'Audio',
  };

  const pageRangeLabels: Record<PageRangeFilter, string> = {
    under300: '<300 pages',
    '300to500': '300-500 pages',
    over500: '500+ pages',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close filter sheet"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
            },
            animatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.header}>
              <ThemedText typography="titleSubLarge" style={styles.title}>
                Filter {getFilterDisplayName(selectedShelf)}
              </ThemedText>
              <View style={styles.headerActions}>
                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={clearAllFilters}
                    style={styles.clearButton}
                  >
                    <ThemedText
                      typography="titleMedium"
                      style={[styles.closeButton, { color: colors.darkPink }]}
                    >
                      Clear All
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose}>
                  <ThemedText
                    typography="titleMedium"
                    style={styles.closeButton}
                  >
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Due Date
              </ThemedText>
              <View style={styles.filterRow}>
                {(['all', 'thisWeek', 'thisMonth'] as TimeRangeFilter[]).map(
                  range => {
                    const count = getTimeRangeCount(range);
                    const label =
                      range === 'all'
                        ? 'All Time'
                        : range === 'thisWeek'
                          ? 'This Week'
                          : 'This Month';
                    return (
                      <ThemedButton
                        key={range}
                        title={`${label} ${count}`}
                        style={styles.filterPill}
                        variant={
                          timeRangeFilter === range ? 'primary' : 'outline'
                        }
                        onPress={() => onTimeRangeChange(range)}
                      />
                    );
                  }
                )}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Format
              </ThemedText>
              <View style={styles.filterRow}>
                <ThemedButton
                  title={`All ${deadlines.length}`}
                  style={styles.filterPill}
                  variant={selectedFormats.length === 0 ? 'primary' : 'outline'}
                  onPress={() => onFormatsChange([])}
                />
                {(['physical', 'eBook', 'audio'] as BookFormat[]).map(
                  format => {
                    const count = getFormatCount(format);
                    return (
                      <ThemedButton
                        key={format}
                        title={`${formatLabels[format]} ${count}`}
                        style={styles.filterPill}
                        variant={
                          selectedFormats.includes(format)
                            ? 'primary'
                            : 'outline'
                        }
                        onPress={() => toggleFormat(format)}
                      />
                    );
                  }
                )}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Page Count
              </ThemedText>
              <View style={styles.filterRow}>
                <ThemedButton
                  title={`All ${deadlines.length}`}
                  style={styles.filterPill}
                  variant={
                    selectedPageRanges.length === 0 ? 'primary' : 'outline'
                  }
                  onPress={() => onPageRangesChange([])}
                />
                {(['under300', '300to500', 'over500'] as PageRangeFilter[]).map(
                  range => {
                    const count = getPageRangeCount(range);
                    return (
                      <ThemedButton
                        key={range}
                        title={`${pageRangeLabels[range]} ${count}`}
                        style={styles.filterPill}
                        variant={
                          selectedPageRanges.includes(range)
                            ? 'primary'
                            : 'outline'
                        }
                        onPress={() => togglePageRange(range)}
                      />
                    );
                  }
                )}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Type
              </ThemedText>
              <View style={styles.filterRow}>
                <ThemedButton
                  title={`All ${deadlines.length}`}
                  style={styles.filterPill}
                  variant={selectedTypes.length === 0 ? 'primary' : 'outline'}
                  onPress={() => onTypesChange([])}
                />
                {availableTypes.map(type => {
                  const count = getTypeCount(type);
                  if (count === 0) return null;
                  return (
                    <ThemedButton
                      key={type}
                      title={`${type} ${count}`}
                      style={styles.filterPill}
                      variant={
                        selectedTypes.includes(type) ? 'primary' : 'outline'
                      }
                      onPress={() => toggleType(type)}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Tags
              </ThemedText>
              <ScrollView
                style={styles.tagsScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <View style={styles.filterRow}>
                  <ThemedButton
                    title={`All ${deadlines.length}`}
                    style={styles.filterPill}
                    variant={selectedTags.length === 0 ? 'primary' : 'outline'}
                    onPress={() => onTagsChange([])}
                  />
                  {[...allTags]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(tag => {
                      const count = getTagCount(tag.id);
                      if (count === 0) return null;
                      return (
                        <ThemedButton
                          key={tag.id}
                          title={`${tag.name} ${count}`}
                          style={styles.filterPill}
                          variant={
                            selectedTags.includes(tag.id)
                              ? 'primary'
                              : 'outline'
                          }
                          onPress={() => toggleTag(tag.id)}
                        />
                      );
                    })}
                </View>
              </ScrollView>
            </View>

            {selectedShelf === 'all' && (
              <View style={styles.section}>
                <ThemedText
                  typography="titleMedium"
                  style={styles.sectionTitle}
                >
                  Exclude Statuses
                </ThemedText>
                <View style={styles.filterRow}>
                  {(
                    [
                      'applied',
                      'active',
                      'pending',
                      'paused',
                      'pastDue',
                      'toReview',
                      'completed',
                      'didNotFinish',
                    ] as SystemShelfId[]
                  ).map(status => {
                    const statusLabels: Record<string, string> = {
                      applied: 'Applied',
                      active: 'Active',
                      pending: 'Pending',
                      paused: 'Paused',
                      pastDue: 'Past due',
                      toReview: 'To Review',
                      completed: 'Completed',
                      didNotFinish: 'DNF',
                    };
                    const count = statusCounts?.[status] ?? 0;
                    return (
                      <ThemedButton
                        key={status}
                        title={`${statusLabels[status]} ${count}`}
                        style={styles.filterPill}
                        variant={
                          excludedStatuses.includes(status)
                            ? 'primary'
                            : 'outline'
                        }
                        onPress={() => toggleExcludedStatus(status)}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                Sort By
              </ThemedText>
              <View style={styles.filterRow}>
                {(selectedShelf === 'all'
                  ? [
                      'default',
                      'soonest',
                      'latest',
                      'lowestPace',
                      'highestPace',
                    ]
                  : ['default', 'lowestPace', 'highestPace']
                ).map(order => {
                  const sortLabels: Record<SortOrder, string> = {
                    default: 'Default',
                    soonest: 'Soonest First',
                    latest: 'Latest First',
                    lowestPace: 'Lowest Pace',
                    highestPace: 'Highest Pace',
                  };
                  return (
                    <ThemedButton
                      key={order}
                      title={sortLabels[order as SortOrder]}
                      style={styles.filterPill}
                      variant={sortOrder === order ? 'primary' : 'outline'}
                      onPress={() => onSortOrderChange(order as SortOrder)}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <ThemedButton
              title="CANCEL"
              variant="dangerOutline"
              style={styles.cancelButton}
              onPress={onClose}
            />
            <ThemedButton
              title={`SHOW ${getFilteredCount()} BOOKS`}
              variant="primary"
              style={styles.applyButton}
              onPress={onClose}
            />
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  clearButton: {
    marginRight: 0,
  },
  title: {
    fontWeight: '700',
  },
  closeButton: {
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 'auto',
  },
  tagsScrollView: {
    maxHeight: 150,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    flex: 0.35,
  },
  applyButton: {
    paddingVertical: Spacing.md,
    flex: 0.65,
  },
});
