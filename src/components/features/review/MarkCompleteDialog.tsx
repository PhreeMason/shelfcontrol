import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ThemedView style={styles.dialog}>
          {allPosted ? (
            <>
              <ThemedText variant="title" style={styles.title}>
                All reviews posted! 🎉
              </ThemedText>
              <ThemedText variant="secondary" style={styles.message}>
                Move this book to Completed?
              </ThemedText>
              <View style={styles.buttonContainer}>
                <ThemedButton title="Not Yet" variant="outline" onPress={onCancel} />
                <ThemedButton title="Yes, Complete It →" variant="primary" onPress={onComplete} />
              </View>
            </>
          ) : (
            <>
              <ThemedText variant="title" style={styles.title}>
                Not All Reviews Posted
              </ThemedText>
              <ThemedText variant="secondary" style={styles.message}>
                You still need to post reviews on:
              </ThemedText>
              <View style={styles.platformList}>
                {unpostedPlatforms.map(platform => (
                  <ThemedText key={platform.id} style={styles.platformItem}>
                    • {platform.platform_name}
                  </ThemedText>
                ))}
              </View>
              <View style={styles.buttonContainer}>
                <ThemedButton title="Go Back" variant="outline" onPress={onCancel} />
                <ThemedButton title="Mark Complete Anyway" variant="primary" onPress={onComplete} />
              </View>
            </>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  platformList: {
    marginBottom: Spacing.lg,
    paddingLeft: Spacing.md,
  },
  platformItem: {
    fontSize: 14,
    marginVertical: Spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});

export default MarkCompleteDialog;
