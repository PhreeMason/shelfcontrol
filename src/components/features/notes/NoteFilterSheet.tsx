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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(1000);

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
            {
              backgroundColor: colors.surface,
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
              <ThemedText style={styles.title}>Filter Notes</ThemedText>
              <View style={styles.headerActions}>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearAllFilters}>
                    <ThemedText style={styles.clearButton}>
                      Clear All
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleDone}>
                  <ThemedText style={styles.doneButton}>Done</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Hashtags</ThemedText>
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

          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <ThemedButton
              title="CANCEL"
              onPress={onClose}
              variant="ghost"
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  clearButton: {
    fontSize: 16,
    color: '#666',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
