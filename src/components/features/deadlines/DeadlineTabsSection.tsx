import DailyReadingChart from '@/components/charts/DailyReadingChart';
import ReviewProgressSection from '@/components/features/review/ReviewProgressSection';
import ReadingStats from '@/components/stats/ReadingStats';
import { ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface DeadlineTabsSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

type TabType = 'stats' | 'reviews';

const DeadlineTabsSection: React.FC<DeadlineTabsSectionProps> = ({ deadline }) => {
  const [activeTab, setActiveTab] = useState<TabType>('stats');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'stats' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('stats')}
          testID="stats-tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'stats' && styles.activeTabText,
            ]}
          >
            Stats
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            activeTab === 'reviews' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('reviews')}
          testID="reviews-tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'reviews' && styles.activeTabText,
            ]}
          >
            Reviews
          </Text>
        </Pressable>
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'stats' ? (
          <>
            <ReadingStats deadline={deadline} />
            <DailyReadingChart deadline={deadline} />
          </>
        ) : (
          <ReviewProgressSection deadline={deadline} />
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.border,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.light.primary + '10',
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: Colors.light.primary,
  },
  tabContent: {
    backgroundColor: Colors.light.background,
  },
});

export default DeadlineTabsSection;
