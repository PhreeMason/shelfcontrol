import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

interface ReadingSessionTimerProps {
  onSessionComplete: (durationInMinutes: number) => void;
  onCancel: () => void;
}

const encouragingMessages = [
  "Great job! You've been reading for",
  "Amazing focus! You've been reading for",
  "Keep going! You've been reading for", 
  "Fantastic progress! You've been reading for",
  "You're crushing it! You've been reading for",
  "Way to stay focused! You've been reading for",
  "Reading champion! You've been reading for",
  "Impressive dedication! You've been reading for",
  "Look at you go! You've been reading for",
  "Outstanding effort! You've been reading for"
];

export function ReadingSessionTimer({ onSessionComplete, onCancel }: ReadingSessionTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const lastMessageIntervalRef = useRef<number>(0);

  const { colors } = useTheme();
  useEffect(() => {
    if (isRunning && !isPaused) {
      startTimeRef.current = Date.now() - pausedTimeRef.current * 1000;
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const newElapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(newElapsedTime);
          
          // Change message every 5 minutes (300 seconds)
          const currentMinutes = Math.floor(newElapsedTime / 60);
          const fiveMinuteIntervals = Math.floor(currentMinutes / 5);
          if (fiveMinuteIntervals > 0 && fiveMinuteIntervals !== lastMessageIntervalRef.current) {
            lastMessageIntervalRef.current = fiveMinuteIntervals;
            setCurrentMessageIndex(Math.floor(Math.random() * encouragingMessages.length));
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (isPaused) {
        pausedTimeRef.current = elapsedTime;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]); // Removed elapsedTime dependency to prevent reset loop

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    lastMessageIntervalRef.current = 0;
    setCurrentMessageIndex(0);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    
    if (elapsedTime < 60) {
      Alert.alert(
        'Session Too Short',
        'Reading sessions must be at least 1 minute long to be recorded. Continue reading for a bit longer!',
        [
          {
            text: 'Continue Reading',
            onPress: () => {
              setIsRunning(true);
              setIsPaused(false);
            },
          },
          {
            text: 'Cancel Session',
            style: 'destructive',
            onPress: onCancel,
          },
        ]
      );
      return;
    }
    
    const durationInMinutes = Math.round(elapsedTime / 60);
    onSessionComplete(durationInMinutes);
  };

  const handleCancel = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    pausedTimeRef.current = 0;
    lastMessageIntervalRef.current = 0;
    setCurrentMessageIndex(0);
    onCancel();
  };

  const getTimerColor = () => {
    if (!isRunning) return colors.text;
    if (isPaused) return colors.primary;
    return '#4ADE80'; // Green for active
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.timerContainer}>
        <ThemedText variant="title" style={[styles.timer, { color: getTimerColor() }]}>
          {formatTime(elapsedTime)}
        </ThemedText>
        
        {isPaused && (
          <ThemedText style={styles.pausedLabel}>Paused</ThemedText>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!isRunning ? (
          <>
            <ThemedButton
              title="Start Reading"
              onPress={handleStart}
              style={[styles.button, styles.startButton]}
            />
            <ThemedButton
              title="Cancel"
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton]}
              variant="ghost"
            />
          </>
        ) : (
          <>
            {!isPaused ? (
              <ThemedButton
                title="Pause"
                onPress={handlePause}
                style={[styles.button, styles.pauseButton]}
              />
            ) : (
              <ThemedButton
                title="Resume"
                onPress={handleResume}
                style={[styles.button, styles.resumeButton]}
              />
            )}
            <ThemedButton
              title="Finish Session"
              onPress={handleStop}
              style={[styles.button, styles.finishButton]}
            />
          </>
        )}
      </View>

      {elapsedTime < 60 && isRunning && (
        <ThemedText style={[styles.encouragement, { color: colors.primary }]}>
          Keep reading! You need at least 1 minute to record your session.
        </ThemedText>
      )}
      
      {elapsedTime >= 60 && (
        <ThemedText style={styles.encouragement}>
          {encouragingMessages[currentMessageIndex]} {Math.round(elapsedTime / 60)} minute{Math.round(elapsedTime / 60) !== 1 ? 's' : ''}!
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    minHeight: 100,
    paddingHorizontal: 20,
  },
  timer: {
    fontSize: 56,
    fontWeight: '300',
    fontFamily: Platform.select({
      ios: 'SF Mono',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 3,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 64,
  },
  pausedLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 8,
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  button: {
    minWidth: 140,
  },
  startButton: {
    backgroundColor: '#4ADE80',
  },
  pauseButton: {
    backgroundColor: '#FB923C',
  },
  resumeButton: {
    backgroundColor: '#4ADE80',
  },
  finishButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButton: {
    borderWidth: 1,
  },
  encouragement: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 20,
  },
});