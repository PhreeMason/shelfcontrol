import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StepIndicatorsProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicators = ({
  currentStep,
  totalSteps,
}: StepIndicatorsProps) => {
  const { colors } = useTheme();
  const activeBackgroundColor = colors.textOnPrimary;
  const inactiveBackgroundColor = colors.border;

  return (
    <View style={styles.stepsContainer} testID="steps-container">
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          testID="step-indicator"
          style={[
            styles.step,
            { backgroundColor: inactiveBackgroundColor },
            index + 1 === currentStep && {
              backgroundColor: activeBackgroundColor,
            },
            index + 1 < currentStep && {
              backgroundColor: activeBackgroundColor,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  step: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
