import { useAcquisitionSources } from '@/hooks/useDeadlines';
import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import Typeahead from './Typeahead';

type AcquisitionSourceTypeaheadInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  testID?: string;
};

const AcquisitionSourceTypeaheadInput = <T extends FieldValues>({
  control,
  name,
  placeholder = 'Enter acquisition source',
  testID = 'acquisition-source-typeahead',
}: AcquisitionSourceTypeaheadInputProps<T>) => {
  const { data: sources = [], isLoading } = useAcquisitionSources();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Typeahead
          suggestions={sources}
          isLoading={isLoading}
          placeholder={placeholder}
          testID={testID}
          value={value as string}
          onChangeText={onChange}
          onSelect={onChange}
          error={error?.message}
          noResultsAction="info"
        />
      )}
    />
  );
};

export default AcquisitionSourceTypeaheadInput;
