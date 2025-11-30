import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import { StyleSheet } from 'react-native';

const makeUpperCaseFirstLetter = (str: string | null | undefined) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const BookDetailsSection = ({
  deadline,
}: {
  deadline: ReadingDeadlineWithProgress;
}) => {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.sectionTitle}>
        <ThemedText variant="title">Book Details</ThemedText>
      </ThemedView>

      <ThemedView style={styles.detailsGrid}>
        <ThemedView
          style={[
            styles.detailRow,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outline + '50',
            },
          ]}
        >
          <ThemedText variant="secondary">Author</ThemedText>
          <ThemedText typography="bodyLarge" style={styles.detailsValue}>
            {deadline.author || 'Unknown'}
          </ThemedText>
        </ThemedView>
        {deadline.publishers &&
          deadline.publishers.length > 0 &&
          deadline.publishers.map((publisher, index) => (
            <ThemedView
              key={index}
              style={[
                styles.detailRow,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outline + '50',
                },
              ]}
            >
              <ThemedText variant="secondary">
                {index === 0 ? 'Publisher' : `Publisher ${index + 1}`}
              </ThemedText>
              <ThemedText typography="bodyLarge" style={styles.detailsValue}>
                {publisher}
              </ThemedText>
            </ThemedView>
          ))}
        <ThemedView
          style={[
            styles.detailRow,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outline + '50',
            },
          ]}
        >
          <ThemedText variant="secondary">Format</ThemedText>
          <ThemedText typography="bodyLarge" style={styles.detailsValue}>
            {deadline.format.toLowerCase() === 'ebook'
              ? 'eBook'
              : makeUpperCaseFirstLetter(deadline.format)}
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={[
            styles.detailRow,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outline + '50',
            },
          ]}
        >
          <ThemedText variant="secondary">Priority</ThemedText>
          <ThemedText typography="bodyLarge" style={styles.detailsValue}>
            {makeUpperCaseFirstLetter(deadline.flexibility)}
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={[
            styles.detailRow,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outline + '50',
            },
          ]}
        >
          <ThemedText variant="secondary">Type</ThemedText>
          <ThemedText typography="bodyLarge" style={styles.detailsValue}>
            {deadline.type ? makeUpperCaseFirstLetter(deadline.type) : ''}
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={[
            styles.detailRow,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outline + '50',
            },
          ]}
        >
          <ThemedText variant="secondary">Deadline</ThemedText>
          <ThemedText typography="bodyLarge" style={styles.detailsValue}>
            {dayjs(deadline.deadline_date).format('MMMM D, YYYY')}
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={[
            styles.detailRow,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outline + '50',
            },
          ]}
        >
          <ThemedText variant="secondary">Added</ThemedText>
          <ThemedText typography="bodyLarge" style={styles.detailsValue}>
            {dayjs(deadline.created_at || '').format('MMMM D, YYYY')}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

export default BookDetailsSection;

const styles = StyleSheet.create({
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  detailsGrid: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  detailsValue: {
    fontWeight: '600',
  },
});
