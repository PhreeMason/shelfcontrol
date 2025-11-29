import { ConfirmationModal } from '@/components/features/profile/ConfirmationModal';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useDeleteAccount, useDeleteAllData } from '@/hooks/useAccount';
import { useExportReadingProgress } from '@/hooks/useExport';
import { useTheme } from '@/hooks/useThemeColor';
// Note: Re-enable these imports when Privacy Settings section is restored
// import { useGetUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
// import { activityService } from '@/services/activity.service';
import { analytics } from '@/lib/analytics/client';
import { posthog } from '@/lib/posthog';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function DataPrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { deadlines } = useDeadlines();
  const exportMutation = useExportReadingProgress();

  // User settings hooks
  // Note: Privacy Settings section is temporarily disabled (TODO: put back later)
  // When re-enabling, uncomment the section and these hooks will be used:
  // const { data: userSettings, isLoading: isLoadingSettings } = useGetUserSettings();
  // const updateSettingsMutation = useUpdateUserSettings();

  // Account deletion hooks
  const deleteAllDataMutation = useDeleteAllData();
  const deleteAccountMutation = useDeleteAccount();

  // Modal state
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Note: Toggle handlers commented out while Privacy Settings section is disabled
  // Uncomment when re-enabling the Privacy Settings section
  /*
  const handleToggleAnalytics = async (newValue: boolean) => {
    try {
      // Track opt-out BEFORE disabling analytics (otherwise it won't be sent)
      if (!newValue) {
        analytics.track('analytics_opted_out');
        activityService.trackUserActivity('analytics_opted_out', {});
      }

      await updateSettingsMutation.mutateAsync({ analytics_enabled: newValue });
      // Update local analytics opt-out state
      await analytics.setOptOut(!newValue);

      // Track opt-in after enabling analytics
      if (newValue) {
        analytics.track('analytics_opted_in');
        activityService.trackUserActivity('analytics_opted_in', {});
      }

      Toast.show({
        type: 'success',
        text1: newValue ? 'Analytics Enabled' : 'Analytics Disabled',
        text2: newValue
          ? 'Thank you for helping improve ShelfControl'
          : 'Analytics have been turned off',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update settings',
      });
    }
  };

  const handleToggleCrashReporting = async (newValue: boolean) => {
    try {
      // Track opt-out BEFORE disabling (in case crash reporting affects analytics)
      if (!newValue) {
        analytics.track('crash_reporting_opted_out');
        activityService.trackUserActivity('crash_reporting_opted_out', {});
      }

      await updateSettingsMutation.mutateAsync({
        crash_reporting_enabled: newValue,
      });

      // Track opt-in after enabling
      if (newValue) {
        analytics.track('crash_reporting_opted_in');
        activityService.trackUserActivity('crash_reporting_opted_in', {});
      }

      Toast.show({
        type: 'success',
        text1: newValue ? 'Crash Reporting Enabled' : 'Crash Reporting Disabled',
        text2: newValue
          ? 'Thank you for helping us fix issues'
          : 'Crash reporting has been turned off',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update settings',
      });
    }
  };
  */

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to export data';
      const isRateLimit =
        errorMessage.includes('Rate limit') || errorMessage.includes('429');

      if (isRateLimit) {
        analytics.track('export_rate_limited');
      } else {
        posthog.captureException(error);
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

  const handleDeleteAllData = async () => {
    // Track before deletion (in case analytics is affected by the deletion)
    analytics.track('delete_all_data_initiated');

    try {
      await deleteAllDataMutation.mutateAsync();
      setShowDeleteDataModal(false);
      analytics.track('delete_all_data_completed');
      Toast.show({
        type: 'success',
        text1: 'Data Deleted',
        text2: 'All your reading data has been removed',
      });
    } catch (error) {
      analytics.track('delete_all_data_failed');
      posthog.captureException(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete data. Please try again.',
      });
    }
  };

  const handleDeleteAccount = async () => {
    // Track before deletion (analytics will be disabled after account is deleted)
    analytics.track('delete_account_initiated');

    try {
      await deleteAccountMutation.mutateAsync();
      // User will be signed out automatically by the hook
      // Note: analytics.track won't work after account deletion
      Toast.show({
        type: 'success',
        text1: 'Account Deleted',
        text2: 'Your account has been permanently removed',
      });
    } catch (error) {
      analytics.track('delete_account_failed');
      posthog.captureException(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete account. Please try again.',
      });
    }
  };

  const handleOpenWebView = (url: string, title: string) => {
    router.push({
      pathname: ROUTES.PROFILE.SETTINGS.WEBVIEW,
      params: { url, title },
    });
  };

  // Note: isToggleDisabled commented out while Privacy Settings section is disabled
  // const isToggleDisabled = isLoadingSettings || updateSettingsMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Data & Privacy" onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText
          typography="bodyMedium"
          color="textSecondary"
          style={styles.subtitle}
        >
          Your data and privacy settings
        </ThemedText>

        {/* Export Section */}
        <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Export Your Data
          </ThemedText>
          <Pressable
            onPress={handleExportData}
            disabled={exportMutation.isPending}
            style={[styles.exportButton, { borderColor: colors.border }]}
            testID="settings-export-button"
          >
            <View
              style={[
                styles.exportIcon,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <IconSymbol
                name="cylinder.fill"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.exportText}>
              <ThemedText typography="titleSmall">
                {exportMutation.isPending ? 'Exporting...' : 'Export to CSV'}
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                Download all your book data
              </ThemedText>
            </View>
            {exportMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IconSymbol
                name="square.and.arrow.down"
                size={20}
                color={colors.primary}
              />
            )}
          </Pressable>
        </View>

        {/* Privacy Settings */}
        {/* TODO: put this back in later */}
        {/* <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Privacy Settings
          </ThemedText>
          {isLoadingSettings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.toggleList}>
              <ToggleSwitch
                value={analyticsEnabled}
                onValueChange={handleToggleAnalytics}
                label="Analytics"
                description="Help improve ShelfControl"
                disabled={isToggleDisabled}
                testID="settings-analytics-toggle"
              />
              <ToggleSwitch
                value={crashReportingEnabled}
                onValueChange={handleToggleCrashReporting}
                label="Crash Reporting"
                description="Send anonymous crash reports"
                disabled={isToggleDisabled}
                testID="settings-crash-reporting-toggle"
              />
            </View>
          )}
        </View> */}

        {/* Legal Links */}
        <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Legal
          </ThemedText>
          <View style={styles.linkList}>
            <Pressable
              onPress={() =>
                handleOpenWebView(
                  'https://www.shelfcontrolapp.com/privacy-policy',
                  'Privacy Policy'
                )
              }
              style={styles.linkRow}
              testID="settings-privacy-policy-link"
            >
              <ThemedText typography="bodyMedium">Privacy Policy</ThemedText>
              <IconSymbol
                name="arrow.up.forward.square"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                handleOpenWebView(
                  'https://www.shelfcontrolapp.com/terms',
                  'Terms of Service'
                )
              }
              style={styles.linkRow}
              testID="settings-terms-link"
            >
              <ThemedText typography="bodyMedium">Terms of Service</ThemedText>
              <IconSymbol
                name="arrow.up.forward.square"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Danger Zone */}
        <ThemedView
          style={[
            styles.dangerZone,
            {
              backgroundColor: colors.errorContainer,
              borderColor: colors.error,
            },
          ]}
        >
          <View style={styles.dangerHeader}>
            <IconSymbol
              name="exclamationmark.triangle"
              size={16}
              color={colors.error}
            />
            <ThemedText
              typography="titleSmall"
              style={{ color: colors.urgent }}
            >
              Danger Zone
            </ThemedText>
          </View>
          <ThemedText
            typography="bodySmall"
            color="textSecondary"
            style={styles.dangerDesc}
          >
            These actions cannot be undone
          </ThemedText>
          <View style={styles.dangerButtons}>
            <ThemedButton
              title="Delete All Data"
              variant="outline"
              onPress={() => setShowDeleteDataModal(true)}
              style={[styles.dangerButton, { borderColor: colors.error }]}
              textColor="urgent"
              testID="settings-delete-all-data-button"
            />
            <ThemedButton
              title="Delete Account"
              variant="error"
              onPress={() => setShowDeleteAccountModal(true)}
              testID="settings-delete-account-button"
            />
          </View>
        </ThemedView>
      </ScrollView>

      {/* Delete All Data Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteDataModal}
        onClose={() => setShowDeleteDataModal(false)}
        onConfirm={handleDeleteAllData}
        title="Delete All Data"
        description="This will permanently delete all your reading data including deadlines, progress, notes, and tags. Your account will remain active."
        warningPoints={[
          'All your books will be deleted',
          'All reading progress will be lost',
          'All notes, tags, contacts, links, ..etc will be removed',
          'This action cannot be undone',
        ]}
        confirmButtonText="Delete Data"
        isLoading={deleteAllDataMutation.isPending}
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This will permanently delete your account and all associated data. You will be signed out immediately."
        warningPoints={[
          'Your account will be permanently deleted',
          'All your data will be removed',
          'You will not be able to recover your account',
          'This action cannot be undone',
        ]}
        confirmButtonText="Delete Account"
        isLoading={deleteAccountMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 100 : Spacing.xxl,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  exportIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportText: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  toggleList: {
    gap: Spacing.md,
  },
  linkList: {
    gap: Spacing.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  dangerZone: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  dangerDesc: {
    marginBottom: Spacing.md,
  },
  dangerButtons: {
    gap: Spacing.sm,
  },
  dangerButton: {
    marginBottom: 0,
  },
});
