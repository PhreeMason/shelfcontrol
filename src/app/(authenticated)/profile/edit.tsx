import Avatar from '@/components/shared/Avatar';
import CustomInput from '@/components/shared/CustomInput';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { z } from 'zod';

const profileSchema = z.object({
    username: z
        .string({ message: 'Username is required' })
        .min(3, 'Username should be at least 3 characters long'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email('Invalid email').optional(),
});

type ProfileFields = z.infer<typeof profileSchema>;

export default function EditProfile() {
    const { profile, updateProfile, uploadAvatar } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
    const router = useRouter();

    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty },
    } = useForm<ProfileFields>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        if (profile) {
            reset({
                username: profile.username || '',
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || '',
            });
        }
    }, [profile, reset]);

    const onSavePress = async (data: ProfileFields) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            let avatarPath = profile?.avatar_url;

            // Upload avatar if a new one was selected
            if (newAvatarUri) {
                const { data: uploadedPath, error: uploadError } = await uploadAvatar(newAvatarUri);
                if (uploadError) {
                    Alert.alert('Error', `Failed to upload avatar: ${uploadError.message}`);
                    setIsLoading(false);
                    return;
                }
                avatarPath = uploadedPath;
            }

            const updates: any = {
                username: data.username,
                first_name: data.first_name || null,
                last_name: data.last_name || null,
                email: data.email || null,
                avatar_url: avatarPath, // Now storing the path, not the URL
            };

            const { error } = await updateProfile(updates);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (err) {
            console.error('Profile update error:', err);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (isDirty || newAvatarUri) {
            Alert.alert(
                'Discard Changes',
                'Are you sure you want to discard your changes?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                ]
            );
        } else {
            router.back();
        }
    };

    const handleImageChange = (uri: string) => {
        setNewAvatarUri(uri);
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ThemedView style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <IconSymbol name="xmark" size={20} color="#007AFF" />
                    <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
                <TouchableOpacity
                    onPress={handleSubmit(onSavePress)}
                    disabled={(!isDirty && !newAvatarUri) || isLoading}
                    style={[styles.saveButton, ((!isDirty && !newAvatarUri) || isLoading) && styles.saveButtonDisabled]}
                >
                    <ThemedText style={[styles.saveText, ((!isDirty && !newAvatarUri) || isLoading) && styles.saveTextDisabled]}>
                        {isLoading ? 'Saving...' : 'Save'}
                    </ThemedText>
                </TouchableOpacity>
            </ThemedView>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <ThemedView style={styles.innerContainer}>
                    <ThemedView style={styles.avatarSection}>
                        <Avatar 
                            avatarUrl={profile?.avatar_url}
                            newImageUri={newAvatarUri}
                            size={120}
                            username={profile?.username}
                            editable={true}
                            onImageChange={handleImageChange}
                            showIcon={true}
                        />
                        <ThemedText style={styles.avatarHint}>
                            Tap to change profile picture
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.form}>
                        <ThemedView style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Username *</ThemedText>
                            <CustomInput
                                control={control}
                                name="username"
                                placeholder="Enter username"
                                autoCapitalize="none"
                            />
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                            <ThemedText style={styles.label}>First Name</ThemedText>
                            <CustomInput
                                control={control}
                                name="first_name"
                                placeholder="Enter first name"
                                autoCapitalize="words"
                            />
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Last Name</ThemedText>
                            <CustomInput
                                control={control}
                                name="last_name"
                                placeholder="Enter last name"
                                autoCapitalize="words"
                            />
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Email</ThemedText>
                            <CustomInput
                                control={control}
                                name="email"
                                placeholder="Enter email"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </ThemedView>
                    </ThemedView>
                </ThemedView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cancelText: {
        color: '#007AFF',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#007AFF',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    saveTextDisabled: {
        color: '#999',
    },
    scrollView: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarHint: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },
    form: {
        gap: 8,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
});