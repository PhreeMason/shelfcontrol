import CustomInput from '@/components/shared/CustomInput';
import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { ReviewFormData } from '@/utils/reviewFormSchema';
import React from 'react';
import { Control } from 'react-hook-form';
import { Platform, StyleSheet } from 'react-native';

interface ReviewNotesSectionProps {
  control: Control<ReviewFormData>;
}

export const ReviewNotesSection: React.FC<ReviewNotesSectionProps> = ({ control }) => {
  const { colors } = useTheme();

  return (
    <ThemedView
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID="review-notes-section"
    >
      <ThemedView style={styles.section}>
        <ThemedText variant="title" style={styles.sectionHeader}>
          Quick Review Thoughts (Optional)
        </ThemedText>
        <CustomInput
          control={control}
          name="reviewNotes"
          placeholder="Jot down key points while they're fresh they will be saved to your Notes..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.textArea}
          testID="review-notes-input"
        />
        <ThemedText variant="secondary" style={styles.noteExplanation}>
          This will be saved to your Notes for this deadline.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  textArea: {
    minHeight: 100,
  },
  noteExplanation: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
