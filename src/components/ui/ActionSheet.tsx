import { IconSymbol } from '@/components/ui/IconSymbol';
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
              paddingBottom: insets.bottom + 16,
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
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.cancelButton, { marginTop: 8 }]}
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  titleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    opacity: 0.6,
  },
  option: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
  },
  checkmark: {
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
