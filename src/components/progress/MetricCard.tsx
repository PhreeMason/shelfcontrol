import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import { Pressable, StyleSheet } from 'react-native';

interface MetricCardProps {
  format: 'physical' | 'eBook' | 'audio';
  currentProgress: number;
  totalQuantity: number;
  viewMode: 'remaining' | 'current';
  onToggle: () => void;
  urgencyLevel: 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible';
}

const MetricCard = ({
  format,
  currentProgress,
  totalQuantity,
  viewMode,
  onToggle,
  urgencyLevel,
}: MetricCardProps) => {
  const { colors } = useTheme();

  // Calculate display values
  const remaining = totalQuantity - currentProgress;
  const percentage = Math.floor((currentProgress / totalQuantity) * 100);

  const displayValue =
    viewMode === 'remaining'
      ? formatProgressDisplay(format, remaining)
      : formatProgressDisplay(format, currentProgress);

  const getLabel = () => {
    if (format === 'audio') {
      return viewMode === 'remaining' ? 'TIME REMAINING' : 'CURRENT POSITION';
    } else {
      return viewMode === 'remaining' ? 'PAGES LEFT' : 'CURRENT PAGE';
    }
  };

  // Urgency-based color for the metric
  const getMetricColor = () => {
    switch (urgencyLevel) {
      case 'overdue':
      case 'urgent':
        return colors.error;
      case 'approaching':
        return colors.warning;
      case 'good':
        return colors.success;
      default:
        return colors.primary;
    }
  };

  return (
    <Pressable
      style={{ borderRadius: BorderRadius.md }}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`Toggle between ${viewMode === 'remaining' ? 'current progress' : 'remaining progress'}. Currently showing ${getLabel()}`}
    >
      {({ pressed }) => (
        <ThemedView
          borderRadius="md"
          backgroundColor="surface"
          style={[
            styles.card,
            pressed && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          <ThemedText variant="title" color="textMuted" style={styles.label}>
            {getLabel()}
          </ThemedText>
          <ThemedText
            style={[styles.value, { color: getMetricColor() }]}
            typography="headlineLarge"
          >
            {displayValue}
          </ThemedText>
          <ThemedText typography="bodyMedium" color="textSecondary">
            {percentage}% complete
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
};

export default MetricCard;

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  label: {
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  value: {
    fontWeight: '800',
    fontSize: 50,
    lineHeight: 54,
    marginBottom: Spacing.xs,
  },
});
