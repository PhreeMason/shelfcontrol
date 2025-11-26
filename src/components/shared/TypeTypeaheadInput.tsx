import { useDeadlineTypes } from '@/hooks/useDeadlines';
import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import Typeahead from './Typeahead';

type TypeTypeaheadInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  testID?: string;
};

const TypeTypeaheadInput = <T extends FieldValues>({
  control,
  name,
  placeholder = 'Select a type or add your own',
  testID = 'source-typeahead',
}: TypeTypeaheadInputProps<T>) => {
  const { data: types = [], isLoading } = useDeadlineTypes();

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={'ARC' as any}
      render={({
        field: { onChange, value },
        fieldState: { error, isTouched },
        formState,
      }) => (
        <Typeahead
          suggestions={types}
          isLoading={isLoading}
          placeholder={placeholder}
          testID={testID}
          value={value as string}
          onChangeText={onChange}
          onSelect={onChange}
          error={
            error && (isTouched || formState?.isSubmitted)
              ? error.message
              : undefined
          }
          noResultsAction="info"
        />
      )}
    />
  );
};

export default TypeTypeaheadInput;
