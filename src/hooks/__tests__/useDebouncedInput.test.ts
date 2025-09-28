import { renderHook, act } from '@testing-library/react-native';
import { useDebouncedInput } from '../useDebouncedInput';

describe('useDebouncedInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should debounce callback execution with default delay', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback));

      act(() => {
        result.current('test input');
      });

      expect(mockCallback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(199);
      });

      expect(mockCallback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(mockCallback).toHaveBeenCalledWith('test input');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should debounce callback execution with custom delay', () => {
      const mockCallback = jest.fn();
      const customDelay = 500;
      const { result } = renderHook(() =>
        useDebouncedInput(mockCallback, customDelay)
      );

      act(() => {
        result.current('custom delay test');
      });

      expect(mockCallback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(499);
      });

      expect(mockCallback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(mockCallback).toHaveBeenCalledWith('custom delay test');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should pass the correct value to the callback', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback));

      act(() => {
        result.current('first value');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledWith('first value');

      act(() => {
        result.current('second value');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledWith('second value');
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Debouncing behavior', () => {
    it('should cancel previous timeout when called multiple times rapidly', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback));

      act(() => {
        result.current('first');
        result.current('second');
        result.current('third');
        result.current('final');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('final');
    });

    it('should handle rapid calls with different values', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback, 100));

      act(() => {
        result.current('a');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('ab');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('abc');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('abcd');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('abcd');
    });

    it('should execute callback multiple times for spaced out calls', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback, 100));

      act(() => {
        result.current('first');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledWith('first');

      act(() => {
        result.current('second');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledWith('second');

      act(() => {
        result.current('third');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledWith('third');
      expect(mockCallback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero delay', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback, 0));

      act(() => {
        result.current('immediate');
      });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(mockCallback).toHaveBeenCalledWith('immediate');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle very long delay', () => {
      const mockCallback = jest.fn();
      const longDelay = 10000;
      const { result } = renderHook(() =>
        useDebouncedInput(mockCallback, longDelay)
      );

      act(() => {
        result.current('long wait');
      });

      act(() => {
        jest.advanceTimersByTime(9999);
      });

      expect(mockCallback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(mockCallback).toHaveBeenCalledWith('long wait');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string values', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback));

      act(() => {
        result.current('');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledWith('');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters and long strings', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback));

      const specialString = '!@#$%^&*()_+{}[]|\\:";\'<>?,./~`';
      const longString = 'a'.repeat(1000);

      act(() => {
        result.current(specialString);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledWith(specialString);

      act(() => {
        result.current(longString);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledWith(longString);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should handle whitespace strings', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback));

      act(() => {
        result.current('   ');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledWith('   ');

      act(() => {
        result.current('\t\n\r');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockCallback).toHaveBeenCalledWith('\t\n\r');
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Callback stability', () => {
    it('should maintain stable debounced function reference across renders', () => {
      const mockCallback = jest.fn();
      const { result, rerender } = renderHook(
        ({
          callback,
          delay,
        }: {
          callback: (value: string) => void;
          delay: number;
        }) => useDebouncedInput(callback, delay),
        {
          initialProps: { callback: mockCallback, delay: 200 },
        }
      );

      const firstReference = result.current;

      rerender({ callback: mockCallback, delay: 200 });

      expect(result.current).toBe(firstReference);
    });

    it('should create new debounced function when callback changes', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      const { result, rerender } = renderHook(
        ({
          callback,
          delay,
        }: {
          callback: (value: string) => void;
          delay: number;
        }) => useDebouncedInput(callback, delay),
        {
          initialProps: { callback: mockCallback1, delay: 200 },
        }
      );

      const firstReference = result.current;

      rerender({ callback: mockCallback2, delay: 200 });

      expect(result.current).not.toBe(firstReference);
    });

    it('should create new debounced function when delay changes', () => {
      const mockCallback = jest.fn();
      const { result, rerender } = renderHook(
        ({
          callback,
          delay,
        }: {
          callback: (value: string) => void;
          delay: number;
        }) => useDebouncedInput(callback, delay),
        {
          initialProps: { callback: mockCallback, delay: 200 },
        }
      );

      const firstReference = result.current;

      rerender({ callback: mockCallback, delay: 500 });

      expect(result.current).not.toBe(firstReference);
    });
  });

  describe('Cleanup behavior', () => {
    it('should still execute callback even if component unmounts', () => {
      const mockCallback = jest.fn();
      const { result, unmount } = renderHook(() =>
        useDebouncedInput(mockCallback)
      );

      act(() => {
        result.current('will execute');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledWith('will execute');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple timeouts before unmount', () => {
      const mockCallback = jest.fn();
      const { result, unmount } = renderHook(() =>
        useDebouncedInput(mockCallback, 100)
      );

      act(() => {
        result.current('first');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('second');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('final');
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledWith('final');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle search input scenario', () => {
      const searchApi = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(searchApi, 300));

      act(() => {
        result.current('h');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('he');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('hel');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('hell');
      });

      act(() => {
        jest.advanceTimersByTime(50);
        result.current('hello');
      });

      act(() => {
        jest.advanceTimersByTime(299);
      });

      expect(searchApi).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(searchApi).toHaveBeenCalledTimes(1);
      expect(searchApi).toHaveBeenCalledWith('hello');
    });

    it('should handle form autosave scenario', () => {
      const saveForm = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(saveForm, 1000));

      act(() => {
        result.current('field value 1');
      });

      act(() => {
        jest.advanceTimersByTime(500);
        result.current('field value 2');
      });

      act(() => {
        jest.advanceTimersByTime(500);
        result.current('field value 3');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(saveForm).toHaveBeenCalledTimes(1);
      expect(saveForm).toHaveBeenCalledWith('field value 3');
    });

    it('should handle rapid delete scenario', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebouncedInput(mockCallback, 150));

      const text = 'hello world';

      for (let i = text.length; i >= 0; i--) {
        act(() => {
          result.current(text.substring(0, i));
        });

        act(() => {
          jest.advanceTimersByTime(50);
        });
      }

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('');
    });
  });
});
