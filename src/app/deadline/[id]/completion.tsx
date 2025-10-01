import DeadlineCompletionScreen from '@/components/features/deadlines/DeadlineCompletionScreen';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ROUTES } from '@/constants/routes';

export default function DeadlineCompletionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines } = useDeadlines();

  const deadline = deadlines.find(d => d.id === id);

  if (!deadline) {
    router.replace(ROUTES.HOME);
    return null;
  }

  const handleContinue = () => {
    router.replace(`/deadline/${id}`);
  };

  return (
    <DeadlineCompletionScreen deadline={deadline} onContinue={handleContinue} />
  );
}
