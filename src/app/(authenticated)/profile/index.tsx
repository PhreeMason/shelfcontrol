import { CalendarLegend } from '@/components/features/deadlines/CalendarLegend';
import { DeadlineCalendar } from '@/components/features/deadlines/DeadlineCalendar';
import { CompletedBooksCarousel } from '@/components/features/profile/CompletedBooksCarousel';
import ProfileHeaderInfo from '@/components/features/profile/ProfileHeaderInfo';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ROUTES } from '@/constants/routes';
import { useExportReadingProgress } from '@/hooks/useExport';
import { useTheme, useThemedStyles } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  getCompletedThisMonth,
  getCompletedThisYear,
  getOnTrackDeadlines,
} from '@/utils/deadlineUtils';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const {
    deadlines,
    completedDeadlines,
    userPaceData: readingPaceData,
    userListeningPaceData: listeningPaceData,
    formatPaceForFormat,
  } = useDeadlines();
  const exportMutation = useExportReadingProgress();

  React.useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = getCompletedThisMonth(completedDeadlines);
  const onTrackCount = getOnTrackDeadlines(
    deadlines,
    readingPaceData,
    listeningPaceData
  );
  const completedThisYear = getCompletedThisYear(completedDeadlines);

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
    try {
      await exportMutation.mutateAsync();
      Toast.show({
        type: 'success',
        text1: 'Export Successful',
        text2: 'CSV has been sent to your email',
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to export data';
      const isRateLimit =
        errorMessage.includes('Rate limit') || errorMessage.includes('429');

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

  const paceStyles = useThemedStyles(theme => ({
    section: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 20,
      marginBottom: 20,
    },
    paceColumnRight: {
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      paddingLeft: 16,
      marginLeft: 4,
    },
    paceDescription: {
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    dataPointsTextSmall: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 16,
      color: theme.colors.textMuted,
    },
    infoText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
  }));

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
          <ThemedView style={styles.section}>
            <ThemedText variant="title" style={styles.sectionTitle}>
              This Month's Reading Progress
            </ThemedText>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: colors.good }]}>
                  {onTrackCount}
                </ThemedText>
                <ThemedText variant="muted" style={styles.statLabel}>
                  ON TRACK
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText
                  style={[styles.statNumber, { color: colors.complete }]}
                >
                  {completedCount}
                </ThemedText>
                <ThemedText variant="muted" style={styles.statLabel}>
                  COMPLETED
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          <CompletedBooksCarousel completedDeadlines={completedThisYear} />

          <ThemedView style={styles.section}>
            <ThemedText variant="title" style={styles.sectionTitle}>
              Your Deadlines
            </ThemedText>
            <DeadlineCalendar />
            <CalendarLegend />
          </ThemedView>

          <ThemedView style={paceStyles.section}>
            <View style={styles.paceSectionHeader}>
              <ThemedText
                variant="defaultSemiBold"
                style={[
                  styles.paceSectionTitle,
                  { fontSize: 20, lineHeight: 24 },
                ]}
              >
                Reading & Listening Pace
              </ThemedText>
            </View>

            <View style={styles.paceRow}>
              {/* Reading Pace */}
              <View style={styles.paceColumn}>
                <View style={styles.paceHeader}>
                  <IconSymbol
                    name="book.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <ThemedText style={styles.paceColumnTitle}>
                    Reading
                  </ThemedText>
                </View>
                <ThemedText style={styles.paceValue}>
                  {readingPaceData.averagePace > 0
                    ? formatPaceForFormat(readingPaceData.averagePace, 'physical')
                    : '0 pages/day'}
                </ThemedText>
                <ThemedText style={paceStyles.paceDescription}>
                  Based on recent reading activity
                </ThemedText>
                {readingPaceData.isReliable && (
                  <ThemedText style={paceStyles.dataPointsTextSmall}>
                    {readingPaceData.readingDaysCount} reading days
                  </ThemedText>
                )}
              </View>

              {/* Listening Pace */}
              <View style={[styles.paceColumn, paceStyles.paceColumnRight]}>
                <View style={styles.paceHeader}>
                  <IconSymbol
                    name="headphones"
                    size={20}
                    color={colors.accent}
                  />
                  <ThemedText style={styles.paceColumnTitle}>
                    Listening
                  </ThemedText>
                </View>
                <ThemedText style={styles.paceValue}>
                  {listeningPaceData.averagePace > 0
                    ? formatPaceForFormat(listeningPaceData.averagePace, 'audio')
                    : '0m/day'}
                </ThemedText>
                <ThemedText style={paceStyles.paceDescription}>
                  Based on recent listening activity
                </ThemedText>
                {listeningPaceData.isReliable && (
                  <ThemedText style={paceStyles.dataPointsTextSmall}>
                    {listeningPaceData.listeningDaysCount} listening days
                  </ThemedText>
                )}
              </View>
            </View>
          </ThemedView>

          {/* How Pace is Calculated - Educational info */}
          <ThemedView style={paceStyles.section}>
            <View
              style={[
                styles.paceSectionHeader,
                { justifyContent: 'flex-start' },
              ]}
            >
              <IconSymbol
                name="info.circle.fill"
                size={24}
                color={colors.icon}
              />
              <ThemedText style={styles.paceSectionTitle}>
                How Pace is Calculated
              </ThemedText>
            </View>

            <View style={styles.paceInfoContainer}>
              <ThemedText style={paceStyles.infoText}>
                Your reading pace is based on the average pages read per day
                within the last 14 days starting from your most recent logged
                day.
              </ThemedText>
              <ThemedText style={paceStyles.infoText}>
                If today is December 25th and the last progress update was
                December 15th, your pace is calculated based on your average
                from December 2nd - December 15th.
              </ThemedText>
            </View>
          </ThemedView>

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
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 33,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  paceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  paceSectionTitle: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '600',
  },
  paceRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
  },
  paceColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  paceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paceColumnTitle: {
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '600',
  },
  paceValue: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  paceInfoContainer: {
    gap: 12,
  },
});
