import Checkbox from '@/components/shared/Checkbox';
import { ThemedButton, ThemedText } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import {
  initializeModalState,
  prepareModalUpdates,
} from '@/utils/postReviewModalUtils';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  onSave: (
    updates: { id: string; posted: boolean; review_url?: string }[]
  ) => void;
}

const PostReviewModal: React.FC<PostReviewModalProps> = ({
  visible,
  platforms,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(500, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  useEffect(() => {
    const state = initializeModalState(platforms, visible);
    if (state) {
      setSelectedPlatformIds(state.selectedPlatformIds);
    }
  }, [visible, platforms]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleReset = () => {
    setSelectedPlatformIds(new Set());
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const togglePlatform = (platformId: string) => {
    const newSelected = new Set(selectedPlatformIds);
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId);
    } else {
      newSelected.add(platformId);
    }
    setSelectedPlatformIds(newSelected);
  };

  const handleSave = () => {
    const updates = prepareModalUpdates(selectedPlatformIds);

    onSave(updates);
    handleReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleClose}
        accessibilityLabel="Close action sheet"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
            },
            animatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          <ThemedText typography="titleSubLarge" style={styles.title}>
            Mark as Posted
          </ThemedText>

          <ThemedText typography="bodyMedium" color="textSecondary" style={styles.subtitle}>
            Select platforms posted
          </ThemedText>

          <View style={styles.content}>
            <View style={styles.platformList}>
              {platforms.map(platform => {
                const isSelected = selectedPlatformIds.has(platform.id);
                return (
                  <View
                    key={platform.id}
                    style={[
                      styles.platformRow,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                      isSelected && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Checkbox
                      checked={isSelected}
                      onToggle={() => togglePlatform(platform.id)}
                      label={platform.platform_name}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Cancel"
              variant="outline"
              onPress={handleClose}
              testID="cancel-button"
              style={styles.button}
            />
            <ThemedButton
              title="Save"
              variant="primary"
              onPress={handleSave}
              disabled={selectedPlatformIds.size === 0}
              testID="save-button"
              style={styles.button}
            />
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  content: {},
  platformList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    flex: 1,
  },
});

export default PostReviewModal;
