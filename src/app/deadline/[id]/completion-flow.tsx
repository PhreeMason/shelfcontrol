import CompletionFormContainer from '@/components/forms/CompletionFormContainer';
import { ThemedText, ThemedView } from '@/components/themed';
import { ROUTES } from '@/constants/routes';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompletionFlowPage() {
  const { id, skipToReview } = useLocalSearchParams<{
    id: string;
    skipToReview?: string;
  }>();
  const { deadlines } = useDeadlines();
  const { colors } = useTheme();

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
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!deadline || fallbackError) {
    router.replace(ROUTES.HOME);
    return null;
  }

  const isDNF = skipToReview === 'true';

  return <CompletionFormContainer deadline={deadline} isDNF={isDNF} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
