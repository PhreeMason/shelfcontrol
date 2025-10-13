import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface PrioritySelectorProps {
  selectedPriority: string;
  onSelectPriority: (priority: 'flexible' | 'strict') => void;
}

export const PrioritySelector = ({
  selectedPriority,
  onSelectPriority,
}: PrioritySelectorProps) => {
  const { colors } = useTheme();
  const primaryColor = colors.primary;
  const cardColor = colors.surface;
  const textMutedColor = colors.textMuted;

  const priorities = [
    { key: 'flexible', label: 'Flexible' },
    { key: 'strict', label: 'Must Meet' },
  ];

  return (
    <View style={styles.priorityOptions} testID="priority-options">
      {priorities.map(priority => {
        const isSelected = selectedPriority === priority.key;
        return (
          <TouchableOpacity
            key={priority.key}
            testID={`priority-option-${priority.key}`}
            style={[
              styles.priorityOption,
              {
                backgroundColor: isSelected ? `${primaryColor}20` : cardColor,
                borderColor: isSelected ? primaryColor : textMutedColor,
              },
            ]}
            onPress={() =>
              onSelectPriority(priority.key as 'flexible' | 'strict')
            }
          >
            <ThemedText
              color={isSelected ? 'text' : 'textMuted'}
              style={[{ fontWeight: '600' }, !isSelected && { opacity: 0.7 }]}
            >
              {priority.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  priorityIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
});
