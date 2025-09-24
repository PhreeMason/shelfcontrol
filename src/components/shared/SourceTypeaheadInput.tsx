import { ThemedText } from '@/components/themed';
import { useDeadlineSources } from '@/hooks/useDeadlineSources';
import { useTheme } from '@/hooks/useTheme';
import {
  filterSuggestions,
  highlightMatch,
  shouldShowSuggestions,
  shouldShowNoResults,
} from '@/utils/typeaheadUtils';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Control,
  Controller,
  FieldValues,
  Path,
  useWatch,
} from 'react-hook-form';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type SourceTypeaheadInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  testID?: string;
};

const SourceTypeaheadInput = <T extends FieldValues>({
  control,
  name,
  placeholder = 'Enter book type',
  testID = 'source-typeahead',
}: SourceTypeaheadInputProps<T>) => {
  const { colors } = useTheme();
  const { data: sources = [], isLoading } = useDeadlineSources();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Watch the form value
  const watchedValue = useWatch({ control, name });

  // Set initial query from watched value
  useEffect(() => {
    if (watchedValue && !isFocused) {
      setQuery(watchedValue);
    }
  }, [watchedValue, isFocused]);

  const textMutedColor = colors.textMuted;
  const cardColor = colors.surface;
  const textColor = colors.text;
  const borderColor = colors.border;
  const dangerColor = colors.danger;
  const primaryColor = colors.primary;

  // Filter suggestions based on query
  const filteredSuggestions = useMemo(() => {
    return filterSuggestions(query, sources);
  }, [query, sources]);

  const handleTextChange = (
    text: string,
    onChange: (value: string) => void
  ) => {
    setQuery(text);
    onChange(text);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (
    suggestion: string,
    onChange: (value: string) => void
  ) => {
    setQuery(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const renderSuggestionItem = ({
    item,
    onChange,
  }: {
    item: string;
    onChange: (value: string) => void;
  }) => {
    // Highlight matching text
    const { beforeMatch, match, afterMatch, matchIndex } = highlightMatch(
      item,
      query
    );

    return (
      <TouchableOpacity
        style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
        onPress={() => handleSelectSuggestion(item, onChange)}
      >
        <Text style={[styles.suggestionText, { color: textColor }]}>
          {query && matchIndex >= 0 ? (
            <>
              {beforeMatch}
              <Text
                style={{
                  backgroundColor: primaryColor + '20',
                  fontWeight: '600',
                }}
              >
                {match}
              </Text>
              {afterMatch}
            </>
          ) : (
            item
          )}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={'ARC' as any}
      render={({ field: { onChange }, fieldState: { error } }) => {
        return (
          <View style={styles.container}>
            <View
              style={[
                styles.inputWrapper,
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
                  value={query}
                  onChangeText={text => handleTextChange(text, onChange)}
                  onFocus={() => {
                    setIsFocused(true);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    // Delay hiding suggestions to allow tap to register
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                />
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={primaryColor}
                    style={styles.loadingIndicator}
                  />
                )}
              </View>
            </View>

            {/* Suggestions dropdown */}
            {shouldShowSuggestions(
              showSuggestions,
              filteredSuggestions,
              isLoading
            ) && (
              <View
                testID="suggestions-dropdown"
                style={[
                  styles.suggestionsContainer,
                  {
                    backgroundColor: cardColor,
                    borderColor: borderColor,
                  },
                ]}
              >
                {filteredSuggestions.slice(0, 5).map((item, index) => (
                  <View key={`${item}-${index}`}>
                    {renderSuggestionItem({ item, onChange })}
                  </View>
                ))}
              </View>
            )}

            {/* No results message */}
            {shouldShowNoResults(
              showSuggestions,
              query,
              filteredSuggestions,
              isLoading
            ) && (
              <View
                style={[
                  styles.suggestionsContainer,
                  {
                    backgroundColor: cardColor,
                    borderColor: borderColor,
                  },
                ]}
              >
                <View style={styles.noResultsContainer}>
                  <ThemedText color="textMuted" style={styles.noResultsText}>
                    No matches found. Press Enter to use "{query}"
                  </ThemedText>
                </View>
              </View>
            )}

            {error && (
              <ThemedText color="danger" style={styles.error}>
                {error.message}
              </ThemedText>
            )}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    gap: 4,
    zIndex: 1,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 16,
  },
  loadingIndicator: {
    marginRight: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  suggestionsList: {
    flexGrow: 0,
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
  },
  noResultsContainer: {
    padding: 16,
  },
  noResultsText: {
    fontSize: 14,
  },
  error: {
    minHeight: 18,
    marginTop: 4,
  },
});

export default SourceTypeaheadInput;
