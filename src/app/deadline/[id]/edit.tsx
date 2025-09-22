import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useDeadlines } from '@/providers/DeadlineProvider';
import DeadlineFormContainer from '@/components/forms/DeadlineFormContainer';

const EditDeadline = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deadlines } = useDeadlines();

  // Find the deadline to edit
  const deadline = deadlines.find(d => d.id === id);

  return <DeadlineFormContainer mode="edit" existingDeadline={deadline} />;
};

export default EditDeadline;
