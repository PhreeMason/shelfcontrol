import TagTypeaheadInput from '@/components/shared/TagTypeaheadInput';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  useAddTagToDeadline,
  useCreateTag,
  useGetAllTags,
  useGetDeadlineTags,
  useRemoveTagFromDeadline,
} from '@/hooks/useTags';
import { useTheme } from '@/hooks/useTheme';
import { analytics } from '@/lib/analytics/client';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { TagWithDetails } from '@/types/tags.types';
import { getNextTagColor } from '@/utils/tagColors';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { TagChip } from './TagChip';

interface DeadlineTagsSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DeadlineTagsSection = ({ deadline }: DeadlineTagsSectionProps) => {
  const { colors } = useTheme();
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
        <View style={styles.titleColumn}>
          <ThemedText variant="title">Tags</ThemedText>
          <ThemedText variant="secondary" style={styles.benefitText}>
            Filter and organize quickly
          </ThemedText>
        </View>
        {!isAdding && (
          <Pressable
            onPress={() => setIsAdding(true)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            testID="add-tag-button"
          >
            <IconSymbol
              name="plus.circle.fill"
              size={20}
              color={colors.darkPurple}
              style={styles.addIcon}
            />
            <ThemedText
              style={[styles.addButtonText, { color: colors.darkPurple }]}
            >
              Add
            </ThemedText>
          </Pressable>
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
                placeholder="Select or add a tag"
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
            <Pressable
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: colors.cardEmptyState,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setIsAdding(true)}
            >
              <View style={styles.ghostTags}>
                <View
                  style={[
                    styles.ghostTag,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.ghostTagText, { color: colors.primary }]}
                  >
                    Fall reads
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.ghostTag,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.ghostTagText, { color: colors.primary }]}
                  >
                    fantasy
                  </ThemedText>
                </View>
              </View>
              <ThemedText variant="secondary" style={styles.emptyCta}>
                Add your first tag to organize
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}

      <ThemedText variant="secondary" style={styles.helpText}>
        Organize your books with tags for easy filtering
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleColumn: {
    flex: 1,
  },
  benefitText: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addIcon: {
    marginRight: 2,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    transform: [{ translateY: 1 }],
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
  emptyStateCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  ghostTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ghostTag: {
    opacity: 0.15,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ghostTagText: {
    fontSize: 15,
    opacity: 0.5,
  },
  emptyCta: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
