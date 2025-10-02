import DeadlineCompletionScreen from '@/components/features/deadlines/DeadlineCompletionScreen';
import { ROUTES } from '@/constants/routes';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function DeadlineCompletionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines, activeDeadlines } = useDeadlines();
  const nextDeadline = activeDeadlines[0];
  
  const deadline = deadlines.find(d => d.id === id);

  if (!deadline) {
    router.replace(ROUTES.HOME);
    return null;
  }

  const handleContinue = () => {
    router.replace(`/deadline/${id}`);
  };

  return (
    <DeadlineCompletionScreen 
    deadline={deadline} 
    onContinue={handleContinue} 
    nextDeadline={nextDeadline}
    />
  );
}
