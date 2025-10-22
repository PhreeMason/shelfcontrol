import React from 'react';
import ProgressInputBase from './ProgressInputBase';

interface PagesProgressInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  testID?: string;
}

const PagesProgressInput: React.FC<PagesProgressInputProps> = ({
  value,
  onChange,
  onBlur,
  totalQuantity,
  testID,
}) => {
  return (
    <ProgressInputBase
      mode="direct"
      format="physical"
      value={value}
      onChange={onChange}
      {...(onBlur && { onBlur })}
      totalQuantity={totalQuantity}
      {...(testID && { testID })}
    />
  );
};

export default PagesProgressInput;
