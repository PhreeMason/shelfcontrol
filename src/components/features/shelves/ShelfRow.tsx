import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import { SystemShelf } from '@/types/shelves.types';
import { OPACITY } from '@/utils/formatters';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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

  // Animation shared values
  const rowScale = useSharedValue(1);
  const pinScale = useSharedValue(1);

  // Row press animation style
  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
  }));

  // Pin animation style
  const pinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: '45deg' }, { scale: pinScale.value }],
  }));

  const handlePressIn = () => {
    rowScale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    rowScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePinPress = () => {
    pinScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
    onTogglePin();
  };

  return (
    <Animated.View style={rowAnimatedStyle}>
      <Pressable
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
              borderRadius: BorderRadius.sm,
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing.xs,
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
            handlePinPress();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View style={pinAnimatedStyle}>
            <IconSymbol
              name={isPinned ? 'pin.fill' : 'pin'}
              size={18}
              color={isPinned ? colors.urgent : colors.textMuted}
            />
          </Animated.View>
        </Pressable>
      </View>
    </Pressable>
    </Animated.View>
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
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    ...Shadows.subtle,
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
    padding: Spacing.xs,
  },
});
