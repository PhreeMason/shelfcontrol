import LinearProgressBar from '@/components/shared/LinearProgressBar'
import { Typography } from '@/constants/Colors'
import { formatProgressDisplay } from '@/utils/deadlineUtils'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ThemedText, ThemedView } from '../themed'

const formatMinutesToTime = (minutes: number): string => {
  return formatProgressDisplay('audio', minutes)
}

type TodaysProgressProps = {
  total: number,
  current: number,
  type?: 'reading' | 'listening'
}

const messageForProgressPercentage = {
  10000: "Immortal!",
  5000: "Godlike!",
  2500: "Mythical!",
  1000: "Legendary!",
  500: "Unstoppable!",
  250: "Incredible!",
  100: "Amazing work!",
  75: "You're doing great!",
  50: "Great pace!",
  20: "Keep it up!",
  0: "Let's get started!",
}

const colorProgressThresholds = {
  1000: '#4b2e83',
  900: '#6247aa',
  800: '#7251b5',
  700: '#815ac0',
  600: '#9163cb',
  500: '#a06cd5',
  400: '#b185db',
  300: '#c19ee0',
  200: '#d2b7e5',
  100: '#dac3e8',
  0: '#e8c2b9',
};

const TodaysProgress: React.FC<TodaysProgressProps> = ({
  total,
  current,
  type = 'reading'
}) => {
  const progressPercentage = (current / total) * 100;
  const isListening = type === 'listening';
  const icon = isListening ? '🎧' : '📖';
  const label = isListening ? "Listening" : "Reading";

  const getDisplayValue = () => {
    if (isListening) {
      return `${formatMinutesToTime(current)}/${formatMinutesToTime(total)}`;
    }
    return `${current}/${total}`;
  };

  const getRemainingText = () => {
    const remaining = total - current;
    const isNegative = remaining < 0;

    if (isNegative) {
      const extra = Math.abs(remaining);
      if (isListening) {
        return `+${formatMinutesToTime(extra)} extra`;
      }
      return `+${extra} pages extra`;
    }

    if (isListening) {
      return `${formatMinutesToTime(remaining)} left`;
    }
    return `${remaining} pages left`;
  };

  const getEncouragementMessage = () => {
    const thresholds = Object.keys(messageForProgressPercentage)
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of thresholds) {
      if (progressPercentage >= threshold) {
        return messageForProgressPercentage[threshold as keyof typeof messageForProgressPercentage];
      }
    }

    return messageForProgressPercentage[0];
  }

  const getProgressColors = () => {
    const colorThresholds = Object.keys(colorProgressThresholds)
      .map(Number)
      .sort((a, b) => b - a);

    let currentColor = colorProgressThresholds[0];
    let backgroundColor = colorProgressThresholds[0];

    for (let i = 0; i < colorThresholds.length; i++) {
      const threshold = colorThresholds[i];
      if (progressPercentage >= threshold) {
        backgroundColor = colorProgressThresholds[threshold as keyof typeof colorProgressThresholds];
        currentColor = colorProgressThresholds[colorThresholds[Math.max(0, i - 1)] as keyof typeof colorProgressThresholds];
        break;
      }
    }

    return {
      gradientColors: [currentColor, currentColor],
      backgroundColor: `${backgroundColor}99`
    };
  }

  const { gradientColors, backgroundColor } = getProgressColors();
  const progressBarPercentageValue = progressPercentage > 900 ? 900 : progressPercentage % 100;
  return (
    <ThemedView style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statLabel}>
          <ThemedText style={styles.statIcon}>{icon}</ThemedText>
          <ThemedText style={styles.labelText}>{label}</ThemedText>
        </View>
        <ThemedText style={styles.statValue}>{getDisplayValue()}</ThemedText>
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
        <ThemedText style={styles.encouragementText}>{getEncouragementMessage()}</ThemedText>
        <ThemedText style={styles.remainingText}>{getRemainingText()}</ThemedText>
      </View>
    </ThemedView>
  )
}

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

export default TodaysProgress