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
            index + 1 === currentStep && { backgroundColor: activeBackgroundColor },
            index + 1 < currentStep && { backgroundColor: activeBackgroundColor },
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
    gap: 8,
    padding: 16,
  },
  step: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
