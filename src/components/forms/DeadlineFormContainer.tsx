import AppHeader from '@/components/shared/AppHeader';
import {
  ThemedButton,
  ThemedKeyboardAwareScrollView,
  ThemedText,
  ThemedView,
} from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { useFormFlowTracking } from '@/hooks/analytics/useFormFlowTracking';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { SelectedBook } from '@/types/bookSearch';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateRemainingFromForm,
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
  getFormDefaultValues,
  handleBookSelection,
  initializeFormState,
  populateFormFromDeadline,
  populateFormFromParams,
  prepareDeadlineDetailsFromForm,
  prepareProgressDetailsFromForm,
} from '@/utils/deadlineFormUtils';
import { getInitialStepFromSearchParams } from '@/utils/deadlineUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeadlineFormStep1 } from './DeadlineFormStep1';
import { DeadlineFormStep2 } from './DeadlineFormStep2';
import { DeadlineFormStep3 } from './DeadlineFormStep3';
import { DeadlineFormStep4 } from './DeadlineFormStep4';
import { StepIndicators } from './StepIndicators';

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
  const { addDeadline, updateDeadline } = useDeadlines();

  // Determine steps and initial step
  const formSteps =
    mode === 'new'
      ? ['Find Book', 'Book Details', 'Additional Details', 'Set Deadline']
      : ['Book Details', 'Additional Details', 'Set Deadline'];
  const totalSteps = formSteps.length;

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

  const isInitialized = useRef(false);
  const bookSelectedRef = useRef(false);

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: reactHookFormState,
  } = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineFormSchema),
    defaultValues: getFormDefaultValues(mode),
  });

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

  const onSubmit = (data: DeadlineFormData) => {
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

    const statusValue = selectedStatus === 'pending' ? 'pending' : 'reading';

    const successCallback = () => {
      if (mode === 'new') {
        formFlowTracking.markCompleted();
      }

      setIsSubmitting(false);
      createSuccessToast(mode)();
    };

    const errorCallback = (error: Error) => {
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

  // Navigation handlers
  const navigation = createFormNavigation(
    {
      currentStep,
      totalSteps,
      canGoBack: true,
    },
    trigger,
    () => handleSubmit(onSubmit)(),
    selectedFormat,
    setCurrentStep,
    mode,
    () => reactHookFormState.errors
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

  // Show error if deadline not found in edit mode
  if (mode === 'edit' && !existingDeadline) {
    return (
      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={styles.container}>
          <AppHeader title="Edit Deadline" onBack={() => router.back()} />
          <ThemedView style={styles.content}>
            <ThemedText>Deadline not found</ThemedText>
            <ThemedButton
              title="Go Back"
              onPress={() => router.back()}
              style={{ marginTop: 16 }}
            />
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const hasExistingProgressRecords = Boolean(
    mode === 'edit' &&
      existingDeadline?.progress &&
      existingDeadline.progress.length > 1
  );

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title={formSteps[currentStep - 1]} onBack={navigation.goBack}>
        <StepIndicators currentStep={currentStep} totalSteps={totalSteps} />
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
          ) : (mode === 'new' && currentStep === 2) ||
            (mode === 'edit' && currentStep === 1) ? (
            <DeadlineFormStep2
              control={control}
              selectedFormat={selectedFormat}
              onFormatChange={mode === 'new' ? handleFormatChange : () => {}}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              setValue={setValue}
              isEditMode={mode === 'edit'}
            />
          ) : (mode === 'new' && currentStep === 3) ||
            (mode === 'edit' && currentStep === 2) ? (
            <DeadlineFormStep3 control={control} setValue={setValue} />
          ) : (
            <DeadlineFormStep4
              control={control}
              selectedFormat={selectedFormat}
              selectedPriority={selectedPriority}
              onPriorityChange={handlePriorityChange}
              showDatePicker={showDatePicker}
              onDatePickerToggle={() => setShowDatePicker(true)}
              onDateChange={onDateChange}
              deadline={watchedValues.deadline}
              paceEstimate={paceEstimate}
              watchedValues={watchedValues}
              setValue={setValue}
              deadlineFromPublicationDate={
                mode === 'new' ? deadlineFromPublicationDate : false
              }
              hasExistingProgressRecords={hasExistingProgressRecords}
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
    padding: 16,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    marginBottom: 20,
  },
});

export default DeadlineFormContainer;
