import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface FormHeaderProps {
    title: string;
    onBack: () => void;
    showBack: boolean;
    onSkip?: () => void;
    showSkip?: boolean;
}

export const FormHeader = ({ title, onBack, showBack, onSkip, showSkip }: FormHeaderProps) => {
    const { colors } = useTheme();
    const borderColor = colors.textMuted;
    const successColor = colors.primary;
    
    return (
        <ThemedView backgroundColor="surface" style={[styles.header, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                disabled={!showBack}
            >
                {showBack && <ThemedText style={styles.backButtonText}>←</ThemedText>}
            </TouchableOpacity>

            <ThemedText style={styles.headerTitle}>{title}</ThemedText>

            {showSkip && onSkip && (
                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                    <ThemedText style={[styles.skipButtonText, { color: successColor }]}>Skip</ThemedText>
                </TouchableOpacity>
            )}
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 5,
        minWidth: 44,
    },
    backButtonText: {
        fontSize: 18,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    skipButton: {
        padding: 5,
        minWidth: 44,
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
}); 