import { AuthError, AuthResponse, Session } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import {
  createAuthHandlers,
  createNavigationLogic,
  createAsyncAuthOperations,
  createProfileOperations,
  createSessionManager,
} from '../authProviderUtils';

type Profile = Database['public']['Tables']['profiles']['Row'];

const mockProfile: Profile = {
  id: 'profile-123',
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  avatar_url: null,
  website: null,
  onboarding_complete: true,
};

const mockSession: Session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: {
    id: 'user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    phone: '',
    confirmed_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

describe('authProviderUtils', () => {
  describe('createAuthHandlers', () => {
    let mockSetProfile: jest.Mock;
    let authHandlers: ReturnType<typeof createAuthHandlers>;

    beforeEach(() => {
      mockSetProfile = jest.fn();
      authHandlers = createAuthHandlers(
        mockSession,
        mockProfile,
        mockSetProfile
      );
    });

    describe('validateUserAuthentication', () => {
      it('should return valid when userId is provided', () => {
        const result = authHandlers.validateUserAuthentication('user-123');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return invalid when userId is undefined', () => {
        const result = authHandlers.validateUserAuthentication(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error).toEqual(new Error('User not authenticated'));
      });

      it('should return invalid when userId is empty string', () => {
        const result = authHandlers.validateUserAuthentication('');
        expect(result.isValid).toBe(false);
        expect(result.error).toEqual(new Error('User not authenticated'));
      });
    });

    describe('validateProfileExists', () => {
      it('should return valid when profileId is provided', () => {
        const result = authHandlers.validateProfileExists('profile-123');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return invalid when profileId is undefined', () => {
        const result = authHandlers.validateProfileExists(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error).toEqual(new Error('Profile not found'));
      });

      it('should return invalid when profileId is empty string', () => {
        const result = authHandlers.validateProfileExists('');
        expect(result.isValid).toBe(false);
        expect(result.error).toEqual(new Error('Profile not found'));
      });
    });

    describe('handleAuthError', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should log error and return the same error', () => {
        const error = new Error('Test error');
        const result = authHandlers.handleAuthError('Test operation', error);

        expect(console.error).toHaveBeenCalledWith(
          'Test operation error:',
          error
        );
        expect(result).toBe(error);
      });
    });

    describe('createAuthResponse', () => {
      it('should create response with data and null error', () => {
        const data = { test: 'data' };
        const result = authHandlers.createAuthResponse(data, null);

        expect(result).toEqual({ data, error: null });
      });

      it('should create response with null data and error', () => {
        const error = new Error('Test error');
        const result = authHandlers.createAuthResponse(null, error);

        expect(result).toEqual({ data: null, error });
      });

      it('should create response with default values when no params provided', () => {
        const result = authHandlers.createAuthResponse();

        expect(result).toEqual({ data: null, error: null });
      });
    });

    describe('createAuthErrorResponse', () => {
      it('should create error response with null error', () => {
        const result = authHandlers.createAuthErrorResponse(null);

        expect(result).toEqual({ error: null });
      });

      it('should create error response with provided error', () => {
        const error = new Error('Test error') as AuthError;
        const result = authHandlers.createAuthErrorResponse(error);

        expect(result).toEqual({ error });
      });

      it('should create error response with default null when no params provided', () => {
        const result = authHandlers.createAuthErrorResponse();

        expect(result).toEqual({ error: null });
      });
    });
  });

  describe('createNavigationLogic', () => {
    let navigationLogic: ReturnType<typeof createNavigationLogic>;

    beforeEach(() => {
      navigationLogic = createNavigationLogic();
    });

    describe('shouldRedirectToAuth', () => {
      it('should return true when no session and not in auth group', () => {
        const result = navigationLogic.shouldRedirectToAuth(null, false);
        expect(result).toBe(true);
      });

      it('should return false when no session but in auth group', () => {
        const result = navigationLogic.shouldRedirectToAuth(null, true);
        expect(result).toBe(false);
      });

      it('should return false when session exists and not in auth group', () => {
        const result = navigationLogic.shouldRedirectToAuth(mockSession, false);
        expect(result).toBe(false);
      });

      it('should return false when session exists and in auth group', () => {
        const result = navigationLogic.shouldRedirectToAuth(mockSession, true);
        expect(result).toBe(false);
      });
    });

    describe('shouldRedirectToHome', () => {
      it('should return true when session exists and in auth group', () => {
        const result = navigationLogic.shouldRedirectToHome(mockSession, true);
        expect(result).toBe(true);
      });

      it('should return false when session exists but not in auth group', () => {
        const result = navigationLogic.shouldRedirectToHome(mockSession, false);
        expect(result).toBe(false);
      });

      it('should return false when no session and in auth group', () => {
        const result = navigationLogic.shouldRedirectToHome(null, true);
        expect(result).toBe(false);
      });

      it('should return false when no session and not in auth group', () => {
        const result = navigationLogic.shouldRedirectToHome(null, false);
        expect(result).toBe(false);
      });
    });

    describe('getRedirectPath', () => {
      it('should return auth path when should redirect to auth', () => {
        const result = navigationLogic.getRedirectPath(null, false);
        expect(result).toBe('/(auth)/sign-in');
      });

      it('should return home path when should redirect to home', () => {
        const result = navigationLogic.getRedirectPath(mockSession, true);
        expect(result).toBe('/');
      });

      it('should return null when no redirect needed', () => {
        const result = navigationLogic.getRedirectPath(mockSession, false);
        expect(result).toBeNull();
      });
    });

    describe('determineRedirectAction', () => {
      it('should return no redirect when loading', () => {
        const result = navigationLogic.determineRedirectAction(
          null,
          ['(auth)'],
          true
        );
        expect(result).toEqual({ shouldRedirect: false, path: null });
      });

      it('should return redirect to auth when no session and not in auth group', () => {
        const result = navigationLogic.determineRedirectAction(
          null,
          ['home'],
          false
        );
        expect(result).toEqual({
          shouldRedirect: true,
          path: '/(auth)/sign-in',
        });
      });

      it('should return redirect to home when session exists and in auth group', () => {
        const result = navigationLogic.determineRedirectAction(
          mockSession,
          ['(auth)'],
          false
        );
        expect(result).toEqual({ shouldRedirect: true, path: '/' });
      });

      it('should return no redirect when session exists and not in auth group', () => {
        const result = navigationLogic.determineRedirectAction(
          mockSession,
          ['home'],
          false
        );
        expect(result).toEqual({ shouldRedirect: false, path: null });
      });

      it('should handle empty segments array', () => {
        const result = navigationLogic.determineRedirectAction(null, [], false);
        expect(result).toEqual({
          shouldRedirect: true,
          path: '/(auth)/sign-in',
        });
      });
    });
  });

  describe('createAsyncAuthOperations', () => {
    let asyncOps: ReturnType<typeof createAsyncAuthOperations>;

    beforeEach(() => {
      asyncOps = createAsyncAuthOperations();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('wrapAuthOperation', () => {
      it('should execute operation successfully and return result', async () => {
        const mockOperation = jest.fn().mockResolvedValue('success');
        const result = await asyncOps.wrapAuthOperation(
          mockOperation,
          'Test Operation'
        );

        expect(mockOperation).toHaveBeenCalled();
        expect(result).toBe('success');
      });

      it('should log error and rethrow when operation fails', async () => {
        const error = new Error('Operation failed');
        const mockOperation = jest.fn().mockRejectedValue(error);

        await expect(
          asyncOps.wrapAuthOperation(mockOperation, 'Test Operation')
        ).rejects.toThrow('Operation failed');

        expect(console.error).toHaveBeenCalledWith(
          'Test Operation failed:',
          error
        );
      });
    });

    describe('wrapAuthServiceCall', () => {
      it('should execute service call successfully', async () => {
        const mockResponse: AuthResponse = {
          data: { user: null, session: null },
          error: null,
        };
        const mockServiceCall = jest.fn().mockResolvedValue(mockResponse);

        const result = await asyncOps.wrapAuthServiceCall(
          mockServiceCall,
          'Test Service'
        );

        expect(mockServiceCall).toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
      });

      it('should log error when service call returns error but not throw', async () => {
        const mockError = new Error('Service error') as AuthError;
        const mockResponse: AuthResponse = {
          data: { user: null, session: null },
          error: mockError,
        };
        const mockServiceCall = jest.fn().mockResolvedValue(mockResponse);

        const result = await asyncOps.wrapAuthServiceCall(
          mockServiceCall,
          'Test Service'
        );

        expect(console.error).toHaveBeenCalledWith(
          'Test Service failed:',
          mockError
        );
        expect(result).toEqual(mockResponse);
      });

      it('should log error and rethrow when service call throws', async () => {
        const error = new Error('Service call failed');
        const mockServiceCall = jest.fn().mockRejectedValue(error);

        await expect(
          asyncOps.wrapAuthServiceCall(mockServiceCall, 'Test Service')
        ).rejects.toThrow('Service call failed');

        expect(console.error).toHaveBeenCalledWith(
          'Test Service error:',
          error
        );
      });
    });
  });

  describe('createProfileOperations', () => {
    let mockSetProfile: jest.Mock;
    let profileOps: ReturnType<typeof createProfileOperations>;

    beforeEach(() => {
      mockSetProfile = jest.fn();
      profileOps = createProfileOperations(
        mockSession,
        mockProfile,
        mockSetProfile
      );
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('validateAndExecuteProfileUpdate', () => {
      it('should execute update when profile validation passes', async () => {
        const updatedProfile = { ...mockProfile, username: 'updated' };
        const mockOperation = jest.fn().mockResolvedValue(updatedProfile);

        const result = await profileOps.validateAndExecuteProfileUpdate(
          mockOperation,
          'profile'
        );

        expect(mockOperation).toHaveBeenCalled();
        expect(mockSetProfile).toHaveBeenCalledWith(updatedProfile);
        expect(result).toEqual({ data: updatedProfile, error: null });
      });

      it('should execute update when user validation passes', async () => {
        const updatedProfile = { ...mockProfile, username: 'updated' };
        const mockOperation = jest.fn().mockResolvedValue(updatedProfile);

        const result = await profileOps.validateAndExecuteProfileUpdate(
          mockOperation,
          'user'
        );

        expect(mockOperation).toHaveBeenCalled();
        expect(mockSetProfile).toHaveBeenCalledWith(updatedProfile);
        expect(result).toEqual({ data: updatedProfile, error: null });
      });

      it('should return error when profile validation fails', async () => {
        const profileOpsNoProfile = createProfileOperations(
          mockSession,
          null,
          mockSetProfile
        );
        const mockOperation = jest.fn();

        const result =
          await profileOpsNoProfile.validateAndExecuteProfileUpdate(
            mockOperation,
            'profile'
          );

        expect(mockOperation).not.toHaveBeenCalled();
        expect(result).toEqual({
          data: null,
          error: new Error('Profile not found'),
        });
      });

      it('should return error when user validation fails', async () => {
        const profileOpsNoSession = createProfileOperations(
          null,
          mockProfile,
          mockSetProfile
        );
        const mockOperation = jest.fn();

        const result =
          await profileOpsNoSession.validateAndExecuteProfileUpdate(
            mockOperation,
            'user'
          );

        expect(mockOperation).not.toHaveBeenCalled();
        expect(result).toEqual({
          data: null,
          error: new Error('User not authenticated'),
        });
      });

      it('should handle operation errors', async () => {
        const error = new Error('Update failed');
        const mockOperation = jest.fn().mockRejectedValue(error);

        const result = await profileOps.validateAndExecuteProfileUpdate(
          mockOperation,
          'profile'
        );

        expect(result).toEqual({ data: null, error });
      });
    });

    describe('validateAndExecuteUserOperation', () => {
      it('should execute operation when user validation passes', async () => {
        const operationResult = 'operation-success';
        const mockOperation = jest.fn().mockResolvedValue(operationResult);

        const result =
          await profileOps.validateAndExecuteUserOperation(mockOperation);

        expect(mockOperation).toHaveBeenCalled();
        expect(result).toEqual({ data: operationResult, error: null });
      });

      it('should return error when user validation fails', async () => {
        const profileOpsNoSession = createProfileOperations(
          null,
          mockProfile,
          mockSetProfile
        );
        const mockOperation = jest.fn();

        const result =
          await profileOpsNoSession.validateAndExecuteUserOperation(
            mockOperation
          );

        expect(mockOperation).not.toHaveBeenCalled();
        expect(result).toEqual({
          data: null,
          error: new Error('User not authenticated'),
        });
      });

      it('should use custom error message when provided', async () => {
        const profileOpsNoSession = createProfileOperations(
          null,
          mockProfile,
          mockSetProfile
        );
        const mockOperation = jest.fn();
        const customError = 'Custom error message';

        const result =
          await profileOpsNoSession.validateAndExecuteUserOperation(
            mockOperation,
            customError
          );

        expect(result).toEqual({ data: null, error: new Error(customError) });
      });

      it('should handle operation errors and log them', async () => {
        const error = new Error('Operation failed');
        const mockOperation = jest.fn().mockRejectedValue(error);

        const result =
          await profileOps.validateAndExecuteUserOperation(mockOperation);

        expect(console.error).toHaveBeenCalledWith(
          'User operation error:',
          error
        );
        expect(result).toEqual({ data: null, error });
      });
    });
  });

  describe('createSessionManager', () => {
    let sessionManager: ReturnType<typeof createSessionManager>;
    let mockSetProfile: jest.Mock;
    let mockSetSession: jest.Mock;

    beforeEach(() => {
      sessionManager = createSessionManager();
      mockSetProfile = jest.fn();
      mockSetSession = jest.fn();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('cleanupUserState', () => {
      it('should set profile and session to null', () => {
        sessionManager.cleanupUserState(mockSetProfile, mockSetSession);

        expect(mockSetProfile).toHaveBeenCalledWith(null);
        expect(mockSetSession).toHaveBeenCalledWith(null);
      });
    });

    describe('handleSessionError', () => {
      it('should log error and cleanup user state', () => {
        const error = new Error('Session error');

        sessionManager.handleSessionError(
          error,
          mockSetProfile,
          mockSetSession
        );

        expect(console.error).toHaveBeenCalledWith('Error signing out:', error);
        expect(mockSetProfile).toHaveBeenCalledWith(null);
        expect(mockSetSession).toHaveBeenCalledWith(null);
      });
    });
  });
});
