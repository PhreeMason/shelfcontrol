import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { SYSTEM_SHELVES, sortShelfIds } from '@/constants/shelves';
import { useTheme } from '@/hooks/useThemeColor';
import { useShelf } from '@/providers/ShelfProvider';
import { SystemShelfId } from '@/types/shelves.types';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShelfRow } from './ShelfRow';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

interface ShelvesPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function ShelvesPanel({ visible, onClose }: ShelvesPanelProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedShelf, selectShelf, pinnedShelves, toggleShelfPin, shelfCounts } =
    useShelf();

  const translateX = useSharedValue(-PANEL_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const createButtonScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = withSpring(-PANEL_WIDTH, SPRING_CONFIG);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateX, backdropOpacity]);

  const handleClose = useCallback(() => {
    translateX.value = withSpring(-PANEL_WIDTH, SPRING_CONFIG);
    backdropOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 200);
  }, [onClose, translateX, backdropOpacity]);

  const handleSelectShelf = useCallback(
    (shelfId: SystemShelfId) => {
      selectShelf(shelfId);
      handleClose();
    },
    [selectShelf, handleClose]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swiping left to close
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      // If swiped more than 1/3 of panel width, close
      if (event.translationX < -PANEL_WIDTH / 3 || event.velocityX < -500) {
        runOnJS(handleClose)();
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const createButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createButtonScale.value }],
  }));

  const handleCreateButtonPress = useCallback(() => {
    createButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
    // Phase 2: Will open create shelf modal
  }, [createButtonScale]);

  // Get visible shelves (filter out conditional shelves with 0 count)
  const visibleShelves = SYSTEM_SHELVES.filter(
    (shelf) => !shelf.isConditional || shelfCounts[shelf.id] > 0
  );

  // Sort pinned shelves by fixed order
  const sortedPinnedShelves = sortShelfIds(pinnedShelves);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Panel */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.panel,
              { width: PANEL_WIDTH },
              panelStyle,
            ]}
          >
            <LinearGradient
              colors={[colors.cardEmptyState, colors.surface]}
              style={styles.panelGradient}
            >
              {/* Header */}
              <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <View style={styles.headerContent}>
                  <ThemedText typography="titleLarge">Your Shelves</ThemedText>
                  <ThemedText typography="bodySmall" color="secondary">
                    {shelfCounts.all} books tracked
                  </ThemedText>
                </View>
                <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}33` }]}>
                  <IconSymbol name="heart" size={16} color={colors.primary} />
                </View>
              </View>

              {/* Gradient Divider */}
              <LinearGradient
                colors={['transparent', colors.accent, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.divider}
              />

              {/* Shelf List */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <LinearGradient
                  colors={[colors.backgroundAccent, colors.backgroundPrimary]}
                  style={{ flex: 1 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >

                  {/* Section Label */}
                  <ThemedText typography="labelSmall" color="textOnPrimary" style={styles.sectionLabel}>
                    READING STATUS
                  </ThemedText>

                  {visibleShelves.map((shelf) => (
                    <ShelfRow
                      key={shelf.id}
                      shelf={shelf}
                      count={shelfCounts[shelf.id]}
                      isSelected={selectedShelf === shelf.id}
                      isPinned={sortedPinnedShelves.includes(shelf.id)}
                      onSelect={() => handleSelectShelf(shelf.id)}
                      onTogglePin={() => toggleShelfPin(shelf.id)}
                    />
                  ))}

                  {/* Custom Shelves Section */}
                  <LinearGradient
                    colors={['transparent', colors.accent, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.divider, styles.sectionDivider]}
                  />

                  <ThemedText typography="labelSmall" color="textOnPrimary" style={styles.sectionLabel}>
                    YOUR SHELVES
                  </ThemedText>

                  <ThemedText typography="bodyMedium" color="textOnPrimary" style={styles.emptyState}>
                    No custom shelves yet
                  </ThemedText>
                </LinearGradient>

              </ScrollView>

              {/* Create Button */}
              {/* <View style={styles.createButtonContainer}>
                <Animated.View style={createButtonAnimatedStyle}>
                  <Pressable style={styles.createButton} onPress={handleCreateButtonPress}>
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.createButtonGradient}
                    >
                      <ThemedText typography="titleMedium" color="textInverse">
                        + Create New Shelf
                      </ThemedText>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </View> */}
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  panelGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  sectionDivider: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingBottom: 80, // Space for FAB
  },
  emptyState: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontStyle: 'italic',
  },
  createButtonContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md
  },
  createButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.themed.primary,
  },
  createButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
