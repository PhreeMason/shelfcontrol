import React from 'react';
import ProgressInputBase from './ProgressInputBase';

interface TimeRemainingInputProps {
  value: number;
  onChange: (minutes: number) => void;
  onBlur?: () => void;
  totalQuantity: number;
  testID?: string;
}

const TimeRemainingInput: React.FC<TimeRemainingInputProps> = ({
  value,
  onChange,
  onBlur,
  totalQuantity,
  testID,
}) => {
  return (
    <ProgressInputBase
      mode="remaining"
      format="audio"
      value={value}
      onChange={onChange}
      {...(onBlur && { onBlur })}
      totalQuantity={totalQuantity}
      {...(testID && { testID })}
    />
  );
};

export default TimeRemainingInput;
