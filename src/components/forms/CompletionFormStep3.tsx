import { LinkSubmissionSection } from '@/components/features/completion/LinkSubmissionSection';
import { PlatformSelectionSection } from '@/components/features/completion/PlatformSelectionSection';
import { ReviewNotesSection } from '@/components/features/completion/ReviewNotesSection';
import { ReviewTimelineSection } from '@/components/features/completion/ReviewTimelineSection';
import {
  ThemedButton,
  ThemedKeyboardAwareScrollView,
  ThemedText,
  ThemedView,
} from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useFetchBookById } from '@/hooks/useBooks';
import {
  useCompleteDeadline,
  useDidNotFinishDeadline,
  useToReviewDeadline,
} from '@/hooks/useDeadlines';
import { useReviewPlatforms } from '@/hooks/useReviewPlatforms';
import {
  useCreateReviewTracking,
  useUpdateReviewTracking,
  useUserPlatforms,
} from '@/hooks/useReviewTracking';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import { useAuth } from '@/providers/AuthProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { ReviewFormData, reviewFormSchema } from '@/utils/reviewFormSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

interface CompletionFormStep3Props {
  deadline: ReadingDeadlineWithProgress;
  isDNF?: boolean;
  mode?: 'create' | 'edit';
}

const CompletionFormStep3: React.FC<CompletionFormStep3Props> = ({
  deadline,
  isDNF = false,
  mode = 'create',
}) => {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  const { mutate: createReviewTracking } = useCreateReviewTracking();
  const { mutate: updateReviewTracking } = useUpdateReviewTracking();
  const { mutate: updateToReview } = useToReviewDeadline();
  const { mutate: completeDeadline } = useCompleteDeadline();
  const { mutate: didNotFinishDeadline } = useDidNotFinishDeadline();

  const { data: bookData } = useFetchBookById(deadline.book_id || null);
  const { data: userPlatforms = [] } = useUserPlatforms();

  const {
    reviewTracking: existingReviewTracking,
    platforms: existingPlatforms,
  } = useReviewTrackingData(deadline.id, mode === 'edit');

  const initialPlatformNames = useMemo(() => {
    return mode === 'edit' && existingPlatforms.length > 0
      ? existingPlatforms.map(p => p.platform_name)
      : undefined;
  }, [mode, existingPlatforms]);

  const postedPlatformNames = useMemo(() => {
    return mode === 'edit' && existingPlatforms.length > 0
      ? existingPlatforms.filter(p => p.posted).map(p => p.platform_name)
      : [];
  }, [mode, existingPlatforms]);

  const {
    selectedPlatforms,
    hasBlog,
    setHasBlog,
    blogUrl,
    setBlogUrl,
    customPlatforms,
    newCustomPlatform,
    setNewCustomPlatform,
    categorizedPlatforms,
    togglePlatform,
    addCustomPlatform,
    removeCustomPlatform,
    getAllSelectedPlatforms,
  } = useReviewPlatforms(
    userPlatforms,
    deadline.type || '',
    initialPlatformNames,
    postedPlatformNames
  );

  const { control, handleSubmit, watch, setValue } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      hasReviewDeadline:
        mode === 'edit' && existingReviewTracking
          ? !!existingReviewTracking.review_due_date
          : true,
      reviewDueDate:
        mode === 'edit' && existingReviewTracking?.review_due_date
          ? new Date(existingReviewTracking.review_due_date)
          : new Date(deadline.deadline_date),
      needsLinkSubmission:
        mode === 'edit' && existingReviewTracking
          ? existingReviewTracking.needs_link_submission
          : false,
      reviewNotes: '',
    },
  });

  const watchHasDeadline = watch('hasReviewDeadline');
  const watchReviewDueDate = watch('reviewDueDate');

  useEffect(() => {
    if (watchHasDeadline && !watchReviewDueDate) {
      const defaultDate = new Date(deadline.deadline_date);
      setValue('reviewDueDate', defaultDate);
    } else if (!watchHasDeadline) {
      setValue('reviewDueDate', null);
    }
  }, [watchHasDeadline, watchReviewDueDate, setValue, deadline.deadline_date]);

  const handleSaveAndFinish = (data: ReviewFormData) => {
    if (!session?.user?.id) return;

    const allPlatforms = getAllSelectedPlatforms();

    if (allPlatforms.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Platform Required',
        text2: 'Please select at least one platform',
      });
      return;
    }

    setIsSubmitting(true);

    if (mode === 'edit') {
      if (!existingReviewTracking?.id) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Review tracking not found',
        });
        setIsSubmitting(false);
        return;
      }

      const updateParams: any = {
        review_tracking_id: existingReviewTracking.id,
        needs_link_submission: data.needsLinkSubmission,
        platforms: allPlatforms.map(name => ({ name })),
      };

      if (data.hasReviewDeadline && data.reviewDueDate) {
        updateParams.review_due_date = data.reviewDueDate.toISOString();
      } else {
        updateParams.review_due_date = null;
      }

      if (data.reviewNotes?.trim()) {
        updateParams.review_notes = data.reviewNotes.trim();
      }

      updateReviewTracking(updateParams, {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Review tracking updated!',
          });
          setIsSubmitting(false);
          router.back();
        },
        onError: error => {
          console.error('Error updating review tracking:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to update review tracking. Please try again.',
          });
          setIsSubmitting(false);
        },
      });
    } else {
      const params: any = {
        deadline_id: deadline.id,
        needs_link_submission: data.needsLinkSubmission,
        platforms: allPlatforms.map(name => ({ name })),
      };

      if (data.hasReviewDeadline && data.reviewDueDate) {
        params.review_due_date = data.reviewDueDate.toISOString();
      }

      if (data.reviewNotes) {
        params.review_notes = data.reviewNotes;
      }

      createReviewTracking(params, {
        onSuccess: () => {
          analytics.track('review_submitted', {
            platform_count: allPlatforms.length,
            has_custom_note: !!data.reviewNotes?.trim(),
          });

          updateToReview(deadline.id, {
            onSuccess: () => {
              Toast.show({
                type: 'success',
                text1: 'Review tracking set up!',
              });
              setIsSubmitting(false);
              router.replace(`/deadline/${deadline.id}`);
            },
            onError: error => {
              console.warn(
                'Could not update status to to_review:',
                error.message
              );
              Toast.show({
                type: 'success',
                text1: 'Review tracking set up!',
              });
              setIsSubmitting(false);
              router.replace(`/deadline/${deadline.id}`);
            },
          });
        },
        onError: error => {
          console.error('Error setting up review tracking:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to set up review tracking. Please try again.',
          });
          setIsSubmitting(false);
        },
      });
    }
  };

  const handleSkip = () => {
    if (!session?.user?.id) return;

    const finalStatus = isDNF ? 'did_not_finish' : 'complete';

    setIsSubmitting(true);

    const mutationCallbacks = {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'All done!',
        });
        setIsSubmitting(false);
        router.replace(ROUTES.HOME);
      },
      onError: (error: any) => {
        console.error('Error updating book status:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update book. Please try again.',
        });
        setIsSubmitting(false);
      },
    };

    if (finalStatus === 'did_not_finish') {
      didNotFinishDeadline(deadline.id, mutationCallbacks);
    } else {
      completeDeadline(
        {
          deadlineId: deadline.id,
          deadline: {
            total_quantity: deadline.total_quantity,
            progress: deadline.progress,
          },
        },
        mutationCallbacks
      );
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('reviewDueDate', selectedDate);
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: colors.surfaceContainer, // Let gradient show through
    },
    bookCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    bookCoverPlaceholder: {
      backgroundColor: colors.surfaceVariant,
    },
    actionBar: {
      backgroundColor: 'transparent',
      borderTopColor: colors.border,
    },
  };

  return (
    <ThemedView
      style={[
        styles.container,
        dynamicStyles.container,
        {
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      testID="review-form-container"
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: 'transparent' },
        ]}
      >
        <ThemedView style={[styles.bookCard, dynamicStyles.bookCard]}>
          <View style={styles.bookCardContent}>
            {bookData?.cover_image_url ? (
              <Image
                source={{ uri: bookData.cover_image_url }}
                style={styles.bookCover}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.bookCoverPlaceholder,
                  dynamicStyles.bookCoverPlaceholder,
                ]}
              >
                <ThemedText typography="headlineSmall">📖</ThemedText>
              </View>
            )}
            <View style={styles.bookInfoText}>
              <ThemedText typography="titleSmall" numberOfLines={1}>
                {deadline.book_title}
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                by {deadline.author || 'Unknown Author'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>

      <ThemedKeyboardAwareScrollView
        style={[styles.scrollView, { backgroundColor: 'transparent' }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView
          style={[styles.content, { backgroundColor: 'transparent' }]}
        >
          <ReviewTimelineSection
            control={control}
            watch={watch}
            setValue={setValue}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            onDateChange={handleDateChange}
          />

          <PlatformSelectionSection
            categorizedPlatforms={categorizedPlatforms}
            selectedPlatforms={selectedPlatforms}
            togglePlatform={togglePlatform}
            hasBlog={hasBlog}
            setHasBlog={setHasBlog}
            blogUrl={blogUrl}
            setBlogUrl={setBlogUrl}
            customPlatforms={customPlatforms}
            newCustomPlatform={newCustomPlatform}
            setNewCustomPlatform={setNewCustomPlatform}
            addCustomPlatform={addCustomPlatform}
            removeCustomPlatform={removeCustomPlatform}
          />

          <LinkSubmissionSection watch={watch} setValue={setValue} />

          <ReviewNotesSection control={control} />
        </ThemedView>
      </ThemedKeyboardAwareScrollView>

      <ThemedView style={[styles.actionBar, dynamicStyles.actionBar]}>
        <ThemedButton
          title={
            isSubmitting
              ? 'Saving...'
              : mode === 'edit'
                ? 'Update'
                : 'Start Tracking'
          }
          variant="primary"
          onPress={handleSubmit(handleSaveAndFinish)}
          disabled={isSubmitting}
          hapticsOnPress
          testID="save-and-finish-button"
          style={styles.primaryButton}
        />
        {mode === 'create' && (
          <ThemedText
            typography="bodyMedium"
            color="surfaceVariant"
            style={styles.skipLink}
            onPress={handleSkip}
            testID="skip-button"
          >
            Skip this book
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  bookCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bookCardContent: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  bookCover: {
    width: 48,
    height: 72,
    borderRadius: BorderRadius.sm,
    flexShrink: 0,
  },
  bookCoverPlaceholder: {
    width: 48,
    height: 72,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bookInfoText: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  actionBar: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: 0,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
  skipLink: {
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
});

export default CompletionFormStep3;
