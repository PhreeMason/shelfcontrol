import Checkbox from '@/components/shared/Checkbox';
import CustomInput from '@/components/shared/CustomInput';
import {
  ThemedButton,
  ThemedKeyboardAwareScrollView,
  ThemedText,
  ThemedView,
} from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { deadlinesService } from '@/services/deadlines.service';
import { reviewTrackingService } from '@/services/reviewTracking.service';
import { ReviewFormData, reviewFormSchema } from '@/utils/reviewFormSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

const PRESET_PLATFORMS = [
  'NetGalley',
  'Goodreads',
  'Amazon',
  'Instagram',
  'TikTok',
  'Twitter/X',
  'Facebook',
  'YouTube',
];

const ReviewForm: React.FC = () => {
  const { colors } = useTheme();
  const { flowState, resetFlow } = useCompletionFlow();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [hasBlog, setHasBlog] = useState(false);
  const [blogUrl, setBlogUrl] = useState('');
  const [customPlatforms, setCustomPlatforms] = useState<string[]>([]);
  const [newCustomPlatform, setNewCustomPlatform] = useState('');

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
    if (!flowState) return;

    const source = flowState.bookData.source;
    const defaultPlatforms = new Set<string>();

    if (source === 'NetGalley') {
      defaultPlatforms.add('NetGalley');
      defaultPlatforms.add('Goodreads');
      setValue('hasReviewDeadline', true);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setValue('reviewDueDate', defaultDate);
    } else if (source === 'Publisher ARC') {
      defaultPlatforms.add('Goodreads');
      setValue('hasReviewDeadline', true);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setValue('reviewDueDate', defaultDate);
    }

    setSelectedPlatforms(defaultPlatforms);
  }, [flowState, setValue]);

  useEffect(() => {
    if (watchHasDeadline && !watchReviewDueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setValue('reviewDueDate', defaultDate);
    } else if (!watchHasDeadline) {
      setValue('reviewDueDate', null);
    }
  }, [watchHasDeadline, watchReviewDueDate, setValue]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  };

  const addCustomPlatform = () => {
    if (newCustomPlatform.trim()) {
      setCustomPlatforms((prev) => [...prev, newCustomPlatform.trim()]);
      setNewCustomPlatform('');
    }
  };

  const removeCustomPlatform = (index: number) => {
    setCustomPlatforms((prev) => prev.filter((_, i) => i !== index));
  };

  const getAllSelectedPlatforms = (): string[] => {
    const platforms = Array.from(selectedPlatforms);
    if (hasBlog && blogUrl.trim()) {
      platforms.push(`Blog: ${blogUrl.trim()}`);
    }
    platforms.push(...customPlatforms);
    return platforms;
  };

  const handleSaveAndFinish = async (data: ReviewFormData) => {
    if (!flowState || !session?.user?.id) return;

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

    try {
      const params: any = {
        deadline_id: flowState.deadlineId,
        needs_link_submission: data.needsLinkSubmission,
        platforms: allPlatforms.map((name) => ({ name })),
      };

      if (data.hasReviewDeadline && data.reviewDueDate) {
        params.review_due_date = data.reviewDueDate.toISOString();
      }

      if (data.reviewNotes) {
        params.review_notes = data.reviewNotes;
      }

      await reviewTrackingService.createReviewTracking(session.user.id, params);

      try {
        await deadlinesService.updateDeadlineStatus(
          session.user.id,
          flowState.deadlineId,
          'to_review'
        );
      } catch (statusError: any) {
        console.warn('Could not update status to to_review:', statusError.message);
      }

      Toast.show({
        type: 'success',
        text1: 'Review tracking set up!',
      });

      router.replace(`/deadline/${flowState.deadlineId}`);
    } catch (error) {
      console.error('Error setting up review tracking:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to set up review tracking. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!flowState || !session?.user?.id) return;

    const finalStatus = flowState.completionData.isDNF ? 'did_not_finish' : 'complete';

    setIsSubmitting(true);

    try {
      await deadlinesService.updateDeadlineStatus(
        session.user.id,
        flowState.deadlineId,
        finalStatus
      );

      Toast.show({
        type: 'success',
        text1: 'All done!',
      });

      resetFlow();
      router.replace(ROUTES.HOME);
    } catch (error) {
      console.error('Error updating deadline status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update deadline. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setValue('reviewDueDate', selectedDate);
    }
  };

  if (!flowState) return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedKeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.content}>
          <ThemedView style={styles.bookInfo}>
            <ThemedText variant="default" style={styles.bookTitle}>
              {flowState.bookData.title}
            </ThemedText>
            <ThemedText variant="secondary" style={styles.bookAuthor}>
              by {flowState.bookData.author}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText variant="title" style={styles.sectionHeader}>
              Review Timeline
            </ThemedText>
            <ThemedView style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setValue('hasReviewDeadline', true)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: colors.border },
                    watchHasDeadline && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  {watchHasDeadline && (
                    <View
                      style={[
                        styles.radioInnerCircle,
                        { backgroundColor: colors.textOnPrimary },
                      ]}
                    />
                  )}
                </View>
                <ThemedText>Yes, I have a review deadline</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setValue('hasReviewDeadline', false)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: colors.border },
                    !watchHasDeadline && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  {!watchHasDeadline && (
                    <View
                      style={[
                        styles.radioInnerCircle,
                        { backgroundColor: colors.textOnPrimary },
                      ]}
                    />
                  )}
                </View>
                <ThemedText>No deadline, review when I can</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            {watchHasDeadline && watchReviewDueDate && (
              <ThemedView style={styles.datePickerContainer}>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText>
                    {watchReviewDueDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </ThemedText>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    themeVariant="light"
                    value={watchReviewDueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText variant="title" style={styles.sectionHeader}>
              Where to Post Reviews
            </ThemedText>
            <ThemedText variant="secondary" style={styles.sectionSubtext}>
              Select all that apply:
            </ThemedText>
            <ThemedView style={styles.platformsList}>
              <ThemedView style={styles.platformsGrid}>
                {PRESET_PLATFORMS.map((platform) => (
                  <ThemedView key={platform} style={styles.platformItem}>
                    <Checkbox
                      label={platform}
                      checked={selectedPlatforms.has(platform)}
                      onToggle={() => togglePlatform(platform)}
                    />
                  </ThemedView>
                ))}
              </ThemedView>

              <Checkbox
                label="My blog"
                checked={hasBlog}
                onToggle={() => setHasBlog(!hasBlog)}
              />
              {hasBlog && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={blogUrl}
                  onChangeText={setBlogUrl}
                  placeholder="Enter blog URL..."
                  placeholderTextColor={colors.textMuted}
                />
              )}

              {customPlatforms.map((platform, index) => (
                <ThemedView key={index} style={styles.customPlatformRow}>
                  <ThemedText style={styles.customPlatformText}>
                    {platform}
                  </ThemedText>
                  <TouchableOpacity onPress={() => removeCustomPlatform(index)}>
                    <IconSymbol
                      name="xmark.circle.fill"
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </ThemedView>
              ))}

              <ThemedView style={styles.addCustomContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                      flex: 1,
                    },
                  ]}
                  value={newCustomPlatform}
                  onChangeText={setNewCustomPlatform}
                  placeholder="Enter platform name..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addCustomPlatform}
                />
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.primary }]}
                  onPress={addCustomPlatform}
                >
                  <IconSymbol name="plus" size={16} color={colors.primary} />
                  <ThemedText color="primary" style={styles.addButtonText}>
                    Add
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText variant="title" style={styles.sectionHeader}>
              Do you need to submit review links?
            </ThemedText>
            <ThemedView style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setValue('needsLinkSubmission', true)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: colors.border },
                    watch('needsLinkSubmission') && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  {watch('needsLinkSubmission') && (
                    <View
                      style={[
                        styles.radioInnerCircle,
                        { backgroundColor: colors.textOnPrimary },
                      ]}
                    />
                  )}
                </View>
                <ThemedText>Yes, I'll need to share review URLs</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setValue('needsLinkSubmission', false)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: colors.border },
                    !watch('needsLinkSubmission') && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  {!watch('needsLinkSubmission') && (
                    <View
                      style={[
                        styles.radioInnerCircle,
                        { backgroundColor: colors.textOnPrimary },
                      ]}
                    />
                  )}
                </View>
                <ThemedText>No link submission needed</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText variant="title" style={styles.sectionHeader}>
              Quick Review Thoughts (Optional)
            </ThemedText>
            <CustomInput
              control={control}
              name="reviewNotes"
              placeholder="Jot down key points while they're fresh..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.textArea}
            />
            <ThemedText variant="secondary" style={styles.noteExplanation}>
              This will be saved to your Notes for this deadline.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedKeyboardAwareScrollView>

      <ThemedView style={styles.actionBar}>
        <ThemedButton
          title="Skip Review Tracking"
          variant="secondary"
          onPress={handleSkip}
          disabled={isSubmitting}
          style={styles.actionButton}
        />
        <ThemedButton
          title={isSubmitting ? 'Saving...' : 'Save & Finish'}
          variant="primary"
          onPress={handleSubmit(handleSaveAndFinish)}
          disabled={isSubmitting}
          style={styles.actionButton}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  bookInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bookTitle: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  bookAuthor: {
    textAlign: 'center',
    fontSize: 14,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  sectionSubtext: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  datePickerContainer: {
    marginTop: Spacing.sm,
  },
  dateInput: {
    borderWidth: 2,
    padding: 16,
    borderRadius: BorderRadius.md,
  },
  platformsList: {
    gap: Spacing.md,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformItem: {
    width: '48%',
  },
  input: {
    borderWidth: 2,
    padding: 16,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    marginLeft: 36,
  },
  customPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.sm,
    marginLeft: 36,
  },
  customPlatformText: {
    fontSize: 14,
    flex: 1,
  },
  addCustomContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    maxHeight: 200,
  },
  noteExplanation: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
  },
  radioGroup: {
    gap: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ReviewForm;
