import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { Colors, Spacing } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface ReviewQuestionScreenProps {
  onContinue: (needsReview: boolean) => void;
}

const ReviewQuestionScreen: React.FC<ReviewQuestionScreenProps> = ({
  onContinue,
}) => {
  const { flowState } = useCompletionFlow();
  const { data: fetchedBook } = useFetchBookById(flowState?.bookData.bookId || '');
  const [needsReview, setNeedsReview] = useState<boolean | null>(null);

  if (!flowState) return null;

  const { bookData } = flowState;

  const handleContinue = () => {
    if (needsReview !== null) {
      onContinue(needsReview);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText variant="title" style={styles.title}>
          Does this book need a review?
        </ThemedText>

        <ThemedView style={styles.bookInfo}>
          {fetchedBook?.cover_image_url ? (
            <Image
              source={{ uri: fetchedBook.cover_image_url }}
              style={styles.coverImage}
              contentFit="cover"
            />
          ) : (
            <ThemedView style={styles.coverThumbnail}>
              <ThemedText style={styles.coverEmoji}>📖</ThemedText>
            </ThemedView>
          )}
          <ThemedText variant="default" style={styles.bookTitle}>
            {bookData.title}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              needsReview === true && styles.radioOptionSelected,
            ]}
            onPress={() => setNeedsReview(true)}
          >
            <ThemedView
              style={[
                styles.radioCircle,
                needsReview === true && styles.radioCircleSelected,
              ]}
            >
              {needsReview === true && <ThemedView style={styles.radioInner} />}
            </ThemedView>
            <ThemedText variant="default" style={styles.radioLabel}>
              Yes, I need to post reviews
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              needsReview === false && styles.radioOptionSelected,
            ]}
            onPress={() => setNeedsReview(false)}
          >
            <ThemedView
              style={[
                styles.radioCircle,
                needsReview === false && styles.radioCircleSelected,
              ]}
            >
              {needsReview === false && <ThemedView style={styles.radioInner} />}
            </ThemedView>
            <ThemedText variant="default" style={styles.radioLabel}>
              No, I'm all done
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedButton
          title="Continue →"
          variant="primary"
          onPress={handleContinue}
          disabled={needsReview === null}
          style={styles.button}
        />
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  bookInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  coverThumbnail: {
    width: 120,
    height: 180,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  coverEmoji: {
    fontSize: 40,
  },
  bookTitle: {
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  radioOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surfaceVariant,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioCircleSelected: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  radioLabel: {
    flex: 1,
  },
  button: {
    paddingVertical: 14,
  },
});

export default ReviewQuestionScreen;
