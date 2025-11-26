import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { calculateProgress } from '@/utils/deadlineCore';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

interface Platform {
  id: string;
  platform_name: string;
  posted: boolean;
  posted_date: string | null;
  review_url: string | null;
}

interface MarkCompleteDialogProps {
  visible: boolean;
  platforms: Platform[];
  deadline: ReadingDeadlineWithProgress;
  onComplete: () => void;
  onCancel: () => void;
}

const MarkCompleteDialog: React.FC<MarkCompleteDialogProps> = ({
  visible,
  platforms,
  deadline,
  onComplete,
  onCancel,
}) => {
  const { colors } = useTheme();
  const unpostedPlatforms = platforms.filter(p => !p.posted);
  const allPosted = unpostedPlatforms.length === 0;

  // Calculate if the book was completed or DNF
  const currentProgress = calculateProgress(deadline);
  const totalQuantity = deadline.total_quantity || 0;
  const wasCompleted = currentProgress >= totalQuantity;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Outer Pressable closes modal on backdrop click, inner Pressable prevents dialog content clicks from bubbling up */}
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={e => e.stopPropagation()}>
          <ThemedView style={styles.dialog}>
            {allPosted ? (
              <>
                <ThemedText typography="headlineSmall" style={styles.title}>
                  {wasCompleted ? 'All reviews posted!' : 'Did Not Finish'}
                </ThemedText>
                <ThemedText
                  typography="bodyMedium"
                  color="textSecondary"
                  style={styles.message}
                >
                  {wasCompleted
                    ? 'Move this book to Completed?'
                    : 'Move this book to DNF?'}
                </ThemedText>
                <View style={styles.buttonContainer}>
                  <ThemedButton
                    title="Not Yet"
                    variant="outline"
                    onPress={onCancel}
                  />
                  <ThemedButton
                    title={
                      wasCompleted ? 'Yes, Complete It →' : 'Yes, Mark as DNF →'
                    }
                    variant="primary"
                    onPress={onComplete}
                  />
                </View>
              </>
            ) : (
              <>
                <ThemedText typography="headlineSmall" style={styles.title}>
                  Just checking
                </ThemedText>
                <ThemedText
                  typography="bodyMedium"
                  color="textSecondary"
                  style={styles.message}
                >
                  These platforms don't{'\n'}have checkmarks yet:
                </ThemedText>
                <View style={styles.platformList}>
                  {unpostedPlatforms.map(platform => (
                    <ThemedView
                      key={platform.id}
                      style={[
                        styles.platformCard,
                        {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '20',
                        },
                      ]}
                    >
                      <ThemedText
                        typography="titleMedium"
                        style={styles.platformItem}
                      >
                        {platform.platform_name}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </View>
                <View style={styles.buttonContainer}>
                  <ThemedButton
                    title="Go back and finish these"
                    textStyle={{ fontWeight: '700' }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                    }}
                    variant="outline"
                    onPress={onCancel}
                  />
                  <ThemedButton
                    title={
                      wasCompleted
                        ? "That's okay, mark complete"
                        : "That's okay, mark as DNF"
                    }
                    textStyle={{ fontWeight: '700' }}
                    variant="primary"
                    onPress={onComplete}
                  />
                </View>
              </>
            )}
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  title: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  platformList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  platformCard: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  platformItem: {
    fontWeight: '600',
    textAlign: 'left',
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});

export default MarkCompleteDialog;
