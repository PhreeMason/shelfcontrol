import DeadlineFormContainer from '@/components/forms/DeadlineFormContainer';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditDeadline = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines } = useDeadlines();
  const router = useRouter();
  const { colors } = useTheme();

  const deadline = deadlines.find(d => d.id === id);

  useEffect(() => {
    if (deadline) {
      const { isCompleted } = getDeadlineStatus(deadline);
      if (isCompleted) {
        router.back();
      }
    }
  }, [deadline, router]);

  if (deadline) {
    const { isCompleted } = getDeadlineStatus(deadline);
    if (isCompleted) {
      return (
        <SafeAreaView
          edges={['right', 'bottom', 'left']}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <ThemedView style={[styles.container, { padding: 20 }]}>
            <ThemedText variant="title">Cannot Edit Completed Books</ThemedText>
            <ThemedText style={{ marginTop: 8 }}>
              This book has been marked as completed and cannot be edited.
            </ThemedText>
            <ThemedButton
              title="Go Back"
              onPress={() => router.back()}
              style={{ marginTop: 16 }}
            />
          </ThemedView>
        </SafeAreaView>
      );
    }
  }

  return <DeadlineFormContainer mode="edit" existingDeadline={deadline} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EditDeadline;
