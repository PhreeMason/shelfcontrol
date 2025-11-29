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
import * as Linking from 'expo-linking';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { z } from 'zod';
import { ROUTES } from '@/constants/routes';

const FORGOT_PASSWORD_URL =
  'https://www.shelfcontrolapp.com/auth/forgot-password';

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
  const { colors } = useTheme();
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
      if (error) {
        posthog.captureException(error);

        if (error.message.includes('Invalid login credentials')) {
          setError('root', { message: 'Invalid email or password' });
        } else if (error.message.includes('Email not confirmed')) {
          setError('root', { message: 'Please confirm your email address' });
        } else {
          setError('root', { message: error.message || 'Sign in failed' });
        }
      } else {
        analytics.track('user_signed_in', {
          method: 'email',
        });
        router.replace(ROUTES.HOME);
      }
    } catch (err) {
      console.error('Sign in error:', err);
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
                  inputStyle={{
                    ...styles.input,
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                  testID="email-input"
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
            onPress={handleSubmit(onSignInPress)}
            disabled={isLoading || isSubmitting}
            testID="sign-in-button"
          >
            <ThemedText color="textInverse" style={styles.buttonText}>
              {isLoading || isSubmitting ? 'Signing in...' : 'Continue'}
            </ThemedText>
          </TouchableOpacity>

          {/* Forgot Password Link - opens external website */}
          <Pressable
            onPress={() => Linking.openURL(FORGOT_PASSWORD_URL)}
            style={styles.forgotPasswordLink}
          >
            <ThemedText color="primary" style={styles.forgotPasswordText}>
              Forgot Password?
            </ThemedText>
          </Pressable>
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
  forgotPasswordLink: {
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
