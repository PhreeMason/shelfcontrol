import {
  AnimatedCustomInput,
  AnimatedCustomInputRef,
} from '@/components/AnimatedCustomInput';
import { ThemedText, ThemedView } from '@/components/themed';
import { useAuth } from '@/providers/AuthProvider';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';
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
import { ROUTES } from '@/constants/routes';

const resetPasswordRequestSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email'),
});

type ResetPasswordRequestFields = z.infer<typeof resetPasswordRequestSchema>;

export default function ResetPasswordRequestScreen() {
  const { requestResetPasswordEmail, isLoading } = useAuth();
  const router = useRouter();
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
        setError('root', {
          message: error.message || 'Failed to send reset email',
        });
      } else {
        alert('Password reset email sent! Please check your email.');
        router.replace(ROUTES.AUTH.SIGN_IN);
      }
    } catch (err) {
      console.error('Reset password request error:', err);
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
                inputStyle={styles.input}
              />
            )}
          />
          {errors.email && (
            <ThemedText style={styles.errorText}>
              {errors.email.message}
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
            onPress={handleSubmit(onResetPasswordRequest)}
            disabled={isLoading || isSubmitting}
          >
            <ThemedText style={styles.buttonText}>
              {isLoading || isSubmitting ? 'Sending...' : 'Send Reset Email'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText>Remember your password? </ThemedText>
          <Link href={ROUTES.AUTH.SIGN_IN}>
            <ThemedText style={styles.linkText}>Sign In</ThemedText>
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
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  errorText: {
    textAlign: 'center',
    color: '#ff0000',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
