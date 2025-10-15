import { posthog } from '@/lib/posthog';
import { AppleProfileData, authService, profileService } from '@/services';
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
import {
  createNavigationLogic,
  createAsyncAuthOperations,
  createProfileOperations,
  createSessionManager,
  createAuthHandlers,
} from '@/utils/authProviderUtils';

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

  const navigationLogic = createNavigationLogic();
  const { wrapAuthServiceCall } = createAsyncAuthOperations();
  const profileOperations = createProfileOperations(
    session,
    profile,
    setProfile
  );
  const sessionManager = createSessionManager();
  const { createAuthErrorResponse } = createAuthHandlers(
    session,
    profile,
    setProfile
  );

  useEffect(() => {
    const fetchSession = async () => {
      const { session } = await authService.getSession();
      setSession(session);
      if (session) {
        const profileData = await profileService.getProfile(session.user.id);
        setProfile(profileData);

        posthog.identify(session.user.id, {
          email: session.user.email || '',
          username: profileData?.username || '',
        });
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
      const redirectAction = navigationLogic.determineRedirectAction(
        session,
        segments,
        isLoading
      );

      const timeoutId = setTimeout(() => {
        if (redirectAction.shouldRedirect && redirectAction.path) {
          router.replace(redirectAction.path as any);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [session, segments, isLoading, navigationLogic]);

  const signIn = async (email: string, password: string) => {
    return wrapAuthServiceCall(
      () => authService.signIn({ email, password }),
      'Sign in'
    );
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      posthog.capture('user signed out');
      posthog.reset();
      sessionManager.cleanupUserState(setProfile, setSession);
    } catch (error: any) {
      sessionManager.handleSessionError(error, setProfile, setSession);
    }
  };

  const signUp = async (email: string, password: string) => {
    return wrapAuthServiceCall(
      () => authService.signUp({ email, password }),
      'Sign up'
    );
  };

  const uploadAvatar = async (uri: string) => {
    return profileOperations.validateAndExecuteUserOperation(() =>
      profileService.uploadAvatar(session!.user.id, uri)
    );
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
    return profileOperations.validateAndExecuteProfileUpdate(() =>
      profileService.updateProfile(profile!.id, updates)
    );
  };

  const updateProfileFromApple = async (appleData: AppleProfileData) => {
    return profileOperations.validateAndExecuteUserOperation(async () => {
      const data = await profileService.updateProfileFromApple(
        session!.user.id,
        appleData
      );
      setProfile(data);
      return data;
    });
  };

  const requestResetPasswordEmail = async (
    email: string,
    redirectTo: string
  ) => {
    try {
      await authService.requestPasswordReset({ email, redirectTo });
      return createAuthErrorResponse(null);
    } catch (error) {
      return createAuthErrorResponse(error as AuthError);
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
        const profileData = await profileService.getProfile(session.user.id);
        setProfile(profileData);

        posthog.identify(session.user.id, {
          email: session.user.email || '',
          username: profileData?.username || '',
        });
      }
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await authService.updatePassword(password);
      return createAuthErrorResponse(null);
    } catch (error) {
      return createAuthErrorResponse(error as AuthError);
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
