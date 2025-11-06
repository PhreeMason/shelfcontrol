import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { useQuery } from '@tanstack/react-query';

import { useAcquisitionSources } from '../useDeadlines';

jest.mock('@/services', () => ({
  deadlinesService: {
    getUniqueAcquisitionSources: jest.fn(),
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

const DEFAULT_SOURCES = ['NetGalley', 'Edelweiss', 'Direct'];

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

describe('useAcquisitionSources', () => {
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

      const result = useAcquisitionSources();

      expect(result.data).toEqual(DEFAULT_SOURCES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'acquisition_sources', undefined],
          enabled: false,
        })
      );
    });

    it('should return DEFAULT_SOURCES when no userId from session', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: null },
        session: { user: { id: null } },
      });

      const result = useAcquisitionSources();

      expect(result.data).toEqual(DEFAULT_SOURCES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'acquisition_sources', undefined],
          enabled: false,
        })
      );
    });

    it('should return DEFAULT_SOURCES when both profile and session are missing', () => {
      mockUseAuth.mockReturnValue({
        profile: undefined,
        session: undefined,
      });

      const result = useAcquisitionSources();

      expect(result.data).toEqual(DEFAULT_SOURCES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'acquisition_sources', undefined],
          enabled: false,
        })
      );
    });
  });

  describe('Query Configuration Tests', () => {
    it('should configure query with correct parameters for authenticated user', () => {
      useAcquisitionSources();

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'acquisition_sources', 'profile-123'],
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

      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual([
        'deadline',
        'acquisition_sources',
        profileId,
      ]);
    });

    it('should fall back to session user id when profile id missing', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: null },
        session: mockSession,
      });

      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual([
        'deadline',
        'acquisition_sources',
        'user-123',
      ]);
    });

    it('should be disabled when user not authenticated', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });
  });

  describe('QueryFn Logic Tests', () => {
    it('should call deadlinesService.getUniqueAcquisitionSources with correct userId', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue([
        'Custom Source',
      ]);

      await queryConfig.queryFn();

      expect(
        mockDeadlinesService.getUniqueAcquisitionSources
      ).toHaveBeenCalledWith('profile-123');
    });

    it('should return DEFAULT_SOURCES when no userId', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(
        mockDeadlinesService.getUniqueAcquisitionSources
      ).not.toHaveBeenCalled();
    });

    it('should merge user sources with defaults correctly', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Amazon', 'Publisher', 'BookBub'];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Amazon',
        'BookBub',
        'Publisher',
        'NetGalley',
        'Edelweiss',
        'Direct',
      ]);
    });

    it('should deduplicate case-insensitive sources', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['netgalley', 'DIRECT', 'Edelweiss', 'Amazon'];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual(['Amazon', 'NetGalley', 'Edelweiss', 'Direct']);
    });

    it('should sort user sources alphabetically before defaults', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Zebra Source', 'Alpha Source', 'Beta Source'];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Alpha Source',
        'Beta Source',
        'Zebra Source',
        'NetGalley',
        'Edelweiss',
        'Direct',
      ]);
    });

    it('should handle empty user sources array', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue([]);

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
    });
  });

  describe('Error Handling Tests', () => {
    it('should return DEFAULT_SOURCES when service throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueAcquisitionSources.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching acquisition sources:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return DEFAULT_SOURCES when service returns null', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueAcquisitionSources.mockRejectedValue(null);

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching acquisition sources:',
        null
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle network timeout errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueAcquisitionSources.mockRejectedValue(
        new Error('Network timeout')
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_SOURCES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching acquisition sources:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle sources with special characters', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Barnes & Noble', 'B&N Online', 'Re-sell Shop'];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'B&N Online',
        'Barnes & Noble',
        'Re-sell Shop',
        'NetGalley',
        'Edelweiss',
        'Direct',
      ]);
    });

    it('should handle very long source names', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const longSourceName = 'A'.repeat(100);
      const userSources = [longSourceName];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        longSourceName,
        'NetGalley',
        'Edelweiss',
        'Direct',
      ]);
    });

    it('should handle sources with numbers and mixed casing', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Store123', 'store123', 'STORE123', 'Unique Source'];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result.slice(0, 4)).toEqual(
        [...userSources].sort((a, b) => a.localeCompare(b))
      );
      expect(result.slice(4)).toEqual(DEFAULT_SOURCES);
      expect(result).toHaveLength(7);
    });

    it('should handle large number of user sources', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = Array.from(
        { length: 50 },
        (_, i) => `Source ${i + 1}`
      );
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toHaveLength(53);
      expect(result.slice(0, 50)).toEqual(userSources.sort());
      expect(result.slice(50)).toEqual(DEFAULT_SOURCES);
    });

    it('should handle sources with only whitespace', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['   ', '\t', '\n', 'Valid Source'];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        '\t',
        '\n',
        '   ',
        'Valid Source',
        'NetGalley',
        'Edelweiss',
        'Direct',
      ]);
    });

    it('should handle unicode characters in source names', async () => {
      useAcquisitionSources();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userSources = ['Librairie 📚', 'Café ☕', 'École 🏫'];
      mockDeadlinesService.getUniqueAcquisitionSources.mockResolvedValue(
        userSources
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Café ☕',
        'École 🏫',
        'Librairie 📚',
        'NetGalley',
        'Edelweiss',
        'Direct',
      ]);
    });
  });
});
