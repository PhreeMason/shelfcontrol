import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDeadlines } from '@/providers/DeadlineProvider';
import CompletionFormStep3 from '@/components/forms/CompletionFormStep3';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { ThemedView, ThemedText, ThemedButton } from '@/components/themed';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useThemeColor';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';

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
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={[styles.container, { padding: 20 }]}>
          <ThemedText variant="title">
            Deadline Not Found
          </ThemedText>
          <ThemedText style={{ marginTop: 8 }}>
            The deadline you are trying to edit could not be found.
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

  const { isToReview } = getDeadlineStatus(deadline);

  if (!isToReview) {
    return (
      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={[styles.container, { padding: 20 }]}>
          <ThemedText variant="title">
            Cannot Edit Review Tracking
          </ThemedText>
          <ThemedText style={{ marginTop: 8 }}>
            Review tracking can only be edited for deadlines in the "to review" status.
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
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={[styles.container, { padding: 20 }]}>
          <ThemedText variant="title">
            No Review Tracking Found
          </ThemedText>
          <ThemedText style={{ marginTop: 8 }}>
            No review tracking data exists for this deadline.
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
