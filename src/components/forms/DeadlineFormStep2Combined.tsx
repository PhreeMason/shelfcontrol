import AcquisitionSourceTypeaheadInput from '@/components/shared/AcquisitionSourceTypeaheadInput';
import CoverImagePicker from '@/components/shared/CoverImagePicker';
import CustomInput from '@/components/shared/CustomInput';
import TypeTypeaheadInput from '@/components/shared/TypeTypeaheadInput';
import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import {
  useGetAudiobookDuration,
  useGetAudiobookFromAudible,
} from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { UrgencyLevel } from '@/types/deadline.types';
import { convertMsToHoursAndMinutes } from '@/utils/audiobookTimeUtils';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
import { toTitleCase } from '@/utils/stringUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import {
  LayoutChangeEvent,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { AudiobookDurationHelpText } from './AudiobookDurationHelpText';
import { FormatSelector } from './FormatSelector';
import {
  ImpactPreviewData,
  ImpactPreviewSection,
} from './ImpactPreviewSection';
import { PaceEstimateBox } from './PaceEstimateBox';
import { PrioritySelector } from './PrioritySelector';
import { StatusSelector } from './StatusSelector';

interface DeadlineFormStep2CombinedProps {
  control: Control<DeadlineFormData>;
  selectedFormat: 'physical' | 'eBook' | 'audio';
  onFormatChange: (format: 'physical' | 'eBook' | 'audio') => void;
  selectedStatus: 'applied' | 'pending' | 'active';
  onStatusChange: (status: 'applied' | 'pending' | 'active') => void;
  selectedPriority: 'flexible' | 'strict';
  onPriorityChange: (priority: 'flexible' | 'strict') => void;
  setValue: (name: keyof DeadlineFormData, value: any) => void;
  showDatePicker: boolean;
  onDatePickerToggle: () => void;
  onDateChange: (event: any, selectedDate?: Date) => void;
  deadline: Date;
  paceEstimate: string;
  paceUrgencyLevel: UrgencyLevel;
  impactPreviewData: ImpactPreviewData | null;
  mode: 'new' | 'edit';
  deadlineFromPublicationDate?: boolean;
  hasExistingProgressRecords?: boolean;
  onFieldLayout?: (fieldName: string, y: number) => void;
}

export const DeadlineFormStep2Combined = ({
  control,
  selectedFormat,
  onFormatChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  setValue,
  showDatePicker,
  onDatePickerToggle,
  onDateChange,
  deadline,
  paceEstimate,
  paceUrgencyLevel,
  impactPreviewData,
  mode,
  deadlineFromPublicationDate = false,
  hasExistingProgressRecords = false,
  onFieldLayout,
}: DeadlineFormStep2CombinedProps) => {
  const { colors } = useTheme();
  const hasAutoFilledDuration = useRef(false);

  // Helper to track field positions for scroll-to-error
  const handleFieldLayout =
    (fieldName: string) => (event: LayoutChangeEvent) => {
      if (onFieldLayout) {
        onFieldLayout(fieldName, event.nativeEvent.layout.y);
      }
    };

  // Watch values
  const watchedBookId = useWatch({ control, name: 'book_id' });
  const bookCoverImageUrl = useWatch({ control, name: 'book_cover_image_url' });
  const isPublisherAutofilled = useWatch({
    control,
    name: 'isPublisherAutofilled',
  });
  const publishers = useWatch({ control, name: 'publishers' }) || [];
  const watchedValues = {
    bookTitle: useWatch({ control, name: 'bookTitle' }),
    bookAuthor: useWatch({ control, name: 'bookAuthor' }),
    totalQuantity: useWatch({ control, name: 'totalQuantity' }),
    totalMinutes: useWatch({ control, name: 'totalMinutes' }),
    currentProgress: useWatch({ control, name: 'currentProgress' }),
    currentMinutes: useWatch({ control, name: 'currentMinutes' }),
    deadline: useWatch({ control, name: 'deadline' }),
  };

  // Primary: Audible lookup (with community cache + similarity check)
  const audibleRequest =
    selectedFormat === 'audio' && watchedValues.bookTitle && mode === 'new'
      ? {
          bookId: watchedBookId || undefined,
          title: watchedValues.bookTitle,
          author: watchedValues.bookAuthor || undefined,
        }
      : null;

  const { data: audibleData, isLoading: isLoadingAudible } =
    useGetAudiobookFromAudible(audibleRequest);

  // Track if user rejected Audible result to trigger Spotify fallback
  const [rejectedAudible, setRejectedAudible] = useState(false);

  // Fallback: Spotify lookup - only when Audible fails or is rejected
  const shouldTrySpotify =
    selectedFormat === 'audio' &&
    watchedValues.bookTitle &&
    mode === 'new' &&
    (rejectedAudible || (!isLoadingAudible && !audibleData));

  const spotifyRequest = shouldTrySpotify
    ? {
        bookId: watchedBookId || undefined,
        title: watchedValues.bookTitle,
        author: watchedValues.bookAuthor || undefined,
      }
    : null;

  const { data: spotifyData, isLoading: isLoadingSpotify } =
    useGetAudiobookDuration(spotifyRequest);

  // Handle "Not right?" rejection
  const handleRejectAudible = useCallback(() => {
    setRejectedAudible(true);
    // Reset auto-fill flag so Spotify data can fill the fields
    hasAutoFilledDuration.current = false;
    setValue('totalQuantity', 0);
    setValue('totalMinutes', 0);
  }, [setValue]);

  // Reset rejection state when leaving audio format
  // Reset auto-fill flag on any format/title change so new lookups can fill
  useEffect(() => {
    if (selectedFormat !== 'audio') {
      setRejectedAudible(false);
    }
    hasAutoFilledDuration.current = false;
  }, [selectedFormat, watchedValues.bookTitle]);

  // Auto-fill duration once when data arrives (prefer Audible, then Spotify)
  useEffect(() => {
    if (selectedFormat !== 'audio') return;
    if (hasAutoFilledDuration.current) return;

    // Use Audible data unless rejected, then use Spotify
    const durationMs = rejectedAudible
      ? spotifyData?.duration_ms
      : audibleData?.duration_ms || spotifyData?.duration_ms;

    if (!durationMs) return;

    const { hours, minutes } = convertMsToHoursAndMinutes(durationMs);
    setValue('totalQuantity', hours);
    if (minutes > 0) {
      setValue('totalMinutes', minutes);
    }
    hasAutoFilledDuration.current = true;
  }, [audibleData, spotifyData, rejectedAudible, selectedFormat, setValue]);

  // Publisher management
  const addPublisher = () => {
    if (publishers.length < 5) {
      setValue('publishers', [...publishers, '']);
    }
  };

  const removePublisher = (index: number) => {
    const newPublishers = publishers.filter((_, i) => i !== index);
    setValue(
      'publishers',
      newPublishers.length > 0 ? newPublishers : undefined
    );
    if (index === 0 && isPublisherAutofilled) {
      setValue('isPublisherAutofilled', false);
    }
  };

  // Dynamic labels
  const getTotalQuantityLabel = () => {
    switch (selectedFormat) {
      case 'audio':
        return (
          <>
            Total Time <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
          </>
        );
      default:
        return (
          <>
            Total Pages <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
          </>
        );
    }
  };

  const getTotalQuantityPlaceholder = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Hours';
      default:
        return 'How many pages total?';
    }
  };

  const getProgressLabel = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Time Already Listened';
      default:
        return 'Pages Already Read';
    }
  };

  const getProgressPlaceholder = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Hours so far';
      default:
        return 'Pages so far?';
    }
  };

  const isEditMode = mode === 'edit';

  return (
    <View style={{ flex: 1, gap: Spacing.lg }}>
      {/* ========== BOOK DETAILS SECTION ========== */}
      <ThemedText
        typography="titleSmall"
        style={{
          marginTop: Spacing.sm,
          marginBottom: Spacing.negative.sm,
          opacity: 0.7,
          letterSpacing: 0.5,
        }}
      >
        BOOK DETAILS
      </ThemedText>

      <View>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Cover Image
        </ThemedText>
        <Controller
          control={control}
          name="cover_image_url"
          render={({ field: { onChange, value } }) => (
            <Controller
              control={control}
              name="cover_image_source"
              render={({
                field: { onChange: onModeChange, value: modeValue },
              }) => (
                <CoverImagePicker
                  value={value || null}
                  onImageChange={onChange}
                  mode={(modeValue as 'upload' | 'url' | 'none') || 'none'}
                  onModeChange={newMode => {
                    onModeChange(newMode);
                    if (newMode === 'none') {
                      onChange(null);
                    }
                  }}
                  editable={true}
                  defaultPreviewUrl={bookCoverImageUrl || null}
                />
              )}
            />
          )}
        />
      </View>

      <View onLayout={handleFieldLayout('bookTitle')}>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Book Title <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
        </ThemedText>
        <CustomInput
          control={control}
          name="bookTitle"
          testID="input-bookTitle"
          placeholder="Enter the book title"
          transformOnBlur={toTitleCase}
        />
        {watchedBookId && (
          <ThemedText color="primary" style={styles.autoFilledIndicator}>
            ✓ Linked from library
          </ThemedText>
        )}
      </View>

      <View>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Author
        </ThemedText>
        <CustomInput
          control={control}
          name="bookAuthor"
          testID="input-bookAuthor"
          placeholder="Author name (optional)"
        />
        {watchedBookId && (
          <ThemedText color="primary" style={styles.autoFilledIndicator}>
            ✓ Linked from library
          </ThemedText>
        )}
      </View>

      <View>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Status
        </ThemedText>
        <StatusSelector
          selectedStatus={selectedStatus}
          onSelectStatus={onStatusChange}
        />
        <ThemedText
          color="textMuted"
          style={{ marginTop: Spacing.sm, lineHeight: 18 }}
        >
          Is this book actively being read?
        </ThemedText>
      </View>

      <View>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Format
        </ThemedText>
        <FormatSelector
          selectedFormat={selectedFormat}
          onSelectFormat={onFormatChange}
          disabled={isEditMode}
        />
        {isEditMode ? (
          <ThemedText
            color="textMuted"
            style={{ marginTop: Spacing.sm, lineHeight: 18 }}
          >
            Format cannot be changed after creation
          </ThemedText>
        ) : null}
      </View>

      <View onLayout={handleFieldLayout('totalQuantity')}>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          {getTotalQuantityLabel()}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <CustomInput
              control={control}
              name="totalQuantity"
              inputType="integer"
              placeholder={getTotalQuantityPlaceholder()}
              keyboardType="numeric"
              testID="input-totalQuantity"
            />
          </View>
          {selectedFormat === 'audio' ? (
            <View style={{ flex: 1 }}>
              <CustomInput
                control={control}
                name="totalMinutes"
                inputType="integer"
                placeholder="Minutes (optional)"
                keyboardType="numeric"
                testID="input-totalMinutes"
              />
            </View>
          ) : null}
        </View>
        <View style={{ marginTop: -Spacing.md }}>
          <AudiobookDurationHelpText
            selectedFormat={selectedFormat}
            audibleRequest={audibleRequest}
            isLoadingAudible={isLoadingAudible}
            isLoadingSpotify={isLoadingSpotify}
            rejectedAudible={rejectedAudible}
            audibleData={audibleData}
            spotifyData={spotifyData}
            onRejectAudible={handleRejectAudible}
          />
        </View>
      </View>

      {/* ========== ADDITIONAL INFORMATION SECTION ========== */}
      <View style={styles.sectionDivider} />
      <ThemedText
        typography="titleSmall"
        style={{
          marginTop: Spacing.sm,
          marginBottom: Spacing.negative.sm,
          opacity: 0.7,
          letterSpacing: 0.5,
        }}
      >
        ADDITIONAL INFORMATION
      </ThemedText>

      <View style={{ zIndex: 3 }} onLayout={handleFieldLayout('type')}>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Book Type <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
        </ThemedText>
        <TypeTypeaheadInput
          control={control}
          name="type"
          placeholder="Select a type or add your own"
          testID="input-type"
        />
      </View>

      <View style={{ zIndex: 2 }}>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Source
        </ThemedText>
        <AcquisitionSourceTypeaheadInput
          control={control}
          name="acquisition_source"
          testID="input-acquisition-source"
          placeholder="Select a source or type in a new one"
        />
      </View>

      <View style={{ zIndex: 1 }}>
        <ThemedText
          variant="defaultSemiBold"
          style={{ marginBottom: Spacing.sm }}
        >
          Publishers
        </ThemedText>
        {publishers.length === 0 ? (
          <TouchableOpacity
            style={[
              styles.addButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={addPublisher}
            testID="add-publisher-button"
          >
            <IconSymbol name="plus" size={20} color={colors.primary} />
            <ThemedText color="primary">Add Publisher</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: Spacing.md }}>
            {publishers.map((_: string, index: number) => (
              <View
                key={index}
                style={{ flexDirection: 'row', gap: Spacing.sm }}
              >
                <View style={{ flex: 1 }}>
                  <CustomInput
                    control={control}
                    name={`publishers.${index}` as any}
                    testID={`input-publisher-${index}`}
                    placeholder="Publisher name"
                  />
                  {index === 0 && isPublisherAutofilled && (
                    <ThemedText
                      color="primary"
                      style={styles.autoFilledIndicator}
                    >
                      ✓ Linked from library
                    </ThemedText>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => removePublisher(index)}
                  testID={`remove-publisher-${index}`}
                >
                  <IconSymbol name="trash" size={30} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  opacity: publishers.length >= 5 ? 0.5 : 1,
                },
              ]}
              onPress={addPublisher}
              disabled={publishers.length >= 5}
              testID="add-publisher-button"
            >
              <IconSymbol name="plus" size={20} color={colors.primary} />
              <ThemedText color="primary">Add Another Publisher</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        <ThemedText
          color="textMuted"
          style={{ marginTop: Spacing.sm, lineHeight: 18 }}
        >
          {publishers.length >= 5
            ? 'Maximum of 5 publishers reached'
            : 'Add up to 5 publishers for this book'}
        </ThemedText>
      </View>

      {/* ========== READING SCHEDULE SECTION ========== */}
      <View style={styles.sectionDivider} />
      <ThemedText
        typography="titleSmall"
        style={{
          marginTop: Spacing.sm,
          marginBottom: Spacing.negative.sm,
          opacity: 0.7,
          letterSpacing: 0.5,
        }}
      >
        READING SCHEDULE
      </ThemedText>

      <View onLayout={handleFieldLayout('deadline')}>
        <ThemedText variant="default" style={{ marginBottom: Spacing.sm }}>
          Due Date <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
        </ThemedText>
        <Controller
          control={control}
          name="deadline"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.inputBlurBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onDatePickerToggle}
                testID="date-picker-button"
              >
                <ThemedText>
                  {value.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </ThemedText>
                {showDatePicker && (
                  <DateTimePicker
                    themeVariant="light"
                    value={deadline}
                    mode="date"
                    display="inline"
                    onChange={onDateChange}
                    testID="input-deadline"
                  />
                )}
              </TouchableOpacity>
            </>
          )}
        />
        {deadlineFromPublicationDate && (
          <ThemedText
            color="primary"
            style={[styles.autoFilledIndicator, { marginTop: Spacing.xs }]}
          >
            ✓ Set to book publication date
          </ThemedText>
        )}
        <ThemedText
          color="textMuted"
          style={{ marginTop: Spacing.sm, lineHeight: 18 }}
        >
          Past dates will be marked as overdue
        </ThemedText>
      </View>

      <View>
        <ThemedText variant="default" style={{ marginBottom: Spacing.sm }}>
          {getProgressLabel()}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <CustomInput
              control={control}
              name="currentProgress"
              inputType="integer"
              placeholder={getProgressPlaceholder()}
              keyboardType="numeric"
              editable={!hasExistingProgressRecords}
              style={{ opacity: hasExistingProgressRecords ? 0.5 : 1 }}
            />
          </View>
          {selectedFormat === 'audio' ? (
            <View style={{ flex: 1 }}>
              <CustomInput
                control={control}
                name="currentMinutes"
                inputType="integer"
                placeholder="Minutes"
                keyboardType="numeric"
                editable={!hasExistingProgressRecords}
                style={{ opacity: hasExistingProgressRecords ? 0.5 : 1 }}
              />
            </View>
          ) : null}
        </View>
        {hasExistingProgressRecords && (
          <ThemedText
            color="textMuted"
            style={{ marginTop: Spacing.sm, lineHeight: 18 }}
          >
            Starting progress cannot be changed after progress records have been
            added
          </ThemedText>
        )}
        {((watchedValues.currentProgress ?? 0) > 0 ||
          (watchedValues.currentMinutes ?? 0) > 0) && (
          <View>
            <Controller
              control={control}
              name="ignoreInCalcs"
              render={({ field: { value, onChange } }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    marginTop: Spacing.negative.md,
                    marginBottom: Spacing.sm,
                  }}
                >
                  <Switch
                    testID="checkbox-ignoreInCalcs"
                    value={value ?? true}
                    onValueChange={onChange}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor={colors.surface}
                  />
                  <ThemedText style={{ flex: 1 }}>
                    Exclude from today's reading progress
                  </ThemedText>
                </View>
              )}
            />
          </View>
        )}
      </View>

      <View>
        <ThemedText variant="default" style={{ marginBottom: Spacing.sm }}>
          Due Date Flexibility
        </ThemedText>
        <PrioritySelector
          selectedPriority={selectedPriority}
          onSelectPriority={onPriorityChange}
        />
        <ThemedText
          color="textMuted"
          style={{ marginTop: Spacing.sm, lineHeight: 18 }}
        >
          Can this date be adjusted if needed?
        </ThemedText>
      </View>

      <PaceEstimateBox
        paceEstimate={paceEstimate}
        urgencyLevel={paceUrgencyLevel}
      />

      {impactPreviewData && (
        <ImpactPreviewSection impactData={impactPreviewData} mode={mode} />
      )}

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          typography="titleMediumPlus"
          color="good"
          style={{ marginBottom: Spacing.sm }}
        >
          ✓ Ready to {mode === 'new' ? 'Add' : 'Update'}
        </ThemedText>
        {watchedValues.bookTitle && watchedValues.deadline ? (
          <ThemedText
            typography="bodyMedium"
            color="primary"
            style={{ fontWeight: 'bold' }}
          >
            {watchedValues.bookTitle}{' '}
            <ThemedText>
              • Due{' '}
              {watchedValues.deadline.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </ThemedText>
          </ThemedText>
        ) : (
          <ThemedText>
            'Complete the form above to see your reading plan'
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionDivider: {
    height: Spacing.md,
  },
  autoFilledIndicator: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.negative.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  removeButton: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInput: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  summaryCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    borderWidth: 2,
  },
});
