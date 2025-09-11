import { ThemedText } from '@/components/themed';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface FormatSelectorProps {
    selectedFormat: string;
    onSelectFormat: (format: 'physical' | 'ebook' | 'audio') => void;
    disabled?: boolean;
}

export const FormatSelector = ({ selectedFormat, onSelectFormat, disabled = false }: FormatSelectorProps) => {
    const primary = useThemeColor({}, 'primary');
    const surface = useThemeColor({}, 'surface');
    const primaryColor = primary;
    const cardColor = surface;
    
    const formats = [
        { key: 'physical', label: 'Physical' },
        { key: 'ebook', label: 'E-book' },
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
                                backgroundColor: isSelected ? `${primaryColor}20` : cardColor, // primary with opacity or card
                                opacity: disabled ? 0.5 : 1
                            }
                        ]}
                        onPress={disabled ? undefined : () => onSelectFormat(format.key as 'physical' | 'ebook' | 'audio')}
                        disabled={disabled}
                    >
                        <ThemedText 
                            color={isSelected ? 'primary' : 'textMuted'}
                            style={[
                                styles.formatChipText,
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
        gap: 8,
        marginTop: 8,
    },
    formatChip: {
        borderRadius: 20,
        padding: 8,
        paddingHorizontal: 16,
    },
    formatChipText: {
        fontSize: 14,
    },
    formatChipTextSelected: {
        fontWeight: '600',
    },
}); 