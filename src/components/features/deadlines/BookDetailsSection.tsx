import { ThemedText, ThemedView } from '@/components/themed';
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
  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.sectionTitle}>
        <ThemedText variant="title">Book Details</ThemedText>
      </ThemedView>

      <ThemedView style={styles.detailsGrid}>
        <ThemedView style={styles.detailRow}>
          <ThemedText variant="secondary" style={styles.detailLabel}>
            Author
          </ThemedText>
          <ThemedText style={styles.detailsValue}>
            {deadline.author || 'Unknown'}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.detailRow}>
          <ThemedText variant="secondary" style={styles.detailLabel}>
            Format
          </ThemedText>
          <ThemedText style={styles.detailsValue}>
            {makeUpperCaseFirstLetter(deadline.format)}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.detailRow}>
          <ThemedText variant="secondary" style={styles.detailLabel}>
            Priority
          </ThemedText>
          <ThemedText style={styles.detailsValue}>
            {makeUpperCaseFirstLetter(deadline.flexibility)}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.detailRow}>
          <ThemedText variant="secondary" style={styles.detailLabel}>
            Type
          </ThemedText>
          <ThemedText style={styles.detailsValue}>
            {makeUpperCaseFirstLetter(deadline.source)}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.detailRow}>
          <ThemedText variant="secondary" style={styles.detailLabel}>
            Added
          </ThemedText>
          <ThemedText style={styles.detailsValue}>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(232, 194, 185, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 194, 185, 0.1)',
  },
  detailLabel: {
    fontSize: 15,
  },
  detailsValue: {
    fontWeight: '600',
    fontSize: 15,
  },
});
