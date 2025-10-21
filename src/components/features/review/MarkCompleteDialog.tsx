import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
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
  onComplete: () => void;
  onCancel: () => void;
}

const MarkCompleteDialog: React.FC<MarkCompleteDialogProps> = ({
  visible,
  platforms,
  onComplete,
  onCancel,
}) => {
  const unpostedPlatforms = platforms.filter(p => !p.posted);
  const allPosted = unpostedPlatforms.length === 0;

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
                <ThemedText variant="title" style={styles.title}>
                  All reviews posted!
                </ThemedText>
                <ThemedText variant="secondary" style={styles.message}>
                  Move this book to Completed?
                </ThemedText>
                <View style={styles.buttonContainer}>
                  <ThemedButton
                    title="Not Yet"
                    variant="outline"
                    onPress={onCancel}
                  />
                  <ThemedButton
                    title="Yes, Complete It →"
                    variant="primary"
                    onPress={onComplete}
                  />
                </View>
              </>
            ) : (
              <>
                <ThemedText variant="title" style={styles.title}>
                  Just checking
                </ThemedText>
                <ThemedText variant="secondary" style={styles.message}>
                  These platforms don't{'\n'}have checkmarks yet:
                </ThemedText>
                <View style={styles.platformList}>
                  {unpostedPlatforms.map(platform => (
                    <ThemedView key={platform.id} style={styles.platformCard}>
                      <ThemedText style={styles.platformItem}>
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
                      borderColor: Colors.light.primary,
                    }}
                    variant="outline"
                    onPress={onCancel}
                  />
                  <ThemedButton
                    title="That's okay, mark complete"
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
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.light.textSecondary,
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
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '20',
  },
  platformItem: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'left',
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});

export default MarkCompleteDialog;
