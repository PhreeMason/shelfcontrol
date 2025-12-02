import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { getSystemShelf, sortShelfIds } from '@/constants/shelves';
import { useTheme } from '@/hooks/useThemeColor';
import { useShelf } from '@/providers/ShelfProvider';
import { SystemShelfId } from '@/types/shelves.types';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';

interface ShelfTabBarProps {
  onOpenPanel: () => void;
}

export function ShelfTabBar({ onOpenPanel }: ShelfTabBarProps) {
  const { colors } = useTheme();
  const { selectedShelf, selectShelf, pinnedShelves, shelfCounts } = useShelf();

  // Get pinned shelves in fixed order, filtered by visibility rules
  const visiblePinnedShelves = useMemo(
    () =>
      sortShelfIds(pinnedShelves).filter((shelfId) => {
        const shelf = getSystemShelf(shelfId);
        if (!shelf) return false;
        // Hide conditional shelves when count = 0
        if (shelf.isConditional && shelfCounts[shelfId] === 0) return false;
        return true;
      }),
    [pinnedShelves, shelfCounts]
  );

  const handleSelectShelf = useCallback(
    (shelfId: SystemShelfId) => {
      selectShelf(shelfId);
    },
    [selectShelf]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Menu button */}
      <Pressable
        style={[styles.menuButton, { borderColor: colors.border }]}
        onPress={onOpenPanel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <IconSymbol name="line.3.horizontal" size={20} color={colors.text} />
      </Pressable>

      {/* Tab scroll view */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visiblePinnedShelves.map((shelfId) => {
          const shelf = getSystemShelf(shelfId);
          if (!shelf) return null;

          const isSelected = selectedShelf === shelfId;

          return (
            <Pressable
              key={shelfId}
              style={[
                styles.tab,
                isSelected && [
                  styles.selectedTab,
                  { backgroundColor: colors.primary + '20' },
                ],
              ]}
              onPress={() => handleSelectShelf(shelfId)}
            >
              <ThemedText
                typography="labelLarge"
                color={isSelected ? 'primary' : 'textSecondary'}
              >
                {shelf.name}
              </ThemedText>
              <ThemedText
                typography="labelMedium"
                color={isSelected ? 'primary' : 'textMuted'}
              >
                ({shelfCounts[shelfId]})
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  scrollContent: {
    paddingRight: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  selectedTab: {
    borderRadius: BorderRadius.md,
  },
});
