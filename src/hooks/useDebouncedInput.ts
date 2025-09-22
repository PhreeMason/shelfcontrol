import { useCallback, useRef } from 'react';

export function useDebouncedInput(
  callback: (value: string) => void,
  delay: number = 200
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debouncedCallback = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback;
}