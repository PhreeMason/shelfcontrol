import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme, useThemedStyles } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Informational component explaining how reading pace is calculated
 *
 * Displays a static explanation of the 14-day rolling window calculation
 * used to determine a user's average reading pace.
 *
 * @example
 * ```tsx
 * <PaceCalculationInfo />
 * ```
 */
const PaceCalculationInfoComponent = () => {
  const { colors } = useTheme();

  const infoStyles = useThemedStyles(theme => ({
    section: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 20,
      marginBottom: 20,
    },
    infoText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
  }));

  return (
    <ThemedView style={infoStyles.section}>
      <View style={[styles.header, { justifyContent: 'flex-start' }]}>
        <IconSymbol name="info.circle.fill" size={24} color={colors.icon} />
        <ThemedText style={styles.title}>How Pace is Calculated</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText style={infoStyles.infoText}>
          Your reading pace is based on the average pages read per day within
          the last 14 days starting from your most recent logged day.
        </ThemedText>
        <ThemedText style={infoStyles.infoText}>
          If today is December 25th and the last progress update was December
          15th, your pace is calculated based on your average from December 2nd
          - December 15th.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

/**
 * Memoized version of PaceCalculationInfo
 * This component has no props and renders static content, so it never needs to re-render
 */
export const PaceCalculationInfo = React.memo(PaceCalculationInfoComponent);
PaceCalculationInfo.displayName = 'PaceCalculationInfo';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '600',
  },
  content: {
    gap: 12,
  },
});
