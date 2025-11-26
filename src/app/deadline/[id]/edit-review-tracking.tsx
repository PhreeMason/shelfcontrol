import CompletionFormStep3 from '@/components/forms/CompletionFormStep3';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditReviewTracking = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines } = useDeadlines();
  const router = useRouter();
  const { colors } = useTheme();

  const deadline = deadlines.find(d => d.id === id);
  const { reviewTracking } = useReviewTrackingData(id || '', !!deadline);

  if (!deadline) {
    return (
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={[styles.container, { padding: 20 }]}>
          <ThemedText variant="title">Book Not Found</ThemedText>
          <ThemedText style={{ marginTop: 8 }}>
            The book you are trying to edit could not be found.
          </ThemedText>
          <ThemedButton
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!reviewTracking) {
    return (
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={[styles.container, { padding: 20 }]}>
          <ThemedText variant="title">No Review Tracking Found</ThemedText>
          <ThemedText style={{ marginTop: 8 }}>
            No review tracking data exists for this book.
          </ThemedText>
          <ThemedButton
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return <CompletionFormStep3 deadline={deadline} mode="edit" />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EditReviewTracking;
