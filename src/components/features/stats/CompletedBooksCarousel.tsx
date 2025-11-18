import { ThemedText, ThemedView } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  getBookCoverIcon,
  getGradientBackground,
} from '@/utils/deadlineDisplayUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

interface CompletedBooksCarouselProps {
  completedDeadlines: ReadingDeadlineWithProgress[];
  isLoading?: boolean;
}

const BookCover: React.FC<{
  deadline: ReadingDeadlineWithProgress;
}> = ({ deadline }) => {
  const { data: bookData } = useFetchBookById(deadline.book_id);
  const router = useRouter();

  const handlePress = () => {
    router.push(`/deadline/${deadline.id}`);
  };

  if (bookData?.cover_image_url) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Image
          source={{ uri: bookData.cover_image_url }}
          style={styles.bookCover}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <LinearGradient
        colors={getGradientBackground(deadline, 0)}
        style={styles.bookCover}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ThemedText typography="headlineSmall">
          {getBookCoverIcon(deadline, 0)}
        </ThemedText>
      </LinearGradient>
    </Pressable>
  );
};

export const CompletedBooksCarousel: React.FC<CompletedBooksCarouselProps> = ({
  completedDeadlines,
  isLoading,
}) => {
  const { colors, borderRadius } = useTheme();

  const dynamicStyles = {
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
    },
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, dynamicStyles.container]}>
        <ThemedText typography="titleMediumPlus" style={styles.sectionTitle}>
          Books finished this year
        </ThemedText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (completedDeadlines.length === 0) {
    return (
      <ThemedView style={[styles.container, dynamicStyles.container]}>
        <ThemedText typography="titleMediumPlus" style={styles.sectionTitle}>
          Books finished this year
        </ThemedText>
        <ThemedText variant="secondary" style={styles.emptyStateText}>
          No completed books yet.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <ThemedText typography="titleMediumPlus" style={styles.sectionTitle}>
        Books completed: {completedDeadlines.length}
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {completedDeadlines.map(deadline => (
          <View key={deadline.id} style={styles.bookCoverWrapper}>
            <BookCover deadline={deadline} />
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  scrollView: {
    marginHorizontal: Spacing.negative.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  bookCoverWrapper: {
    marginRight: Spacing.md,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
});
