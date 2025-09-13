import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet } from 'react-native';

interface FormHeaderProps {
    title: string;
}

export const FormHeader = ({ title }: FormHeaderProps) => {
    const { colors } = useTheme();
    const borderColor = colors.textMuted;

    return (
        <ThemedView backgroundColor="surface" style={[styles.header, { borderBottomColor: borderColor }]}>
            <ThemedText style={styles.headerTitle}>{title}</ThemedText>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    }
}); 