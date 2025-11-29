import { AuthError, AuthResponse, Session } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { posthog } from '@/lib/posthog';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const createAuthHandlers = (
  _session: Session | null,
  _profile: Profile | null,
  _setProfile: (profile: Profile | null) => void
) => {
  const validateUserAuthentication = (userId?: string) => {
    if (!userId) {
      return { isValid: false, error: new Error('User not authenticated') };
    }
    return { isValid: true, error: null };
  };

  const validateProfileExists = (profileId?: string) => {
    if (!profileId) {
      return { isValid: false, error: new Error('Profile not found') };
    }
    return { isValid: true, error: null };
  };

  const handleAuthError = (operation: string, error: unknown) => {
    console.error(`${operation} error:`, error);
    posthog.captureException(
      error instanceof Error ? error : new Error(String(error))
    );
    return error;
  };

  const createAuthResponse = (
    data: any = null,
    error: Error | null = null
  ): { data: any; error: Error | null } => {
    return { data, error };
  };

  const createAuthErrorResponse = (
    error: AuthError | null = null
  ): { error: AuthError | null } => {
    return { error };
  };

  return {
    validateUserAuthentication,
    validateProfileExists,
    handleAuthError,
    createAuthResponse,
    createAuthErrorResponse,
  };
};

export const createNavigationLogic = () => {
  const shouldRedirectToAuth = (
    session: Session | null,
    inAuthGroup: boolean
  ) => {
    return !session && !inAuthGroup;
  };

  const shouldRedirectToHome = (
    session: Session | null,
    inAuthGroup: boolean
  ) => {
    return Boolean(session && inAuthGroup);
  };

  const getRedirectPath = (session: Session | null, inAuthGroup: boolean) => {
    if (shouldRedirectToAuth(session, inAuthGroup)) {
      return '/(auth)/sign-up';
    }
    if (shouldRedirectToHome(session, inAuthGroup)) {
      return '/';
    }
    return null;
  };

  const determineRedirectAction = (
    session: Session | null,
    segments: string[],
    isLoading: boolean
  ) => {
    if (isLoading) {
      return { shouldRedirect: false, path: null };
    }

    const inAuthGroup = segments[0] === '(auth)';
    const redirectPath = getRedirectPath(session, inAuthGroup);

    return {
      shouldRedirect: redirectPath !== null,
      path: redirectPath,
    };
  };

  return {
    shouldRedirectToAuth,
    shouldRedirectToHome,
    getRedirectPath,
    determineRedirectAction,
  };
};

export const createAsyncAuthOperations = () => {
  const wrapAuthOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      posthog.captureException(
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  const wrapAuthServiceCall = async (
    serviceCall: () => Promise<AuthResponse>,
    operationName: string
  ): Promise<AuthResponse> => {
    try {
      const result = await serviceCall();
      if (result.error) {
        console.error(`${operationName} failed:`, result.error);
        posthog.captureException(result.error);
      }
      return result;
    } catch (error) {
      console.error(`${operationName} error:`, error);
      posthog.captureException(
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  return {
    wrapAuthOperation,
    wrapAuthServiceCall,
  };
};

export const createProfileOperations = (
  session: Session | null,
  profile: Profile | null,
  setProfile: (profile: Profile | null) => void
) => {
  const {
    validateUserAuthentication,
    validateProfileExists,
    createAuthResponse,
  } = createAuthHandlers(session, profile, setProfile);

  const validateAndExecuteProfileUpdate = async (
    updateOperation: () => Promise<Profile>,
    validationType: 'user' | 'profile' = 'profile'
  ) => {
    const validation =
      validationType === 'user'
        ? validateUserAuthentication(session?.user?.id)
        : validateProfileExists(profile?.id);

    if (!validation.isValid) {
      return createAuthResponse(null, validation.error);
    }

    try {
      const data = await updateOperation();
      setProfile(data);
      return createAuthResponse(data, null);
    } catch (err) {
      return createAuthResponse(null, err as Error);
    }
  };

  const validateAndExecuteUserOperation = async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'User not authenticated'
  ) => {
    const validation = validateUserAuthentication(session?.user?.id);
    if (!validation.isValid) {
      return createAuthResponse(null, new Error(errorMessage));
    }

    try {
      const data = await operation();
      return createAuthResponse(data, null);
    } catch (err) {
      console.error('User operation error:', err);
      posthog.captureException(
        err instanceof Error ? err : new Error(String(err))
      );
      return createAuthResponse(null, err as Error);
    }
  };

  return {
    validateAndExecuteProfileUpdate,
    validateAndExecuteUserOperation,
  };
};

export const createSessionManager = () => {
  const cleanupUserState = (
    setProfile: (profile: Profile | null) => void,
    setSession: (session: Session | null) => void
  ) => {
    setProfile(null);
    setSession(null);
  };

  const handleSessionError = (
    error: unknown,
    setProfile: (profile: Profile | null) => void,
    setSession: (session: Session | null) => void
  ) => {
    console.error('Error signing out:', error);
    posthog.captureException(
      error instanceof Error ? error : new Error(String(error))
    );
    cleanupUserState(setProfile, setSession);
  };

  return {
    cleanupUserState,
    handleSessionError,
  };
};
