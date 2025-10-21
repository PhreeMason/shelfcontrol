import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';

interface ProgressCheckDialogProps {
  visible: boolean;
  totalPages: number;
  currentProgress: number;
  format: 'physical' | 'eBook' | 'audio';
  onMarkAllPages: () => void;
  onDidNotFinish: () => void;
  onClose: () => void;
}

const ProgressCheckDialog: React.FC<ProgressCheckDialogProps> = ({
  visible,
  totalPages,
  currentProgress,
  format,
  onMarkAllPages,
  onDidNotFinish,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<
    'finished' | 'dnf' | null
  >(null);
  const isAudiobook = format === 'audio';

  const handleConfirm = () => {
    if (selectedOption === 'finished') {
      onMarkAllPages();
    } else if (selectedOption === 'dnf') {
      onDidNotFinish();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation()}>
          <ThemedView style={styles.dialog}>
            <ThemedText variant="title" style={styles.title}>
              Did you finish all {formatProgressDisplay(format, totalPages)}?
            </ThemedText>

            <ThemedText variant="default" style={styles.subtitle}>
              You're currently at{' '}
              {formatProgressDisplay(format, currentProgress)}/
              {formatProgressDisplay(format, totalPages)}.
            </ThemedText>

            <ThemedView style={styles.buttonContainer}>
              <Pressable
                onPress={() => setSelectedOption('finished')}
                style={[
                  styles.selectionButton,
                  selectedOption === 'finished' &&
                    styles.selectionButtonSelected,
                ]}
              >
                <ThemedText
                  style={[
                    styles.selectionButtonText,
                    selectedOption === 'finished' &&
                      styles.selectionButtonTextSelected,
                  ]}
                >
                  {isAudiobook
                    ? 'Yes, mark all time as listened'
                    : 'Yes, mark all pages as read'}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setSelectedOption('dnf')}
                style={[
                  styles.selectionButton,
                  selectedOption === 'dnf' && styles.selectionButtonSelected,
                ]}
              >
                <ThemedText
                  style={[
                    styles.selectionButtonText,
                    selectedOption === 'dnf' &&
                      styles.selectionButtonTextSelected,
                  ]}
                >
                  No, I didn't finish everything
                </ThemedText>
              </Pressable>
            </ThemedView>

            {selectedOption && (
              <ThemedView style={styles.confirmationContainer}>
                <ThemedButton
                  title={
                    selectedOption === 'finished'
                      ? 'Mark Complete'
                      : 'Mark as DNF'
                  }
                  variant="primary"
                  onPress={handleConfirm}
                  style={styles.button}
                />
              </ThemedView>
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
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 480,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  selectionButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  selectionButtonSelected: {
    backgroundColor: Colors.light.primary + '20',
    borderColor: Colors.light.primary,
  },
  selectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  selectionButtonTextSelected: {
    color: Colors.light.darkPurple,
  },
  confirmationContainer: {
    marginTop: Spacing.lg,
  },
  button: {
    width: '100%',
  },
});

export default ProgressCheckDialog;
