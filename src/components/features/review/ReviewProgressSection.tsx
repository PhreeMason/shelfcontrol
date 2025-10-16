import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';
import { useReviewTrackingMutation } from '@/hooks/useReviewTrackingMutation';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getDeadlineStatus } from '@/utils/deadlineActionUtils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MarkCompleteDialog from './MarkCompleteDialog';
import PlatformChecklist from './PlatformChecklist';
import ReviewDueDateBadge from './ReviewDueDateBadge';
import ReviewProgressBar from './ReviewProgressBar';

interface ReviewProgressSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

const ReviewProgressSection: React.FC<ReviewProgressSectionProps> = ({ deadline }) => {
  const latestStatus = getDeadlineStatus(deadline);
  const isToReview = latestStatus === 'to_review';

  const [showMarkCompleteDialog, setShowMarkCompleteDialog] = useState(false);

  const { reviewTracking, platforms, isLoading } = useReviewTrackingData(
    deadline.id,
    isToReview
  );

  const { updatePlatforms } = useReviewTrackingMutation(deadline.id);
  const { completeDeadline, didNotFinishDeadline } = useDeadlines();

  if (!isToReview) return null;

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
      </ThemedView>
    );
  }

  if (!reviewTracking) {
    return null;
  }

  const postedCount = platforms.filter(p => p.posted).length;
  const totalCount = platforms.length;

  const handleTogglePlatform = (platformId: string, posted: boolean) => {
    if (!reviewTracking) return;

    updatePlatforms({
      reviewTrackingId: reviewTracking.id,
      params: {
        platforms: [{ id: platformId, posted }],
      },
    });
  };

  const handleMarkComplete = () => {
    const finalStatus = deadline.status?.[0];
    const wasDNF = finalStatus?.status === 'did_not_finish';

    const completeMethod = wasDNF ? didNotFinishDeadline : completeDeadline;

    completeMethod(
      deadline.id,
      () => {
        setShowMarkCompleteDialog(false);
        Toast.show({
          type: 'success',
          text1: 'Completed!',
          text2: 'All reviews tracked',
          position: 'top',
          visibilityTime: 2000,
        });
        router.replace('/');
      },
      (error: Error) => {
        Toast.show({
          type: 'error',
          text1: 'Failed to complete',
          text2: error.message || 'Please try again',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.sectionTitle}>
        Review Progress
      </ThemedText>

      <View style={styles.content}>
        <ReviewDueDateBadge reviewDueDate={reviewTracking.review_due_date} />

        <ReviewProgressBar postedCount={postedCount} totalCount={totalCount} />

        <PlatformChecklist platforms={platforms} onToggle={handleTogglePlatform} />

        <ThemedButton
          title="Mark Complete"
          variant="primary"
          onPress={() => setShowMarkCompleteDialog(true)}
          style={styles.actionButton}
        />
      </View>

      <MarkCompleteDialog
        visible={showMarkCompleteDialog}
        platforms={platforms}
        onComplete={handleMarkComplete}
        onCancel={() => setShowMarkCompleteDialog(false)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  loadingContainer: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  content: {
    gap: Spacing.xs,
  },
  actionButton: {
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
});

export default ReviewProgressSection;
