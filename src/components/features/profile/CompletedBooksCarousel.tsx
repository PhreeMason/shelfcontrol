import { ThemedText, ThemedView } from '@/components/themed';
import { useFetchBookById } from '@/hooks/useBooks';
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
        <ThemedText style={styles.bookCoverIcon}>
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
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.sectionTitle}>
          Books finished this year
        </ThemedText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </ThemedView>
    );
  }

  if (completedDeadlines.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.sectionTitle}>
          Books finished this year
        </ThemedText>
        <ThemedText style={styles.emptyStateText}>
          No completed books yet. Finish your first reading deadline to see it
          here!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.sectionTitle}>
        {completedDeadlines.length} books finished this year!
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
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  scrollView: {
    marginHorizontal: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bookCoverWrapper: {
    marginRight: 12,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCoverIcon: {
    fontSize: 24,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
