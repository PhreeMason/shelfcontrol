import TagTypeaheadInput from '@/components/shared/TagTypeaheadInput';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import {
  useAddTagToDeadline,
  useCreateTag,
  useGetAllTags,
  useGetDeadlineTags,
  useRemoveTagFromDeadline,
} from '@/hooks/useTags';
import { analytics } from '@/lib/analytics/client';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { TagWithDetails } from '@/types/tags.types';
import { getNextTagColor } from '@/utils/tagColors';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { TagChip } from './TagChip';

interface DeadlineTagsSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DeadlineTagsSection = ({
  deadline,
}: DeadlineTagsSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const { data: deadlineTags = [], isLoading } = useGetDeadlineTags(
    deadline.id
  );
  const { data: allTags = [] } = useGetAllTags();
  const createTagMutation = useCreateTag();
  const addTagMutation = useAddTagToDeadline();
  const removeTagMutation = useRemoveTagFromDeadline();

  const handleSelectTag = async (
    selectedTag: TagWithDetails | { name: string }
  ) => {
    try {
      let tagId: string;
      const isNewTag = !('id' in selectedTag);
      const tagName = selectedTag.name;

      if ('id' in selectedTag) {
        tagId = selectedTag.id;
      } else {
        const newColor = getNextTagColor(allTags);
        const newTag = await createTagMutation.mutateAsync({
          tagData: {
            name: selectedTag.name,
            color: newColor,
            user_id: deadline.user_id,
          },
        });
        tagId = newTag.id;
      }

      await addTagMutation.mutateAsync({
        deadlineId: deadline.id,
        tagId,
      });

      analytics.track('tag_added_to_deadline', {
        tag_name: tagName,
        is_new_tag: isNewTag,
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      Alert.alert('Error', 'Failed to add tag. Please try again.');
    }
  };

  const handleRemoveTag = (tag: TagWithDetails) => {
    Alert.alert('Remove Tag', `Remove "${tag.name}" from this deadline?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTagMutation.mutateAsync({
              deadlineId: deadline.id,
              tagId: tag.id,
            });

            analytics.track('tag_removed_from_deadline', {
              tag_name: tag.name,
            });
          } catch (error) {
            console.error('Error removing tag:', error);
            Alert.alert('Error', 'Failed to remove tag. Please try again.');
          }
        },
      },
    ]);
  };

  const excludeTagIds = deadlineTags.map(tag => tag.id);

  return (
    <ThemedView style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText variant="title">Tags</ThemedText>
        </View>
        {!isAdding && (
          <ThemedButton
            title="+ Add"
            onPress={() => setIsAdding(true)}
            variant="ghost"
            style={styles.addButton}
            testID="add-tag-button"
          />
        )}
      </View>

      {isLoading ? (
        <ThemedText variant="secondary">Loading tags...</ThemedText>
      ) : (
        <View style={styles.tagsList}>
          {deadlineTags.length > 0 && (
            <View style={styles.tagsContainer}>
              {deadlineTags.map(tag => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  onRemove={() => handleRemoveTag(tag)}
                />
              ))}
            </View>
          )}

          {isAdding && (
            <View style={styles.addForm}>
              <TagTypeaheadInput
                placeholder="Enter tag name"
                onSelectTag={handleSelectTag}
                excludeTagIds={excludeTagIds}
                testID="tag-typeahead-input"
              />
              <ThemedButton
                title="Cancel"
                onPress={() => setIsAdding(false)}
                variant="outline"
                style={styles.cancelButton}
              />
            </View>
          )}

          {!isAdding && deadlineTags.length === 0 && (
            <ThemedText variant="secondary" style={styles.emptyText}>
              No tags added yet
            </ThemedText>
          )}
        </View>
      )}

      <ThemedText variant="secondary" style={styles.helpText}>
        Organize your deadlines with tags for easy filtering
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagsList: {
    gap: 12,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addForm: {
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
