import DailyReadingChart from '@/components/charts/DailyReadingChart';
import BookDetailsSection from '@/components/features/deadlines/BookDetailsSection';
import { DeadlineActionSheet } from '@/components/features/deadlines/DeadlineActionSheet';
import DeadlineHeroSection from '@/components/features/deadlines/DeadlineHeroSection';
import DeadlineTabsSection from '@/components/features/deadlines/DeadlineTabsSection';
import DeadlineViewHeader from '@/components/features/deadlines/DeadlineViewHeader';
import ReadingProgressUpdate from '@/components/progress/ReadingProgressUpdate';
import {
  ThemedButton,
  ThemedScrollView,
  ThemedText,
  ThemedView,
} from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DeadlineView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { deadlines } = useDeadlines();
  const { colors } = useTheme();
  const [showActionSheet, setShowActionSheet] = useState(false);

  let deadline = deadlines.find(d => d.id === id);
  const {
    data: fallbackDeadline,
    isLoading: isFallbackLoading,
    error: fallbackError,
  } = useGetDeadlineById(deadline ? undefined : id);

  if (!deadline && fallbackDeadline) {
    deadline = fallbackDeadline;
  }

  if (!deadline && isFallbackLoading) {
    return (
      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView
          style={[
            styles.container,
            { padding: 20, justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ThemedText>Loading deadline...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!deadline || fallbackError) {
    return (
      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={[styles.container, { padding: 20 }]}>
          <ThemedText variant="title">Deadline not found</ThemedText>
          <ThemedButton
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const { isToReview, isArchived, isPending } = getDeadlineStatus(deadline);

  const handleBack = () => {
    router.back();
  };

  const headerProps = {
    onBack: handleBack,
  };

  const shouldShowStats = isToReview || isArchived;
  const shouldShowProgress = !shouldShowStats && !isPending;

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <DeadlineViewHeader {...headerProps} />

      <ThemedScrollView style={[styles.content, { backgroundColor: 'white' }]}>
        <DeadlineHeroSection isPending={isPending} deadline={deadline} />

        {shouldShowStats ? (
          <DeadlineTabsSection deadline={deadline} />
        ) : shouldShowProgress ? (
          <>
            <ReadingProgressUpdate deadline={deadline} />
            <DailyReadingChart deadline={deadline} />
          </>
        ) : null}

        <BookDetailsSection deadline={deadline} />
      </ThemedScrollView>

      <Pressable
        onPress={() => setShowActionSheet(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <IconSymbol name="ellipsis" size={30} color="white" />
      </Pressable>

      <DeadlineActionSheet
        deadline={deadline}
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 45,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 100,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeadlineView;
