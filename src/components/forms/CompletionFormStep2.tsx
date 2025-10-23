import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useTheme';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface CompletionFormStep2Props {
  deadline: ReadingDeadlineWithProgress;
  onContinue: (needsReview: boolean) => void;
}

const CompletionFormStep2: React.FC<CompletionFormStep2Props> = ({
  deadline,
  onContinue,
}) => {
  const { data: fetchedBook } = useFetchBookById(deadline.book_id || '');
  const [needsReview, setNeedsReview] = useState<boolean | null>(null);
  const { colors, typography } = useTheme();

  const handleContinue = () => {
    if (needsReview !== null) {
      onContinue(needsReview);
    }
  };

  return (
    <LinearGradient
      colors={['#F5F1EA', colors.accent, colors.primary]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.container}
      testID="review-question-container"
    >
      <View style={styles.content}>
        <View style={[styles.bookInfo, styles.mediumShadow]}>
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
        </View>
        <ThemedText
          variant="title"
          style={[styles.title, { ...typography.headlineMedium }]}
        >
          Need to post reviews?
        </ThemedText>
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={() => setNeedsReview(true)}
            style={[
              styles.selectionButton,
              needsReview === true && styles.selectionButtonSelected,
            ]}
            testID="yes-button"
          >
            <ThemedText
              style={[
                styles.selectionButtonText,
                needsReview === true && styles.selectionButtonTextSelected,
              ]}
            >
              Yes, I need to post reviews
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setNeedsReview(false)}
            style={[
              styles.selectionButton,
              needsReview === false && styles.selectionButtonSelected,
            ]}
            testID="no-button"
          >
            <ThemedText
              style={styles.selectionButtonText}
            >
              No, I'm all done
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText variant="default" style={[styles.title]}>
          {needsReview ? "We'll help you track your review progress" : " "}
        </ThemedText>

        {needsReview !== null && (
          <View style={styles.confirmationContainer}>
            <ThemedButton
              title="Continue →"
              variant="primary"
              onPress={handleContinue}
              style={styles.button}
              testID="continue-button"
            />
          </View>
        )}
      </View>
    </LinearGradient>
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
    gap: Spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  bookInfo: {
    alignItems: 'center',
  },
  mediumShadow: {
    shadowColor: '#0000006b',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  coverImage: {
    width: 120,
    height: 200,
    borderRadius: 8,
  },
  coverThumbnail: {
    width: 120,
    height: 200,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: {
    fontSize: 40,
    lineHeight: 44,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  selectionButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    opacity: 0.6,
    backgroundColor: Colors.light.surface,
  },
  selectionButtonSelected: {
    // backgroundColor: Colors.light.primary + '80',
    borderColor: Colors.light.primary,
    borderWidth: 3,
    opacity: 1,
  },
  selectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  selectionButtonTextSelected: {
    // color: Colors.light.textOnPrimary,
  },
  confirmationContainer: {
    backgroundColor: 'transparent',
  },
  button: {
    width: '100%',
  },
});

export default CompletionFormStep2;
