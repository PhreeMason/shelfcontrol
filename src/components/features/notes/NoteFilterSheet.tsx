import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Hashtag } from '@/types/hashtags.types';
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NoteFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  hashtags: Hashtag[];
  selectedHashtagIds: string[];
  onHashtagsChange: (hashtagIds: string[]) => void;
  filteredCount: number;
}

export const NoteFilterSheet: React.FC<NoteFilterSheetProps> = ({
  visible,
  onClose,
  hashtags,
  selectedHashtagIds,
  onHashtagsChange,
  filteredCount,
}) => {
  const { colors, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(1000);

  const dynamicStyles = {
    sheet: {
      backgroundColor: colors.surface,
      borderColor: colors.borderVariant,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
    },
    footer: {
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
  };

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    } else {
      translateY.value = withSpring(1000, {
        damping: 20,
        stiffness: 90,
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const hasActiveFilters = selectedHashtagIds.length > 0;

  const clearAllFilters = () => {
    onHashtagsChange([]);
  };

  const toggleHashtag = (hashtagId: string) => {
    if (selectedHashtagIds.includes(hashtagId)) {
      onHashtagsChange(selectedHashtagIds.filter(id => id !== hashtagId));
    } else {
      onHashtagsChange([...selectedHashtagIds, hashtagId]);
    }
  };

  const handleDone = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close filter sheet"
      >
        <Animated.View
          style={[
            styles.sheet,
            dynamicStyles.sheet,
            {
              paddingBottom: insets.bottom + 16,
            },
            animatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.header}>
              <ThemedText typography="titleSubLarge">
                Hashtag Filters
              </ThemedText>
              <View style={styles.headerActions}>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearAllFilters}>
                    <ThemedText variant="default" color="textSecondary">
                      Clear All
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.pillContainer}>
                {hashtags.map(hashtag => {
                  const isSelected = selectedHashtagIds.includes(hashtag.id);
                  return (
                    <ThemedButton
                      key={hashtag.id}
                      title={`#${hashtag.name}`}
                      onPress={() => toggleHashtag(hashtag.id)}
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      style={[
                        styles.pill,
                        isSelected && {
                          backgroundColor: hashtag.color,
                          borderColor: hashtag.color,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, dynamicStyles.footer]}>
            <ThemedButton
              title="CANCEL"
              onPress={onClose}
              variant="outline"
              size="lg"
              style={styles.footerButton}
            />
            <ThemedButton
              title={`SHOW ${filteredCount} NOTE${filteredCount === 1 ? '' : 'S'}`}
              onPress={handleDone}
              variant="primary"
              size="lg"
              style={styles.footerButton}
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
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderWidth: 1,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  section: {
    marginBottom: 24,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 5,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    margin: 5,
  },
});
