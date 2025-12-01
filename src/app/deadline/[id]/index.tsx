import DailyReadingChart from '@/components/charts/DailyReadingChart';
import BookDetailsSection from '@/components/features/deadlines/BookDetailsSection';
import { DeadlineActionSheet } from '@/components/features/deadlines/DeadlineActionSheet';
import { DeadlineActionsSection } from '@/components/features/deadlines/DeadlineActionsSection';
import { DeadlineContactsSection } from '@/components/features/deadlines/DeadlineContactsSection';
import { DeadlineCustomDatesSection } from '@/components/features/deadlines/DeadlineCustomDatesSection';
import DeadlineHeroSection from '@/components/features/deadlines/DeadlineHeroSection';
import { DeadlineTagsSection } from '@/components/features/deadlines/DeadlineTagsSection';
import DeadlineViewHeader from '@/components/features/deadlines/DeadlineViewHeader';
import { DisclosureSection } from '@/components/features/deadlines/DisclosureSection';
import ReviewProgressSection from '@/components/features/review/ReviewProgressSection';
import ReadingProgressUpdate from '@/components/progress/ReadingProgressUpdate';
import ReadingStats from '@/components/stats/ReadingStats';
import {
  ThemedButton,
  ThemedKeyboardAwareScrollView,
  ThemedText,
  ThemedView,
} from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Shadows } from '@/constants/Theme';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { getDeadlineSourceOptions } from '@/utils/getDeadlineSourceOptions';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTES } from '@/constants/routes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (deadline && id) {
      const latestStatus =
        deadline.status && deadline.status.length > 0
          ? (deadline.status[deadline.status.length - 1].status ?? 'reading')
          : 'reading';

      analytics.track('deadline_viewed', {
        deadline_id: id,
        deadline_status: latestStatus as
          | 'pending'
          | 'reading'
          | 'completed'
          | 'paused'
          | 'dnf',
        deadline_format: deadline.format,
      });
    }
  }, [deadline, id]);

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
          <ThemedText>Loading due dates...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!deadline || fallbackError) {
    const handleErrorBack = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(ROUTES.HOME);
      }
    };

    return (
      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ThemedView style={[styles.container, { padding: 20 }]}>
          <ThemedText variant="title">Book not found</ThemedText>
          <ThemedButton
            title="Go Back"
            onPress={handleErrorBack}
            style={{ marginTop: 16 }}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const { isPending, isPaused, latestStatus } = getDeadlineStatus(deadline);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.HOME);
    }
  };

  const headerProps = {
    onBack: handleBack,
  };

  const shouldShowStats =
    latestStatus !== 'pending' &&
    latestStatus !== 'reading' &&
    latestStatus !== 'paused';
  const shouldShowProgress = !shouldShowStats && !isPending;
  const sourceOptions = getDeadlineSourceOptions(deadline);
  const shouldShowDisclosure = sourceOptions.length > 0;

  return (
    <SafeAreaView
      edges={['right', 'bottom', 'left']}
      style={[styles.container]}
    >
      <LinearGradient
        colors={[colors.backgroundAccent, colors.backgroundPrimary]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <DeadlineViewHeader {...headerProps} />
        <ThemedKeyboardAwareScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          style={[styles.content, { backgroundColor: 'transparent' }]}
        >
          <DeadlineHeroSection
            isPending={isPending}
            isPaused={isPaused}
            deadline={deadline}
          />

          <DeadlineActionsSection deadline={deadline} />

          {shouldShowProgress ? (
            <ReadingProgressUpdate deadline={deadline} />
          ) : null}

          <ReviewProgressSection deadline={deadline} />
          {shouldShowStats ? <ReadingStats deadline={deadline} /> : null}

          {latestStatus !== 'pending' ? (
            <DailyReadingChart deadline={deadline} />
          ) : null}

          <DeadlineContactsSection deadline={deadline} />

          <DeadlineCustomDatesSection deadline={deadline} />

          <DeadlineTagsSection deadline={deadline} />

          {shouldShowDisclosure ? (
            <DisclosureSection deadline={deadline} />
          ) : null}

          <BookDetailsSection deadline={deadline} />
        </ThemedKeyboardAwareScrollView>

        <Pressable
          onPress={() => setShowActionSheet(true)}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <IconSymbol name="ellipsis" size={30} color={colors.textOnPrimary} />
        </Pressable>

        <DeadlineActionSheet
          deadline={deadline}
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 10,
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
    ...Shadows.elevated,
  },
});

export default DeadlineView;
