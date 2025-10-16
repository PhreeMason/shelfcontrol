import Checkbox from '@/components/shared/Checkbox';
import { ThemedButton, ThemedScrollView, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { initializeModalState, prepareModalUpdates } from '@/utils/postReviewModalUtils';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';

interface Platform {
  id: string;
  platform_name: string;
  posted: boolean;
  posted_date: string | null;
  review_url: string | null;
}

interface PostReviewModalProps {
  visible: boolean;
  platforms: Platform[];
  onClose: () => void;
  onSave: (updates: { id: string; posted: boolean; review_url?: string }[]) => void;
}

const PostReviewModal: React.FC<PostReviewModalProps> = ({
  visible,
  platforms,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set());
  const [needsLinkSubmission, setNeedsLinkSubmission] = useState(false);
  const [platformUrls, setPlatformUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const state = initializeModalState(platforms, visible);
    if (state) {
      setSelectedPlatformIds(state.selectedPlatformIds);
      setPlatformUrls(state.platformUrls);
      setNeedsLinkSubmission(state.needsLinkSubmission);
    }
  }, [visible, platforms]);

  const handleReset = () => {
    setSelectedPlatformIds(new Set());
    setNeedsLinkSubmission(false);
    setPlatformUrls({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const togglePlatform = (platformId: string) => {
    const newSelected = new Set(selectedPlatformIds);
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId);
      const newUrls = { ...platformUrls };
      delete newUrls[platformId];
      setPlatformUrls(newUrls);
    } else {
      newSelected.add(platformId);
    }
    setSelectedPlatformIds(newSelected);
  };

  const handleUrlChange = (platformId: string, url: string) => {
    setPlatformUrls(prev => ({
      ...prev,
      [platformId]: url,
    }));
  };

  const handleSave = () => {
    const updates = prepareModalUpdates(
      selectedPlatformIds,
      needsLinkSubmission,
      platformUrls
    );

    onSave(updates);
    handleReset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <ThemedView style={styles.modal}>
          <ThemedText variant="title" style={styles.title}>
            Post Review
          </ThemedText>

          <ThemedScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <ThemedText variant="secondary" style={styles.subtitle}>
              Select where you posted:
            </ThemedText>

            <View style={styles.platformList}>
              {platforms.map(platform => (
                <View key={platform.id} style={styles.platformRow}>
                  <Checkbox
                    checked={selectedPlatformIds.has(platform.id)}
                    onToggle={() => togglePlatform(platform.id)}
                    label={platform.platform_name}
                  />
                  {platform.posted && (
                    <ThemedText style={styles.alreadyPosted}>(Posted)</ThemedText>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.linkSubmissionRow}>
              <Checkbox
                checked={needsLinkSubmission}
                onToggle={() => setNeedsLinkSubmission(!needsLinkSubmission)}
                label="I need to submit review links"
              />
            </View>

            {needsLinkSubmission && selectedPlatformIds.size > 0 && (
              <View style={styles.urlInputsContainer}>
                <ThemedText variant="secondary" style={styles.urlSectionTitle}>
                  Review Links
                </ThemedText>
                {Array.from(selectedPlatformIds).map(platformId => {
                  const platform = platforms.find(p => p.id === platformId);
                  if (!platform) return null;

                  return (
                    <View key={platformId} style={styles.urlInputGroup}>
                      <ThemedText style={styles.urlInputLabel}>
                        {platform.platform_name}
                      </ThemedText>
                      <TextInput
                        placeholder="https://..."
                        placeholderTextColor={colors.textMuted}
                        value={platformUrls[platformId] || ''}
                        onChangeText={(text: string) => handleUrlChange(platformId, text)}
                        keyboardType="url"
                        autoCapitalize="none"
                        style={styles.urlInput}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </ThemedScrollView>

          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Cancel"
              variant="outline"
              onPress={handleClose}
              testID="cancel-button"
            />
            <ThemedButton
              title="Save"
              variant="primary"
              onPress={handleSave}
              disabled={selectedPlatformIds.size === 0}
              testID="save-button"
            />
          </View>
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
  modal: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  content: {
    maxHeight: 400,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  platformList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  alreadyPosted: {
    fontSize: 12,
    color: Colors.light.success,
  },
  linkSubmissionRow: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  urlInputsContainer: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  urlSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  urlInputGroup: {
    gap: Spacing.xs,
  },
  urlInputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  urlInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    height: 36,
    fontSize: 12,
    color: Colors.light.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});

export default PostReviewModal;
