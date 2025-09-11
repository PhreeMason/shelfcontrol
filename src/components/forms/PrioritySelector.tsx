import { ThemedText } from '@/components/themed';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PrioritySelectorProps {
    selectedPriority: string;
    onSelectPriority: (priority: 'flexible' | 'strict') => void;
}

export const PrioritySelector = ({ selectedPriority, onSelectPriority }: PrioritySelectorProps) => {
    const primary = useThemeColor({}, 'primary');
    const surface = useThemeColor({}, 'surface');
    const textMuted = useThemeColor({}, 'textMuted');
    const primaryColor = primary;
    const cardColor = surface;
    const textMutedColor = textMuted;
    
    const priorities = [
        { key: 'flexible', label: 'Flexible', icon: '🕐' },
        { key: 'strict', label: 'Must Meet', icon: '⚡' }
    ];

    return (
        <View style={styles.priorityOptions} testID="priority-options">
            {priorities.map((priority) => {
                const isSelected = selectedPriority === priority.key;
                return (
                    <TouchableOpacity
                        key={priority.key}
                        testID={`priority-option-${priority.key}`}
                        style={[
                            styles.priorityOption,
                            { 
                                backgroundColor: isSelected ? `${primaryColor}20` : cardColor, // primary with opacity or card
                                borderColor: isSelected ? primaryColor : textMutedColor, // primary or textMuted
                            }
                        ]}
                        onPress={() => onSelectPriority(priority.key as 'flexible' | 'strict')}
                    >
                        <Text style={[styles.priorityIcon, !isSelected && { opacity: 0.5}]}>{priority.icon}</Text>
                        <ThemedText 
                            color={isSelected ? 'primary' : 'textMuted'}
                            style={[{fontWeight: '600'}, !isSelected && { opacity: 0.7 }]}
                        >
                            {priority.label}
                        </ThemedText>
                    </TouchableOpacity>
                )
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    priorityOptions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    priorityOption: {
        flex: 1,
        borderWidth: 2,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    priorityIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
}); 