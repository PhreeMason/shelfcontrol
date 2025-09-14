import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SourceSelectorProps {
    selectedSource: string;
    onSelectSource: (source: 'ARC' | 'library' | 'personal' | 'bookclub') => void;
}

export const SourceSelector = ({ selectedSource, onSelectSource }: SourceSelectorProps) => {
    const { colors } = useTheme();
    
    const sources = [
        { key: 'ARC', label: 'ARC' },
        { key: 'library', label: 'Library' },
        { key: 'personal', label: 'Personal' },
        { key: 'bookclub', label: 'Book Club' }
    ];

    return (
        <View style={styles.sourceSelector}>
            {sources.map((source) => {
                const isSelected = selectedSource === source.key;
                return (
                    <TouchableOpacity
                        key={source.key}
                        style={[
                            styles.sourceChip,
                            { 
                                backgroundColor: isSelected ? `${colors.primary}20` : colors.surface, // primary with opacity or card
                            }
                        ]}
                        onPress={() => onSelectSource(source.key as 'ARC' | 'library' | 'personal' | 'bookclub')}
                    >
                        <ThemedText 
                            color={isSelected ? 'primary' : 'textMuted'}
                            style={[
                                styles.sourceChipText,
                                isSelected && styles.sourceChipTextSelected
                            ]}
                        >
                            {source.label}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    sourceSelector: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    sourceChip: {
        borderRadius: 20,
        padding: 8,
        paddingHorizontal: 16,
    },
    sourceChipText: {
        fontSize: 14,
    },
    sourceChipTextSelected: {
        fontWeight: '600',
    },
}); 