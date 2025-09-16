import {
  DeadlineFormStep2,
  DeadlineFormStep3,
  StepIndicators,
} from '@/components/forms';
import AppHeader from '@/components/shared/AppHeader';
import {
  ThemedButton,
  ThemedKeyboardAvoidingView,
  ThemedScrollView,
  ThemedText,
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
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { convertMinutesToHoursAndMinutes } from '@/utils/audiobookTimeUtils';

import {
  DeadlineFormData,
  deadlineFormSchema,
} from '@/utils/deadlineFormSchema';
import { getInitialStepFromSearchParams } from '@/utils/deadlineUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const EditDeadline = () => {
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const initialStep = getInitialStepFromSearchParams(
    { page },
    { paramName: 'page', defaultStep: 1, minStep: 1, maxStep: 3 }
  );

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [selectedFormat, setSelectedFormat] = useState<
    'physical' | 'eBook' | 'audio'
  >('physical');
  const [selectedPriority, setSelectedPriority] = useState<
    'flexible' | 'strict'
  >('flexible');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paceEstimate, setPaceEstimate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { deadlines, updateDeadline } = useDeadlines();
  const { colors } = useTheme();

  // Find the deadline to edit
  const deadline = deadlines.find(d => d.id === id);

  const formSteps = ['Book Details', 'Set Deadline'];
  const totalSteps = formSteps.length;

  const { control, handleSubmit, watch, setValue, trigger } =
    useForm<DeadlineFormData>({
      resolver: zodResolver(deadlineFormSchema),
      defaultValues: {
        bookTitle: '',
        bookAuthor: '',
        format: 'physical',
        source: 'ARC',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalQuantity: 0,
        totalMinutes: 0,
        currentMinutes: 0,
        currentProgress: 0,
        flexibility: 'flexible',
      },
    });

  // Pre-populate form with existing deadline data
  useEffect(() => {
    if (deadline) {
      setValue('bookTitle', deadline.book_title);
      setValue('bookAuthor', deadline.author || '');
      setValue('format', deadline.format);
      setValue('source', deadline.source || 'ARC');
      setValue('deadline', new Date(deadline.deadline_date));
      setValue('flexibility', deadline.flexibility);
      setValue('book_id', deadline.book_id || undefined);

      setSelectedFormat(deadline.format);
      setSelectedPriority(deadline.flexibility as 'flexible' | 'strict');

      // Get the latest progress entry
      const latestProgress =
        deadline.progress && deadline.progress.length > 0
          ? deadline.progress[deadline.progress.length - 1]
          : null;

      // Set quantity/time based on format
      if (deadline.format === 'audio') {
        // Convert total minutes to hours and minutes for form display
        const { hours, minutes } = convertMinutesToHoursAndMinutes(
          deadline.total_quantity
        );
        setValue('totalQuantity', hours);
        setValue('totalMinutes', minutes);

        // Convert current progress minutes to hours and minutes for form display
        const currentProgressMinutes = latestProgress?.current_progress || 0;
        const { hours: currentHours, minutes: currentMins } =
          convertMinutesToHoursAndMinutes(currentProgressMinutes);
        setValue('currentProgress', currentHours);
        setValue('currentMinutes', currentMins);
      } else {
        setValue('totalQuantity', deadline.total_quantity);
        setValue('currentProgress', latestProgress?.current_progress || 0);
      }
    }
  }, [deadline, setValue]);

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

  // Show error if deadline not found
  if (!deadline) {
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
      id: deadline.id,
      author: data.bookAuthor || null,
      book_title: data.bookTitle,
      deadline_date: data.deadline.toISOString(),
      total_quantity: finalTotalQuantity,
      format: selectedFormat,
      source: data.source,
      flexibility: selectedPriority,
      book_id: data.book_id || deadline.book_id || null,
      user_id: deadline.user_id,
      created_at: deadline.created_at,
      updated_at: new Date().toISOString(),
    };
    // Calculate current progress accounting for format
    const finalCurrentProgress = calculateCurrentProgressFromForm(
      selectedFormat,
      data.currentProgress || 0,
      data.currentMinutes
    );

    // Get the latest progress entry ID if it exists
    const latestProgress =
      deadline.progress && deadline.progress.length > 0
        ? deadline.progress[deadline.progress.length - 1]
        : null;

    const progressDetails: any = {
      id: latestProgress?.id || '',
      current_progress: finalCurrentProgress,
      deadline_id: deadline.id,
    };

    updateDeadline(
      {
        deadlineDetails,
        progressDetails,
      },
      // Success callback
      () => {
        setIsSubmitting(false);
        Toast.show({
          swipeable: true,
          type: 'success',
          text1: 'Deadline updated successfully!',
          autoHide: true,
          visibilityTime: 1500,
          position: 'top',
          onHide: () => {
            // router.replace(`/deadline/${id}/view`);
            router.back();
          },
        });
      },
      // Error callback
      error => {
        setIsSubmitting(false);
        Toast.show({
          swipeable: true,
          type: 'error',
          text1: 'Failed to update deadline',
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
        setCurrentStep(currentStep + 1);
      }
    } else {
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
    }
  };

  const handleFormatChange = (_format: 'physical' | 'eBook' | 'audio') => {
    // Format should not be changeable in edit mode
    // This function is kept for compatibility but does nothing
    return;
  };

  const handlePriorityChange = (priority: 'flexible' | 'strict') => {
    setSelectedPriority(priority);
    setValue('flexibility', priority);
  };

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ThemedKeyboardAvoidingView style={styles.container}>
        <AppHeader title={formSteps[currentStep - 1]} onBack={goBack}>
          <StepIndicators currentStep={currentStep} totalSteps={totalSteps} />
        </AppHeader>
        <ThemedScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 ? (
            <DeadlineFormStep2
              control={control}
              selectedFormat={selectedFormat}
              onFormatChange={handleFormatChange}
              setValue={setValue}
              isEditMode={true}
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
            />
          )}
        </ThemedScrollView>

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
                ? 'Updating...'
                : currentStep === totalSteps
                  ? 'Update Book'
                  : 'Continue'
            }
            onPress={nextStep}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          />
        </ThemedView>
      </ThemedKeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
});

export default EditDeadline;
