import {
  DeadlineFormStep1,
  DeadlineFormStep2,
  DeadlineFormStep3,
  StepIndicators,
} from '@/components/forms';
import { SelectedBook } from '@/types/bookSearch';
import AppHeader from '@/components/shared/AppHeader';
import {
  ThemedButton,
  ThemedKeyboardAwareScrollView,
  ThemedView,
} from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
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
import { getInitialStepFromSearchParams } from '@/utils/deadlineUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const NewDeadline = () => {
  const params = useLocalSearchParams();
  const initialStep = getInitialStepFromSearchParams(params, {
    paramName: 'page',
    defaultStep: 1,
    minStep: 1,
    maxStep: 3,
  });

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [selectedFormat, setSelectedFormat] = useState<
    'physical' | 'eBook' | 'audio'
  >('eBook');
  // Source is now handled directly by form control
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'active'>(
    'active'
  );
  const [selectedPriority, setSelectedPriority] = useState<
    'flexible' | 'strict'
  >('flexible');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paceEstimate, setPaceEstimate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadlineFromPublicationDate, setDeadlineFromPublicationDate] =
    useState(false);
  const { addDeadline } = useDeadlines();
  const { colors } = useTheme();

  const formSteps = ['Find Book', 'Book Details', 'Set Deadline'];
  const totalSteps = formSteps.length;

  const { control, handleSubmit, watch, setValue, trigger } =
    useForm<DeadlineFormData>({
      resolver: zodResolver(deadlineFormSchema),
      defaultValues: {
        bookTitle: '',
        bookAuthor: '',
        format: 'eBook',
        source: 'ARC',
        status: 'active',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        flexibility: 'flexible',
      },
    });

  useEffect(() => {
    // Prefill from params (read again flow)
    if (!params) return;

    const str = (v: any) => (Array.isArray(v) ? v[0] : v);

    const format = str(params.format);
    if (format && ['physical', 'eBook', 'audio'].includes(format)) {
      setSelectedFormat(format as any);
      setValue('format', format as any);
    }

    const flexibility = str(params.flexibility);
    if (flexibility && ['flexible', 'strict'].includes(flexibility)) {
      setSelectedPriority(flexibility as any);
      setValue('flexibility', flexibility as any);
    }

    const bookTitle = str(params.bookTitle);
    if (bookTitle) setValue('bookTitle', bookTitle);

    const bookAuthor = str(params.bookAuthor);
    if (bookAuthor) setValue('bookAuthor', bookAuthor);

    const totalQuantity = str(params.totalQuantity);
    if (totalQuantity && !isNaN(Number(totalQuantity))) {
      setValue('totalQuantity', Number(totalQuantity));
    }

    const totalMinutes = str(params.totalMinutes);
    if (totalMinutes && !isNaN(Number(totalMinutes))) {
      setValue('totalMinutes', Number(totalMinutes));
    }

    const book_id = str((params as any).book_id);
    if (book_id) setValue('book_id', book_id);

    const api_id = str((params as any).api_id);
    if (api_id) setValue('api_id', api_id);
  }, [params, setValue]);

  const watchedValues = watch();

  // Calculate pace estimate when deadline or progress changes
  useEffect(() => {
    const deadline = watchedValues.deadline;
    const remaining = calculateRemainingFromForm(
      selectedFormat,
      watchedValues.totalQuantity || 0,
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
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    // Calculate total quantity accounting for format
    const finalTotalQuantity = calculateTotalQuantityFromForm(
      selectedFormat,
      data.totalQuantity,
      data.totalMinutes
    );

    const deadlineDetails = {
      id: '',
      author: data.bookAuthor || null,
      book_title: data.bookTitle,
      deadline_date: data.deadline.toISOString(),
      total_quantity: finalTotalQuantity,
      format: selectedFormat,
      source: data.source,
      flexibility: selectedPriority,
      book_id: data.book_id || null,
    } as any;

    const statusValue = selectedStatus === 'pending' ? 'requested' : 'reading';

    // Calculate current progress accounting for format
    const finalCurrentProgress = calculateCurrentProgressFromForm(
      selectedFormat,
      data.currentProgress || 0,
      data.currentMinutes
    );

    const progressDetails = {
      id: '',
      current_progress: finalCurrentProgress,
      deadline_id: '', // This will be set after the deadline is created
    } as any;

    addDeadline(
      {
        deadlineDetails,
        progressDetails,
        status: statusValue,
        bookData: data.api_id
          ? {
              api_id: data.api_id,
              ...(data.book_id ? { book_id: data.book_id } : {}),
            }
          : undefined,
      } as any,
      // Success callback
      () => {
        setIsSubmitting(false);
        Toast.show({
          swipeable: true,
          type: 'success',
          text1: 'Deadline added successfully!',
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
          onHide: () => {
            router.replace('/');
          },
        });
      },
      // Error callback
      error => {
        setIsSubmitting(false);
        Toast.show({
          swipeable: true,
          type: 'error',
          text1: 'Failed to add deadline',
          text2: error.message || 'Please try again',
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
        });
      }
    );
  };

  const nextStep = async () => {
    if (currentStep < totalSteps) {
      // Step 1 -> Step 2: No validation needed, just proceed
      if (currentStep === 1) {
        setCurrentStep(2);
        return;
      }

      // Step 2 -> Step 3: Validate book details
      if (currentStep === 2) {
        const fieldsToValidate: (keyof DeadlineFormData)[] = [
          'bookTitle',
          'format',
          'source',
          'totalQuantity',
        ];

        // Add totalMinutes validation for audio format
        if (selectedFormat === 'audio') {
          fieldsToValidate.push('totalMinutes');
        }

        const result = await trigger(fieldsToValidate);

        if (result) {
          setCurrentStep(3);
        }
      }
    } else {
      // Step 3: Submit form
      handleSubmit(onSubmit)();
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('deadline', selectedDate);
      // If user manually changes the deadline, clear the publication date flag
      setDeadlineFromPublicationDate(false);
    }
  };

  const handleFormatChange = (format: 'physical' | 'eBook' | 'audio') => {
    setSelectedFormat(format);
    setValue('format', format);
  };

  // Source change handler removed - now handled by CustomDropdown

  const handlePriorityChange = (priority: 'flexible' | 'strict') => {
    setSelectedPriority(priority);
    setValue('flexibility', priority);
  };

  const handleBookSelected = (book: SelectedBook | null) => {
    if (book?.publication_date) {
      const publicationDate = new Date(book.publication_date);
      const now = new Date();

      // Check if publication date is in the future
      if (publicationDate > now) {
        setValue('deadline', publicationDate);
        setDeadlineFromPublicationDate(true);
      } else {
        setDeadlineFromPublicationDate(false);
      }
    } else {
      setDeadlineFromPublicationDate(false);
    }
    setCurrentStep(2);
  };

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader title={formSteps[currentStep - 1]} onBack={goBack}>
        <StepIndicators currentStep={currentStep} totalSteps={totalSteps} />
      </AppHeader>

      <ThemedKeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        // extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
        enableOnAndroid={true}
        scrollEnabled={true}
      >
        <ThemedView style={styles.content}>
          {currentStep === 1 ? (
            <DeadlineFormStep1
              onBookSelected={handleBookSelected}
              onManualEntry={() => {
                setCurrentStep(2);
              }}
              setValue={setValue}
            />
          ) : currentStep === 2 ? (
            <DeadlineFormStep2
              control={control}
              selectedFormat={selectedFormat}
              onFormatChange={handleFormatChange}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              setValue={setValue}
            />
          ) : (
            <DeadlineFormStep3
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
              deadlineFromPublicationDate={deadlineFromPublicationDate}
            />
          )}
        </ThemedView>

        <ThemedView style={styles.navButtons}>
          {currentStep > 1 && (
            <ThemedButton
              title="Back"
              variant="secondary"
              onPress={goBack}
              style={{ flex: 1 }}
              disabled={isSubmitting}
            />
          )}
          <ThemedButton
            title={
              isSubmitting
                ? 'Adding...'
                : currentStep === totalSteps
                  ? 'Add Book'
                  : 'Continue'
            }
            onPress={nextStep}
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
    // paddingBottom: 20,
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

export default NewDeadline;
