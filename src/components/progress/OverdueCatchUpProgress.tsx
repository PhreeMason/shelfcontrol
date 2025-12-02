import LinearProgressBar from '@/components/shared/LinearProgressBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';
import { PROGRESS_TYPE } from '@/constants/status';
import { useTheme } from '@/hooks/useThemeColor';
import {
  getOverdueDisplayValue,
  getOverdueEncouragementMessage,
  getOverdueRemainingText,
  getProgressBackgroundColor,
} from '@/utils/todaysProgressUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText, ThemedView } from '../themed';

type OverdueCatchUpProgressProps = {
  total: number;
  current: number;
  type?: 'reading' | 'listening';
};

const OverdueCatchUpProgress: React.FC<OverdueCatchUpProgressProps> = ({
  total,
  current,
  type = 'reading',
}) => {
  const progressPercentage =
    total > 0 ? Math.floor((current / total) * 100) : 0;
  const isListening = type === PROGRESS_TYPE.LISTENING;
  const iconName = 'books.vertical.fill';
  const label = 'Past due catch-up';
  const { colors } = useTheme();

  const displayValue = getOverdueDisplayValue(current, total, isListening);
  const remainingText = getOverdueRemainingText(current, total, isListening);
  const encouragementMessage = getOverdueEncouragementMessage(progressPercentage);
  const backgroundColor = getProgressBackgroundColor(progressPercentage);

  const progressBarPercentageValue = Math.min(100, progressPercentage);
  const gradientColors =
    progressBarPercentageValue === 100
      ? ['#815ac0', '#4b2e83']
      : ['#E8C2B9', colors.primary];

  return (
    <ThemedView style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statLabel}>
          <IconSymbol name={iconName} size={18} color="#2B3D4F" />
          <ThemedText style={styles.labelText}>{label}</ThemedText>
        </View>
        <ThemedText style={styles.statValue}>{displayValue}</ThemedText>
      </View>

      <LinearProgressBar
        progressPercentage={progressBarPercentageValue}
        height={8}
        borderRadius={100}
        showShimmer={true}
        gradientColors={gradientColors}
        backgroundColor={backgroundColor}
      />

      <View style={[styles.statFooter, { marginTop: Spacing.sm }]}>
        <ThemedText style={styles.encouragementText}>
          {encouragementMessage}
        </ThemedText>
        <ThemedText style={styles.remainingText}>{remainingText}</ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: 'rgba(250, 248, 245, 1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(232, 194, 185, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  labelText: {
    color: '#2B3D4F',
    ...Typography.titleMedium,
  },
  statValue: {
    color: '#8B5A8C',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  statFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 13,
    color: '#6B7280',
  },
  remainingText: {
    color: '#C8698A',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OverdueCatchUpProgress;
