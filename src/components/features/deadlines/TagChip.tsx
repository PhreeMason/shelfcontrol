import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TagWithDetails } from '@/types/tags.types';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface TagChipProps {
  tag: TagWithDetails;
  onRemove?: () => void;
  showRemove?: boolean;
}

export const TagChip = ({ tag, onRemove, showRemove = true }: TagChipProps) => {
  const backgroundColor = tag.color + '20';
  const borderColor = tag.color;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderColor },
      ]}
    >
      <ThemedText style={[styles.text, { color: tag.color }]}>
        {tag.name}
      </ThemedText>
      {showRemove && onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={`remove-tag-${tag.id}`}
        >
          <IconSymbol name="xmark" size={14} color={tag.color} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
