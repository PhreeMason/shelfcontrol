import { ThemedText } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { StyleSheet, View } from 'react-native';

dayjs.extend(relativeTime);

interface DateRangeDisplayProps {
  startDate: string;
  startLabel: string;
  dueDate: string;
}

const DateRangeDisplay = ({
  startDate,
  startLabel,
  dueDate,
}: DateRangeDisplayProps) => {
  const formattedStartDate = dayjs(startDate).fromNow();
  const formattedDueDate = dayjs(dueDate).format('MMM D, YYYY');

  return (
    <View style={styles.container}>
      <ThemedText typography="bodySmall" color="secondary">
        {startLabel} {formattedStartDate}
      </ThemedText>
      <ThemedText typography="bodySmall" color="secondary">
        Due: {formattedDueDate}
      </ThemedText>
    </View>
  );
};

export default DateRangeDisplay;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
});
