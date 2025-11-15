import { CompletedBooksCarousel } from '@/components/features/profile/CompletedBooksCarousel';
import { MostProductiveListeningDaysCard } from '@/components/features/stats/MostProductiveListeningDaysCard';
import { MostProductiveReadingDaysCard } from '@/components/features/stats/MostProductiveReadingDaysCard';
import { WeeklyListeningCard } from '@/components/features/stats/WeeklyListeningCard';
import { WeeklyReadingCard } from '@/components/features/stats/WeeklyReadingCard';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
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
  const { activeDeadlines, completedDeadlines, isLoading, error, refetch } =
    useDeadlines();

  const completedThisYear = getCompletedThisYear(completedDeadlines);

  // Calculate weekly stats for reading and audio
  const weeklyReadingStats = React.useMemo(
    () => calculateWeeklyReadingStats(activeDeadlines, completedDeadlines),
    [activeDeadlines, completedDeadlines]
  );
  const weeklyListeningStats = React.useMemo(
    () => calculateWeeklyListeningStats(activeDeadlines, completedDeadlines),
    [activeDeadlines, completedDeadlines]
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
          <ThemedText style={styles.loadingText}>
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
          <ThemedText style={styles.errorTitle}>
            Unable to Load Statistics
          </ThemedText>
          <ThemedText
            style={[styles.errorMessage, { color: colors.textMuted }]}
          >
            {error.message ||
              'An error occurred while loading your reading data.'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <ThemedText
              style={[styles.retryButtonText, { color: colors.textOnPrimary }]}
            >
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
    padding: 20,
  },
  iosContainer: {
    marginBottom: 80, // Accounts for iOS tab bar height + safe area padding
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
