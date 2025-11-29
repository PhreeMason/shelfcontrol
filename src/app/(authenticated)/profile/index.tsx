import ProfileHeaderInfo from '@/components/features/profile/ProfileHeaderInfo';
import SettingsSectionList, {
  SettingsSection,
} from '@/components/features/profile/SettingsSectionList';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedView } from '@/components/themed';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  React.useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleEditProfile = () => {
    router.push(ROUTES.PROFILE.EDIT);
  };

  const getJoinedDate = () => {
    if (profile?.created_at) {
      return new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return undefined;
  };

  const settingsSections: SettingsSection[] = [
    // {
    //   id: 'appearance',
    //   title: 'Display & Appearance',
    //   description: 'Theme, fonts, calendar',
    //   icon: 'paintpalette.fill',
    //   iconBackgroundColor: colors.primary,
    //   onPress: () => router.push(ROUTES.PROFILE.SETTINGS.APPEARANCE),
    // },
    // {
    //   id: 'reading',
    //   title: 'Reading Preferences',
    //   description: 'Pace, thresholds, progress',
    //   icon: 'book.fill',
    //   iconBackgroundColor: colors.accent,
    //   onPress: () => router.push(ROUTES.PROFILE.SETTINGS.READING),
    // },
    {
      id: 'updates',
      title: 'App Updates',
      description: 'Check for new versions',
      icon: 'arrow.triangle.2.circlepath',
      iconBackgroundColor: colors.primary,
      onPress: () => router.push(ROUTES.PROFILE.SETTINGS.UPDATES),
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      description: 'Export, delete, policies',
      icon: 'cylinder.fill',
      iconBackgroundColor: colors.accent,
      onPress: () => router.push(ROUTES.PROFILE.SETTINGS.DATA),
    },
    // {
    //   id: 'about',
    //   title: 'About & Support',
    //   description: 'Help, contact, version',
    //   icon: 'info.circle',
    //   iconBackgroundColor: colors.primary,
    //   onPress: () => router.push(ROUTES.PROFILE.SETTINGS.ABOUT),
    // },
  ];

  const editButton = (
    <ThemedIconButton
      icon="pencil"
      size="md"
      onPress={handleEditProfile}
      variant="ghost"
      iconColor="onPrimary"
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['right', 'left']}
    >
      <AppHeader title="" onBack={() => {}} showBackButton={false}>
        <ProfileHeaderInfo
          avatarUrl={profile?.avatar_url}
          username={profile?.username || 'Unknown'}
          email={profile?.email}
          joinedDate={getJoinedDate()}
          rightElement={editButton}
        />
      </AppHeader>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView
          style={[
            styles.innerContainer,
            Platform.OS === 'ios' && styles.iosContainer,
          ]}
        >
          <SettingsSectionList sections={settingsSections} />

          <ThemedButton
            title="Sign Out"
            variant="dangerOutline"
            onPress={handleSignOut}
            testID="sign-out-button"
            style={styles.signOutButton}
          />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  innerContainer: {
    padding: Spacing.md,
  },
  iosContainer: {
    marginBottom: 80,
  },
  signOutButton: {
    marginTop: Spacing.md,
  },
});
