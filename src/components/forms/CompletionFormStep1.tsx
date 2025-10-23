import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { Colors } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { parseServerDateTime } from '@/utils/dateNormalization';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import type { Dayjs } from 'dayjs';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface CompletionFormStep1Props {
  deadline: ReadingDeadlineWithProgress;
  onContinue: () => void;
}

const congratsQuotes = [
  'Way to go, book finisher!',
  'Another one bites the dust!',
  'You did it! Time to celebrate with a snack.',
  'You read it like a boss!',
  'You came, you read, you conquered!',
  'Mission accomplished! Book devoured!',
  'Reading level: Expert. Well done!',
  'You turned pages like a pro!',
  'Book completed! You are a reading machine!',
  'You read it all! Impressive stamina!',
  'You finished a book! Cue the victory dance!',
  'Book completed! You are on fire!',
];

const CompletionFormStep1: React.FC<CompletionFormStep1Props> = ({
  deadline,
  onContinue,
}) => {
  const { colors } = useTheme();
  const { data: fetchedBook } = useFetchBookById(deadline.book_id || '');
  const confettiRef = useRef<any>(null);
  const [showContent, setShowContent] = useState(false);

  const emojiScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const coverTranslateY = useRef(new Animated.Value(50)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (confettiRef.current) {
      confettiRef.current.start();
    }

    setTimeout(() => setShowContent(true), 100);

    Animated.sequence([
      Animated.delay(200),
      Animated.spring(emojiScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 400,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(coverTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 400,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 300,
      delay: 800,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenHeight = Dimensions.get('window').height;
  const coverHeight = screenHeight * 0.4;

  const latestProgress =
    deadline.progress && deadline.progress.length > 0
      ? deadline.progress[deadline.progress.length - 1]
      : null;
  const currentProgress = latestProgress?.current_progress || 0;
  const firstReadingStatus =
    deadline.status && deadline.status.length > 0
      ? deadline.status.find(s => s.status === 'reading')
      : null;
  const startDate = firstReadingStatus?.created_at
    ? parseServerDateTime(firstReadingStatus.created_at)
    : parseServerDateTime(deadline.created_at);
  const finishDate = dayjs();
  const duration = Math.ceil(finishDate.diff(startDate, 'day', true));
  console.log({
    startDate,
    finishDate,
    duration,
    deadline,
  });
  const formatDate = (date: Dayjs) => {
    return date.format('MMM D');
  };

  const randomQuote =
    congratsQuotes[Math.floor(Math.random() * congratsQuotes.length)];

  return (
    <LinearGradient
      colors={['#F5F1EA', colors.accent, colors.primary]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.container}
      testID="celebration-container"
    >
      <ConfettiCannon
        ref={confettiRef}
        count={50}
        origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={2000}
      />

      {showContent && (
        <>
          <Animated.View style={{ opacity: titleOpacity }}>
            <ThemedText variant="headline" style={styles.headline}>
              You finished!
            </ThemedText>
            <View style={[styles.quoteContainer, styles.mediumShadow]}>
              <ThemedText variant="secondary" style={styles.quoteText}>
                {randomQuote}
              </ThemedText>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.coverContainer,
              {
                height: coverHeight,
                transform: [{ translateY: coverTranslateY }],
              },
            ]}
          >
            {fetchedBook?.cover_image_url ? (
              <View style={[styles.bookCoverContainer, styles.mediumShadow]}>
                <Image
                  source={{ uri: fetchedBook.cover_image_url }}
                  style={[styles.bookCover, { height: coverHeight }]}
                  contentFit="cover"
                />
                <View style={styles.checkmarkBadge}>
                  <ThemedText style={styles.checkmarkIcon}>✓</ThemedText>
                </View>
              </View>
            ) : (
              <ThemedView
                style={[styles.coverPlaceholder, { height: coverHeight }]}
              >
                <ThemedText style={styles.coverPlaceholderText}>📖</ThemedText>
              </ThemedView>
            )}
          </Animated.View>

          <Animated.View
            style={[styles.statsContainer, { opacity: statsOpacity }]}
          >
            <ThemedText variant="secondary" style={styles.statsText}>
              {formatDate(startDate)} → {formatDate(finishDate)}
            </ThemedText>
            <ThemedText variant="secondary" style={styles.statsText}>
              {duration} {duration === 1 ? 'day' : 'days'} •{' '}
              {deadline.format === 'audio'
                ? `${formatProgressDisplay(deadline.format, currentProgress)} / ${formatProgressDisplay(deadline.format, deadline.total_quantity || 0)} listened`
                : `${currentProgress}/${deadline.total_quantity || 0} pages read`}
            </ThemedText>
          </Animated.View>

          <Animated.View
            style={[styles.buttonContainer, { opacity: buttonOpacity }]}
          >
            <ThemedButton
              title="Continue →"
              variant="primary"
              onPress={onContinue}
              style={styles.button}
              hapticsOnPress
              testID="continue-button"
            />
          </Animated.View>
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 30,
  },
  headline: {
    textAlign: 'center',
    marginBottom: 10,
  },
  quoteContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFF7ED',
  },
  quoteText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: Colors.light.darkPurple,
  },
  coverContainer: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediumShadow: {
    shadowColor: '#0000006b',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  bookCoverContainer: {
    position: 'relative',
  },
  bookCover: {
    width: 200,
    borderRadius: 10,
    aspectRatio: 0.66,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  checkmarkIcon: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  coverPlaceholder: {
    width: '100%',
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 80,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    paddingVertical: 14,
  },
});

export default CompletionFormStep1;
