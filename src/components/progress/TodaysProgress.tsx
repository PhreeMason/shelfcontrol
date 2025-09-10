import LinearProgressBar from '@/components/shared/LinearProgressBar'
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
    if (isListening) {
      return `${formatMinutesToTime(remaining)} left`;
    }
    return `${remaining} pages left`;
  };

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
        progressPercentage={progressPercentage}
        height={8}
        borderRadius={100}
        showShimmer={true}
      />
      
      <View style={[styles.statFooter, { marginTop: 8 }]}>
        <ThemedText style={styles.encouragementText}>{isListening ? 'Great pace!' : "You're doing great!"}</ThemedText>
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
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  statValue: {
    color: '#8B5A8C',
    fontSize: 20,
    fontWeight: '700',
  },
  statFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 12,
    color: '#6B7280',
  },
  remainingText: {
    color: '#C8698A',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TodaysProgress