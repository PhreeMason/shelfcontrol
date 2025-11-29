import {
  AnimatedCustomInput,
  AnimatedCustomInputRef,
} from '@/components/AnimatedCustomInput';
import { AppleSSO } from '@/components/auth/AppleSSO';
import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';
import { useTheme } from '@/hooks/useThemeColor';
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
  const { colors } = useTheme();
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
                  inputStyle={{
                    ...styles.input,
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                />
              )}
            />
            {errors.email && (
              <ThemedText color="error" style={styles.errorText}>
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
                  inputStyle={{
                    ...styles.input,
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                  testID="password-input"
                />
              )}
            />
            {errors.password && (
              <ThemedText color="error" style={styles.errorText}>
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
                  inputStyle={{
                    ...styles.input,
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                  testID="confirm-password-input"
                />
              )}
            />
            {errors.confirmPassword && (
              <ThemedText color="error" style={styles.errorText}>
                {errors.confirmPassword.message}
              </ThemedText>
            )}
          </ThemedView>

          {errors.root && (
            <ThemedText color="error" style={styles.errorText}>
              {errors.root.message}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                ...Shadows.themed.primary,
              },
              (isLoading || isSubmitting) && {
                backgroundColor: colors.surfaceVariant,
              },
            ]}
            onPress={handleSubmit(onSignUpPress)}
            disabled={isLoading || isSubmitting}
          >
            <ThemedText color="textInverse" style={styles.buttonText}>
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
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    ...Shadows.themed.primary,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 38,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  button: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 1,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerText: {
    textAlign: 'center',
    flex: 1,
    fontSize: 14,
    opacity: 0.7,
  },
  socialButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
