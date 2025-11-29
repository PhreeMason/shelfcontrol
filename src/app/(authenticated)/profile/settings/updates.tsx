import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import {
  getAllPreviousReleases,
  getCurrentRelease,
  getRecentPreviousReleases,
  ReleaseNote,
} from '@/constants/releaseNotes';
import { useTheme } from '@/hooks/useThemeColor';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

type UpdateStatus =
  | { type: 'idle' }
  | { type: 'checking' }
  | { type: 'up-to-date'; checkedAt: Date }
  | { type: 'available' }
  | { type: 'downloading' }
  | { type: 'ready' }
  | { type: 'error'; message: string };

export default function AppUpdatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    type: 'idle',
  });
  const [showAllReleasesModal, setShowAllReleasesModal] = useState(false);
  const [showPreviousReleases, setShowPreviousReleases] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const runtimeVersion = __DEV__
    ? appVersion
    : (Updates.runtimeVersion ?? 'N/A');
  const isDevMode = __DEV__;

  const currentRelease = getCurrentRelease();
  const recentPreviousReleases = getRecentPreviousReleases(2);
  const allPreviousReleases = getAllPreviousReleases();

  const handleCheckForUpdate = useCallback(async () => {
    if (isDevMode) {
      Alert.alert(
        'Development Mode',
        'Update checking is not available in development mode. Build the app for production to test updates.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setUpdateStatus({ type: 'checking' });
      const checkResult = await Updates.checkForUpdateAsync();

      if (checkResult.isAvailable) {
        setUpdateStatus({ type: 'available' });
      } else {
        setUpdateStatus({ type: 'up-to-date', checkedAt: new Date() });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setUpdateStatus({ type: 'error', message });
    }
  }, [isDevMode]);

  const handleDownloadUpdate = useCallback(async () => {
    try {
      setUpdateStatus({ type: 'downloading' });
      await Updates.fetchUpdateAsync();
      setUpdateStatus({ type: 'ready' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Download failed';
      setUpdateStatus({ type: 'error', message });
    }
  }, []);

  const handleApplyUpdate = useCallback(async () => {
    Alert.alert('Apply Update', 'The app will restart to apply the update.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restart Now',
        onPress: async () => {
          try {
            await Updates.reloadAsync();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Restart failed';
            setUpdateStatus({ type: 'error', message });
          }
        },
      },
    ]);
  }, []);

  const renderStatusSection = () => {
    switch (updateStatus.type) {
      case 'checking':
        return (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText typography="bodyMedium" color="textSecondary">
              Checking for updates...
            </ThemedText>
          </View>
        );

      case 'up-to-date':
        return (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.successContainer },
            ]}
          >
            <IconSymbol
              name="checkmark.circle.fill"
              size={20}
              color={colors.good}
            />
            <View style={styles.statusTextContainer}>
              <ThemedText typography="titleSmall" color="text">
                You&apos;re on the latest version!
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                Last checked: just now
              </ThemedText>
            </View>
          </View>
        );

      case 'available':
        return (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <IconSymbol
              name="arrow.clockwise"
              size={20}
              color={colors.primary}
            />
            <View style={styles.statusTextContainer}>
              <ThemedText typography="titleSmall" color="text">
                Update available!
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                A new version is ready to download
              </ThemedText>
            </View>
            <ThemedButton
              title="Download"
              variant="primary"
              size="sm"
              onPress={handleDownloadUpdate}
              testID="settings-download-update-button"
            />
          </View>
        );

      case 'downloading':
        return (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText typography="bodyMedium" color="textSecondary">
              Downloading update...
            </ThemedText>
          </View>
        );

      case 'ready':
        return (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.successContainer },
            ]}
          >
            <IconSymbol
              name="checkmark.circle.fill"
              size={20}
              color={colors.good}
            />
            <View style={styles.statusTextContainer}>
              <ThemedText typography="titleSmall" color="text">
                Update ready!
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                Restart the app to apply changes
              </ThemedText>
            </View>
            <ThemedButton
              title="Restart"
              variant="primary"
              size="sm"
              onPress={handleApplyUpdate}
              testID="settings-restart-button"
            />
          </View>
        );

      case 'error':
        return (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.errorContainer },
            ]}
          >
            <IconSymbol
              name="exclamationmark.circle.fill"
              size={20}
              color={colors.error}
            />
            <View style={styles.statusTextContainer}>
              <ThemedText typography="titleSmall" color="text">
                Error checking for updates
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                {updateStatus.message}
              </ThemedText>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderReleaseNotes = (release: ReleaseNote, isCompact = false) => {
    const textSize = isCompact ? 'bodySmall' : 'bodyMedium';
    const bulletColor = isCompact ? colors.textMuted : colors.primary;

    return (
      <View style={styles.releaseNotesContent}>
        {release.features.map((feature: string, index: number) => (
          <View key={`feature-${index}`} style={styles.bulletItem}>
            <View
              style={[styles.bulletDot, { backgroundColor: bulletColor }]}
            />
            <ThemedText typography={textSize} color="text">
              {feature}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  const isChecking = updateStatus.type === 'checking';
  const isDownloading = updateStatus.type === 'downloading';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="App Updates" onBack={() => router.back()} />

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
          Keep ShelfControl up to date
        </ThemedText>

        {/* Version Card with Build Name */}
        <ThemedView
          style={[
            styles.versionCard,
            {
              backgroundColor: colors.primary + '20',
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.appIcon}
          />

          {/* Build Name - Featured */}
          <View style={styles.buildNameContainer}>
            <ThemedText
              typography="headlineSmall"
              style={[styles.buildName, { color: colors.primary }]}
            >
              {currentRelease.buildName}
            </ThemedText>
            <View style={styles.buildNameDivider}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.accent }]}
              />
              <ThemedText
                typography="labelSmall"
                color="accent"
                style={styles.buildNameLabel}
              >
                BUILD NAME
              </ThemedText>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.accent }]}
              />
            </View>
          </View>

          <ThemedText typography="titleMedium" style={styles.appName}>
            ShelfControl
          </ThemedText>
          <ThemedText typography="bodyMedium" color="textSecondary">
            Version {appVersion}
          </ThemedText>
          <ThemedText typography="bodySmall" color="textMuted">
            Runtime: {runtimeVersion}
          </ThemedText>

          {/* What's New Section */}
          <View
            style={[
              styles.whatsNewContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <ThemedText
              typography="labelLarge"
              color="darkPurple"
              style={[styles.whatsNewTitle]}
            >
              What&apos;s New in This Chapter
            </ThemedText>
            {renderReleaseNotes(currentRelease)}

            {/* Previous Chapters Toggle */}
            {recentPreviousReleases.length > 0 && (
              <Pressable
                onPress={() => setShowPreviousReleases(!showPreviousReleases)}
                style={[
                  styles.previousChaptersToggle,
                  { borderTopColor: colors.border },
                ]}
              >
                <View style={styles.previousChaptersLabel}>
                  <IconSymbol
                    name="book"
                    size={16}
                    color={colors.primary}
                    style={styles.bookIcon}
                  />
                  <ThemedText typography="bodyMedium" color="primary">
                    Previous Chapters
                  </ThemedText>
                </View>
                <IconSymbol
                  name={showPreviousReleases ? 'chevron.up' : 'chevron.down'}
                  size={16}
                  color={colors.primary}
                />
              </Pressable>
            )}

            {/* Expandable Previous Releases */}
            {showPreviousReleases && (
              <View style={styles.previousReleasesContainer}>
                {recentPreviousReleases.map((release, index) => (
                  <View
                    key={release.version}
                    style={[
                      styles.previousReleaseItem,
                      { borderTopColor: colors.border },
                      index === 0 && styles.firstPreviousRelease,
                    ]}
                  >
                    <View style={styles.previousReleaseHeader}>
                      <ThemedText
                        typography="titleSmall"
                        style={styles.previousBuildName}
                      >
                        &quot;{release.buildName}&quot;
                      </ThemedText>
                      <ThemedText typography="labelSmall" color="textMuted">
                        v{release.version}
                      </ThemedText>
                    </View>
                    {renderReleaseNotes(release, true)}
                  </View>
                ))}

                {/* View All Chapters Link */}
                {allPreviousReleases.length > 2 && (
                  <Pressable
                    onPress={() => setShowAllReleasesModal(true)}
                    style={[
                      styles.viewAllChaptersLink,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <ThemedText typography="bodyMedium" color="primary">
                      View All Chapters
                    </ThemedText>
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </ThemedView>

        {/* Check for Updates Button */}
        <ThemedButton
          title={isChecking ? 'Checking...' : 'Check for Updates'}
          variant="primary"
          onPress={handleCheckForUpdate}
          disabled={isChecking || isDownloading}
          loading={isChecking}
          style={styles.checkButton}
          testID="settings-check-updates-button"
        />

        {/* Status Section */}
        {renderStatusSection()}

        {/* Info Card */}
        <ThemedView style={[styles.infoCard, { borderColor: colors.border }]}>
          <ThemedText typography="titleSmall" style={styles.infoTitle}>
            How Updates Work
          </ThemedText>
          <ThemedText
            typography="bodySmall"
            color="textSecondary"
            style={styles.infoText}
          >
            ShelfControl checks for updates when you open the app. Small fixes
            are applied automatically, while larger updates may require a visit
            to the {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}.
          </ThemedText>
        </ThemedView>

        {/* Dev Mode Notice */}
        {isDevMode && (
          <View
            style={[
              styles.devNotice,
              { backgroundColor: colors.warningContainer },
            ]}
          >
            <IconSymbol
              name="exclamationmark.triangle"
              size={16}
              color={colors.warning}
            />
            <ThemedText typography="bodySmall" color="textSecondary">
              Running in development mode. Updates only work in production
              builds.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Release History Modal */}
      <Modal
        visible={showAllReleasesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllReleasesModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable onPress={() => setShowAllReleasesModal(false)}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </Pressable>
            <ThemedText typography="titleSubLarge">Release History</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* Intro */}
          <View
            style={[
              styles.modalIntro,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.modalAppIcon}
            />
            <ThemedText typography="titleMedium" style={styles.modalIntroTitle}>
              Previous Chapters of ShelfControl
            </ThemedText>
            <ThemedText typography="bodyMedium" color="textSecondary">
              romance trope-inspired updates
            </ThemedText>
          </View>

          {/* Release List */}
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >
            {allPreviousReleases.map((release, index) => (
              <View
                key={release.version}
                style={[
                  styles.modalReleaseItem,
                  { borderBottomColor: colors.border },
                  index === allPreviousReleases.length - 1 &&
                    styles.lastReleaseItem,
                ]}
              >
                <View style={styles.modalReleaseHeader}>
                  <ThemedText
                    typography="titleMediumPlus"
                    style={styles.modalReleaseBuildName}
                  >
                    {release.buildName}
                  </ThemedText>
                  <ThemedText typography="labelSmall" color="textMuted">
                    v{release.version}
                  </ThemedText>
                </View>
                {renderReleaseNotes(release, true)}
              </View>
            ))}

            {/* End of List */}
            <View style={styles.modalEndOfList}>
              <View
                style={[
                  styles.modalEndDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <ThemedText typography="bodySmall" color="textMuted">
                More chapters coming soon
              </ThemedText>
              <View
                style={[
                  styles.modalEndDivider,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  versionCard: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  buildNameContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buildName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
  },
  buildNameDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  dividerLine: {
    height: 1,
    width: 24,
  },
  buildNameLabel: {
    marginHorizontal: Spacing.sm,
    letterSpacing: 1,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  whatsNewContainer: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  whatsNewTitle: {
    marginBottom: Spacing.md,
  },
  releaseNotesContent: {
    gap: Spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  previousChaptersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  previousChaptersLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllChaptersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  bookIcon: {
    marginRight: Spacing.sm,
  },
  previousReleasesContainer: {
    marginTop: Spacing.md,
  },
  previousReleaseItem: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    paddingBottom: Spacing.sm,
  },
  firstPreviousRelease: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  previousReleaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previousBuildName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  checkButton: {
    marginBottom: Spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusTextContainer: {
    flex: 1,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    marginBottom: Spacing.sm,
  },
  infoText: {
    marginBottom: 0,
  },
  devNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalIntro: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  modalAppIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  modalIntroTitle: {
    marginBottom: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  modalReleaseItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  lastReleaseItem: {
    borderBottomWidth: 0,
  },
  modalReleaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalReleaseBuildName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalEndOfList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  modalEndDivider: {
    height: 1,
    width: 32,
  },
});
