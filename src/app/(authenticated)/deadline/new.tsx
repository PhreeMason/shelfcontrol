import { ThemedButton, ThemedKeyboardAvoidingView, ThemedKeyboardAwareScrollView, ThemedView } from '@/components/themed';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

import {
    DeadlineFormStep1,
    DeadlineFormStep2,
    FormHeader,
    FormProgressBar,
    StepIndicators
} from '@/components/forms';
import AppHeader from '@/components/shared/AppHeader';
import { useThemeColor } from '@/hooks/useThemeColor';

import {
    calculateCurrentProgressFromForm,
    calculateRemainingFromForm,
    calculateTotalQuantityFromForm,
    getPaceEstimate
} from '@/utils/deadlineCalculations';

import { DeadlineFormData, deadlineFormSchema } from '@/utils/deadlineFormSchema';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewDeadLine = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedFormat, setSelectedFormat] = useState<'physical' | 'ebook' | 'audio'>('physical');
    // Source is now handled directly by form control
    const [selectedPriority, setSelectedPriority] = useState<'flexible' | 'strict'>('flexible');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [paceEstimate, setPaceEstimate] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addDeadline } = useDeadlines();
    const backgroundColor = useThemeColor({}, 'background');

    const formSteps = ['Book Details', 'Set Deadline'];
    const totalSteps = formSteps.length;

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        trigger
    } = useForm<DeadlineFormData>({
        resolver: zodResolver(deadlineFormSchema),
        defaultValues: {
            bookTitle: '',
            bookAuthor: '',
            format: 'physical',
            source: 'arc',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            flexibility: 'flexible'
        }
    });

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
    }, [selectedFormat, watchedValues.deadline, watchedValues.totalQuantity, watchedValues.totalMinutes, watchedValues.currentProgress, watchedValues.currentMinutes]);

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
        } as any

        // Calculate current progress accounting for format
        const finalCurrentProgress = calculateCurrentProgressFromForm(
            selectedFormat,
            data.currentProgress || 0,
            data.currentMinutes
        );

        // If the user has already made progress in the book, they can specify when they started reading.
        // This ensures accurate pace calculations - e.g., if they read 100 pages over the past week
        // before adding the deadline, we track that they've been reading for a week, not that they
        // read 100 pages instantly today. The startDate gets passed to the progress entry's created_at
        // field to maintain an accurate reading history.
        const progressDetails = {
            id: '',
            current_progress: finalCurrentProgress,
            deadline_id: '', // This will be set after the deadline is created
            ...(data.startDate ? { created_at: data.startDate.toISOString() } : {})
        } as any;

        addDeadline(
            {
                deadlineDetails,
                progressDetails,
                bookData: data.api_id ? {
                    api_id: data.api_id,
                    ...(data.book_id ? { book_id: data.book_id } : {}),
                } : undefined,
                startDate: data.startDate
            } as any,
            // Success callback
            () => {
                setIsSubmitting(false);
                Toast.show({
                    type: 'success',
                    text1: 'Deadline added successfully!',
                    autoHide: true,
                    visibilityTime: 1000,
                    position: 'top',
                    onHide: () => {
                        router.replace('/');
                    }
                });
            },
            // Error callback
            (error) => {
                setIsSubmitting(false);
                Toast.show({
                    type: 'error',
                    text1: 'Failed to add deadline',
                    text2: error.message || 'Please try again',
                    autoHide: true,
                    visibilityTime: 3000,
                    position: 'top'
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
            router.back();
        }
    };

    const goBackToIndex = () => {
        router.push('/');
    };

    const onDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setValue('deadline', selectedDate);
        }
    };

    const handleFormatChange = (format: 'physical' | 'ebook' | 'audio') => {
        setSelectedFormat(format);
        setValue('format', format);
    };

    // Source change handler removed - now handled by CustomDropdown

    const handlePriorityChange = (priority: 'flexible' | 'strict') => {
        setSelectedPriority(priority);
        setValue('flexibility', priority);
    };

    return (
        <SafeAreaView edges={['right', 'bottom', 'left']} style={{flex: 1 , backgroundColor}}>
            <ThemedKeyboardAvoidingView style={styles.container}>
                <AppHeader title="New Deadline" onBack={goBackToIndex} />

                <FormProgressBar currentStep={currentStep} totalSteps={totalSteps} />
                <StepIndicators currentStep={currentStep} totalSteps={totalSteps} />
                <ThemedKeyboardAwareScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 48 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <FormHeader
                        title={formSteps[currentStep - 1]}
                        onBack={goBack}
                        showBack={currentStep > 1}
                    />

                    {currentStep === 1 ? (
                        <DeadlineFormStep1
                            control={control}
                            selectedFormat={selectedFormat}
                            onFormatChange={handleFormatChange}
                            setValue={setValue}
                        />
                    ) : (
                        <DeadlineFormStep2
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
                </ThemedKeyboardAwareScrollView>

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
                        title={isSubmitting ? 'Adding...' : (currentStep === totalSteps ? 'Add Book' : 'Continue')}
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

export default NewDeadLine;