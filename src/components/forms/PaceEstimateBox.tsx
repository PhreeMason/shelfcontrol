import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

interface PaceEstimateBoxProps {
  paceEstimate: string;
}

export const PaceEstimateBox: React.FC<PaceEstimateBoxProps> = ({
  paceEstimate,
}) => {
  const { colors } = useTheme();
  const isOverdue = paceEstimate.includes('passed');

  if (!paceEstimate) return null;

  return (
    <LinearGradient
      colors={[
        colors.outline,
        isOverdue ? `${colors.outline}` : `${colors.primary}`,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.estimateContainer,
        {
          borderColor: isOverdue ? colors.secondary : colors.primary,
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
