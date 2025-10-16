import ReviewForm from '@/components/features/completion/ReviewForm';
import { ROUTES } from '@/constants/routes';
import { useCompletionFlow } from '@/providers/CompletionFlowProvider';
import { router } from 'expo-router';
import React, { useEffect } from 'react';

export default function ReviewFormPage() {
  const { flowState } = useCompletionFlow();

  useEffect(() => {
    if (!flowState) {
      router.replace(ROUTES.HOME);
    }
  }, [flowState]);

  if (!flowState) {
    return null;
  }

  return <ReviewForm />;
}
