import {
  AnimatedCustomInput,
  AnimatedCustomInputRef,
} from '@/components/AnimatedCustomInput';
import { AppleSSO } from '@/components/auth/AppleSSO';
import { ThemedText, ThemedView } from '@/components/themed';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';
import { analytics } from '@/lib/analytics/client';
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

const signUpSchema = z
  .object({
    email: z.string({ message: 'Email is required' }).email('Invalid email'),
    password: z
      .string({ message: 'Password is required' })
      .min(8, 'Password should be at least 8 characters long'),
    confirmPassword: z.string({ message: 'Please confirm your password' }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFields = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuth();
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const emailInputRef = useRef<AnimatedCustomInputRef>(null);
  const passwordInputRef = useRef<AnimatedCustomInputRef>(null);
  const confirmPasswordInputRef = useRef<AnimatedCustomInputRef>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
  });

  const debouncedEmailChange = useDebouncedInput((value: string) => {
    setValue('email', value);
  });

  const debouncedPasswordChange = useDebouncedInput((value: string) => {
    setValue('password', value);
  });

  const debouncedConfirmPasswordChange = useDebouncedInput((value: string) => {
    setValue('confirmPassword', value);
  });

  const onSignUpPress = async (data: SignUpFields) => {
    if (isLoading || isSubmitting) return;

    try {
      const { error } = await signUp(data.email, data.password, '');
      if (error) {
        posthog.captureException(error);

        if (error.message.includes('User already registered')) {
          setError('email', {
            message: 'An account with this email already exists',
          });
        } else if (error.message.includes('Password should be')) {
          setError('password', { message: error.message });
        } else {
          setError('root', { message: error.message || 'Sign up failed' });
        }
      } else {
        analytics.track('user_signed_up', {
          method: 'email',
        });
        router.replace(ROUTES.HOME);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      posthog.captureException(err);
      setError('root', { message: 'An unexpected error occurred' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.innerContainer}>
        <ThemedView style={styles.header}>
          <Link href="/(auth)/sign-in">
            <ThemedText
              variant="default"
              style={{ textDecorationLine: 'underline' }}
            >
              Sign in
            </ThemedText>
          </Link>
        </ThemedView>

        <ThemedView style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/transparent-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </ThemedView>

        <ThemedText variant="headline" style={styles.title}>
          Sign up
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

          <ThemedView style={styles.inputGroup}>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onBlur } }) => (
                <AnimatedCustomInput
                  ref={confirmPasswordInputRef}
                  label="Confirm Password"
                  value={confirmPasswordInput}
                  onChangeText={text => {
                    setConfirmPasswordInput(text);
                    debouncedConfirmPasswordChange(text);
                  }}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  inputStyle={styles.input}
                  testID="confirm-password-input"
                />
              )}
            />
            {errors.confirmPassword && (
              <ThemedText style={styles.errorText}>
                {errors.confirmPassword.message}
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
            onPress={handleSubmit(onSignUpPress)}
            disabled={isLoading || isSubmitting}
          >
            <ThemedText style={styles.buttonText}>
              {isLoading || isSubmitting ? 'Creating account...' : 'Continue'}
            </ThemedText>
          </TouchableOpacity>
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
});
