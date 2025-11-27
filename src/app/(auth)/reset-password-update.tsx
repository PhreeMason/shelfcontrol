import {
  AnimatedCustomInput,
  AnimatedCustomInputRef,
} from '@/components/AnimatedCustomInput';
import { ThemedText, ThemedView } from '@/components/themed';
import { ROUTES } from '@/constants/routes';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';
import { analytics } from '@/lib/analytics/client';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { z } from 'zod';

const updatePasswordSchema = z
  .object({
    password: z
      .string({ message: 'Password is required' })
      .min(8, 'Password should be at least 8 characters long'),
    confirmPassword: z.string({ message: 'Please confirm your password' }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type UpdatePasswordFields = z.infer<typeof updatePasswordSchema>;

export default function ResetPasswordUpdateScreen() {
  const { setSessionFromUrl, updatePassword, isLoading } = useAuth();
  const router = useRouter();
  const [isSessionEstablished, setIsSessionEstablished] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const passwordInputRef = useRef<AnimatedCustomInputRef>(null);
  const confirmPasswordInputRef = useRef<AnimatedCustomInputRef>(null);

  const url = Linking.useLinkingURL();

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFields>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const debouncedPasswordChange = useDebouncedInput((value: string) => {
    setValue('password', value);
  });

  const debouncedConfirmPasswordChange = useDebouncedInput((value: string) => {
    setValue('confirmPassword', value);
  });

  const createSessionFromUrl = useCallback(
    async (url: string) => {
      try {
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) {
          throw new Error(errorCode);
        }

        const { access_token, refresh_token, type } = params;

        if (!access_token || !refresh_token || type !== 'recovery') {
          setSessionError(
            'Invalid or expired reset link. Please request a new password reset.'
          );
          return;
        }

        const { error } = await setSessionFromUrl(access_token, refresh_token);

        if (error) {
          console.error('Session establishment error:', error);
          setSessionError(
            'Invalid or expired reset link. Please request a new password reset.'
          );
        } else {
          setIsSessionEstablished(true);
        }
      } catch (err) {
        console.error('URL processing error:', err);
        setSessionError('Failed to validate reset link. Please try again.');
      }
    },
    [setSessionFromUrl]
  );

  useEffect(() => {
    if (url) {
      createSessionFromUrl(url);
    }
  }, [url, createSessionFromUrl]);

  const onUpdatePassword = async (data: UpdatePasswordFields) => {
    if (isLoading || isSubmitting || !isSessionEstablished) return;

    try {
      const { error } = await updatePassword(data.password);

      if (error) {
        posthog.captureException(error);
        setError('root', {
          message: error.message || 'Failed to update password',
        });
      } else {
        analytics.track('password_updated');
        alert('Password updated successfully!');
        router.replace(ROUTES.HOME);
      }
    } catch (err) {
      console.error('Update password error:', err);
      posthog.captureException(err);
      setError('root', { message: 'An unexpected error occurred' });
    }
  };

  if (sessionError) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.innerContainer}
        >
          <ThemedText variant="title" style={styles.title}>
            Invalid Link
          </ThemedText>
          <ThemedText style={styles.errorMessage}>{sessionError}</ThemedText>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace(ROUTES.AUTH.RESET_PASSWORD_REQUEST)}
          >
            <ThemedText style={styles.buttonText}>
              Request New Reset Link
            </ThemedText>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  if (!isSessionEstablished) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.innerContainer}>
          <ThemedText style={styles.title}>Validating reset link...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <ThemedText variant="title" style={styles.title}>
          Update Password
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter your new password below.
        </ThemedText>

        <ThemedView style={styles.form}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur } }) => (
              <AnimatedCustomInput
                ref={passwordInputRef}
                label="New Password"
                value={passwordInput}
                onChangeText={text => {
                  setPasswordInput(text);
                  debouncedPasswordChange(text);
                }}
                onBlur={onBlur}
                secureTextEntry
                autoCapitalize="none"
                inputStyle={styles.input}
              />
            )}
          />
          {errors.password && (
            <ThemedText style={styles.errorText}>
              {errors.password.message}
            </ThemedText>
          )}

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onBlur } }) => (
              <AnimatedCustomInput
                ref={confirmPasswordInputRef}
                label="Confirm New Password"
                value={confirmPasswordInput}
                onChangeText={text => {
                  setConfirmPasswordInput(text);
                  debouncedConfirmPasswordChange(text);
                }}
                onBlur={onBlur}
                secureTextEntry
                autoCapitalize="none"
                inputStyle={styles.input}
              />
            )}
          />
          {errors.confirmPassword && (
            <ThemedText style={styles.errorText}>
              {errors.confirmPassword.message}
            </ThemedText>
          )}

          {errors.root && (
            <ThemedText style={styles.errorText}>
              {errors.root.message}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              (isLoading || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit(onUpdatePassword)}
            disabled={isLoading || isSubmitting}
          >
            <ThemedText style={styles.buttonText}>
              {isLoading || isSubmitting ? 'Updating...' : 'Update Password'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: '#ff0000',
    fontSize: 14,
    marginTop: 4,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#ff0000',
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 22,
  },
});
