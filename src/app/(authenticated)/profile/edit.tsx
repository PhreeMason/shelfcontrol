import AppHeader from '@/components/shared/AppHeader';
import Avatar from '@/components/shared/Avatar';
import CustomInput from '@/components/shared/CustomInput';
import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { UpdateProfileParams } from '@/services';
import { analytics } from '@/lib/analytics/client';
import { useAuth } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';

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
  const { profile, session } = useAuth();
  const { mutateAsync: uploadAvatar } = useUploadAvatar();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const router = useRouter();
  const { colors } = useTheme();

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
    if (isLoading || !session?.user?.id) return;

    setIsLoading(true);
    try {
      let avatarPath = profile?.avatar_url;
      let avatarUploaded = false;

      if (newAvatarUri) {
        try {
          const uploadedPath = await uploadAvatar({
            userId: session.user.id,
            uri: newAvatarUri,
          });
          avatarPath = uploadedPath;
          avatarUploaded = true;
        } catch (uploadError) {
          Alert.alert(
            'Error',
            `Failed to upload avatar: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          );
          setIsLoading(false);
          return;
        }
      }

      const updates: UpdateProfileParams = {
        username: data.username,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        email: data.email || null,
        avatar_url: avatarPath ?? null,
      };

      await updateProfile({ profileId: session.user.id, updates });

      analytics.track('profile_updated', {
        avatar_changed: avatarUploaded,
      });
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(ROUTES.HOME);
            }
          },
        },
      ]);
    } catch (err) {
      console.error('Profile update error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const navigateBack = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(ROUTES.HOME);
      }
    };

    if (isDirty || newAvatarUri) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: navigateBack,
          },
        ]
      );
    } else {
      navigateBack();
    }
  };

  const handleImageChange = (uri: string) => {
    setNewAvatarUri(uri);
  };

  const saveButton = (
    <TouchableOpacity
      onPress={handleSubmit(onSavePress)}
      disabled={(!isDirty && !newAvatarUri) || isLoading}
      style={[
        styles.saveButton,
        ((!isDirty && !newAvatarUri) || isLoading) && styles.saveButtonDisabled,
      ]}
    >
      <ThemedText
        style={[
          styles.saveText,
          ((!isDirty && !newAvatarUri) || isLoading) && styles.saveTextDisabled,
        ]}
      >
        {isLoading ? 'Saving...' : 'Save'}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['right', 'bottom', 'left']}
    >
      <AppHeader
        title="Edit Profile"
        onBack={handleBack}
        rightElement={saveButton}
        headerStyle={Platform.OS === 'ios' ? { paddingTop: 10 } : {}}
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
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
              <ThemedText
                typography="bodyMedium"
                style={[styles.avatarHint, { color: colors.textSecondary }]}
              >
                Tap to change profile picture
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.label}>
                  Username{' '}
                  <ThemedText color="error">*</ThemedText>
                </ThemedText>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveText: {
    ...Typography.titleMedium,
    color: 'white',
  },
  saveTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  scrollView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarHint: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.titleMedium,
    marginBottom: Spacing.sm,
  },
});
