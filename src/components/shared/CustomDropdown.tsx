import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from '../ui/IconSymbol';

type CustomDropdownProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  options: { label: string; value: string }[];
  allowCustom?: boolean;
  customPlaceholder?: string;
  testID?: string;
};

const CustomDropdown = <T extends FieldValues>({
  control,
  name,
  placeholder = 'Select an option',
  options,
  allowCustom = true,
  customPlaceholder = 'Enter custom value',
  testID = 'custom-dropdown',
}: CustomDropdownProps<T>) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState<
    { label: string; value: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const textMutedColor = colors.textMuted;
  const cardColor = colors.surface;
  const textColor = colors.text;
  const borderColor = colors.border;
  const dangerColor = colors.danger;
  const primaryColor = colors.primary;

  const filterFunction = (
    items: { label: string; value: string }[],
    searchText: string
  ) => {
    if (!searchText.trim())
      return [...items, { label: 'Other...', value: '__custom__' }];
    const filtered = items.filter(item =>
      item.label.toLowerCase().includes(searchText.toLowerCase())
    );

    if (allowCustom && !filtered.find(item => item.value === '__custom__')) {
      filtered.push({ label: 'Other...', value: '__custom__' });
    }

    return filtered;
  };

  const handleTextChange = (
    text: string,
    onChange: (value: string) => void
  ) => {
    setQuery(text);

    const filtered = filterFunction(options, text);
    setFilteredData(filtered);
    setShowSuggestions(text.length > 0);

    const exactMatch = options.find(
      option => option.label.toLowerCase() === text.toLowerCase()
    );
    if (exactMatch) {
      onChange(exactMatch.value);
    }
  };

  const handleSelectItem = (
    item: { label: string; value: string },
    onChange: (value: string) => void
  ) => {
    if (item.value === '__custom__') {
      setShowCustomInput(true);
      setCustomValue('');
      setQuery('');
    } else {
      setQuery(item.label);
      onChange(item.value);
    }
    setShowSuggestions(false);
  };

  const renderSuggestionItem = ({
    item,
    onChange,
  }: {
    item: { label: string; value: string };
    onChange: (value: string) => void;
  }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
      onPress={() => handleSelectItem(item, onChange)}
    >
      <Text style={[styles.suggestionText, { color: textColor }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const isCustomValue =
          value &&
          !options.find(opt => opt.value === value) &&
          value !== '__custom__';
        const selectedOption = options.find(opt => opt.value === value);
        const displayText = isCustomValue ? value : selectedOption?.label || '';

        return (
          <View style={styles.container}>
            <View
              style={[
                styles.dropdownContainer,
                {
                  backgroundColor: cardColor,
                  borderColor: error ? dangerColor : borderColor,
                },
              ]}
            >
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isFocused
                      ? cardColor
                      : colors.inputBlurBackground,
                  },
                ]}
              >
                <TextInput
                  testID={testID}
                  style={[styles.textInput, { color: textColor }]}
                  placeholder={placeholder}
                  placeholderTextColor={textMutedColor}
                  value={showSuggestions ? query : displayText}
                  onChangeText={text => handleTextChange(text, onChange)}
                  onFocus={() => {
                    setIsFocused(true);
                    setQuery(displayText);
                    const filtered = filterFunction(options, '');
                    setFilteredData(filtered);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 150);
                    setIsFocused(false);
                  }}
                />
                <Pressable onPress={() => setShowSuggestions(!showSuggestions)}>
                  <IconSymbol
                    name="chevron.down"
                    size={16}
                    color={textMutedColor}
                    style={styles.chevronIcon}
                  />
                </Pressable>
              </View>
            </View>

            {showSuggestions && filteredData.length > 0 && (
              <View
                style={[
                  styles.suggestionsContainer,
                  {
                    backgroundColor: cardColor,
                    borderColor: borderColor,
                  },
                ]}
              >
                <FlatList
                  data={filteredData}
                  keyExtractor={(item, index) => `${item.value}-${index}`}
                  renderItem={({ item }) =>
                    renderSuggestionItem({ item, onChange })
                  }
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={false}
                />
              </View>
            )}

            {error && (
              <ThemedText color="danger" style={styles.error}>
                {error.message}
              </ThemedText>
            )}

            <Modal
              visible={showCustomInput}
              transparent
              animationType="slide"
              onRequestClose={() => setShowCustomInput(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowCustomInput(false)}
              >
                <View
                  style={[styles.modalContent, { backgroundColor: cardColor }]}
                >
                  <TouchableOpacity activeOpacity={1}>
                    <ThemedText variant="title" style={styles.modalTitle}>
                      Enter Custom Source
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.customInput,
                        {
                          backgroundColor: colors.background,
                          color: textColor,
                          borderColor: borderColor,
                        },
                      ]}
                      placeholder={customPlaceholder}
                      placeholderTextColor={textMutedColor}
                      value={customValue}
                      onChangeText={setCustomValue}
                      autoFocus
                    />
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          { backgroundColor: colors.background },
                        ]}
                        onPress={() => setShowCustomInput(false)}
                      >
                        <ThemedText>Cancel</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          { backgroundColor: primaryColor },
                        ]}
                        onPress={() => {
                          if (customValue.trim()) {
                            onChange(customValue.trim());
                            setQuery(customValue.trim());
                            setShowCustomInput(false);
                          }
                        }}
                      >
                        <ThemedText color="textInverse">Save</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    gap: Spacing.xs,
    zIndex: 1,
  },
  dropdownContainer: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: Spacing.md,
  },
  chevronIcon: {
    marginLeft: Spacing.sm,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    zIndex: 1000,
    ...Shadows.medium,
  },
  suggestionsList: {
    flexGrow: 0,
    maxHeight: 300,
  },
  suggestionItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
  },
  error: {
    minHeight: 18,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.elevated,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: Spacing.md,
  },
  customInput: {
    borderWidth: 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
});

export default CustomDropdown;
