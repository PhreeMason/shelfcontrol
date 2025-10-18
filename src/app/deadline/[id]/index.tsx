import DailyReadingChart from '@/components/charts/DailyReadingChart';
import ProgressCheckDialog from '@/components/features/completion/ProgressCheckDialog';
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
import { useGetDeadlineById, useUpdateDeadlineProgress } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const DeadlineView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { deadlines } = useDeadlines();
  const { colors } = useTheme();
  const { mutate: updateProgress } = useUpdateDeadlineProgress();
  const [showProgressCheck, setShowProgressCheck] = useState(false);
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

  const { isCompleted, isToReview, isArchived } = getDeadlineStatus(deadline);

  const handleEdit = () => {
    router.push(`/deadline/${id}/edit`);
  };

  const handleBack = () => {
    router.back();
  };

  const totalPages = deadline.total_quantity || 0;
  const latestProgress =
    deadline.progress && deadline.progress.length > 0
      ? deadline.progress[deadline.progress.length - 1]
      : null;
  const currentProgress = latestProgress?.current_progress || 0;

  const handleComplete = () => {
    if (currentProgress < totalPages) {
      setShowProgressCheck(true);
    } else {
      router.push(`/deadline/${id}/completion-flow`);
    }
  };

  const handleMarkAllPages = () => {
    if (!deadline) return;

    updateProgress(
      {
        deadlineId: deadline.id,
        currentProgress: totalPages,
      },
      {
        onSuccess: () => {
          setShowProgressCheck(false);
          router.push(`/deadline/${id}/completion-flow`);
        },
        onError: error => {
          Toast.show({
            type: 'error',
            text1: 'Failed to update progress',
            text2: error.message || 'Please try again',
          });
        },
      }
    );
  };

  const handleDidNotFinish = () => {
    setShowProgressCheck(false);
    router.push(`/deadline/${id}/completion-flow?skipToReview=true`);
  };

  const headerProps = {
    onBack: handleBack,
    ...(isCompleted ? {} : { onEdit: handleEdit }),
  };

  const shouldShowStats = isToReview || isArchived;

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <DeadlineViewHeader {...headerProps} />

      <ThemedScrollView style={[styles.content, { backgroundColor: 'white' }]}>
        <DeadlineHeroSection deadline={deadline} />

        {shouldShowStats ? (
          <DeadlineTabsSection deadline={deadline} />
        ) : (
          <>
            <ReadingProgressUpdate deadline={deadline} />
            <DailyReadingChart deadline={deadline} />
          </>
        )}

        <BookDetailsSection deadline={deadline} />
      </ThemedScrollView>

      <ProgressCheckDialog
        visible={showProgressCheck}
        totalPages={totalPages}
        currentProgress={currentProgress}
        onMarkAllPages={handleMarkAllPages}
        onDidNotFinish={handleDidNotFinish}
        onClose={() => setShowProgressCheck(false)}
      />

      <Pressable
        onPress={() => setShowActionSheet(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <IconSymbol name="ellipsis" size={30} color="white" />
        {/* <ThemedText style={styles.fabText}>More</ThemedText> */}
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
