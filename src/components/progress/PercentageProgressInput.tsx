import React from 'react';
import ProgressInputBase from './ProgressInputBase';

interface PercentageProgressInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  format: 'physical' | 'eBook' | 'audio';
  testID?: string;
}

const PercentageProgressInput: React.FC<PercentageProgressInputProps> = ({
  value,
  onChange,
  onBlur,
  totalQuantity,
  format,
  testID,
}) => {
  return (
    <ProgressInputBase
      mode="percentage"
      format={format}
      value={value}
      onChange={onChange}
      {...(onBlur && { onBlur })}
      totalQuantity={totalQuantity}
      {...(testID && { testID })}
    />
  );
};

export default PercentageProgressInput;
