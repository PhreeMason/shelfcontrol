import { ProgressUpdateModal } from '@/components/features/reading-session/ProgressUpdateModal';
import { ReadingSessionTimer } from '@/components/features/reading-session/ReadingSessionTimer';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useFetchBookById } from '@/hooks/useBooks';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ReadingSession = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { deadlines } = useDeadlines();
  const { colors } = useTheme();
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // First try to find deadline in context (for active deadlines)
  let deadline = deadlines.find(d => d.id === id);

  // If not found, use fallback hook (for archived deadlines)
  const { data: fallbackDeadline, isLoading: isFallbackLoading } = useGetDeadlineById(deadline ? undefined : id);

  // Use fallback deadline if context deadline not found
  if (!deadline && fallbackDeadline) {
    deadline = fallbackDeadline;
  }

  // Fetch book data if deadline has a book_id
  const { data: bookData } = useFetchBookById(deadline?.book_id || null);

  // Show loading state when using fallback
  if (!deadline && isFallbackLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <ThemedView style={[styles.loadingContainer]}>
          <ThemedText>Loading deadline...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Show error or not found state
  if (!deadline) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <ThemedView style={[styles.loadingContainer]}>
          <ThemedText variant="title">Deadline not found</ThemedText>
          <ThemedButton
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const handleSessionComplete = (durationInMinutes: number) => {
    setSessionDuration(durationInMinutes);
    setShowProgressModal(true);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Reading Session',
      'Are you sure you want to cancel your reading session?',
      [
        {
          text: 'Continue Reading',
          style: 'cancel',
        },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleProgressSubmitted = () => {
    setShowProgressModal(false);
    router.back();
  };

  const handleModalCancel = () => {
    setShowProgressModal(false);
    router.back();
  };

  const getFormatMessage = () => {
    switch (deadline.format) {
      case 'physical':
        return 'Time to dive into your book! 📖'; // TODO: change this messaging
      case 'audio':
        return 'Ready to listen? Put on your headphones! 🎧';
      case 'eBook':
        return 'Your digital reading session awaits! 📱';
      default:
        return 'Ready to start reading?';
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={Platform.OS === 'ios' ? 24 : 40} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { fontWeight: '600' }]}>
            Reading Session
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Book Details Section */}
        <ThemedView style={styles.bookSection}>
          {bookData?.cover_image_url && (
            <View style={styles.coverContainer}>
              <Image
                source={{ uri: bookData.cover_image_url }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            </View>
          )}

          <ThemedView style={styles.bookInfo}>
            <ThemedText variant="title" style={styles.bookTitle}>
              {deadline.book_title}
            </ThemedText>

            {/* Author info would go here when available */}

            <ThemedText style={styles.formatMessage}>
              {getFormatMessage()}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Timer Section */}
        <ThemedView style={styles.timerSection}>
          <ReadingSessionTimer
            onSessionComplete={handleSessionComplete}
            onCancel={handleCancel}
          />
        </ThemedView>
      </ScrollView>

      <ProgressUpdateModal
        visible={showProgressModal}
        deadline={deadline}
        sessionDuration={sessionDuration}
        onSubmit={handleProgressSubmitted}
        onCancel={handleModalCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  bookSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  coverContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  coverImage: {
    width: 180,
    height: 270,
    borderRadius: 8,
  },
  bookInfo: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  bookTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  bookAuthor: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  formatMessage: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.9,
    marginTop: 8,
  },
  timerSection: {
    flex: 1,
  },
});

export default ReadingSession;