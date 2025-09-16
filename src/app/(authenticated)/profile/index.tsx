import { CalendarLegend } from '@/components/features/deadlines/CalendarLegend';
import { DeadlineCalendar } from '@/components/features/deadlines/DeadlineCalendar';
import AppHeader from '@/components/shared/AppHeader';
import Avatar from '@/components/shared/Avatar';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGetDeadlines } from '@/hooks/useDeadlines';
import { useTheme, useThemedStyles } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import {
  getCompletedThisMonth,
  getOnTrackDeadlines,
} from '@/utils/deadlineUtils';
import {
  calculateUserListeningPace,
  calculateUserPace,
  formatListeningPaceDisplay,
  formatPaceDisplay,
} from '@/utils/paceCalculations';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: deadlines = [] } = useGetDeadlines();

  const completedCount = getCompletedThisMonth(deadlines);
  const onTrackCount = getOnTrackDeadlines(deadlines);

  // Calculate pace data
  const readingPaceData = calculateUserPace(deadlines);
  const listeningPaceData = calculateUserListeningPace(deadlines);

  // Refresh profile when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    }
    return null;
  };

  const editButton = (
    <Pressable onPress={handleEditProfile}>
      <IconSymbol name="pencil" size={24} color="white" />
    </Pressable>
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
        title="Profile"
        onBack={() => {}} // Not used since showBackButton is false
        rightElement={editButton}
        showBackButton={false}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.innerContainer}>
          <ThemedView style={styles.profileCard}>
            <View style={styles.avatarSection}>
              <Avatar
                avatarUrl={profile?.avatar_url}
                size={120}
                username={profile?.username}
                showIcon={true}
              />
              <View style={styles.nameSection}>
                <ThemedText style={styles.username}>
                  @{profile?.username || 'Unknown'}
                </ThemedText>
                {getDisplayName() && (
                  <ThemedText style={styles.displayName}>
                    {getDisplayName()}
                  </ThemedText>
                )}
              </View>
            </View>
          </ThemedView>

          <ThemedView style={styles.statsCard}>
            <ThemedText variant="title" style={styles.sectionTitle}>
              This Month's Reading Progress
            </ThemedText>
            <View style={styles.statsContainer}>
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
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: colors.good }]}>
                  {onTrackCount}
                </ThemedText>
                <ThemedText variant="muted" style={styles.statLabel}>
                  ON TRACK
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          <ThemedView style={styles.calendarSection}>
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
                style={[styles.paceSectionTitle, { fontSize: 20 }]}
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
                    ? formatPaceDisplay(readingPaceData.averagePace, 'physical')
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
                    ? formatListeningPaceDisplay(listeningPaceData.averagePace)
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

          <ThemedView style={styles.infoSection}>
            <View style={styles.infoItem}>
              <IconSymbol name="envelope" size={20} color="#666" />
              <ThemedText style={styles.infoText}>
                {profile?.email || 'No email provided'}
              </ThemedText>
            </View>

            <View style={styles.infoItem}>
              <IconSymbol name="calendar" size={20} color="#666" />
              <ThemedText style={styles.infoText}>
                Joined{' '}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'Unknown'}
              </ThemedText>
            </View>
          </ThemedView>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
          </TouchableOpacity>
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
  profileCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  username: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  linkText: {
    color: '#007AFF',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  signOutButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
