import {
  AnimatedCustomInput,
  AnimatedCustomInputRef,
} from '@/components/AnimatedCustomInput';
import { AppleSSO } from '@/components/auth/AppleSSO';
import { ThemedText, ThemedView } from '@/components/themed';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { z } from 'zod';
import { ROUTES } from '@/constants/routes';

const signInSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password should be at least 8 characters long'),
});

type SignInFields = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const { signIn, isLoading } = useAuth();
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const emailInputRef = useRef<AnimatedCustomInputRef>(null);
  const passwordInputRef = useRef<AnimatedCustomInputRef>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
  });

  const debouncedEmailChange = useDebouncedInput((value: string) => {
    setValue('email', value);
  });

  const debouncedPasswordChange = useDebouncedInput((value: string) => {
    setValue('password', value);
  });

  const onSignInPress = async (data: SignInFields) => {
    if (isLoading || isSubmitting) return;

    try {
      const { error } = await signIn(data.email, data.password);
      console.log('Sign in response error:', error);
      if (error) {
        posthog.capture('sign in failed', {
          error_type: error.message.includes('Invalid login credentials')
            ? 'invalid_credentials'
            : error.message.includes('Email not confirmed')
              ? 'email_not_confirmed'
              : 'other',
          error_message: error.message,
        });

        if (error.message.includes('Invalid login credentials')) {
          setError('root', { message: 'Invalid email or password' });
        } else if (error.message.includes('Email not confirmed')) {
          setError('root', { message: 'Please confirm your email address' });
        } else {
          setError('root', { message: error.message || 'Sign in failed' });
        }
      } else {
        posthog.capture('user signed in', {
          method: 'email',
        });
        router.replace(ROUTES.HOME);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      posthog.capture('sign in failed', {
        error_type: 'unexpected',
        error_message: 'An unexpected error occurred',
      });
      setError('root', { message: 'An unexpected error occurred' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.innerContainer}>
        <Link href={ROUTES.AUTH.SIGN_UP} style={styles.header}>
          <ThemedText>Sign up</ThemedText>
        </Link>

        <ThemedView style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/transparent-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </ThemedView>

        <ThemedText variant="headline" style={styles.title}>
          Sign in
        </ThemedText>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputGroup}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur } }) => (
                <AnimatedCustomInput
                  ref={emailInputRef}
                  label="Email"
                  value={emailInput}
                  onChangeText={text => {
                    setEmailInput(text);
                    debouncedEmailChange(text);
                  }}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  inputStyle={styles.input}
                  testID="email-input"
                />
              )}
            />
            {errors.email && (
              <ThemedText style={styles.errorText}>
                {errors.email.message}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur } }) => (
                <AnimatedCustomInput
                  ref={passwordInputRef}
                  label="Password"
                  value={passwordInput}
                  onChangeText={text => {
                    setPasswordInput(text);
                    debouncedPasswordChange(text);
                  }}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  inputStyle={styles.input}
                  testID="password-input"
                />
              )}
            />
            {errors.password && (
              <ThemedText style={styles.errorText}>
                {errors.password.message}
              </ThemedText>
            )}
          </ThemedView>

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
            onPress={handleSubmit(onSignInPress)}
            disabled={isLoading || isSubmitting}
            testID="sign-in-button"
          >
            <ThemedText style={styles.buttonText}>
              {isLoading || isSubmitting ? 'Signing in...' : 'Continue'}
            </ThemedText>
          </TouchableOpacity>

          {/* Add Forgot Password Link - iOS only */}
          {Platform.OS === 'ios' && (
            <Link
              href={ROUTES.AUTH.RESET_PASSWORD_REQUEST}
              style={styles.forgotPasswordLink}
            >
              <ThemedText style={styles.forgotPasswordText}>
                Forgot Password?
              </ThemedText>
            </Link>
          )}
        </ThemedView>

        <ThemedView style={styles.divider} />

        <ThemedView style={styles.socialButtons}>
          <AppleSSO
            onSuccess={() => router.replace(ROUTES.HOME)}
            onError={error =>
              setError('root', {
                message: error.message || 'Apple sign-in failed',
              })
            }
          />
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#B8A9D9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 38,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#B8A9D9',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#B8A9D9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  errorText: {
    textAlign: 'center',
    color: '#ff0000',
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerText: {
    textAlign: 'center',
    flex: 1,
    fontSize: 14,
    opacity: 0.7,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#B8A9D9',
    fontSize: 16,
    fontWeight: '600',
  },
});
