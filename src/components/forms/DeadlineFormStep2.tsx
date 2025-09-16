import CustomDropdown from '@/components/shared/CustomDropdown';
import CustomInput from '@/components/shared/CustomInput';
import { ThemedText } from '@/components/themed';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
import { toTitleCase } from '@/utils/stringUtils';
import React from 'react';
import { Control, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { FormatSelector } from './FormatSelector';

interface DeadlineFormStep2Props {
  control: Control<DeadlineFormData>;
  selectedFormat: 'physical' | 'eBook' | 'audio';
  onFormatChange: (format: 'physical' | 'eBook' | 'audio') => void;
  isEditMode?: boolean;
  setValue: (name: keyof DeadlineFormData, value: any) => void;
}

export const DeadlineFormStep2 = ({
  control,
  selectedFormat,
  onFormatChange,
  isEditMode = false,
}: DeadlineFormStep2Props) => {
  // Watch for book linking
  const watchedBookId = useWatch({ control, name: 'book_id' });

  const getTotalQuantityLabel = () => {
    switch (selectedFormat) {
      case 'audio':
        return 'Total Time *';
      default:
        return 'Total Pages *';
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

  return (
    <View style={{ flex: 1, gap: 24 }}>
      <ThemedText color="textMuted" style={{ lineHeight: 24, fontSize: 16 }}>
        Enter the book details and format information.
      </ThemedText>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Book Title *
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
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
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
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
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
            style={{ marginTop: 6, lineHeight: 18 }}
          >
            Format cannot be changed after creation
          </ThemedText>
        ) : null}
      </View>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Book type
        </ThemedText>
        <CustomDropdown
          control={control}
          name="source"
          placeholder="Select a source"
          options={[
            { label: 'ARC', value: 'ARC' },
            { label: 'Library', value: 'library' },
            { label: 'Personal', value: 'personal' },
            { label: 'Book Club', value: 'bookclub' },
          ]}
          allowCustom={true}
          customPlaceholder="Enter custom source"
          testID="dropdown-source"
        />
      </View>

      <View>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          {getTotalQuantityLabel()}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
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
        <ThemedText
          color="textMuted"
          style={{ marginTop: -12, lineHeight: 18 }}
        >
          We'll use this to calculate your daily reading pace
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  autoFilledIndicator: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -15,
  },
});
