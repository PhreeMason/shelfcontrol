import { ActionSheet, ActionSheetOption } from '@/components/ui/ActionSheet';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getDeadlineStatus, getStatusFlags } from '@/utils/deadlineActionUtils';
import React, { useState } from 'react';
import { CompleteDeadlineModal } from './CompleteDeadlineModal';
import { DidNotFinishDeadlineModal } from './DidNotFinishDeadlineModal';

interface ChangeReadingStatusModalProps {
  deadline: ReadingDeadlineWithProgress;
  visible: boolean;
  onClose: () => void;
}

export const ChangeReadingStatusModal: React.FC<
  ChangeReadingStatusModalProps
> = ({ deadline, visible, onClose }) => {
  const { colors } = useTheme();
  const { startReadingDeadline } = useDeadlines();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDidNotFinishModal, setShowDidNotFinishModal] = useState(false);

  const latestStatus = getDeadlineStatus(deadline);
  const { isCompleted, isPending } = getStatusFlags(latestStatus);

  const isArchived = isCompleted || latestStatus === 'did_not_finish';

  const actions: ActionSheetOption[] = [];
  if (isPending) {
    actions.push({
      label: 'Start Reading',
      icon: 'book.fill',
      iconColor: colors.secondary,
      onPress: () => {
        startReadingDeadline(
          deadline.id,
          () => {
            onClose();
          },
          error => {
            console.error('Failed to start reading:', error);
          }
        );
      },
    });
  }

  if (!isArchived) {
    actions.push({
      label: "I'm done reading",
      icon: 'checkmark.circle.fill',
      iconColor: colors.primary,
      onPress: () => {
        setShowCompleteModal(true);
      },
    });

    actions.push({
      label: 'Did Not Finish',
      icon: 'xmark.circle.fill',
      iconColor: colors.error,
      onPress: () => {
        setShowDidNotFinishModal(true);
      },
    });
  }

  return (
    <>
      <ActionSheet
        visible={visible}
        onClose={onClose}
        options={actions}
        title="Change Reading Status"
      />

      <CompleteDeadlineModal
        deadline={deadline}
        visible={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          onClose();
        }}
      />

      <DidNotFinishDeadlineModal
        deadline={deadline}
        visible={showDidNotFinishModal}
        onClose={() => {
          setShowDidNotFinishModal(false);
          onClose();
        }}
      />
    </>
  );
};
