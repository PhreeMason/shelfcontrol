import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { SystemShelf } from '@/types/shelves.types';
import { OPACITY } from '@/utils/formatters';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

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
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? colors.primary : 'transparent',
        },
      ]}
      onPress={onSelect}
    >
      <View style={styles.leftContent}>
        <IconSymbol
          name={shelf.icon as IconSymbolName}
          size={shelf.id === 'withdrew' && Platform.OS === 'ios' ? 18 : 20}
          color={isSelected ? colors.primary : colors.text}
        />
        <ThemedText
          typography="bodyLarge"
          color={isSelected ? 'primary' : 'text'}
        >
          {shelf.name}
          {' '}

        </ThemedText>
          <ThemedText
            typography="labelLarge"
            color='darkPurple'
            style={{ 
              backgroundColor: colors.primary + OPACITY.SUBTLE, 
              borderRadius: BorderRadius.full,
              paddingHorizontal: Spacing.xs,
              paddingVertical: Spacing.xs
            }}
          >
            {count}
          </ThemedText>
      </View>

      <View style={styles.rightContent}>

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
            color={isPinned ? colors.urgent : colors.textMuted}
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
  pinButton: {
    transform: [{ rotate: '45deg' }],
    padding: Spacing.xs,
  },
});
