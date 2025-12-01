import AppHeader from '@/components/shared/AppHeader';
import {
  ThemedButton,
  ThemedKeyboardAwareScrollView,
  ThemedText,
  ThemedView,
} from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useFormFlowTracking } from '@/hooks/analytics/useFormFlowTracking';
import {
  useDeleteDeadlineCover,
  useUploadDeadlineCover,
} from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { SelectedBook } from '@/types/bookSearch';
import {
  ReadingDeadlineWithProgress,
  UrgencyLevel,
} from '@/types/deadline.types';
import { calculateLocalDaysLeft } from '@/utils/dateNormalization';
import {
  calculateCurrentProgressFromForm,
  calculateRemainingFromForm,
  calculateTotalQuantityFromForm,
  getPaceEstimate,
} from '@/utils/deadlineCalculations';
import {
  DeadlineFormData,
  deadlineFormSchema,
} from '@/utils/deadlineFormSchema';
import {
  FormMode,
  createDateChangeHandler,
  createErrorToast,
  createFormNavigation,
  createFormatChangeHandler,
  createPriorityChangeHandler,
  createSuccessToast,
  findEarliestErrorStep,
  getFirstErrorField,
  getFormDefaultValues,
  handleBookSelection,
  initializeFormState,
  populateFormFromDeadline,
  populateFormFromParams,
  prepareDeadlineDetailsFromForm,
  prepareProgressDetailsFromForm,
} from '@/utils/deadlineFormUtils';
import { mapPaceToUrgency } from '@/utils/deadlineProviderUtils';
import { getInitialStepFromSearchParams } from '@/utils/deadlineUtils';
import { getPaceBasedStatus } from '@/utils/paceCalculations';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeadlineFormStep1 } from './DeadlineFormStep1';
import { DeadlineFormStep2Combined } from './DeadlineFormStep2Combined';
import { ImpactPreviewData } from './ImpactPreviewSection';
import { StepIndicators } from './StepIndicators';

/**
 * Calculate urgency level from pace data.
 * Shared helper used by both paceUrgencyLevel and impactPreviewData calculations.
 */
const calculateUrgencyFromPace = (
  userPace: number,
  requiredPace: number,
  daysLeft: number,
  progressPercentage: number
): UrgencyLevel => {
  if (daysLeft <= 0) return 'overdue';
  if (userPace <= 0) return null; // No pace data = hide label

  const status = getPaceBasedStatus(
    userPace,
    requiredPace,
    daysLeft,
    progressPercentage
  );
  return mapPaceToUrgency(status, daysLeft);
};

interface DeadlineFormContainerProps {
  mode: FormMode;
  existingDeadline?: ReadingDeadlineWithProgress | undefined;
}

const DeadlineFormContainer: React.FC<DeadlineFormContainerProps> = ({
  mode,
  existingDeadline,
}) => {
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const {
    addDeadline,
    updateDeadline,
    activeDeadlines,
    pendingDeadlines,
    getDeadlineCalculations,
    userPaceData,
    userListeningPaceData,
  } = useDeadlines();
  const { mutateAsync: uploadCover } = useUploadDeadlineCover();
  const { mutateAsync: deleteCover } = useDeleteDeadlineCover();

  // Determine steps and initial step
  const formSteps =
    mode === 'new' ? ['Find Book', 'Book Details'] : ['Edit Deadline'];
  const totalSteps = mode === 'new' ? 2 : 1;

  const initialStep = getInitialStepFromSearchParams(params, {
    paramName: 'page',
    defaultStep: 1,
    minStep: 1,
    maxStep: totalSteps,
  });

  // State management
  const [currentStep, setCurrentStep] = useState(initialStep);
  const formState = initializeFormState(mode);
  const [selectedFormat, setSelectedFormat] = useState(
    formState.selectedFormat
  );
  const [selectedStatus, setSelectedStatus] = useState(
    formState.selectedStatus
  );
  const [selectedPriority, setSelectedPriority] = useState(
    formState.selectedPriority
  );
  const [showDatePicker, setShowDatePicker] = useState(
    formState.showDatePicker
  );
  const [paceEstimate, setPaceEstimate] = useState(formState.paceEstimate);
  const [isSubmitting, setIsSubmitting] = useState(formState.isSubmitting);
  const [deadlineFromPublicationDate, setDeadlineFromPublicationDate] =
    useState(formState.deadlineFromPublicationDate || false);
  const [previousPageCount, setPreviousPageCount] = useState(
    formState.previousPageCount || null
  );
  // Track uploaded cover path for cleanup on error
  const [uploadedCoverPath, setUploadedCoverPath] = useState<string | null>(
    null
  );

  const isInitialized = useRef(false);
  const bookSelectedRef = useRef(false);

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const fieldPositions = useRef<Map<string, number>>(new Map());

  // Callback to register field positions for scroll-to-error functionality
  const registerFieldPosition = useCallback((fieldName: string, y: number) => {
    fieldPositions.current.set(fieldName, y);
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    setFocus,
    reset,
    formState: reactHookFormState,
  } = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: getFormDefaultValues(mode),
  });

  // Reset all form state (both React Hook Form and local state)
  // Used when going back from step 2 to step 1 to clear previous book's data
  const resetAllFormState = useCallback(() => {
    // Reset React Hook Form fields to defaults
    reset(getFormDefaultValues(mode));

    // Reset local state to defaults
    setSelectedFormat('eBook');
    setSelectedStatus('pending');
    setSelectedPriority('flexible');
    setDeadlineFromPublicationDate(false);
    setPreviousPageCount(null);

    // Reset initialization flags so form can be re-populated from params if needed
    isInitialized.current = false;
    bookSelectedRef.current = false;
  }, [reset, mode]);

  const watchedValues = watch();

  // Stabilize params to prevent new object references on every render
  const paramsString = JSON.stringify(params);
  const stableParams = useMemo(() => {
    if (!params) return null;
    return JSON.parse(paramsString);
  }, [params, paramsString]);

  // Stabilize existingDeadline ID to prevent unnecessary re-initializations
  const existingDeadlineId = existingDeadline?.id;

  // Reset initialization flag when mode or deadline ID changes (legitimate changes)
  useEffect(() => {
    isInitialized.current = false;
  }, [mode, existingDeadlineId]);

  useEffect(() => {
    // Prevent re-initialization if already done
    if (isInitialized.current) return;

    if (mode === 'new' && stableParams) {
      const { selectedFormat: newFormat, selectedPriority: newPriority } =
        populateFormFromParams(stableParams as Record<string, any>, setValue);
      setSelectedFormat(newFormat);
      setSelectedPriority(newPriority);
      isInitialized.current = true;
    } else if (mode === 'edit' && existingDeadline) {
      const {
        selectedFormat: editFormat,
        selectedPriority: editPriority,
        selectedStatus: editStatus,
      } = populateFormFromDeadline(existingDeadline, setValue);
      setSelectedFormat(editFormat);
      setSelectedPriority(editPriority);
      setSelectedStatus(editStatus);
      isInitialized.current = true;
    }
  }, [mode, stableParams, existingDeadline, setValue]);

  useEffect(() => {
    if (currentStep === totalSteps && scrollViewRef.current) {
      scrollViewRef.current.scrollToPosition(0, 0, true);
    }
  }, [currentStep, totalSteps]);

  useEffect(() => {
    if (watchedValues.bookTitle) {
      bookSelectedRef.current = true;
    }
  }, [watchedValues.bookTitle]);

  const formFlowTracking = useFormFlowTracking({
    flowType: 'deadline_creation',
    mode,
    currentStep,
    stepNames: formSteps,
    getAbandonmentData: () => ({
      book_selected: bookSelectedRef.current,
    }),
  });

  // Calculate pace estimate when relevant values change
  useEffect(() => {
    const deadline = watchedValues.deadline;
    const remaining = calculateRemainingFromForm(
      selectedFormat,
      watchedValues.totalQuantity,
      watchedValues.totalMinutes,
      watchedValues.currentProgress || 0,
      watchedValues.currentMinutes
    );

    if (deadline && remaining > 0) {
      setPaceEstimate(getPaceEstimate(selectedFormat, deadline, remaining));
    } else {
      setPaceEstimate('');
    }
  }, [
    selectedFormat,
    watchedValues.deadline,
    watchedValues.totalQuantity,
    watchedValues.totalMinutes,
    watchedValues.currentProgress,
    watchedValues.currentMinutes,
  ]);

  // Calculate urgency level based on pace (aligned with DeadlineCard system)
  const paceUrgencyLevel = useMemo((): UrgencyLevel => {
    const deadline = watchedValues.deadline;
    if (!deadline) return 'good';

    // Guard against invalid Date objects
    if (deadline instanceof Date && isNaN(deadline.getTime())) return 'good';

    // Use dateNormalization utility for consistent timezone handling
    const deadlineString =
      deadline instanceof Date
        ? deadline.toISOString().split('T')[0]
        : deadline;
    const daysLeft = calculateLocalDaysLeft(deadlineString);

    const total = calculateTotalQuantityFromForm(
      selectedFormat,
      watchedValues.totalQuantity || 0,
      watchedValues.totalMinutes
    );
    const current = calculateCurrentProgressFromForm(
      selectedFormat,
      watchedValues.currentProgress || 0,
      watchedValues.currentMinutes
    );
    const remaining = total - current;

    if (remaining <= 0) return 'good';

    const progressPercentage = total > 0 ? (current / total) * 100 : 0;
    const userPace =
      selectedFormat === 'audio'
        ? userListeningPaceData.averagePace
        : userPaceData.averagePace;
    const requiredPace = daysLeft > 0 ? remaining / daysLeft : 0;

    return calculateUrgencyFromPace(
      userPace,
      requiredPace,
      daysLeft,
      progressPercentage
    );
  }, [
    watchedValues.deadline,
    watchedValues.totalQuantity,
    watchedValues.totalMinutes,
    watchedValues.currentProgress,
    watchedValues.currentMinutes,
    selectedFormat,
    userPaceData,
    userListeningPaceData,
  ]);

  // Calculate impact preview data
  const impactPreviewData = useMemo((): ImpactPreviewData | null => {
    const deadline = watchedValues.deadline;
    if (!deadline) return null;

    // Guard against invalid Date objects
    if (deadline instanceof Date && isNaN(deadline.getTime())) return null;

    const total = calculateTotalQuantityFromForm(
      selectedFormat,
      watchedValues.totalQuantity || 0,
      watchedValues.totalMinutes
    );
    const current = calculateCurrentProgressFromForm(
      selectedFormat,
      watchedValues.currentProgress || 0,
      watchedValues.currentMinutes
    );

    if (total <= 0) return null;

    // Use dateNormalization utility for consistent timezone handling
    const deadlineString =
      deadline instanceof Date
        ? deadline.toISOString().split('T')[0]
        : deadline;
    const daysLeft = calculateLocalDaysLeft(deadlineString);

    // Calculate this book's required pace
    const thisBookPacePerDay =
      daysLeft > 0 ? Math.ceil((total - current) / daysLeft) : total - current;

    // Filter existing deadlines by format (audio vs reading)
    const isAudioFormat = selectedFormat === 'audio';
    const activeByFormat = activeDeadlines.filter(d =>
      isAudioFormat ? d.format === 'audio' : d.format !== 'audio'
    );
    const pendingByFormat = pendingDeadlines.filter(d =>
      isAudioFormat ? d.format === 'audio' : d.format !== 'audio'
    );

    // In edit mode, exclude the current deadline from active count
    const activeExcludingCurrent =
      mode === 'edit' && existingDeadline
        ? activeByFormat.filter(d => d.id !== existingDeadline.id)
        : activeByFormat;

    // Calculate active deadlines total pace
    const activeTotalPacePerDay = activeExcludingCurrent.reduce((sum, d) => {
      const { unitsPerDay } = getDeadlineCalculations(d);
      return sum + unitsPerDay;
    }, 0);

    // Combined with this book
    const activeWithThisPacePerDay = activeTotalPacePerDay + thisBookPacePerDay;

    // Calculate pending deadlines total pace
    const pendingTotalPacePerDay =
      pendingByFormat.reduce((sum, d) => {
        const { unitsPerDay } = getDeadlineCalculations(d);
        return sum + unitsPerDay;
      }, 0) + activeWithThisPacePerDay;

    // Get user's pace for urgency calculation
    const userPace = isAudioFormat
      ? userListeningPaceData.averagePace
      : userPaceData.averagePace;

    // For impact preview, use 0 progress since we're calculating combined totals
    const impactProgressPercentage = 0;

    return {
      format: selectedFormat,
      thisBookPacePerDay,
      activeBookCount: activeExcludingCurrent.length,
      activeTotalPacePerDay,
      activeWithThisPacePerDay,
      activeUrgency: calculateUrgencyFromPace(
        userPace,
        activeWithThisPacePerDay,
        daysLeft,
        impactProgressPercentage
      ),
      pendingBookCount: pendingByFormat.length,
      pendingTotalPacePerDay,
      pendingUrgency: calculateUrgencyFromPace(
        userPace,
        pendingTotalPacePerDay,
        daysLeft,
        impactProgressPercentage
      ),
    };
  }, [
    watchedValues.deadline,
    watchedValues.totalQuantity,
    watchedValues.totalMinutes,
    watchedValues.currentProgress,
    watchedValues.currentMinutes,
    selectedFormat,
    activeDeadlines,
    pendingDeadlines,
    getDeadlineCalculations,
    userPaceData,
    userListeningPaceData,
    mode,
    existingDeadline,
  ]);

  const onSubmit = async (data: DeadlineFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const deadlineDetails = prepareDeadlineDetailsFromForm(
      data,
      selectedFormat,
      selectedPriority,
      existingDeadline
    );

    const progressDetails = prepareProgressDetailsFromForm(
      data,
      selectedFormat,
      existingDeadline
    );

    const statusValue =
      selectedStatus === 'pending'
        ? 'pending'
        : selectedStatus === 'applied'
          ? 'applied'
          : 'reading';

    // Handle cover image based on source mode
    if (
      data.cover_image_source === 'upload' &&
      data.cover_image_url?.startsWith('file://')
    ) {
      // Upload mode: Upload file and get storage path
      try {
        const oldCoverPath =
          mode === 'edit' ? (existingDeadline?.cover_image_url ?? null) : null;
        const { path } = await uploadCover({
          uri: data.cover_image_url,
          oldCoverPath,
        });
        // Track uploaded path for cleanup if deadline creation fails
        setUploadedCoverPath(path);
        // Update deadlineDetails with the storage path
        deadlineDetails.cover_image_url = path;
      } catch (error) {
        setIsSubmitting(false);
        createErrorToast(mode)(error as Error);
        return;
      }
    } else if (data.cover_image_source === 'url' && data.cover_image_url) {
      // URL mode: Use the URL directly
      let finalUrl = data.cover_image_url.trim();

      // Auto-prepend https:// if missing protocol
      if (!finalUrl.match(/^https?:\/\//)) {
        finalUrl = `https://${finalUrl}`;
      }

      // Validate it looks like a URL (has protocol + domain with at least one dot)
      if (finalUrl.match(/^https?:\/\/[^.]+\..+/)) {
        deadlineDetails.cover_image_url = finalUrl;
      } else {
        setIsSubmitting(false);
        Alert.alert(
          'Invalid URL',
          'Please provide a valid image URL (e.g., example.com/image.jpg)'
        );
        return;
      }
    } else if (data.cover_image_source === 'none' || !data.cover_image_url) {
      // No custom cover - set to null to fall back to book cover
      deadlineDetails.cover_image_url = null;
    }

    const successCallback = (newDeadlineId?: string) => {
      if (mode === 'new') {
        formFlowTracking.markCompleted();
      }

      // Clear uploaded cover path since deadline was created successfully
      setUploadedCoverPath(null);

      // Don't set isSubmitting to false - we're navigating away immediately
      // and keeping the button disabled prevents duplicate submissions
      createSuccessToast(mode, newDeadlineId)();
    };

    const errorCallback = async (error: Error) => {
      // Clean up uploaded cover image if deadline creation failed
      if (uploadedCoverPath) {
        try {
          await deleteCover(uploadedCoverPath);
          console.log('Cleaned up orphaned cover image:', uploadedCoverPath);
        } catch (cleanupError) {
          console.warn('Failed to clean up cover image:', cleanupError);
          // Don't block error handling if cleanup fails
        }
        setUploadedCoverPath(null);
      }
      setIsSubmitting(false);
      createErrorToast(mode)(error);
    };

    if (mode === 'new') {
      const bookData =
        data.api_id || data.google_volume_id || data.isbn || data.book_id
          ? {
              ...(data.api_id && { api_id: data.api_id }),
              ...(data.api_source && { api_source: data.api_source }),
              ...(data.google_volume_id && {
                google_volume_id: data.google_volume_id,
              }),
              ...(data.isbn && { isbn: data.isbn }),
              ...(data.book_id && { book_id: data.book_id }),
            }
          : undefined;

      const bookSource = data.api_id ? 'search' : 'manual';
      const creationContext = formFlowTracking.getCreationContext();

      addDeadline(
        {
          deadlineDetails,
          progressDetails,
          status: statusValue,
          bookData,
          analyticsContext: {
            book_source: bookSource,
            ...creationContext,
          },
        } as any,
        successCallback,
        errorCallback
      );
    } else {
      updateDeadline(
        { deadlineDetails, progressDetails, status: statusValue },
        successCallback,
        errorCallback
      );
    }
  };

  const onValidationError = () => {
    const errors = reactHookFormState.errors;
    const earliestErrorStep = findEarliestErrorStep(errors, mode);
    const firstErrorField = getFirstErrorField(errors, mode);

    // Navigate to the step with the error if it's not the current step
    if (earliestErrorStep !== null && earliestErrorStep !== currentStep) {
      setCurrentStep(earliestErrorStep);
    }

    // Focus on the first error field and scroll to it
    if (firstErrorField) {
      setFocus(firstErrorField as keyof DeadlineFormData);

      // Scroll to the error field position
      const fieldY = fieldPositions.current.get(firstErrorField);
      if (fieldY !== undefined && scrollViewRef.current) {
        // Add offset to show field label above the input
        const scrollOffset = Math.max(0, fieldY - 100);
        scrollViewRef.current.scrollToPosition(0, scrollOffset, true);
      }
    }
  };

  // Navigation handlers
  const navigation = createFormNavigation(
    {
      currentStep,
      totalSteps,
      canGoBack: true,
    },
    trigger,
    () => handleSubmit(onSubmit, onValidationError)(),
    selectedFormat,
    setCurrentStep,
    mode,
    () => reactHookFormState.errors,
    setFocus,
    resetAllFormState
  );

  // Event handlers
  const handleFormatChange = createFormatChangeHandler(
    selectedFormat,
    watchedValues,
    previousPageCount,
    setValue,
    setSelectedFormat,
    setPreviousPageCount
  );

  const handlePriorityChange = createPriorityChangeHandler(
    setValue,
    setSelectedPriority
  );

  const onDateChange = createDateChangeHandler(
    setValue,
    setShowDatePicker,
    mode === 'new' ? setDeadlineFromPublicationDate : undefined
  );

  const handleBookSelected = (book: SelectedBook | null) => {
    if (mode === 'new') {
      handleBookSelection(
        book,
        setValue,
        setCurrentStep,
        setDeadlineFromPublicationDate
      );
    }
  };

  const handleManualEntry = () => {
    if (mode === 'new') {
      setCurrentStep(2);
    }
  };

  const hasExistingProgressRecords = Boolean(
    mode === 'edit' &&
      existingDeadline?.progress &&
      existingDeadline.progress.length > 1
  );

  // Save button for header - shown on Step 2 (new mode) or always (edit mode)
  const saveButton = useMemo(() => {
    const showSaveButton =
      (mode === 'new' && currentStep === 2) || mode === 'edit';

    if (!showSaveButton) return null;

    const { isValid } = reactHookFormState;
    const buttonText = isSubmitting
      ? mode === 'new'
        ? 'Adding...'
        : 'Updating...'
      : mode === 'new'
        ? 'Add'
        : 'Save';

    return (
      <TouchableOpacity
        onPress={() => handleSubmit(onSubmit)()}
        disabled={!isValid || isSubmitting}
        style={[
          styles.saveButton,
          (!isValid || isSubmitting) && styles.saveButtonDisabled,
        ]}
      >
        <ThemedText
          typography="titleMedium"
          color="textOnPrimary"
          style={[(!isValid || isSubmitting) && styles.saveTextDisabled]}
        >
          {buttonText}
        </ThemedText>
      </TouchableOpacity>
    );
    // handleSubmit and onSubmit are excluded - button visuals only depend on state, not handler references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentStep, reactHookFormState, isSubmitting]);

  // Safe navigation helper - navigates back if possible, otherwise goes to home
  const safeGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.HOME);
    }
  }, []);

  // Show error if Book not found in edit mode
  if (mode === 'edit' && !existingDeadline) {
    return (
      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={styles.container}>
          <AppHeader title="Edit Deadline" onBack={safeGoBack} />
          <ThemedView style={styles.content}>
            <ThemedText>Book not found</ThemedText>
            <ThemedButton
              title="Go Back"
              onPress={safeGoBack}
              style={{ marginTop: Spacing.md }}
            />
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader
        title={formSteps[currentStep - 1]}
        onBack={navigation.goBack}
        rightElement={saveButton}
      >
        {mode === 'new' && (
          <StepIndicators currentStep={currentStep} totalSteps={totalSteps} />
        )}
      </AppHeader>

      <ThemedKeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={200}
        scrollEnabled={true}
      >
        <ThemedView style={styles.content}>
          {mode === 'new' && currentStep === 1 ? (
            <DeadlineFormStep1
              onBookSelected={handleBookSelected}
              onManualEntry={handleManualEntry}
              setValue={setValue}
            />
          ) : (
            <DeadlineFormStep2Combined
              control={control}
              selectedFormat={selectedFormat}
              onFormatChange={handleFormatChange}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedPriority={selectedPriority}
              onPriorityChange={handlePriorityChange}
              setValue={setValue}
              showDatePicker={showDatePicker}
              onDatePickerToggle={() => setShowDatePicker(true)}
              onDateChange={onDateChange}
              deadline={watchedValues.deadline}
              paceEstimate={paceEstimate}
              paceUrgencyLevel={paceUrgencyLevel}
              impactPreviewData={impactPreviewData}
              mode={mode}
              deadlineFromPublicationDate={
                mode === 'new' ? deadlineFromPublicationDate : false
              }
              hasExistingProgressRecords={hasExistingProgressRecords}
              onFieldLayout={registerFieldPosition}
            />
          )}
        </ThemedView>

        <ThemedView style={styles.navButtons}>
          {currentStep > 1 && (
            <ThemedButton
              title="Back"
              variant="secondary"
              onPress={navigation.goBack}
              style={{ flex: 1 }}
              disabled={isSubmitting}
            />
          )}
          <ThemedButton
            title={
              isSubmitting
                ? mode === 'new'
                  ? 'Adding...'
                  : 'Updating...'
                : currentStep === totalSteps
                  ? mode === 'new'
                    ? 'Add Book'
                    : 'Update Book'
                  : 'Continue'
            }
            onPress={navigation.nextStep}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          />
        </ThemedView>
      </ThemedKeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  navButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveTextDisabled: {
    opacity: 0.7,
  },
});

export default DeadlineFormContainer;
