import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface FormatSelectorProps {
    selectedFormat: string;
    onSelectFormat: (format: 'physical' | 'eBook' | 'audio') => void;
    disabled?: boolean;
}

export const FormatSelector = ({ selectedFormat, onSelectFormat, disabled = false }: FormatSelectorProps) => {
    const { colors } = useTheme();
    const primaryColor = colors.primary;
    const inputBlurBackground = colors.inputBlurBackground;

    const formats = [
        { key: 'physical', label: 'Physical' },
        { key: 'eBook', label: 'eBook' },
        { key: 'audio', label: 'Audio' }
    ];

    return (
        <View style={styles.formatSelector} testID="format-selector">
            {formats.map((format) => {
                const isSelected = selectedFormat === format.key;
                return (
                    <TouchableOpacity
                        key={format.key}
                        testID={`format-chip-${format.key}`}
                        style={[
                            styles.formatChip,
                            { 
                                backgroundColor: isSelected ? `${primaryColor}20` : inputBlurBackground, // primary with opacity or card
                                opacity: disabled ? 0.5 : 1,
                                borderWidth: isSelected ? 2 : 0,
                                borderColor: isSelected ? primaryColor : 'transparent',
                            }
                        ]}
                        onPress={disabled ? undefined : () => onSelectFormat(format.key as 'physical' | 'eBook' | 'audio')}
                        disabled={disabled}
                    >
                        <ThemedText 
                            color="textOnSurface"
                            variant="default"
                            style={[
                                isSelected && styles.formatChipTextSelected
                            ]}
                        >
                            {format.label}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    formatSelector: {
        flexDirection: 'row',
        gap: 13,
        marginTop: 8,
        justifyContent: 'flex-start',
    },
    formatChip: {
        borderRadius: 15,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formatChipTextSelected: {
        fontWeight: '600',
    },
}); 