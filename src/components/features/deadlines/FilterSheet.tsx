import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useGetAllDeadlineTags, useGetAllTags } from '@/hooks/useTags';
import { useTheme } from '@/hooks/useThemeColor';
import { usePreferences } from '@/providers/PreferencesProvider';
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
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Consolidated label maps for all filter types
const FILTER_LABELS = {
  format: { physical: 'Physical', eBook: 'eBook', audio: 'Audio' } as const,
  pageRange: {
    under300: '<300 pages',
    '300to500': '300-500 pages',
    over500: '500+ pages',
  } as const,
  timeRange: { all: 'All Time', thisWeek: 'This Week', thisMonth: 'This Month' } as const,
  status: {
    applied: 'Applied',
    active: 'Active',
    pending: 'Pending',
    paused: 'Paused',
    overdue: 'Past due',
    toReview: 'To Review',
    completed: 'Completed',
    didNotFinish: 'DNF',
  } as const,
  sort: {
    default: 'Default',
    soonest: 'Soonest First',
    latest: 'Latest First',
    lowestPace: 'Lowest Pace',
    highestPace: 'Highest Pace',
    shortestFirst: 'Shortest First',
    longestFirst: 'Longest First',
  } as const,
  shelf: {
    applied: 'Applied',
    pending: 'Pending',
    active: 'Active',
    paused: 'Paused',
    overdue: 'Past due',
    toReview: 'To Review',
    completed: 'Completed',
    didNotFinish: 'DNF',
    rejected: 'Rejected',
    withdrew: 'Withdrew',
    all: 'All',
  } as const,
} as const;

// Shared helper to check if a deadline matches a page range filter
const matchesPageRange = (
  deadline: ReadingDeadlineWithProgress,
  range: PageRangeFilter
): boolean => {
  if (deadline.format === 'audio') return false;
  const pages = deadline.total_quantity;
  if (range === 'under300') return pages < 300;
  if (range === '300to500') return pages >= 300 && pages <= 500;
  if (range === 'over500') return pages > 500;
  return false;
};

// Shared helper to check if a deadline matches a time range filter
const matchesTimeRange = (
  deadline: ReadingDeadlineWithProgress,
  range: TimeRangeFilter
): boolean => {
  if (range === 'all') return true;
  if (!deadline.deadline_date) return false;
  if (range === 'thisWeek') return isDateThisWeek(deadline.deadline_date);
  if (range === 'thisMonth') return isDateThisMonth(deadline.deadline_date);
  return true;
};

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

// Helper to split items into two rows for horizontal scrolling
const splitIntoTwoRows = <T,>(items: T[]): [T[], T[]] => {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
};

// Generic toggle handler factory to reduce duplication
const createToggleHandler = <T,>(
  selected: T[],
  onChange: (items: T[]) => void
) => {
  return (item: T) => {
    if (selected.includes(item)) {
      onChange(selected.filter(i => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };
};

// Reusable two-row horizontal scroll component
interface TwoRowFilterScrollProps {
  items: React.ReactNode[];
}

const TwoRowFilterScroll = ({ items }: TwoRowFilterScrollProps) => {
  const [row1, row2] = splitIntoTwoRows(items);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScrollContent}
    >
      <View style={styles.twoRowContainer}>
        <View style={styles.filterRow}>{row1}</View>
        {row2.length > 0 && <View style={styles.filterRow}>{row2}</View>}
      </View>
    </ScrollView>
  );
};

// Reusable section wrapper to reduce duplication
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <ThemedText typography="titleMedium" style={styles.sectionTitle}>
      {title}
    </ThemedText>
    {children}
  </View>
);

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
  const {
    showPaceOnCards,
    setShowPaceOnCards,
    showPaceOnCovers,
    setShowPaceOnCovers,
  } = usePreferences();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(1000);
  const { data: allTags = [] } = useGetAllTags();
  const { data: deadlineTags = [] } = useGetAllDeadlineTags();

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

  // Use generic toggle handler factory for all toggle functions
  const toggleFormat = createToggleHandler(selectedFormats, onFormatsChange);
  const togglePageRange = createToggleHandler(selectedPageRanges, onPageRangesChange);
  const toggleType = createToggleHandler(selectedTypes, onTypesChange);
  const toggleTag = createToggleHandler(selectedTags, onTagsChange);
  const toggleExcludedStatus = createToggleHandler(excludedStatuses, onExcludedStatusesChange);

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
    return deadlines.filter(d => matchesPageRange(d, range)).length;
  };

  const getTimeRangeCount = (range: TimeRangeFilter): number => {
    return deadlines.filter(d => matchesTimeRange(d, range)).length;
  };

  const applyFilters = (
    deadlines: ReadingDeadlineWithProgress[]
  ): ReadingDeadlineWithProgress[] => {
    let filtered = deadlines;

    if (timeRangeFilter !== 'all') {
      filtered = filtered.filter(d => matchesTimeRange(d, timeRangeFilter));
    }

    if (selectedFormats.length > 0) {
      filtered = filtered.filter(d =>
        selectedFormats.includes(d.format as BookFormat)
      );
    }

    if (selectedPageRanges.length > 0) {
      filtered = filtered.filter(d => {
        if (d.format === 'audio') return true;
        return selectedPageRanges.some(range => matchesPageRange(d, range));
      });
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(
        d => d.type && selectedTypes.includes(d.type)
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

      filtered = filtered.filter(d => {
        return selectedTags.some(tagId => {
          const deadlineIds = deadlineIdsByTag.get(tagId);
          return deadlineIds?.has(d.id);
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

  // Helper to create "All X" reset buttons
  const createAllButton = (
    selectedItems: unknown[],
    onClear: () => void,
    count: number = deadlines.length
  ) => (
    <ThemedButton
      key="all"
      title={`All ${count}`}
      style={styles.filterPill}
      variant={selectedItems.length === 0 ? 'primary' : 'outline'}
      onPress={onClear}
    />
  );

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
                Filter {FILTER_LABELS.shelf[selectedShelf] || 'All'}
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

            <Section title="Due Date">
              <TwoRowFilterScroll
                items={(['all', 'thisWeek', 'thisMonth'] as TimeRangeFilter[]).map(
                  range => (
                    <ThemedButton
                      key={range}
                      title={`${FILTER_LABELS.timeRange[range]} ${getTimeRangeCount(range)}`}
                      style={styles.filterPill}
                      variant={timeRangeFilter === range ? 'primary' : 'outline'}
                      onPress={() => onTimeRangeChange(range)}
                    />
                  )
                )}
              />
            </Section>

            <Section title="Format">
              <TwoRowFilterScroll
                items={[
                  createAllButton(selectedFormats, () => onFormatsChange([])),
                  ...(['physical', 'eBook', 'audio'] as BookFormat[]).map(format => (
                    <ThemedButton
                      key={format}
                      title={`${FILTER_LABELS.format[format]} ${getFormatCount(format)}`}
                      style={styles.filterPill}
                      variant={selectedFormats.includes(format) ? 'primary' : 'outline'}
                      onPress={() => toggleFormat(format)}
                    />
                  )),
                ]}
              />
            </Section>

            <Section title="Page Count">
              <TwoRowFilterScroll
                items={[
                  createAllButton(selectedPageRanges, () => onPageRangesChange([])),
                  ...(['under300', '300to500', 'over500'] as PageRangeFilter[]).map(range => (
                    <ThemedButton
                      key={range}
                      title={`${FILTER_LABELS.pageRange[range]} ${getPageRangeCount(range)}`}
                      style={styles.filterPill}
                      variant={selectedPageRanges.includes(range) ? 'primary' : 'outline'}
                      onPress={() => togglePageRange(range)}
                    />
                  )),
                ]}
              />
            </Section>

            <Section title="Type">
              <TwoRowFilterScroll
                items={[
                  createAllButton(selectedTypes, () => onTypesChange([])),
                  ...availableTypes
                    .filter(type => getTypeCount(type) > 0)
                    .map(type => (
                      <ThemedButton
                        key={type}
                        title={`${type} ${getTypeCount(type)}`}
                        style={styles.filterPill}
                        variant={selectedTypes.includes(type) ? 'primary' : 'outline'}
                        onPress={() => toggleType(type)}
                      />
                    )),
                ]}
              />
            </Section>

            <Section title="Tags">
              <TwoRowFilterScroll
                items={[
                  createAllButton(selectedTags, () => onTagsChange([])),
                  ...[...allTags]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .filter(tag => getTagCount(tag.id) > 0)
                    .map(tag => (
                      <ThemedButton
                        key={tag.id}
                        title={`${tag.name} ${getTagCount(tag.id)}`}
                        style={styles.filterPill}
                        variant={selectedTags.includes(tag.id) ? 'primary' : 'outline'}
                        onPress={() => toggleTag(tag.id)}
                      />
                    )),
                ]}
              />
            </Section>

            {selectedShelf === 'all' && (
              <Section title="Exclude Statuses">
                <TwoRowFilterScroll
                  items={(
                    ['applied', 'active', 'pending', 'paused', 'overdue', 'toReview', 'completed', 'didNotFinish'] as const
                  ).map(status => (
                    <ThemedButton
                      key={status}
                      title={`${FILTER_LABELS.status[status]} ${statusCounts?.[status] ?? 0}`}
                      style={styles.filterPill}
                      variant={excludedStatuses.includes(status) ? 'primary' : 'outline'}
                      onPress={() => toggleExcludedStatus(status)}
                    />
                  ))}
                />
              </Section>
            )}

            <Section title="Sort By">
              <TwoRowFilterScroll
                items={(
                  selectedShelf === 'all'
                    ? ['default', 'soonest', 'latest', 'lowestPace', 'highestPace', 'shortestFirst', 'longestFirst']
                    : ['default', 'lowestPace', 'highestPace', 'shortestFirst', 'longestFirst']
                ).map(order => (
                  <ThemedButton
                    key={order}
                    title={FILTER_LABELS.sort[order as SortOrder]}
                    style={styles.filterPill}
                    variant={sortOrder === order ? 'primary' : 'outline'}
                    onPress={() => onSortOrderChange(order as SortOrder)}
                  />
                ))}
              />
            </Section>

            <Section title="Display Options">
              <View style={styles.toggleRow}>
                <ThemedText typography="labelLarge">Show pace on cards</ThemedText>
                <Switch
                  value={showPaceOnCards}
                  onValueChange={setShowPaceOnCards}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <ThemedText typography="labelLarge">Show pace on covers</ThemedText>
                <Switch
                  value={showPaceOnCovers}
                  onValueChange={setShowPaceOnCovers}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </Section>
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
  filterScrollContent: {
    paddingRight: Spacing.lg,
  },
  twoRowContainer: {
    gap: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 'auto',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
