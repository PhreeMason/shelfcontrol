import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { SourceOption } from '@/types/disclosure.types';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface SourceSelectorProps {
  value: string | null;
  options: SourceOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  testID?: string;
}

export const SourceSelector = ({
  value,
  options,
  onChange,
  placeholder = 'Select a source',
  label = 'Which source/publisher is this disclosure for?',
  testID = 'source-selector',
}: SourceSelectorProps) => {
  const { colors } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText variant="default" style={styles.label}>
          {label}
        </ThemedText>
      )}

      <Pressable
        testID={testID}
        onPress={() => setShowDropdown(!showDropdown)}
        style={[
          styles.selectButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <ThemedText
          typography="titleMedium"
          color={selectedOption ? 'text' : 'textMuted'}
          style={styles.selectText}
        >
          {selectedOption?.label || placeholder}
        </ThemedText>
        <IconSymbol
          name="chevron.down"
          size={16}
          color={colors.textMuted}
          style={[styles.chevron, showDropdown && styles.chevronRotated]}
        />
      </Pressable>

      {showDropdown && options.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`source-option-${item.value}`}
                style={[
                  styles.dropdownItem,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor:
                      value === item.value
                        ? `${colors.primary}20`
                        : colors.surface,
                  },
                ]}
                onPress={() => {
                  onChange(item.value);
                  setShowDropdown(false);
                }}
              >
                <ThemedText
                  typography="titleMedium"
                  color={value === item.value ? 'primary' : 'text'}
                  style={styles.dropdownItemText}
                >
                  {item.label}
                </ThemedText>
                {value === item.value && (
                  <IconSymbol
                    name="checkmark"
                    size={16}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {options.length === 0 && (
        <ThemedText
          typography="bodyMedium"
          color="textMuted"
          style={styles.noOptions}
        >
          No sources available. Add a source or publisher to the book first.
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
  },
  selectText: {
    flex: 1,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    flex: 1,
  },
  noOptions: {
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
});
