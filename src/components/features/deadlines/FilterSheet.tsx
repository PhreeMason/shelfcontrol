import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import {
  BookFormat,
  ReadingDeadlineWithProgress,
  TimeRangeFilter,
} from '@/types/deadline.types';
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

  timeRangeFilter: TimeRangeFilter;
  onTimeRangeChange: (filter: TimeRangeFilter) => void;

  selectedFormats: BookFormat[];
  onFormatsChange: (formats: BookFormat[]) => void;

  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;

  availableSources: string[];
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  deadlines,
  timeRangeFilter,
  onTimeRangeChange,
  selectedFormats,
  onFormatsChange,
  selectedSources,
  onSourcesChange,
  availableSources,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(1000);

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

  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter(s => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  const getFormatCount = (format: BookFormat): number => {
    return deadlines.filter(d => d.format === format).length;
  };

  const getSourceCount = (source: string): number => {
    return deadlines.filter(d => d.source === source).length;
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

  const applyFilters = (deadlines: ReadingDeadlineWithProgress[]): ReadingDeadlineWithProgress[] => {
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

  const getFilteredCount = (): number => {
    return applyFilters(deadlines).length;
  };

  const hasActiveFilters =
    timeRangeFilter !== 'all' ||
    selectedFormats.length < 3 ||
    selectedSources.length > 0;

  const clearAllFilters = () => {
    onTimeRangeChange('all');
    onFormatsChange(['physical', 'eBook', 'audio']);
    onSourcesChange([]);
  };

  const formatLabels: Record<BookFormat, string> = {
    physical: 'Physical',
    eBook: 'eBook',
    audio: 'Audio',
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
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <ThemedText style={styles.title}>Filters</ThemedText>
              <View style={styles.headerActions}>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
                    <ThemedText style={[styles.closeButton, { color: colors.darkPink }]}>
                      Clear All
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose}>
                  <ThemedText style={styles.closeButton}>Done</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Time Range</ThemedText>
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
              <ThemedText style={styles.sectionTitle}>Format</ThemedText>
              <View style={styles.filterRow}>
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
              <ThemedText style={styles.sectionTitle}>Source</ThemedText>
              <View style={styles.filterRow}>
                {availableSources.map(source => {
                  const count = getSourceCount(source);
                  if (count === 0) return null;
                  return (
                    <ThemedButton
                      key={source}
                      title={`${source} ${count}`}
                      style={styles.filterPill}
                      variant={
                        selectedSources.includes(source) ? 'primary' : 'outline'
                      }
                      onPress={() => toggleSource(source)}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <ThemedButton
              title={`SHOW ${getFilteredCount()} DEADLINES`}
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearButton: {
    marginRight: 0,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 'auto',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyButton: {
    width: '100%',
    paddingVertical: 16,
  },
});
