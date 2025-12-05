import { CompletedBooksCarousel } from '@/components/features/stats/CompletedBooksCarousel';
import { MostProductiveListeningDaysCard } from '@/components/features/stats/MostProductiveListeningDaysCard';
import { MostProductiveReadingDaysCard } from '@/components/features/stats/MostProductiveReadingDaysCard';
import { WeeklyListeningCard } from '@/components/features/stats/WeeklyListeningCard';
import { WeeklyReadingCard } from '@/components/features/stats/WeeklyReadingCard';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { getCompletedThisYear } from '@/utils/deadlineUtils';
import {
  calculateWeeklyListeningStats,
  calculateWeeklyReadingStats,
} from '@/utils/statsUtils';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Stats() {
  const { colors } = useTheme();
  const {
    deadlines,
    activeDeadlines,
    completedDeadlines,
    isLoading,
    error,
    refetch,
  } = useDeadlines();

  const completedThisYear = getCompletedThisYear(completedDeadlines);

  // Calculate weekly stats for reading and audio
  // Progress counts ALL deadlines (any status), goals count only active deadlines
  const weeklyReadingStats = React.useMemo(
    () =>
      calculateWeeklyReadingStats(activeDeadlines, completedDeadlines, deadlines),
    [activeDeadlines, completedDeadlines, deadlines]
  );
  const weeklyListeningStats = React.useMemo(
    () =>
      calculateWeeklyListeningStats(activeDeadlines, completedDeadlines, deadlines),
    [activeDeadlines, completedDeadlines, deadlines]
  );

  // Refetch data whenever the page comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['right', 'left']}
      >
        <AppHeader
          title="Reading Statistics"
          onBack={() => {}} // Empty handler - no back navigation needed for root tab
          showBackButton={false}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText typography="bodyLarge" style={styles.loadingText}>
            Loading your reading statistics...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['right', 'left']}
      >
        <AppHeader
          title="Reading Statistics"
          onBack={() => {}} // Empty handler - no back navigation needed for root tab
          showBackButton={false}
        />
        <View style={styles.centerContainer}>
          <ThemedText typography="titleSubLarge" style={styles.errorTitle}>
            Unable to Load Statistics
          </ThemedText>
          <ThemedText
            typography="bodyMedium"
            color="textMuted"
            style={styles.errorMessage}
          >
            {error.message ||
              'An error occurred while loading your reading data.'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <ThemedText typography="titleMedium" color="textOnPrimary">
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['right', 'left']}
    >
      <AppHeader
        title="Reading Statistics"
        onBack={() => {}}
        showBackButton={false}
      />
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
          <CompletedBooksCarousel completedDeadlines={completedThisYear} />

          <WeeklyReadingCard stats={weeklyReadingStats} />
          <MostProductiveReadingDaysCard />

          <WeeklyListeningCard stats={weeklyListeningStats} />
          <MostProductiveListeningDaysCard />
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
    padding: Spacing.lg,
  },
  iosContainer: {
    marginBottom: 80, // Accounts for iOS tab bar height + safe area padding
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  errorTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
});
