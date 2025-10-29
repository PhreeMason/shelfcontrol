import { ThemedText } from '@/components/themed';
import { useGetAllTags } from '@/hooks/useTags';
import { useTheme } from '@/hooks/useTheme';
import { TagWithDetails } from '@/types/tags.types';
import {
  filterSuggestions,
  highlightMatch,
  shouldShowNoResults,
  shouldShowSuggestions,
} from '@/utils/typeaheadUtils';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type TagTypeaheadInputProps = {
  placeholder?: string;
  testID?: string;
  onSelectTag: (tag: TagWithDetails | { name: string }) => void;
  excludeTagIds?: string[];
};

const TagTypeaheadInput = ({
  placeholder = 'Type or select a tag name',
  testID = 'tag-typeahead',
  onSelectTag,
  excludeTagIds = [],
}: TagTypeaheadInputProps) => {
  const { colors } = useTheme();
  const { data: allTags = [], isLoading } = useGetAllTags();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textMutedColor = colors.textMuted;
  const cardColor = colors.surface;
  const textColor = colors.text;
  const borderColor = colors.border;
  const primaryColor = colors.primary;

  const availableTags = useMemo(() => {
    return allTags.filter(tag => !excludeTagIds.includes(tag.id));
  }, [allTags, excludeTagIds]);

  const tagNames = useMemo(() => {
    return availableTags.map(tag => tag.name);
  }, [availableTags]);

  const filteredSuggestions = useMemo(() => {
    return filterSuggestions(query, tagNames);
  }, [query, tagNames]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestionName: string) => {
    const existingTag = availableTags.find(tag => tag.name === suggestionName);
    if (existingTag) {
      onSelectTag(existingTag);
    } else {
      onSelectTag({ name: suggestionName });
    }
    setQuery('');
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
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: cardColor,
            borderColor: borderColor,
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
          <TouchableOpacity
            style={styles.noResultsContainer}
            onPress={() => handleSelectSuggestion(query)}
          >
            <ThemedText color="textMuted" style={styles.noResultsText}>
              No matches found. Tap to create "{query}"
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
});

export default TagTypeaheadInput;
