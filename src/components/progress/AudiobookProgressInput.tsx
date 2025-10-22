import React from 'react';
import ProgressInputBase from './ProgressInputBase';

interface AudiobookProgressInputProps {
  value: number;
  onChange: (minutes: number) => void;
  onBlur?: () => void;
  totalQuantity?: number;
  testID?: string;
}

const AudiobookProgressInput: React.FC<AudiobookProgressInputProps> = ({
  value,
  onChange,
  onBlur,
  totalQuantity = 0,
  testID,
}) => {
  return (
    <ProgressInputBase
      mode="direct"
      format="audio"
      value={value}
      onChange={onChange}
      {...(onBlur && { onBlur })}
      totalQuantity={totalQuantity}
      {...(testID && { testID })}
    />
  );
};

export default AudiobookProgressInput;
