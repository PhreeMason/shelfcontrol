import { BorderRadius, Colors, Typography } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface CustomToastProps {
  text1?: string;
  text2?: string;
  onHide?: () => void;
  props?: any;
}

const CustomToast = ({
  text1,
  text2,
  onHide,
  gradientColors,
  iconGradientColors,
  icon,
}: CustomToastProps & {
  gradientColors: readonly [string, string];
  iconGradientColors: readonly [string, string];
  icon: string;
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.background]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.toastContainer}
      >
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={iconGradientColors}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.iconContainer}
          >
            <Text style={styles.icon}>{icon}</Text>
          </LinearGradient>

          <View style={styles.messageContainer}>
            {text1 && (
              <Text style={[styles.text1, { color: colors.text }]}>{text1}</Text>
            )}
            {text2 && (
              <Text style={[styles.text2, { color: colors.textSecondary }]}>{text2}</Text>
            )}
          </View>

          <Pressable
            onPress={onHide}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { backgroundColor: colors.pressed }
            ]}
          >
            <Text style={[styles.closeText, { color: colors.textMuted }]}>×</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
};

const CustomToastWithAction = ({
  text1,
  text2,
  gradientColors,
  iconGradientColors,
  icon,
  actionText,
  onActionPress,
}: CustomToastProps & {
  gradientColors: readonly [string, string];
  iconGradientColors: readonly [string, string];
  icon: string;
  actionText?: string;
  onActionPress?: () => void;
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, gradientColors[0]]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.toastContainer}
      >
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={iconGradientColors}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.iconContainer}
          >
            <Text style={styles.icon}>{icon}</Text>
          </LinearGradient>

          <View style={styles.messageContainer}>
            {text1 && (
              <Text style={[styles.text1, { color: colors.text }]}>{text1}</Text>
            )}
            {text2 && (
              <Text style={[styles.text2, { color: colors.textSecondary }]}>{text2}</Text>
            )}
          </View>

          {actionText && (
            <Pressable
              onPress={onActionPress}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.8 }
              ]}
            >
              <LinearGradient
                colors={iconGradientColors}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>{actionText}</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const SuccessToast = (props: CustomToastProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <CustomToast
      {...props}
      gradientColors={[colors.success, "#FAF8F5"] as const}
      iconGradientColors={[colors.success, colors.peach] as const}
      icon="✓"
    />
  );
};

const ErrorToast = (props: CustomToastProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <CustomToast
      {...props}
      gradientColors={[colors.error, "#FAF8F5"] as const}
      iconGradientColors={[colors.error, colors.darkPink] as const}
      icon="!"
    />
  );
};

const InfoToast = (props: CustomToastProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <CustomToast
      {...props}
      gradientColors={[colors.info, "#FAF8F5"] as const}
      iconGradientColors={[colors.info, colors.warning] as const}
      icon="i"
    />
  );
};

const WarningToast = (props: CustomToastProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <CustomToast
      {...props}
      gradientColors={[colors.orange,"#FAF8F5"] as const}
      iconGradientColors={[colors.orange, colors.warning] as const}
      icon="⚠"
    />
  );
};

const SuccessWithActionToast = (props: CustomToastProps & { actionText?: string; onActionPress?: () => void }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <CustomToastWithAction
      {...props}
      gradientColors={[colors.success, "#FAF8F5"] as const}
      iconGradientColors={[colors.success, colors.peach] as const}
      icon="✓"
    />
  );
};

const InfoWithActionToast = (props: CustomToastProps & { actionText?: string; onActionPress?: () => void }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <CustomToastWithAction
      {...props}
      gradientColors={[colors.info, "#FAF8F5"] as const}
      iconGradientColors={[colors.info, colors.warning] as const}
      icon="↻"
    />
  );
};

export const toastConfig = {
  success: SuccessToast,
  error: ErrorToast,
  info: InfoToast,
  warning: WarningToast,
  successWithAction: SuccessWithActionToast,
  infoWithAction: InfoWithActionToast,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius.xxl, // 24px
    borderWidth: 1,
    borderColor: 'rgba(184, 169, 217, 0.2)',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  messageContainer: {
    flex: 1,
  },
  text1: {
    ...Typography.labelLarge,
    fontWeight: '500',
    lineHeight: 20,
  },
  text2: {
    ...Typography.bodySmall,
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '300',
  },
  actionButton: {
    marginLeft: 8,
  },
  actionButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
  },
  actionButtonText: {
    ...Typography.labelMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});