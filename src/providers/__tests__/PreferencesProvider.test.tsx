import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import PreferencesProvider, { usePreferences } from '../PreferencesProvider';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('PreferencesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      expect(result.current.selectedFilter).toBe('active');
      expect(result.current.timeRangeFilter).toBe('all');
      expect(result.current.selectedFormats).toEqual([]);
      expect(result.current.selectedTypes).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });

    it('should load preferences from AsyncStorage on mount', async () => {
      mockAsyncStorage.getItem.mockImplementation(key => {
        if (key === '@preferences/selectedFilter')
          return Promise.resolve('completed');
        if (key === '@preferences/timeRangeFilter')
          return Promise.resolve('thisWeek');
        if (key === '@preferences/selectedFormats')
          return Promise.resolve('["physical"]');
        if (key === '@preferences/selectedTypes')
          return Promise.resolve('["Library"]');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedFilter).toBe('completed');
      expect(result.current.timeRangeFilter).toBe('thisWeek');
      expect(result.current.selectedFormats).toEqual(['physical']);
      expect(result.current.selectedTypes).toEqual(['Library']);
    });

    it('should set isLoading to false after loading', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('setSelectedFilter', () => {
    it('should update selectedFilter state', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFilter('overdue');
      });

      expect(result.current.selectedFilter).toBe('overdue');
    });

    it('should persist selectedFilter to AsyncStorage', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFilter('completed');
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@preferences/selectedFilter',
        'completed'
      );
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAsyncStorage.setItem.mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFilter('overdue');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving filter preference:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('setTimeRangeFilter', () => {
    it('should update timeRangeFilter state', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setTimeRangeFilter('thisMonth');
      });

      expect(result.current.timeRangeFilter).toBe('thisMonth');
    });

    it('should persist timeRangeFilter to AsyncStorage', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setTimeRangeFilter('thisWeek');
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@preferences/timeRangeFilter',
        'thisWeek'
      );
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAsyncStorage.setItem.mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setTimeRangeFilter('thisMonth');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving due range filter preference:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('setSelectedFormats', () => {
    it('should update selectedFormats state', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFormats(['physical', 'audio']);
      });

      expect(result.current.selectedFormats).toEqual(['physical', 'audio']);
    });

    it('should persist selectedFormats to AsyncStorage', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFormats(['eBook']);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@preferences/selectedFormats',
        JSON.stringify(['eBook'])
      );
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAsyncStorage.setItem.mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFormats(['physical']);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving format filter preference:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('setSelectedTypes', () => {
    it('should update selectedTypes state', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedTypes(['Library', 'Bookstore']);
      });

      expect(result.current.selectedTypes).toEqual(['Library', 'Bookstore']);
    });

    it('should persist selectedTypes to AsyncStorage', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedTypes(['Amazon']);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@preferences/selectedTypes',
        JSON.stringify(['Amazon'])
      );
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAsyncStorage.setItem.mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedTypes(['Library']);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving type filter preference:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('AsyncStorage Loading Errors', () => {
    it('should handle AsyncStorage loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Loading error'));

      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading preferences:',
        expect.any(Error)
      );

      expect(result.current.selectedFilter).toBe('active');
      expect(result.current.timeRangeFilter).toBe('all');
      expect(result.current.selectedFormats).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('usePreferences Hook', () => {
    it('should return all context values', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.setSelectedFilter).toBe('function');
      expect(typeof result.current.setTimeRangeFilter).toBe('function');
      expect(typeof result.current.setSelectedFormats).toBe('function');
      expect(typeof result.current.setSelectedTypes).toBe('function');
      expect(result.current).toHaveProperty('selectedFilter');
      expect(result.current).toHaveProperty('timeRangeFilter');
      expect(result.current).toHaveProperty('selectedFormats');
      expect(result.current).toHaveProperty('selectedTypes');
      expect(result.current).toHaveProperty('isLoading');
    });
  });

  describe('Filter Value Combinations', () => {
    it('should handle all filters being set simultaneously', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFilter('completed');
        await result.current.setTimeRangeFilter('thisMonth');
        await result.current.setSelectedFormats(['physical']);
        await result.current.setSelectedTypes(['Library', 'Amazon']);
      });

      expect(result.current.selectedFilter).toBe('completed');
      expect(result.current.timeRangeFilter).toBe('thisMonth');
      expect(result.current.selectedFormats).toEqual(['physical']);
      expect(result.current.selectedTypes).toEqual(['Library', 'Amazon']);
    });

    it('should handle empty arrays for formats', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedFormats([]);
      });

      expect(result.current.selectedFormats).toEqual([]);
    });

    it('should handle empty arrays for types', async () => {
      const { result } = renderHook(() => usePreferences(), {
        wrapper: PreferencesProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setSelectedTypes([]);
      });

      expect(result.current.selectedTypes).toEqual([]);
    });
  });
});
