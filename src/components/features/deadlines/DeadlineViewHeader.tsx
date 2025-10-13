import AppHeader from '@/components/shared/AppHeader';
import { ThemedText } from '@/components/themed';
import React from 'react';
import { TouchableOpacity } from 'react-native';

interface DeadlineViewHeaderProps {
  title?: string;
  onBack: () => void;
  onEdit?: () => void;
}

const DeadlineViewHeader: React.FC<DeadlineViewHeaderProps> = ({
  title = 'Book Details',
  onBack,
  onEdit,
}) => {
  const editButton = onEdit ? (
    <TouchableOpacity onPress={onEdit}>
      <ThemedText variant="default" style={{ color: 'white' }}>
        Edit
      </ThemedText>
    </TouchableOpacity>
  ) : null;

  return <AppHeader title={title} onBack={onBack} rightElement={editButton} />;
};

export default DeadlineViewHeader;
