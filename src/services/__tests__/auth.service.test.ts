import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';
import { authService } from '../auth.service';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithIdToken: jest.fn(),
      onAuthStateChange: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

// Mock React Native AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    it('should return session when available', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: 'user123', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result).toEqual({
        session: mockSession,
        error: null,
      });
    });

    it('should handle error when getting session', async () => {
      const mockError = new Error('Session error');
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const result = await authService.getSession();

      expect(result).toEqual({
        session: null,
        error: mockError,
      });
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
    });

    it('should handle sign in error', async () => {
      const mockError = new Error('Invalid credentials') as AuthError;

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toEqual({
        data: { user: null, session: null },
        error: mockError,
      });
    });

    it('should catch and return thrown errors', async () => {
      const thrownError = new Error('Network error');
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        thrownError
      );

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        data: { user: null, session: null },
        error: thrownError,
      });
    });
  });

  describe('signUp', () => {
    it('should sign up successfully with valid data', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            email: 'test@example.com',
          },
        },
      });

      expect(result).toEqual({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
    });

    it('should handle sign up error', async () => {
      const mockError = new Error('Email already registered') as AuthError;

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await authService.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        data: { user: null, session: null },
        error: mockError,
      });
    });

    it('should catch and return thrown errors', async () => {
      const thrownError = new Error('Validation error');
      (supabase.auth.signUp as jest.Mock).mockRejectedValue(thrownError);

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        data: { user: null, session: null },
        error: thrownError,
      });
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('signInWithApple', () => {
    it('should sign in with Apple successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@privaterelay.appleid.com',
      };
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
      };

      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signInWithApple({
        identityToken: 'apple-identity-token',
      });

      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'apple',
        token: 'apple-identity-token',
      });

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it('should throw error when Apple sign in fails', async () => {
      const mockError = new Error('Apple sign in failed');
      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(
        authService.signInWithApple({ identityToken: 'invalid-token' })
      ).rejects.toThrow('Apple sign in failed');
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockUnsubscribe },
      });

      const result = authService.onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(
        mockCallback
      );
      expect(result).toEqual({ data: { subscription: mockUnsubscribe } });
    });

    it('should handle auth state change events', () => {
      const mockCallback = jest.fn();

      authService.onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(
        mockCallback
      );

      // Simulate calling the callback
      const callbackArg = (supabase.auth.onAuthStateChange as jest.Mock).mock
        .calls[0][0];
      const mockSession = { access_token: 'token123' };

      callbackArg('SIGNED_IN', mockSession);
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', mockSession);

      callbackArg('SIGNED_OUT', null);
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_OUT', null);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      // Sign up
      const signUpMockData = {
        user: { id: 'user123', email: 'test@example.com' },
        session: { access_token: 'token123', refresh_token: 'refresh123' },
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: signUpMockData,
        error: null,
      });

      const signUpResult = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(signUpResult.data).toEqual(signUpMockData);
      expect(signUpResult.error).toBeNull();

      // Sign out
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
      await authService.signOut();
      expect(supabase.auth.signOut).toHaveBeenCalled();

      // Sign in
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: signUpMockData,
        error: null,
      });

      const signInResult = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(signInResult.data).toEqual(signUpMockData);
      expect(signInResult.error).toBeNull();
    });

  });
});
