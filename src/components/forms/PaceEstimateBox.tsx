import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { UrgencyLevel } from '@/types/deadline.types';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

interface PaceEstimateBoxProps {
  paceEstimate: string;
  urgencyLevel?: UrgencyLevel;
}

export const PaceEstimateBox: React.FC<PaceEstimateBoxProps> = ({
  paceEstimate,
  urgencyLevel,
}) => {
  const { colors } = useTheme();
  const isOverdue = paceEstimate.includes('passed');

  // Get gradient colors based on urgency level (using theme colors)
  const getGradientColors = (): [string, string] => {
    // If urgencyLevel is provided, use it; otherwise fall back to isOverdue check
    const effectiveLevel = urgencyLevel ?? (isOverdue ? 'overdue' : 'good');

    switch (effectiveLevel) {
      case 'overdue':
      case 'impossible':
        // Gentle gray for overdue/impossible - not alarming
        return [colors.textMuted, colors.pending];
      case 'approaching':
      case 'urgent':
        // Approaching deadline - needs attention
        return [colors.approaching, `${colors.approaching}CC`];
      case 'good':
      default:
        // On track - primary colors
        return [colors.outline, colors.primary];
    }
  };

  // Get border color based on urgency level (using theme colors)
  const getBorderColor = (): string => {
    const effectiveLevel = urgencyLevel ?? (isOverdue ? 'overdue' : 'good');

    switch (effectiveLevel) {
      case 'overdue':
      case 'impossible':
        return colors.pending;
      case 'approaching':
      case 'urgent':
        return colors.approaching;
      case 'good':
      default:
        return colors.primary;
    }
  };

  if (!paceEstimate) return null;

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.estimateContainer,
        {
          borderColor: getBorderColor(),
        },
      ]}
    >
      <ThemedText
        typography={isOverdue ? 'titleSubLarge' : 'headlineMedium'}
        color="textOnPrimary"
      >
        {paceEstimate}
      </ThemedText>
      {!isOverdue && (
        <ThemedText typography="bodyMedium" color="textOnPrimary">
          to finish on time
        </ThemedText>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  estimateContainer: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xl,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
});
