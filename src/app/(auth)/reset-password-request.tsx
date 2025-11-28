import {
  AnimatedCustomInput,
  AnimatedCustomInputRef,
} from '@/components/AnimatedCustomInput';
import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { z } from 'zod';

const resetPasswordRequestSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
});

type ResetPasswordRequestFields = z.infer<typeof resetPasswordRequestSchema>;

export default function ResetPasswordRequestScreen() {
  const { requestResetPasswordEmail, isLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [emailInput, setEmailInput] = useState('');
  const emailInputRef = useRef<AnimatedCustomInputRef>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequestFields>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  const debouncedEmailChange = useDebouncedInput((value: string) => {
    setValue('email', value);
  });

  const onResetPasswordRequest = async (data: ResetPasswordRequestFields) => {
    if (isLoading || isSubmitting) return;

    try {
      const resetPasswordURL = Linking.createURL('/reset-password-update');
      const { error } = await requestResetPasswordEmail(
        data.email,
        resetPasswordURL
      );

      if (error) {
        posthog.captureException(error);
        setError('root', {
          message: error.message || 'Failed to send reset email',
        });
      } else {
        analytics.track('password_reset_requested');
        alert('Password reset email sent! Please check your email.');
        router.replace(ROUTES.AUTH.SIGN_IN);
      }
    } catch (err) {
      console.error('Reset password request error:', err);
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
        <Link href={ROUTES.AUTH.SIGN_IN} style={styles.header}>
          <ThemedText>Back to Sign In</ThemedText>
        </Link>

        <ThemedText
          style={[styles.title, { fontSize: 32, fontWeight: 'bold' }]}
        >
          Reset Password
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your
          password.
        </ThemedText>

        <ThemedView style={styles.form}>
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

          {errors.root && (
            <ThemedText color="error" style={styles.errorText}>
              {errors.root.message}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              (isLoading || isSubmitting) && {
                backgroundColor: colors.surfaceVariant,
              },
            ]}
            onPress={handleSubmit(onResetPasswordRequest)}
            disabled={isLoading || isSubmitting}
          >
            <ThemedText color="textInverse" style={styles.buttonText}>
              {isLoading || isSubmitting ? 'Sending...' : 'Send Reset Email'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText>Remember your password? </ThemedText>
          <Link href={ROUTES.AUTH.SIGN_IN}>
            <ThemedText color="primary" style={styles.linkText}>
              Sign In
            </ThemedText>
          </Link>
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
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 38,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
  },
  button: {
    borderRadius: BorderRadius.sm,
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
    left: Spacing.lg,
    zIndex: 1,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
});
