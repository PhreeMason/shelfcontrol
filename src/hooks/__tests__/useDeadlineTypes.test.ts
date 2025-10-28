import { useAuth } from '@/providers/AuthProvider';
import { deadlinesService } from '@/services';
import { useQuery } from '@tanstack/react-query';

import { useDeadlineTypes } from '../useDeadlineTypes';

jest.mock('@/services', () => ({
  deadlinesService: {
    getUniqueDeadlineTypes: jest.fn(),
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

const DEFAULT_TYPES = ['ARC', 'Library', 'Personal', 'Book Club'];

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

describe('useDeadlineTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      session: mockSession,
    });
  });

  describe('Unauthenticated User Scenarios', () => {
    it('should return DEFAULT_TYPES when no userId from profile', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      const result = useDeadlineTypes();

      expect(result.data).toEqual(DEFAULT_TYPES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'types', undefined],
          enabled: false,
        })
      );
    });

    it('should return DEFAULT_TYPES when no userId from session', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: null },
        session: { user: { id: null } },
      });

      const result = useDeadlineTypes();

      expect(result.data).toEqual(DEFAULT_TYPES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'types', undefined],
          enabled: false,
        })
      );
    });

    it('should return DEFAULT_TYPES when both profile and session are missing', () => {
      mockUseAuth.mockReturnValue({
        profile: undefined,
        session: undefined,
      });

      const result = useDeadlineTypes();

      expect(result.data).toEqual(DEFAULT_TYPES);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'types', undefined],
          enabled: false,
        })
      );
    });
  });

  describe('Query Configuration Tests', () => {
    it('should configure query with correct parameters for authenticated user', () => {
      useDeadlineTypes();

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['deadline', 'types', 'profile-123'],
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

      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['deadline', 'types', profileId]);
    });

    it('should fall back to session user id when profile id missing', () => {
      mockUseAuth.mockReturnValue({
        profile: { id: null },
        session: mockSession,
      });

      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryKey).toEqual(['deadline', 'types', 'user-123']);
    });

    it('should be disabled when user not authenticated', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.enabled).toBe(false);
    });
  });

  describe('QueryFn Logic Tests', () => {
    it('should call deadlinesService.getUniqueDeadlineTypes with correct userId', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue([
        'Custom Type',
      ]);

      await queryConfig.queryFn();

      expect(mockDeadlinesService.getUniqueDeadlineTypes).toHaveBeenCalledWith(
        'profile-123'
      );
    });

    it('should return DEFAULT_TYPES when no userId', async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        session: null,
      });

      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_TYPES);
      expect(
        mockDeadlinesService.getUniqueDeadlineTypes
      ).not.toHaveBeenCalled();
    });

    it('should merge user types with defaults correctly', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = ['Bookstore', 'Gift', 'Academic'];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

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
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = ['library', 'PERSONAL', 'Book club', 'Bookstore'];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Bookstore',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should sort user types alphabetically before defaults', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = ['Zebra Type', 'Alpha Type', 'Beta Type'];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        'Alpha Type',
        'Beta Type',
        'Zebra Type',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should handle empty user types array', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue([]);

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_TYPES);
    });
  });

  describe('Error Handling Tests', () => {
    it('should return DEFAULT_TYPES when service throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueDeadlineTypes.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_TYPES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching deadline types:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return DEFAULT_TYPES when service returns null', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueDeadlineTypes.mockRejectedValue(null);

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_TYPES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching deadline types:',
        null
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle network timeout errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      mockDeadlinesService.getUniqueDeadlineTypes.mockRejectedValue(
        new Error('Network timeout')
      );

      const result = await queryConfig.queryFn();

      expect(result).toEqual(DEFAULT_TYPES);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching deadline types:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle typeswith special characters', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = ['Mom & Dad', 'B&N Store', 'Re-read'];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

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
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const longTypeName = 'A'.repeat(100);
      const userTypes = [longTypeName];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        longTypeName,
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should handle typeswith numbers and mixed casing', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = ['Store123', 'store123', 'STORE123', 'Unique Type'];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

      const result = await queryConfig.queryFn();

      expect(result.slice(0, 4)).toEqual(
        [...userTypes].sort((a, b) => a.localeCompare(b))
      );
      expect(result.slice(4)).toEqual(DEFAULT_TYPES);
      expect(result).toHaveLength(8);
    });

    it('should handle large number of user types', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = Array.from({ length: 50 }, (_, i) => `Type ${i + 1}`);
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

      const result = await queryConfig.queryFn();

      expect(result).toHaveLength(54);
      expect(result.slice(0, 50)).toEqual(userTypes.sort());
      expect(result.slice(50)).toEqual(DEFAULT_TYPES);
    });

    it('should handle typeswith only whitespace', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = ['   ', '\t', '\n', 'Valid Type'];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

      const result = await queryConfig.queryFn();

      expect(result).toEqual([
        '\t',
        '\n',
        '   ',
        'Valid Type',
        'ARC',
        'Library',
        'Personal',
        'Book Club',
      ]);
    });

    it('should handle unicode characters in source names', async () => {
      useDeadlineTypes();

      const queryConfig = mockUseQuery.mock.calls[0][0];
      const userTypes = ['Librairie 📚', 'Café ☕', 'École 🏫'];
      mockDeadlinesService.getUniqueDeadlineTypes.mockResolvedValue(userTypes);

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
