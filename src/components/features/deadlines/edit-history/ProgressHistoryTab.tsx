import { ThemedText, ThemedView } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useUpdateProgressTimestamp } from '@/hooks/useDeadlines';
import { ReadingDeadlineProgress } from '@/types/deadline.types';
import { ScrollView, StyleSheet } from 'react-native';
import { EditableHistoryRow } from './EditableHistoryRow';

interface ProgressHistoryTabProps {
  deadlineId: string;
  progress: ReadingDeadlineProgress[];
  format: 'physical' | 'eBook' | 'audio';
}

export const ProgressHistoryTab = ({
  deadlineId,
  progress,
  format,
}: ProgressHistoryTabProps) => {
  const updateTimestamp = useUpdateProgressTimestamp();

  const unit = format === 'audio' ? 'min' : 'pages';

  // Sort by created_at descending (newest first)
  const sortedProgress = [...progress].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleTimestampChange = (progressId: string, newTimestamp: string) => {
    updateTimestamp.mutate({
      progressId,
      deadlineId,
      newCreatedAt: newTimestamp,
    });
  };

  if (sortedProgress.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText color="textSecondary">No progress records yet</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText
        typography="bodySmall"
        color="textSecondary"
        style={styles.helpText}
      >
        Tap a record to edit when it was logged
      </ThemedText>

      {sortedProgress.map(record => {
        const isInitial = record.ignore_in_calcs;
        const label = `${record.current_progress} ${unit}`;
        const sublabel = isInitial
          ? 'Starting progress'
          : record.time_spent_reading
            ? `${record.time_spent_reading} min reading time`
            : null;

        return (
          <EditableHistoryRow
            key={record.id}
            id={record.id}
            label={label}
            sublabel={sublabel}
            timestamp={record.created_at}
            onTimestampChange={newTimestamp =>
              handleTimestampChange(record.id, newTimestamp)
            }
            isPending={updateTimestamp.isPending}
          />
        );
      })}
    </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  helpText: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
