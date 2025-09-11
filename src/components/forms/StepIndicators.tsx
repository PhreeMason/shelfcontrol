import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StepIndicatorsProps {
    currentStep: number;
    totalSteps: number;
}

export const StepIndicators = ({ currentStep, totalSteps }: StepIndicatorsProps) => {
    const primary = useThemeColor({}, 'primary');
    const backgroundColor = primary;

    return (
        <View style={styles.stepsContainer} testID="steps-container">
            {Array.from({ length: totalSteps }, (_, index) => (
                <View
                    key={index}
                    testID="step-indicator"
                    style={[
                        styles.step,
                        index + 1 === currentStep && { backgroundColor },
                        index + 1 < currentStep && { backgroundColor }
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
        borderBottomWidth: 1,
        borderBottomColor: '#404040',
    },
    step: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#404040',
    },
}); 