import { authService, profileService, AppleProfileData } from '@/services';
import { Database } from '@/types/database.types';
import { AuthError, AuthResponse, Session } from '@supabase/supabase-js';
import { router, useSegments } from 'expo-router';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthData = {
  session: Session | null;
  isLoading: boolean;
  profile: Profile | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<AuthResponse>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ data: Profile | null; error: Error | null }>;
  uploadAvatar: (
    uri: string
  ) => Promise<{ data: string | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
  updateProfileFromApple: (appleData: {
    email?: string | null;
    fullName?: any;
  }) => Promise<{ data: Profile | null; error: Error | null }>;
  requestResetPasswordEmail: (
    email: string,
    redirectTo: string
  ) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  setSessionFromUrl: (
    accessToken: string,
    refreshToken: string
  ) => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthData>({
  isLoading: false,
  session: null,
  profile: null,
  signOut: async () => {},
  signIn: async () => ({ data: { user: null, session: null }, error: null }),
  signUp: async () => ({ data: { user: null, session: null }, error: null }),
  updateProfile: async () => ({ data: null, error: null }),
  uploadAvatar: async () => ({ data: null, error: null }),
  refreshProfile: async () => {},
  updateProfileFromApple: async () => ({ data: null, error: null }),
  requestResetPasswordEmail: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  setSessionFromUrl: async () => ({ error: null }),
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const segments = useSegments();

  useEffect(() => {
    const fetchSession = async () => {
      const { session } = await authService.getSession();
      setSession(session);
      if (session) {
        // fetch profile
        const profileData = await profileService.getProfile(session.user.id);
        setProfile(profileData);
      }

      setLoading(false);
    };
    fetchSession();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, authSession) => {
      setSession(authSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === '(auth)';

      // Add a small delay to prevent flickering during auth state transitions
      const timeoutId = setTimeout(() => {
        if (!session && !inAuthGroup) {
          // Redirect to login if not authenticated
          router.replace('/(auth)/sign-in');
        } else if (session && inAuthGroup) {
          // Redirect to home if already authenticated
          router.replace('/');
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    // Return undefined for the case when isLoading is true
    return undefined;
  }, [session, segments, isLoading]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authService.signIn({ email, password });
      if (result.error) {
        console.error('Sign in failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const result = await authService.signUp({ email, password, username });
      if (result.error) {
        console.error('Sign up failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!session?.user?.id) {
      return { data: null, error: new Error('User not authenticated') };
    }

    try {
      const path = await profileService.uploadAvatar(session.user.id, uri);
      return { data: path, error: null };
    } catch (err) {
      console.error('Avatar upload error:', err);
      return { data: null, error: err as Error };
    }
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const data = await profileService.getProfile(session.user.id);
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile?.id) {
      return { data: null, error: new Error('Profile not found') };
    }

    try {
      const data = await profileService.updateProfile(profile.id, updates);
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateProfileFromApple = async (appleData: AppleProfileData) => {
    if (!session?.user?.id) {
      return { data: null, error: new Error('User not authenticated') };
    }

    try {
      const data = await profileService.updateProfileFromApple(
        session.user.id,
        appleData
      );
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const requestResetPasswordEmail = async (
    email: string,
    redirectTo: string
  ) => {
    try {
      await authService.requestPasswordReset({ email, redirectTo });
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const setSessionFromUrl = async (
    accessToken: string,
    refreshToken: string
  ) => {
    try {
      const { session } = await authService.setSession({
        accessToken,
        refreshToken,
      });
      if (session) {
        setSession(session);
        // Fetch profile for the new session
        const profileData = await profileService.getProfile(session.user.id);
        setProfile(profileData);
      }
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await authService.updatePassword(password);
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const providerValue = {
    session,
    isLoading,
    profile,
    signOut,
    signIn,
    signUp,
    updateProfile,
    uploadAvatar,
    refreshProfile,
    updateProfileFromApple,
    requestResetPasswordEmail,
    updatePassword,
    setSessionFromUrl,
  };
  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
