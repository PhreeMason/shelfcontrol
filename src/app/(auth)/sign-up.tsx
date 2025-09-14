import { AppleSSO } from '@/components/auth/AppleSSO';
import { ThemedText, ThemedView } from '@/components/themed';
import { useAuth } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { z } from 'zod';

const signUpSchema = z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email'),
    password: z
        .string({ message: 'Password is required' })
        .min(8, 'Password should be at least 8 characters long'),
    username: z
        .string({ message: 'Username is required' })
        .min(3, 'Username should be at least 3 characters long'),
});

type SignUpFields = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
    const { signUp, isLoading } = useAuth();
    const router = useRouter();

    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFields>({
        resolver: zodResolver(signUpSchema),
    });

    const onSignUpPress = async (data: SignUpFields) => {
        if (isLoading || isSubmitting) return;

        try {
            const { error } = await signUp(data.email, data.password, data.username);

            if (error) {
                // Handle different Supabase auth errors
                if (error.message.includes('User already registered')) {
                    setError('email', { message: 'An account with this email already exists' });
                } else if (error.message.includes('Password should be')) {
                    setError('password', { message: error.message });
                } else if (error.message.includes('Username')) {
                    setError('username', { message: error.message });
                } else {
                    setError('root', { message: error.message || 'Sign up failed' });
                }
            } else {
                // Success - AuthProvider will handle navigation
                router.replace('/');
            }
        } catch (err) {
            console.error('Sign up error:', err);
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
                        <ThemedText variant="default" style={{ textDecorationLine: 'underline' }}>Sign in</ThemedText>
                    </Link>
                </ThemedView>
                
                <ThemedText variant="headline" style={styles.title}>Sign up</ThemedText>

                <ThemedView style={styles.form}>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        )}
                    />
                    {errors.email && (
                        <ThemedText style={styles.errorText}>{errors.email.message}</ThemedText>
                    )}

                    <Controller
                        control={control}
                        name="username"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Enter username"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                autoCapitalize="none"
                            />
                        )}
                    />
                    {errors.username && (
                        <ThemedText style={styles.errorText}>{errors.username.message}</ThemedText>
                    )}

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                secureTextEntry={true}
                            />
                        )}
                    />
                    {errors.password && (
                        <ThemedText style={styles.errorText}>{errors.password.message}</ThemedText>
                    )}

                    {errors.root && (
                        <ThemedText style={styles.errorText}>
                            {errors.root.message}
                        </ThemedText>
                    )}

                    <TouchableOpacity
                        style={[styles.button, (isLoading || isSubmitting) && styles.buttonDisabled]}
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
                        onSuccess={() => router.replace('/')}
                        onError={(error) => setError('root', { message: error.message || 'Apple sign-in failed' })}
                    />
                    
                    {/* <GoogleSSO 
                        onSuccess={() => router.replace('/')}
                        onError={(error) => setError('root', { message: error.message || 'Google sign-in failed' })}
                    /> */}
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
        marginBottom: 40,
        lineHeight: 38,
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