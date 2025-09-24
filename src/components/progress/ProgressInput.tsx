import { requiresAudiobookInput } from '@/utils/formUtils';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import AudiobookProgressInput from './AudiobookProgressInput';
import PagesProgressInput from './PagesProgressInput';

interface ProgressInputProps {
  format: 'physical' | 'eBook' | 'audio';
  control: Control<any>;
  totalQuantity: number;
}

const ProgressInput: React.FC<ProgressInputProps> = ({
  format,
  control,
  totalQuantity,
}) => {
  if (requiresAudiobookInput(format)) {
    return (
      <Controller
        control={control}
        name="currentProgress"
        render={({ field: { value, onChange, onBlur } }) => (
          <AudiobookProgressInput
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            totalQuantity={totalQuantity}
            testID="audiobook-progress-input"
          />
        )}
      />
    );
  }

  return (
    <Controller
      control={control}
      name="currentProgress"
      render={({ field: { value, onChange, onBlur } }) => (
        <PagesProgressInput
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          totalQuantity={totalQuantity}
          testID="pages-progress-input"
        />
      )}
    />
  );
};

export default ProgressInput;
