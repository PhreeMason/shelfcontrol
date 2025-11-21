import LinearProgressBar from '@/components/shared/LinearProgressBar';
import { Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText, ThemedView } from '../themed';
import {
  getDisplayValue,
  getRemainingText,
  getEncouragementMessage,
  getProgressBackgroundColor,
} from '@/utils/todaysProgressUtils';
import { PROGRESS_TYPE } from '@/constants/status';

type TodaysProgressProps = {
  total: number;
  current: number;
  type?: 'reading' | 'listening';
};

const TodaysProgress: React.FC<TodaysProgressProps> = ({
  total,
  current,
  type = 'reading',
}) => {
  const progressPercentage = Math.floor((current / total) * 100);
  const isListening = type === PROGRESS_TYPE.LISTENING;
  const icon = isListening ? '🎧' : '📖';
  const label = isListening ? 'Listening' : 'Reading';
  const { colors } = useTheme();

  const displayValue = getDisplayValue(current, total, isListening);
  const remainingText = getRemainingText(current, total, isListening);
  const encouragementMessage = getEncouragementMessage(progressPercentage);
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
          <ThemedText style={styles.statIcon}>{icon}</ThemedText>
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

      <View style={[styles.statFooter, { marginTop: 8 }]}>
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
    backgroundColor: 'rgba(250, 248, 245, 1)', // Linear gradient approximation
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(232, 194, 185, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 18,
    lineHeight: 24,
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

export default TodaysProgress;
