import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
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
import { ThemedText } from '../themed/ThemedText';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
  selected?: boolean;
  icon?: string;
  iconColor?: string;
  showChevron?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
  title?: string;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  options,
  title,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(500, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleOptionPress = (option: ActionSheetOption) => {
    option.onPress();
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
        accessibilityLabel="Close action sheet"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.md,
            },
            animatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {title && (
            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>{title}</ThemedText>
            </View>
          )}

          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth:
                    index < options.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
              ]}
              onPress={() => handleOptionPress(option)}
            >
              {option.icon && (
                <IconSymbol
                  name={option.icon as any}
                  size={24}
                  color={option.iconColor || colors.text}
                  style={styles.optionIcon}
                />
              )}
              <ThemedText
                style={[
                  styles.optionText,
                  option.variant === 'destructive' && {
                    color: colors.error,
                  },
                  option.selected && {
                    fontWeight: '600',
                  },
                ]}
              >
                {option.label}
              </ThemedText>
              {option.selected && (
                <IconSymbol
                  name="checkmark"
                  size={20}
                  color={colors.primary}
                  style={styles.checkmark}
                />
              )}
              {option.showChevron && (
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.text}
                  style={styles.chevron}
                />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.cancelButton,
              { marginTop: Spacing.sm, borderColor: colors.border },
            ]}
            onPress={onClose}
          >
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
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
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  titleContainer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    opacity: 0.6,
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: Spacing.md,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    marginLeft: Spacing.sm,
  },
  chevron: {
    marginLeft: Spacing.sm,
    opacity: 0.5,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
