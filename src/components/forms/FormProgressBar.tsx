import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface FormProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export const FormProgressBar = ({ currentStep, totalSteps }: FormProgressBarProps) => {
    const progress = (currentStep / totalSteps) * 100;
    const { colors } = useTheme();
    const progressBgColor = colors.textMuted;
    const progressFillColor = colors.primary;
    
    return (
        <View style={styles.progressContainer} testID="progress-container">
            <View style={[styles.progressBar, { backgroundColor: progressBgColor }]} testID="progress-bar">
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progressFillColor }]} testID="progress-fill" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    progressContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
}); 