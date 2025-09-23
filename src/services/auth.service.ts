import { supabase } from '@/lib/supabase';
import { AuthError, AuthResponse, Session } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Setup auto-refresh for session management
AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
}

export interface AppleSignInParams {
  identityToken: string;
}

export interface ResetPasswordParams {
  email: string;
  redirectTo: string;
}

export interface SetSessionParams {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Get the current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: SignInParams): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  }

  /**
   * Sign up with email, password, and username
   */
  async signUp({
    email,
    password,
    username,
  }: SignUpParams): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email,
          },
        },
      });
      if (error) throw error;
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple({ identityToken }: AppleSignInParams) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });

    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  /**
   * Request a password reset email
   */
  async requestPasswordReset({ email, redirectTo }: ResetPasswordParams) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;
    return { error: null };
  }

  /**
   * Update the user's password
   */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
    return { error: null };
  }

  /**
   * Set session from access and refresh tokens
   */
  async setSession({ accessToken, refreshToken }: SetSessionParams) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw error;
    return { session: data.session, user: data.user };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
