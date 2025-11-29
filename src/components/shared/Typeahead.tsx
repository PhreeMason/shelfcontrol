import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useTheme';
import {
  filterSuggestions,
  highlightMatch,
  shouldShowNoResults,
  shouldShowSuggestions,
} from '@/utils/typeaheadUtils';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export type TypeaheadProps = {
  suggestions: string[];
  isLoading?: boolean;
  placeholder?: string;
  testID?: string;
  value?: string;
  onChangeText: (text: string) => void;
  onSelect: (value: string) => void;
  error?: string | undefined;
  noResultsAction?: 'create' | 'info';
  noResultsMessage?: string;
  clearOnSelect?: boolean;
};

const Typeahead = ({
  suggestions,
  isLoading = false,
  placeholder = 'Enter value',
  testID = 'typeahead-input',
  value,
  onChangeText,
  onSelect,
  error,
  noResultsAction = 'info',
  noResultsMessage,
  clearOnSelect = false,
}: TypeaheadProps) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value !== undefined && !isFocused) {
      setQuery(value);
    }
  }, [value, isFocused]);

  const textMutedColor = colors.textMuted;
  const cardColor = colors.surface;
  const textColor = colors.text;
  const borderColor = colors.border;
  const dangerColor = colors.danger;
  const primaryColor = colors.primary;

  const filteredSuggestions = useMemo(() => {
    return filterSuggestions(query, suggestions);
  }, [query, suggestions]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    onChangeText(text);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (clearOnSelect) {
      setQuery('');
      onChangeText('');
    } else {
      setQuery(suggestion);
      onChangeText(suggestion);
    }
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  const renderSuggestionItem = ({ item }: { item: string }) => {
    const { beforeMatch, match, afterMatch, matchIndex } = highlightMatch(
      item,
      query
    );

    return (
      <TouchableOpacity
        style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
        onPress={() => handleSelectSuggestion(item)}
      >
        <ThemedText typography="bodyLarge">
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
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const defaultNoResultsMessage =
    noResultsAction === 'create'
      ? `No matches found. Tap to create "${query}"`
      : `No matches found. Press Enter to use "${query}"`;

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
            onChangeText={handleTextChange}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
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
              {renderSuggestionItem({ item })}
            </View>
          ))}
        </View>
      )}

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
          {noResultsAction === 'create' ? (
            <TouchableOpacity
              style={styles.noResultsContainer}
              onPress={() => handleSelectSuggestion(query)}
            >
              <ThemedText typography="bodyMedium" color="textMuted">
                {noResultsMessage || defaultNoResultsMessage}
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.noResultsContainer}>
              <ThemedText typography="bodyMedium" color="textMuted">
                {noResultsMessage || defaultNoResultsMessage}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {error && (
        <ThemedText color="danger" style={styles.error}>
          {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    gap: Spacing.xs,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    ...Typography.bodyLarge,
    padding: Spacing.md,
  },
  loadingIndicator: {
    marginRight: Spacing.md,
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
  suggestionItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  noResultsContainer: {
    padding: Spacing.md,
  },
  error: {
    minHeight: 18,
    marginTop: Spacing.xs,
  },
});

export default Typeahead;
