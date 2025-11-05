import AcquisitionSourceTypeaheadInput from '@/components/shared/AcquisitionSourceTypeaheadInput';
import CustomInput from '@/components/shared/CustomInput';
import TypeTypeaheadInput from '@/components/shared/TypeTypeaheadInput';
import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useThemeColor';
import { DeadlineFormData } from '@/utils/deadlineFormSchema';
import React from 'react';
import { Control, useWatch } from 'react-hook-form';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface DeadlineFormStep3Props {
  control: Control<DeadlineFormData>;
  setValue: (name: keyof DeadlineFormData, value: any) => void;
}

export const DeadlineFormStep3 = ({
  control,
  setValue,
}: DeadlineFormStep3Props) => {
  const { colors } = useTheme();
  const isPublisherAutofilled = useWatch({
    control,
    name: 'isPublisherAutofilled',
  });
  const publishers = useWatch({ control, name: 'publishers' }) || [];

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

  return (
    <View style={{ flex: 1, gap: 24 }}>
      <ThemedText color="textMuted" style={{ lineHeight: 24, fontSize: 16 }}>
        Add additional details about the book source and publishers.
      </ThemedText>

      <View style={{ zIndex: 3 }}>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Book Type <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>
        </ThemedText>
        <TypeTypeaheadInput
          control={control}
          name="type"
          placeholder="Enter book type"
          testID="input-type"
        />
      </View>

      <View style={{ zIndex: 2 }}>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
          Source
        </ThemedText>
        <AcquisitionSourceTypeaheadInput
          control={control}
          name="acquisition_source"
          testID="input-acquisition-source"
          placeholder="(e.g., NetGalley, Edelweiss, Direct, etc.)"
        />
      </View>

      <View style={{ zIndex: 1 }}>
        <ThemedText variant="defaultSemiBold" style={{ marginBottom: 8 }}>
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
          <View style={{ gap: 12 }}>
            {publishers.map((_: string, index: number) => (
              <View key={index} style={{ flexDirection: 'row', gap: 8 }}>
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
        <ThemedText color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
          {publishers.length >= 5
            ? 'Maximum of 5 publishers reached'
            : 'Add up to 5 publishers for this book'}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  removeButton: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
