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
import { useFetchBookById } from '@/hooks/useBooks';
import { useCompleteDeadline, useDidNotFinishDeadline, useToReviewDeadline } from '@/hooks/useDeadlines';
import { useCreateReviewTracking, useUserPlatforms } from '@/hooks/useReviewTracking';
import { useTheme } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { ReviewFormData, reviewFormSchema } from '@/utils/reviewFormSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Image,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const { mutate: createReviewTracking } = useCreateReviewTracking();
  const { mutate: updateToReview } = useToReviewDeadline();
  const { mutate: completeDeadline } = useCompleteDeadline();
  const { mutate: didNotFinishDeadline } = useDidNotFinishDeadline();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [hasBlog, setHasBlog] = useState(false);
  const [blogUrl, setBlogUrl] = useState('');
  const [customPlatforms, setCustomPlatforms] = useState<string[]>([]);
  const [newCustomPlatform, setNewCustomPlatform] = useState('');

  const { data: bookData } = useFetchBookById(flowState?.bookData.bookId || null);
  const { data: userPlatforms = [] } = useUserPlatforms();

  const categorizedPlatforms = useMemo(() => {
    const usedPresets: string[] = [];
    const custom: string[] = [];
    const blogs: string[] = [];

    userPlatforms.forEach(p => {
      if (p.startsWith('Blog: ')) {
        const blogUrl = p.replace('Blog: ', '');
        if (!blogs.includes(blogUrl)) {
          blogs.push(blogUrl);
        }
      } else if (PRESET_PLATFORMS.includes(p)) {
        if (!usedPresets.includes(p)) {
          usedPresets.push(p);
        }
      } else {
        if (!custom.includes(p)) {
          custom.push(p);
        }
      }
    });

    const unusedPresets = PRESET_PLATFORMS.filter(p => !usedPresets.includes(p));

    return {
      usedPresets,
      unusedPresets,
      custom,
      blogs,
    };
  }, [userPlatforms]);

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

  useEffect(() => {
    if (hasBlog && !blogUrl && categorizedPlatforms.blogs.length > 0) {
      setBlogUrl(categorizedPlatforms.blogs[0]);
    }
  }, [hasBlog, blogUrl, categorizedPlatforms.blogs]);

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

  const handleSaveAndFinish = (data: ReviewFormData) => {
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

    createReviewTracking(params, {
      onSuccess: () => {
        updateToReview(flowState.deadlineId, {
          onSuccess: () => {
            Toast.show({
              type: 'success',
              text1: 'Review tracking set up!',
            });
            setIsSubmitting(false);
            router.replace(`/deadline/${flowState.deadlineId}`);
          },
          onError: (error) => {
            console.warn('Could not update status to to_review:', error.message);
            Toast.show({
              type: 'success',
              text1: 'Review tracking set up!',
            });
            setIsSubmitting(false);
            router.replace(`/deadline/${flowState.deadlineId}`);
          },
        });
      },
      onError: (error) => {
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
    if (!flowState || !session?.user?.id) return;

    const finalStatus = flowState.isDNF ? 'did_not_finish' : 'complete';

    setIsSubmitting(true);

    const statusMutation = finalStatus === 'did_not_finish' ? didNotFinishDeadline : completeDeadline;

    statusMutation(flowState.deadlineId, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'All done!',
        });
        setIsSubmitting(false);
        resetFlow();
        router.replace(ROUTES.HOME);
      },
      onError: (error) => {
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

  if (!flowState) return null;

  const isPastDate = watchReviewDueDate && watchReviewDueDate < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <ThemedView style={[styles.container, {
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}>
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
                {flowState.bookData.title}
              </ThemedText>
              <ThemedText variant="secondary" style={styles.bookAuthor}>
                by {flowState.bookData.author}
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
          <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedView style={styles.section}>
              <ThemedText variant="title" style={styles.sectionHeader}>
                Review Timeline
              </ThemedText>
              <ThemedView style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    { borderColor: colors.border },
                    watchHasDeadline && {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.primary,
                    },
                  ]}
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
                  <ThemedText style={styles.radioLabel}>Yes, I have a review deadline</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    { borderColor: colors.border },
                    !watchHasDeadline && {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.primary,
                    },
                  ]}
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
                  <ThemedText style={styles.radioLabel}>No deadline, review when I can</ThemedText>
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
                    <ThemedText style={styles.dateText}>
                      {watchReviewDueDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </ThemedText>
                  </TouchableOpacity>
                  {isPastDate && (
                    <ThemedText color="error" style={styles.warningText}>
                      This date is in the past
                    </ThemedText>
                  )}
                  {showDatePicker && (
                    <DateTimePicker
                      themeVariant="light"
                      value={watchReviewDueDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={handleDateChange}
                    />
                  )}
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>

          <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedView style={styles.section}>
              <ThemedText variant="title" style={styles.sectionHeader}>
                Where to Post Reviews
              </ThemedText>
              <ThemedText variant="secondary" style={styles.sectionSubtext}>
                Select all that apply:
              </ThemedText>
            <ThemedView style={styles.platformsList}>
              <ThemedView style={styles.platformsGrid}>
                {categorizedPlatforms.usedPresets.map((platform) => (
                  <ThemedView key={platform} style={styles.platformItem}>
                    <Checkbox
                      label={platform}
                      checked={selectedPlatforms.has(platform)}
                      onToggle={() => togglePlatform(platform)}
                    />
                  </ThemedView>
                ))}
                {categorizedPlatforms.custom.map((platform) => (
                  <ThemedView key={`history-${platform}`} style={styles.platformItem}>
                    <Checkbox
                      label={platform}
                      checked={selectedPlatforms.has(platform)}
                      onToggle={() => togglePlatform(platform)}
                    />
                  </ThemedView>
                ))}
                {categorizedPlatforms.unusedPresets.map((platform) => (
                  <ThemedView key={platform} style={styles.platformItem}>
                    <Checkbox
                      label={platform}
                      checked={selectedPlatforms.has(platform)}
                      onToggle={() => togglePlatform(platform)}
                    />
                  </ThemedView>
                ))}
                {customPlatforms.map((platform, index) => (
                  <ThemedView key={`custom-${index}`} style={styles.platformItem}>
                    <Checkbox
                      label={platform}
                      checked={true}
                      onToggle={() => removeCustomPlatform(index)}
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
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              )}

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
          </ThemedView>

          <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedView style={styles.section}>
              <ThemedText variant="title" style={styles.sectionHeader}>
                Do you need to submit review links?
              </ThemedText>
              <ThemedView style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    { borderColor: colors.border },
                    watch('needsLinkSubmission') && {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.primary,
                    },
                  ]}
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
                  <ThemedText style={styles.radioLabel}>Yes, I'll need to share review URLs</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    { borderColor: colors.border },
                    !watch('needsLinkSubmission') && {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.primary,
                    },
                  ]}
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
                  <ThemedText style={styles.radioLabel}>No link submission needed</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedView style={styles.section}>
              <ThemedText variant="title" style={styles.sectionHeader}>
                Quick Review Thoughts (Optional)
              </ThemedText>
              <CustomInput
                control={control}
                name="reviewNotes"
                placeholder="Jot down key points while they're fresh they will be saved to your Notes..."
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
        </ThemedView>
      </ThemedKeyboardAwareScrollView>

      <ThemedView style={styles.actionBar}>
        <ThemedButton
          title="Skip Review Tracking"
          variant="secondary"
          onPress={handleSkip}
          disabled={isSubmitting}
        />
        <ThemedButton
          title={isSubmitting ? 'Saving...' : 'Save & Finish'}
          variant="primary"
          onPress={handleSubmit(handleSaveAndFinish)}
          disabled={isSubmitting}
          hapticsOnPress
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
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  sectionSubtext: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  radioGroup: {
    gap: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    flex: 1,
    lineHeight: 20,
  },
  datePickerContainer: {
    marginTop: Spacing.sm,
  },
  dateInput: {
    borderWidth: 2,
    padding: 16,
    borderRadius: BorderRadius.md,
  },
  dateText: {
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
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
    lineHeight: 20,
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
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
  },
  noteExplanation: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
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

export default ReviewForm;
