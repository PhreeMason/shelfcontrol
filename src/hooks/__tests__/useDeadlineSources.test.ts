import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { useQuery } from '@tanstack/react-query';

import { useDeadlineSources } from '../useDeadlineSources';

jest.mock('@/services', () => ({
  deadlinesService: {
    getUniqueSources: jest.fn(),
  },
}));

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;
const mockDeadlinesService = deadlinesService as jest.Mocked<
  typeof deadlinesService
>;

const DEFAULT_SOURCES = ['ARC', 'Library', 'Personal', 'Book Club'];

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockProfile = {
  id: 'profile-123',
  user_id: 'user-123',
};

const mockSession = {
  access_token: 'token',
  user: mockUser,
};

describe('useDeadlineSources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      session: mockSession,
    });
  });

  describe('Unauthenticated User Scenarios', () => {
    it('should return DEFAULT_SOURCES when no userId from profile', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      const result = useDeadlineSources();

      expect(result.data).toEqual(DEFAULT_SOURCES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'sources', undefined],
          enabled: false,
        })
      );
    });

    it('should return DEFAULT_SOURCES when no userId from session', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: null },
        session: { user: { id: null } },
      });

      const result = useDeadlineSources();

      expect(result.data).toEqual(DEFAULT_SOURCES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'sources', undefined],
          enabled: false,
        })
      );
    });

    it('should return DEFAULT_SOURCES when both profile and session are missing', () => {
      mockUseAuth.mockReturnValue({
        profile: undefined,
        session: undefined,
      });

      const result = useDeadlineSources();

      expect(result.data).toEqual(DEFAULT_SOURCES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'sources', undefined],
          enabled: false,
        })
      );
    });
  });

  describe('Query Configuration Tests', () => {
    it('should configure query with correct parameters for authenticated user', () => {
      useDeadlineSources();

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'sources', 'profile-123'],
          queryFn: expect.any(Function),
          enabled: true,
          staleTime: 5 * 60 * 1000,
        })
      );
    });

    it('should use profile id when available in queryKey', () => {
      const profileId = 'profile-456';
      mockUseAuth.mockReturnValue({
        profile: { id: profileId },
        session: mockSession,
      });

      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['deadline', 'sources', profileId]);
    });

    it('should fall back to session user id when profile id missing', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: null },
        session: mockSession,
      });

      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['deadline', 'sources', 'user-123']);
    });

    it('should be disabled when user not authenticated', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });
  });

  describe('QueryFn Logic Tests', () => {
    it('should call deadlinesService.getUniqueSources with correct userId', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueSources.mockResolvedValue([
        'Custom Source',
      ]);

      await queryConfig.queryFn();

      expect(mockDeadlinesService.getUniqueSources).toHaveBeenCalledWith(
        'profile-123'
      );
    });

    it('should return DEFAULT_SOURCES when no userId', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(mockDeadlinesService.getUniqueSources).not.toHaveBeenCalled();
    });

    it('should merge user sources with defaults correctly', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Bookstore', 'Gift', 'Academic'];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Academic',
        'Bookstore',
        'Gift',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should deduplicate case-insensitive sources', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['library', 'PERSONAL', 'Book club', 'Bookstore'];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Bookstore',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should sort user sources alphabetically before defaults', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Zebra Source', 'Alpha Source', 'Beta Source'];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Alpha Source',
        'Beta Source',
        'Zebra Source',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should handle empty user sources array', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueSources.mockResolvedValue([]);

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
    });
  });

  describe('Error Handling Tests', () => {
    it('should return DEFAULT_SOURCES when service throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueSources.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching deadline sources:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return DEFAULT_SOURCES when service returns null', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueSources.mockRejectedValue(null);

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching deadline sources:',
        null
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle network timeout errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueSources.mockRejectedValue(
        new Error('Network timeout')
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching deadline sources:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle sources with special characters', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Mom & Dad', 'B&N Store', 'Re-read'];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'B&N Store',
        'Mom & Dad',
        'Re-read',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should handle very long source names', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const longSourceName = 'A'.repeat(100);
      const userSources = [longSourceName];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        longSourceName,
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should handle sources with numbers and mixed casing', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Store123', 'store123', 'STORE123', 'Unique Source'];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result.slice(0, 4)).toEqual(
        [...userSources].sort((a, b) => a.localeCompare(b))
      );
      expect(result.slice(4)).toEqual(DEFAULT_SOURCES);
      expect(result).toHaveLength(8);
    });

    it('should handle large number of user sources', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = Array.from(
        { length: 50 },
        (_, i) => `Source ${i + 1}`
      );
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toHaveLength(54);
      expect(result.slice(0, 50)).toEqual(userSources.sort());
      expect(result.slice(50)).toEqual(DEFAULT_SOURCES);
    });

    it('should handle sources with only whitespace', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['   ', '\t', '\n', 'Valid Source'];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        '\t',
        '\n',
        '   ',
        'Valid Source',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should handle unicode characters in source names', async () => {
      useDeadlineSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Librairie 📚', 'Café ☕', 'École 🏫'];
      mockDeadlinesService.getUniqueSources.mockResolvedValue(userSources);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Café ☕',
        'École 🏫',
        'Librairie 📚',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });
  });
});
