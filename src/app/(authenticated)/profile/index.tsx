import ProfileHeaderInfo from '@/components/features/profile/ProfileHeaderInfo';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ROUTES } from '@/constants/routes';
import { useExportReadingProgress } from '@/hooks/useExport';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import { useAuth } from '@/providers/AuthProvider';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { deadlines } = useDeadlines();
  const exportMutation = useExportReadingProgress();

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

  const handleExportData = async () => {
    analytics.track('export_data_initiated');

    try {
      await exportMutation.mutateAsync();
      analytics.track('export_completed', {
        record_count: deadlines.length,
      });
      Toast.show({
        type: 'success',
        text1: 'Export Successful',
        text2: 'CSV has been sent to your email',
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to export data';
      const isRateLimit =
        errorMessage.includes('Rate limit') || errorMessage.includes('429');

      if (isRateLimit) {
        analytics.track('export_rate_limited');
      } else {
        analytics.track('export_failed', {
          error_message: errorMessage,
        });
      }

      Toast.show({
        type: 'error',
        text1: isRateLimit ? 'Rate Limit Exceeded' : 'Export Failed',
        text2: isRateLimit
          ? 'You can only export once per 24 hours'
          : errorMessage,
      });
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    }
    return null;
  };

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
      <AppHeader
        title=""
        onBack={() => {}}
        showBackButton={false}
        rightElement={editButton}
      >
        <ProfileHeaderInfo
          avatarUrl={profile?.avatar_url}
          username={profile?.username || 'Unknown'}
          displayName={getDisplayName() || undefined}
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
          <ThemedView style={[styles.section, styles.infoSection]}>
            <View style={styles.infoItem}>
              <IconSymbol name="envelope" size={20} color={colors.icon} />
              <ThemedText style={styles.infoText}>
                {profile?.email || 'No email provided'}
              </ThemedText>
            </View>

            <View style={styles.infoItem}>
              <IconSymbol name="calendar" size={20} color={colors.icon} />
              <ThemedText style={styles.infoText}>
                Joined{' '}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'Unknown'}
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedButton
            title={exportMutation.isPending ? 'Exporting...' : 'Export Data'}
            variant="outline"
            onPress={handleExportData}
            loading={exportMutation.isPending}
            testID="export-data-button"
            style={styles.exportButton}
          />

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
    padding: 20,
  },
  iosContainer: {
    marginBottom: 80,
  },
  section: {
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 18,
  },
  exportButton: {
    marginBottom: 12,
  },
  signOutButton: {
    marginBottom: 12,
  },
});
