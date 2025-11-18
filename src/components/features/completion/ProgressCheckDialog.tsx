import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
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
  const { colors } = useTheme();
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
          <ThemedView
            style={[styles.dialog, { backgroundColor: colors.surface }]}
          >
            <ThemedText typography="titleSubLarge" style={styles.title}>
              Did you finish all {formatProgressDisplay(format, totalPages)}?
            </ThemedText>

            <ThemedText
              variant="default"
              color="textSecondary"
              style={styles.subtitle}
            >
              You're currently at{' '}
              {formatProgressDisplay(format, currentProgress)}/
              {formatProgressDisplay(format, totalPages)}.
            </ThemedText>

            <ThemedView style={styles.buttonContainer}>
              <Pressable
                onPress={() => setSelectedOption('finished')}
                style={[
                  styles.selectionButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                  selectedOption === 'finished' && {
                    backgroundColor: colors.primaryContainer,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <ThemedText
                  typography="titleMedium"
                  style={[
                    styles.selectionButtonText,
                    selectedOption === 'finished' && { color: colors.primary },
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
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                  selectedOption === 'dnf' && {
                    backgroundColor: colors.primaryContainer,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <ThemedText
                  typography="titleMedium"
                  style={[
                    styles.selectionButtonText,
                    selectedOption === 'dnf' && { color: colors.primary },
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 480,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
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
  },
  selectionButtonText: {
    textAlign: 'center',
  },
  confirmationContainer: {
    marginTop: Spacing.lg,
  },
  button: {
    width: '100%',
  },
});

export default ProgressCheckDialog;
