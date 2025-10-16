import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import React from 'react';
import { Modal, StyleSheet } from 'react-native';

interface ProgressCheckDialogProps {
  visible: boolean;
  onMarkAllPages: () => void;
  onDidNotFinish: () => void;
}

const ProgressCheckDialog: React.FC<ProgressCheckDialogProps> = ({
  visible,
  onMarkAllPages,
  onDidNotFinish,
}) => {
  const { flowState } = useCompletionFlow();

  if (!flowState) return null;

  const { bookData } = flowState;
  const { currentProgress, totalPages } = bookData;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <ThemedView style={styles.backdrop}>
        <ThemedView style={styles.dialog}>
          <ThemedText variant="title" style={styles.title}>
            Did you finish all {totalPages} pages?
          </ThemedText>

          <ThemedText variant="secondary" style={styles.subtitle}>
            You're currently at {currentProgress}/{totalPages} pages.
          </ThemedText>

          <ThemedView style={styles.buttonContainer}>
            <ThemedButton
              title="Yes, mark all pages as read"
              variant="primary"
              onPress={onMarkAllPages}
              style={styles.button}
            />
            <ThemedButton
              title="No, I didn't finish everything"
              variant="outline"
              onPress={onDidNotFinish}
              style={styles.button}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
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
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 480,
  },
  title: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});

export default ProgressCheckDialog;
