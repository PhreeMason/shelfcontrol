import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { normalizeServerDate } from '@/utils/dateNormalization';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export interface EditableHistoryRowProps {
  id: string;
  label: string;
  sublabel: string | null;
  timestamp: string;
  onTimestampChange: (newTimestamp: string) => void;
  isPending?: boolean;
}

export const EditableHistoryRow = ({
  label,
  sublabel,
  timestamp,
  onTimestampChange,
  isPending = false,
}: EditableHistoryRowProps) => {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const normalizedDate = normalizeServerDate(timestamp);
  const formattedDate = normalizedDate.format('MMM D, YYYY');
  const formattedTime = normalizedDate.format('h:mm A');
  const dateValue = normalizedDate.toDate();

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (date) {
      // Preserve the time from the original timestamp, just update the date
      const newDate = dayjs(date);
      const original = normalizeServerDate(timestamp);
      const combined = newDate
        .hour(original.hour())
        .minute(original.minute())
        .second(original.second());
      onTimestampChange(combined.toISOString());
    }
    setIsEditing(false);
  };

  return (
    <ThemedView style={[styles.row, { borderColor: colors.border }]}>
      <Pressable
        onPress={() => setIsEditing(!isEditing)}
        disabled={isPending}
        style={({ pressed }) => [
          styles.pressable,
          {
            backgroundColor: isEditing
              ? colors.surfaceVariant
              : pressed
                ? colors.surfaceVariant
                : 'transparent',
            opacity: isPending ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.labelContainer}>
            <ThemedText typography="bodyMedium">{label}</ThemedText>
            {sublabel && (
              <ThemedText typography="bodySmall" color="textSecondary">
                {sublabel}
              </ThemedText>
            )}
          </View>
          <View style={styles.dateContainer}>
            <View style={styles.dateInfo}>
              <ThemedText typography="bodyMedium" color="textSecondary">
                {formattedDate}
              </ThemedText>
              <ThemedText typography="bodySmall" color="textMuted">
                {formattedTime}
              </ThemedText>
            </View>
            <IconSymbol
              name={isEditing ? 'chevron.up' : 'pencil'}
              size={16}
              color={colors.textMuted}
            />
          </View>
        </View>
      </Pressable>

      {isEditing && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            themeVariant="light"
            value={dateValue}
            mode="datetime"
            display="spinner"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  row: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  pressable: {
    padding: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    gap: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateInfo: {
    alignItems: 'flex-end',
  },
  pickerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
