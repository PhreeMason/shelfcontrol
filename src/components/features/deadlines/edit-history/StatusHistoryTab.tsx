import { ThemedText, ThemedView } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useUpdateStatusTimestamp } from '@/hooks/useDeadlines';
import { ReadingDeadlineStatus } from '@/types/deadline.types';
import { formatStatus } from '@/utils/formatters';
import { ScrollView, StyleSheet } from 'react-native';
import { EditableHistoryRow } from './EditableHistoryRow';

interface StatusHistoryTabProps {
  deadlineId: string;
  status: ReadingDeadlineStatus[];
}

export const StatusHistoryTab = ({
  deadlineId,
  status,
}: StatusHistoryTabProps) => {
  const updateTimestamp = useUpdateStatusTimestamp();

  // Sort by created_at descending (newest first)
  const sortedStatus = [...status].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleTimestampChange = (statusId: string, newTimestamp: string) => {
    updateTimestamp.mutate({
      statusId,
      deadlineId,
      newCreatedAt: newTimestamp,
    });
  };

  if (sortedStatus.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText color="textSecondary">No status history yet</ThemedText>
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
        Tap a record to edit when the status changed
      </ThemedText>

      {sortedStatus.map((record, index) => {
        const isLatest = index === 0;
        const label = formatStatus(record.status ?? 'unknown');
        const sublabel = isLatest ? 'Current status' : null;

        return (
          <EditableHistoryRow
            key={record.id}
            id={record.id}
            label={label}
            sublabel={sublabel}
            timestamp={record.created_at ?? ''}
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
