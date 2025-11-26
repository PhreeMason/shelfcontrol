import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { StyleSheet, View } from 'react-native';
import { DeadlineCardActions } from './DeadlineCardActions';

interface DeadlineActionsSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DeadlineActionsSection = ({
  deadline,
}: DeadlineActionsSectionProps) => {
  return (
    <ThemedView style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <ThemedText variant="title">Quick Actions</ThemedText>
        </View>
      </View>

      <DeadlineCardActions deadline={deadline} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleColumn: {
    flex: 1,
  },
});
