import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StatusSelectorProps {
  selectedStatus: string;
  onSelectStatus: (status: 'pending' | 'active') => void;
}

export const StatusSelector = ({
  selectedStatus,
  onSelectStatus,
}: StatusSelectorProps) => {
  const { colors } = useTheme();
  const primaryColor = colors.primary;
  const cardColor = colors.surface;
  const textMutedColor = colors.textMuted;

  const statuses = [
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
  ];

  return (
    <View style={styles.statusOptions} testID="status-options">
      {statuses.map(status => {
        const isSelected = selectedStatus === status.key;
        return (
          <TouchableOpacity
            key={status.key}
            testID={`status-option-${status.key}`}
            style={[
              styles.statusOption,
              {
                backgroundColor: isSelected ? `${primaryColor}20` : cardColor,
                borderColor: isSelected ? primaryColor : textMutedColor,
              },
            ]}
            onPress={() =>
              onSelectStatus(status.key as 'pending' | 'active')
            }
          >
            <ThemedText
              color={isSelected ? 'text' : 'textMuted'}
              style={[{ fontWeight: '600' }, !isSelected && { opacity: 0.7 }]}
            >
              {status.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  statusOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statusOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
});