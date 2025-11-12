import UserReadingLineChart from '@/components/charts/UserReadingLineChart';
import { CompletedBooksCarousel } from '@/components/features/profile/CompletedBooksCarousel';
import { MonthlyProgressSection } from '@/components/features/stats/MonthlyProgressSection';
import { PaceCalculationInfo } from '@/components/features/stats/PaceCalculationInfo';
import { ReadingPaceSection } from '@/components/features/stats/ReadingPaceSection';
import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  getCompletedThisMonth,
  getCompletedThisYear,
  getOnTrackDeadlines,
} from '@/utils/deadlineUtils';
import React from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Stats() {
  const { colors } = useTheme();
  const {
    deadlines,
    completedDeadlines,
    userPaceData: readingPaceData,
    userListeningPaceData: listeningPaceData,
    formatPaceForFormat,
    isLoading,
    error,
    refetch,
  } = useDeadlines();

  const completedCount = getCompletedThisMonth(completedDeadlines);
  const onTrackCount = getOnTrackDeadlines(
    deadlines,
    readingPaceData,
    listeningPaceData
  );
  const completedThisYear = getCompletedThisYear(completedDeadlines);

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
          <ThemedText style={[styles.errorMessage, { color: colors.textMuted }]}>
            {error.message || 'An error occurred while loading your reading data.'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <ThemedText style={[styles.retryButtonText, { color: colors.textOnPrimary }]}>
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
          <MonthlyProgressSection
            onTrackCount={onTrackCount}
            completedCount={completedCount}
          />

          <CompletedBooksCarousel completedDeadlines={completedThisYear} />

          <UserReadingLineChart deadlines={deadlines} />

          <ReadingPaceSection
            readingPaceData={readingPaceData}
            listeningPaceData={listeningPaceData}
            formatPaceForFormat={formatPaceForFormat}
          />

          <PaceCalculationInfo />
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
