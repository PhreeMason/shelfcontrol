import { ThemedText } from '@/components/themed/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DEADLINE_CARD_ICONS } from '@/constants/icons';
import { Layout } from '@/constants/Layout';
import { useTheme } from '@/hooks/useThemeColor';
import type { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { StatusChangeActionSheet } from './modals/StatusChangeActionSheet';
import { UpdateDeadlineDateModal } from './modals/UpdateDeadlineDateModal';

interface DeadlineCardActionsProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DeadlineCardActions: React.FC<DeadlineCardActionsProps> = ({
  deadline,
}) => {
  const { colors } = useTheme();
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleEditPress = () => {
    router.push(`/deadline/${deadline.id}/edit`);
  };

  const handleNotesPress = () => {
    router.push(`/deadline/${deadline.id}/notes`);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Status Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowStatusModal(true)}
          accessibilityLabel="Change status"
          accessibilityRole="button"
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <IconSymbol
              name={DEADLINE_CARD_ICONS.CHANGE_STATUS}
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Status
          </ThemedText>
        </TouchableOpacity>

        {/* Calendar Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowDateModal(true)}
          accessibilityLabel="Update due date"
          accessibilityRole="button"
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <IconSymbol
              name={DEADLINE_CARD_ICONS.UPDATE_DATE}
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Due Date
          </ThemedText>
        </TouchableOpacity>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleEditPress}
          accessibilityLabel="Edit deadline"
          accessibilityRole="button"
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <IconSymbol
              name={DEADLINE_CARD_ICONS.EDIT}
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Edit
          </ThemedText>
        </TouchableOpacity>

        {/* Notes Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleNotesPress}
          accessibilityLabel="View notes"
          accessibilityRole="button"
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <IconSymbol
              name={DEADLINE_CARD_ICONS.NOTES}
              size={20}
              color={colors.primary}
            />
          </View>
          <ThemedText typography="bodySmall" style={styles.buttonLabel}>
            Notes
          </ThemedText>
        </TouchableOpacity>
      </View>

      <UpdateDeadlineDateModal
        deadline={deadline}
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
      />

      <StatusChangeActionSheet
        deadline={deadline}
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: Layout.ICON_CIRCLE_SIZE,
    height: Layout.ICON_CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    textAlign: 'center',
  },
});
