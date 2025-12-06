import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useUpdateDeadlineDate } from '@/hooks/useDeadlines';
import {
  useReviewTracking,
  useUpdateReviewDueDate,
} from '@/hooks/useReviewTracking';
import { useTheme } from '@/hooks/useTheme';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { normalizeServerDate, parseServerDateOnly } from '@/utils/dateNormalization';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

interface DatesTabProps {
  deadline: ReadingDeadlineWithProgress;
}

type EditingField = 'due' | 'review' | null;

export const DatesTab = ({ deadline }: DatesTabProps) => {
  const { colors } = useTheme();
  const [editingField, setEditingField] = useState<EditingField>(null);

  const updateDueDate = useUpdateDeadlineDate();
  const updateReviewDueDate = useUpdateReviewDueDate();

  // Get review tracking data
  const { reviewDueDate, isLoading: isLoadingReview } = useReviewTracking(
    deadline.id,
    true
  );
  const hasReviewTracking = !isLoadingReview && reviewDueDate !== undefined;

  // Date values
  const dueDateValue = parseServerDateOnly(deadline.deadline_date).toDate();
  const reviewDueDateValue = reviewDueDate
    ? normalizeServerDate(reviewDueDate).toDate()
    : new Date();

  const handleDueDateChange = (_event: unknown, date?: Date) => {
    if (date) {
      updateDueDate.mutate({
        deadlineId: deadline.id,
        newDate: dayjs(date).format('YYYY-MM-DD'),
      });
    }
    setEditingField(null);
  };

  const handleReviewDueDateChange = (_event: unknown, date?: Date) => {
    if (date) {
      updateReviewDueDate.mutate({
        deadlineId: deadline.id,
        reviewDueDate: date.toISOString(),
      });
    }
    setEditingField(null);
  };

  const toggleField = (field: EditingField) => {
    setEditingField(prev => (prev === field ? null : field));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText
        typography="bodySmall"
        color="textSecondary"
        style={styles.helpText}
      >
        Tap a date to edit
      </ThemedText>

      {/* Due Date */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <IconSymbol name="calendar" size={18} color={colors.primary} />
          <ThemedText typography="titleSmall">Due Date</ThemedText>
        </View>

        <DateRow
          label="Book due"
          value={parseServerDateOnly(deadline.deadline_date).format(
            'MMMM D, YYYY'
          )}
          isEditing={editingField === 'due'}
          onPress={() => toggleField('due')}
        />

        {editingField === 'due' && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              themeVariant="light"
              value={dueDateValue}
              mode="date"
              display="inline"
              onChange={handleDueDateChange}
            />
          </View>
        )}
      </ThemedView>

      {/* Review Due Date */}
      {hasReviewTracking && (
        <ThemedView style={[styles.section, { borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="star.fill" size={18} color={colors.primary} />
            <ThemedText typography="titleSmall">Review Due Date</ThemedText>
          </View>

          <DateRow
            label="Reviews due"
            value={
              reviewDueDate
                ? normalizeServerDate(reviewDueDate).format('MMMM D, YYYY')
                : 'Not set'
            }
            isEditing={editingField === 'review'}
            onPress={() => toggleField('review')}
          />

          {editingField === 'review' && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                themeVariant="light"
                value={reviewDueDateValue}
                mode="date"
                display="inline"
                onChange={handleReviewDueDateChange}
              />
            </View>
          )}
        </ThemedView>
      )}

      <ThemedText
        typography="bodySmall"
        color="textMuted"
        style={styles.footerText}
      >
        Custom dates can be edited from the main book details page
      </ThemedText>
    </ScrollView>
  );
};

interface DateRowProps {
  label: string;
  value: string;
  isEditing: boolean;
  onPress: () => void;
}

const DateRow = ({ label, value, isEditing, onPress }: DateRowProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.dateRow,
        {
          backgroundColor: isEditing
            ? colors.surfaceVariant
            : pressed
              ? colors.surfaceVariant
              : 'transparent',
        },
      ]}
      onPress={onPress}
    >
      <ThemedText color="textSecondary">{label}</ThemedText>
      <View style={styles.dateValueContainer}>
        <ThemedText>{value}</ThemedText>
        <IconSymbol
          name={isEditing ? 'chevron.up' : 'chevron.down'}
          size={16}
          color={colors.textMuted}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  helpText: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  section: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  dateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pickerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
