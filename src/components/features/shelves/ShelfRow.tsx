import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/themed/ThemedText';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { SystemShelf } from '@/types/shelves.types';
import { Pressable, StyleSheet, View } from 'react-native';

interface ShelfRowProps {
  shelf: SystemShelf;
  count: number;
  isSelected: boolean;
  isPinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}

export function ShelfRow({
  shelf,
  count,
  isSelected,
  isPinned,
  onSelect,
  onTogglePin,
}: ShelfRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? `${colors.primary}26` : 'transparent',
          borderWidth: isSelected ? 1 : 0,
          borderColor: isSelected ? `${colors.primary}4D` : 'transparent',
        },
      ]}
      onPress={onSelect}
    >
      <View style={styles.leftContent}>
        <IconSymbol
          name={shelf.icon as IconSymbolName}
          size={20}
          color={isSelected ? colors.primary : colors.text}
        />
        <ThemedText
          typography="bodyLarge"
          color={isSelected ? 'primary' : 'text'}
        >
          {shelf.name}
        </ThemedText>
      </View>

      <View style={styles.rightContent}>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: count > 0 ? `${colors.primary}33` : colors.disabled,
            },
          ]}
        >
          <ThemedText
            typography="bodySmall"
            color={count > 0 ? 'primary' : 'textMuted'}
          >
            {count}
          </ThemedText>
        </View>

        <Pressable
          style={styles.pinButton}
          onPress={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name={isPinned ? 'pin.fill' : 'pin'}
            size={18}
            color={isPinned ? colors.primary : colors.textMuted}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.sm,
    marginVertical: 2,
    borderRadius: BorderRadius.lg,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countBadge: {
    minWidth: 28,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinButton: {
    transform: [{ rotate: '45deg' }],
    padding: Spacing.xs,
  },
});
