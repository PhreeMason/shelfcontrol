import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import React from 'react';
import { Modal, StyleSheet } from 'react-native';

interface DNFConfirmationDialogProps {
  visible: boolean;
  onMoveToDNF: () => void;
  onGoBack: () => void;
}

const DNFConfirmationDialog: React.FC<DNFConfirmationDialogProps> = ({
  visible,
  onMoveToDNF,
  onGoBack,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onGoBack}
    >
      <ThemedView style={styles.backdrop}>
        <ThemedView style={styles.dialog}>
          <ThemedText variant="title" style={styles.title}>
            Mark as Did Not Finish?
          </ThemedText>

          <ThemedText variant="secondary" style={styles.text}>
            This will move the book to your DNF list. You can still add review notes
            if needed.
          </ThemedText>

          <ThemedView style={styles.buttonContainer}>
            <ThemedButton
              title="Move to DNF"
              variant="dangerOutline"
              onPress={onMoveToDNF}
              style={styles.button}
            />
            <ThemedButton
              title="Go Back"
              variant="outline"
              onPress={onGoBack}
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
  text: {
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

export default DNFConfirmationDialog;
