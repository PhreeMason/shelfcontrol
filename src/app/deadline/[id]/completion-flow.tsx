import CompletionFormContainer from '@/components/forms/CompletionFormContainer';
import { ThemedText, ThemedView } from '@/components/themed';
import { ROUTES } from '@/constants/routes';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { calculateTotalQuantity } from '@/utils/deadlineCalculations';
import { calculateProgress } from '@/utils/deadlineCore';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompletionFlowPage() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { colors } = useTheme();

  // Always fetch fresh deadline data from database to ensure we have the latest progress
  const { data: deadline, isLoading, error } = useGetDeadlineById(id);

  if (isLoading) {
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

  if (!deadline || error) {
    router.replace(ROUTES.HOME);
    return null;
  }

  // Calculate isDNF from actual progress data
  // User is DNF if they haven't reached the total quantity
  const currentProgress = calculateProgress(deadline);
  const totalQuantity = calculateTotalQuantity(
    deadline.format,
    deadline.total_quantity
  );
  const isDNF = currentProgress < totalQuantity;

  return <CompletionFormContainer deadline={deadline} isDNF={isDNF} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
