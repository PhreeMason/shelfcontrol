import {
  DatesTab,
  ProgressHistoryTab,
  StatusHistoryTab,
} from '@/components/features/deadlines/edit-history';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { ROUTES } from '@/constants/routes';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabId = 'progress' | 'status' | 'dates';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'progress', label: 'Progress', icon: 'chart.line.uptrend.xyaxis' },
  { id: 'status', label: 'Status', icon: 'list.bullet' },
  { id: 'dates', label: 'Dates', icon: 'calendar' },
];

const EditHistoryScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines } = useDeadlines();
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('progress');

  // Try to get deadline from provider cache first
  let deadline = deadlines.find(d => d.id === id);

  // Fall back to fetching if not in cache
  const {
    data: fallbackDeadline,
    isLoading: isFallbackLoading,
    error: fallbackError,
  } = useGetDeadlineById(deadline ? undefined : id);

  if (!deadline && fallbackDeadline) {
    deadline = fallbackDeadline;
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.HOME);
    }
  };

  // Loading state
  if (!deadline && isFallbackLoading) {
    return (
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.centerContent}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Error state
  if (!deadline || fallbackError) {
    return (
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.centerContent}>
          <ThemedText typography="titleMedium">Book not found</ThemedText>
          <Pressable onPress={handleBack} style={styles.backLink}>
            <ThemedText color="primary">Go back</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={colors.primary} />
          <ThemedText color="primary">Back</ThemedText>
        </Pressable>
        <ThemedText typography="titleMedium" style={styles.headerTitle}>
          Edit History
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Book title */}
      <View style={styles.bookInfo}>
        <ThemedText typography="bodySmall" color="textSecondary" numberOfLines={1}>
          {deadline.book_title}
        </ThemedText>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                isActive && [
                  styles.activeTab,
                  { backgroundColor: colors.primary + '20' },
                ],
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconSymbol
                name={tab.icon as any}
                size={18}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <ThemedText
                typography="bodySmall"
                color={isActive ? 'primary' : 'textMuted'}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'progress' && (
          <ProgressHistoryTab
            deadlineId={deadline.id}
            progress={deadline.progress || []}
            format={deadline.format}
          />
        )}
        {activeTab === 'status' && (
          <StatusHistoryTab
            deadlineId={deadline.id}
            status={deadline.status || []}
          />
        )}
        {activeTab === 'dates' && <DatesTab deadline={deadline} />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Match back button width for centering
  },
  bookInfo: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabContent: {
    flex: 1,
  },
  backLink: {
    padding: Spacing.sm,
  },
});

export default EditHistoryScreen;
