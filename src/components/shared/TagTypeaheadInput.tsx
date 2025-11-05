import { useGetAllTags } from '@/hooks/useTags';
import { TagWithDetails } from '@/types/tags.types';
import React, { useMemo, useState } from 'react';
import Typeahead from './Typeahead';

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
  const { data: allTags = [], isLoading } = useGetAllTags();
  const [query, setQuery] = useState('');

  const availableTags = useMemo(() => {
    return allTags.filter(tag => !excludeTagIds.includes(tag.id));
  }, [allTags, excludeTagIds]);

  const tagNames = useMemo(() => {
    return availableTags.map(tag => tag.name);
  }, [availableTags]);

  const handleSelectSuggestion = (suggestionName: string) => {
    const existingTag = availableTags.find(tag => tag.name === suggestionName);
    if (existingTag) {
      onSelectTag(existingTag);
    } else {
      onSelectTag({ name: suggestionName });
    }
  };

  return (
    <Typeahead
      suggestions={tagNames}
      isLoading={isLoading}
      placeholder={placeholder}
      testID={testID}
      value={query}
      onChangeText={setQuery}
      onSelect={handleSelectSuggestion}
      noResultsAction="create"
      clearOnSelect
    />
  );
};

export default TagTypeaheadInput;
