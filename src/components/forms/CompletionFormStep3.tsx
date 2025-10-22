import {
  ThemedButton,
  ThemedKeyboardAwareScrollView,
  ThemedText,
  ThemedView,
} from '@/components/themed';
import { LinkSubmissionSection } from '@/components/features/completion/LinkSubmissionSection';
import { PlatformSelectionSection } from '@/components/features/completion/PlatformSelectionSection';
import { ReviewNotesSection } from '@/components/features/completion/ReviewNotesSection';
import { ReviewTimelineSection } from '@/components/features/completion/ReviewTimelineSection';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useFetchBookById } from '@/hooks/useBooks';
import { useReviewPlatforms } from '@/hooks/useReviewPlatforms';
import {
  useCompleteDeadline,
  useDidNotFinishDeadline,
  useToReviewDeadline,
} from '@/hooks/useDeadlines';
import {
  useCreateReviewTracking,
  useUserPlatforms,
} from '@/hooks/useReviewTracking';
import { useTheme } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { ReviewFormData, reviewFormSchema } from '@/utils/reviewFormSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

interface CompletionFormStep3Props {
  deadline: ReadingDeadlineWithProgress;
  isDNF?: boolean;
}

const CompletionFormStep3: React.FC<CompletionFormStep3Props> = ({
  deadline,
  isDNF = false,
}) => {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  const { mutate: createReviewTracking } = useCreateReviewTracking();
  const { mutate: updateToReview } = useToReviewDeadline();
  const { mutate: completeDeadline } = useCompleteDeadline();
  const { mutate: didNotFinishDeadline } = useDidNotFinishDeadline();

  const { data: bookData } = useFetchBookById(deadline.book_id || null);
  const { data: userPlatforms = [] } = useUserPlatforms();

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
  } = useReviewPlatforms(userPlatforms, deadline.source);

  const { control, handleSubmit, watch, setValue } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      hasReviewDeadline: false,
      reviewDueDate: null,
      needsLinkSubmission: false,
      reviewNotes: '',
    },
  });

  const watchHasDeadline = watch('hasReviewDeadline');
  const watchReviewDueDate = watch('reviewDueDate');

  useEffect(() => {
    const source = deadline.source;

    if (source === 'NetGalley' || source === 'Publisher ARC') {
      setValue('hasReviewDeadline', true);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setValue('reviewDueDate', defaultDate);
    }
  }, [deadline.source, setValue]);

  useEffect(() => {
    if (watchHasDeadline && !watchReviewDueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setValue('reviewDueDate', defaultDate);
    } else if (!watchHasDeadline) {
      setValue('reviewDueDate', null);
    }
  }, [watchHasDeadline, watchReviewDueDate, setValue]);

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
  };

  const handleSkip = () => {
    if (!session?.user?.id) return;

    const finalStatus = isDNF ? 'did_not_finish' : 'complete';

    setIsSubmitting(true);

    const statusMutation =
      finalStatus === 'did_not_finish'
        ? didNotFinishDeadline
        : completeDeadline;

    statusMutation(deadline.id, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'All done!',
        });
        setIsSubmitting(false);
        router.replace(ROUTES.HOME);
      },
      onError: error => {
        console.error('Error updating deadline status:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update deadline. Please try again.',
        });
        setIsSubmitting(false);
      },
    });
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('reviewDueDate', selectedDate);
    }
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      testID="review-form-container"
    >
      <LinearGradient
        colors={[colors.accent, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top }]}
      >
        <ThemedView style={styles.bookCard}>
          <View style={styles.bookCardContent}>
            {bookData?.cover_image_url ? (
              <Image
                source={{ uri: bookData.cover_image_url }}
                style={styles.bookCover}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bookCoverPlaceholder}>
                <ThemedText style={styles.bookCoverPlaceholderText}>
                  📖
                </ThemedText>
              </View>
            )}
            <View style={styles.bookInfoText}>
              <ThemedText variant="default" style={styles.bookTitle}>
                {deadline.book_title}
              </ThemedText>
              <ThemedText variant="secondary" style={styles.bookAuthor}>
                by {deadline.author || 'Unknown Author'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </LinearGradient>

      <ThemedKeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.content}>
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

      <ThemedView style={styles.actionBar}>
        <ThemedButton
          title="Skip Review Tracking"
          variant="secondary"
          onPress={handleSkip}
          disabled={isSubmitting}
          testID="skip-button"
        />
        <ThemedButton
          title={isSubmitting ? 'Saving...' : 'Save & Finish'}
          variant="primary"
          onPress={handleSubmit(handleSaveAndFinish)}
          disabled={isSubmitting}
          hapticsOnPress
          testID="save-and-finish-button"
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
  gradientHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  bookCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bookCardContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  bookCover: {
    width: 96,
    height: 144,
    borderRadius: BorderRadius.sm,
    flexShrink: 0,
  },
  bookCoverPlaceholder: {
    width: 96,
    height: 144,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bookCoverPlaceholderText: {
    fontSize: 40,
  },
  bookInfoText: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  bookAuthor: {
    fontSize: 14,
    lineHeight: 18,
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: 0,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});

export default CompletionFormStep3;
