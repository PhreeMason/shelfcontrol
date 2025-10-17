import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useTheme';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ReviewQuestionScreenProps {
  onContinue: (needsReview: boolean) => void;
}

const ReviewQuestionScreen: React.FC<ReviewQuestionScreenProps> = ({
  onContinue,
}) => {
  const { flowState } = useCompletionFlow();
  const { data: fetchedBook } = useFetchBookById(flowState?.bookData.bookId || '');
  const [needsReview, setNeedsReview] = useState<boolean | null>(null);
  const { colors, typography } = useTheme();
  
  if (!flowState) return null;

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
        <ThemedText variant="title" style={[styles.title, { ...typography.headlineMedium }]}>
          Need to post reviews?
        </ThemedText>
        <ThemedText variant="default" style={[styles.title, { marginBottom: Spacing.xl }]}>
          We can help you track them
        </ThemedText>
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={() => setNeedsReview(true)}
            style={[
              styles.selectionButton,
              needsReview === true && styles.selectionButtonSelected,
            ]}
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
          >
            <ThemedText
              style={[
                styles.selectionButtonText,
                needsReview === false && styles.selectionButtonTextSelected,
              ]}
            >
              No, I'm all done
            </ThemedText>
          </Pressable>
        </View>

        {needsReview !== null && (
          <View style={styles.confirmationContainer}>
            <ThemedButton
              title="Continue →"
              variant="primary"
              onPress={handleContinue}
              style={styles.button}
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
  },
  title: {
    textAlign: 'center',
  },
  bookInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    lineHeight: 44,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
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
    backgroundColor: Colors.light.primary + '80',
    borderColor: Colors.light.primary,
    borderWidth: 3,
    opacity: 1,
  },
  selectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  selectionButtonTextSelected: {
    color: Colors.light.textOnPrimary,
  },
  confirmationContainer: {
    marginTop: Spacing.lg,
    backgroundColor: 'transparent',
  },
  button: {
    width: '100%',
  },
});

export default ReviewQuestionScreen;
