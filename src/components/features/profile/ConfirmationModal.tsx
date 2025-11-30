import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  warningPoints?: string[];
  confirmButtonText?: string;
  isLoading?: boolean;
}

const CONFIRMATION_PHRASE = 'I understand';

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  warningPoints = [],
  confirmButtonText = 'Confirm',
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const [inputText, setInputText] = useState('');

  const isConfirmEnabled =
    inputText.toLowerCase().trim() === CONFIRMATION_PHRASE && !isLoading;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(500, { damping: 20, stiffness: 200 });
      // Reset input when modal closes
      setInputText('');
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm();
    }
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
        accessibilityLabel="Close confirmation dialog"
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
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.scaryRed + '20' },
              ]}
            >
              <IconSymbol
                name="exclamationmark.triangle"
                size={36}
                color={colors.scaryRed}
              />
            </View>

            <ThemedText typography="headlineSmall" style={styles.title}>
              {title}
            </ThemedText>
            <ThemedText typography="bodyLarge" style={styles.message}>
              {description}
            </ThemedText>

            {warningPoints.length > 0 && (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: colors.scaryRed + '15' },
                ]}
              >
                {warningPoints.map((point, index) => (
                  <ThemedText
                    key={index}
                    style={[styles.warningText, { color: colors.scaryRed }]}
                  >
                    • {point}
                  </ThemedText>
                ))}
              </View>
            )}

            <View style={styles.inputSection}>
              <ThemedText typography="labelLarge">
                Type "{CONFIRMATION_PHRASE}" to confirm:
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={CONFIRMATION_PHRASE}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                testID="confirmation-modal-input"
              />
            </View>

            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Cancel"
                variant="outline"
                style={styles.button}
                onPress={onClose}
                disabled={isLoading}
                testID="confirmation-modal-cancel-button"
              />
              <ThemedButton
                title={isLoading ? '' : confirmButtonText}
                variant="error"
                style={[
                  styles.button,
                  { backgroundColor: colors.scaryRed },
                  !isConfirmEnabled && styles.buttonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!isConfirmEnabled}
                testID="confirmation-modal-confirm-button"
              >
                {isLoading && (
                  <ActivityIndicator color={colors.surface} size="small" />
                )}
              </ThemedButton>
            </View>
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
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    gap: Spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  warningBox: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    ...Typography.bodyMedium,
  },
  inputSection: {
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyLarge,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
