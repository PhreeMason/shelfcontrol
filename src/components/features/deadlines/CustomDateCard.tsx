import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { DeadlineCustomDate } from '@/types/customDates.types';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, View } from 'react-native';

interface CustomDateCardProps {
  customDate: DeadlineCustomDate;
  onEdit: () => void;
  onDelete: () => void;
}

export const CustomDateCard = ({
  customDate,
  onEdit,
  onDelete,
}: CustomDateCardProps) => {
  const { colors } = useTheme();

  const formattedDate = dayjs(customDate.date).format('MMM D, YYYY');

  return (
    <ThemedView style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.contentContainer}>
        <View style={styles.infoRow}>
          <IconSymbol name="calendar" size={16} color={colors.primary} />
          <ThemedText typography="titleSmall">{formattedDate}</ThemedText>
        </View>
        <ThemedText
          typography="bodyMedium"
          color="textSecondary"
          style={styles.nameText}
        >
          {customDate.name}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <IconSymbol name="pencil" size={16} color={colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.danger} />
        </Pressable>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  contentContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nameText: {
    marginLeft: Spacing.lg + Spacing.xs, // Align with text after icon
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {},
});
