import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface DeadlineCompletionScreenProps {
  deadline: ReadingDeadlineWithProgress;
  onContinue: () => void;
}

const DeadlineCompletionScreen: React.FC<DeadlineCompletionScreenProps> = ({
  deadline,
  onContinue,
}) => {
  const { colors } = useTheme();
  const { data: bookData } = useFetchBookById(deadline.book_id);
  const { width, height } = Dimensions.get('window');

  const handleContinue = () => {
    onContinue();
  };

  return (
    <ThemedView backgroundColor="complete" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.bookContainer}>
          {bookData?.cover_image_url ? (
            <Image
              source={{ uri: bookData.cover_image_url }}
              style={styles.bookCover}
              contentFit="cover"
            />
          ) : (
            <View
              style={[styles.fallbackIcon, { backgroundColor: colors.accent }]}
            >
              <ThemedText style={styles.celebrationEmoji}>🎉</ThemedText>
            </View>
          )}
        </View>

        <ThemedText color="textOnPrimary" style={styles.title}>
          Well Done!
        </ThemedText>

        <ThemedText color="textOnPrimary" style={styles.subtitle}>
          Congratulations on finishing{' '}
          <ThemedText color="accent" style={styles.bookTitle}>
            "{deadline.book_title}"
          </ThemedText>
          !
        </ThemedText>

        <ThemedButton
          title="Continue"
          variant="accent"
          style={styles.continueButton}
          onPress={handleContinue}
        />
      </View>
      <ConfettiCannon
        count={200}
        origin={{ x: width / 2, y: height - 10 }}
        autoStart={true}
        fadeOut={true}
        fallSpeed={1800}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bookContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bookCover: {
    width: 160,
    height: 240,
    borderRadius: 8,
  },
  fallbackIcon: {
    width: 160,
    height: 240,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  continueButton: {
    minWidth: 120,
    width: '80%',
    paddingHorizontal: 24,
  },
  bookTitle: {
    fontWeight: '800',
    fontSize: 18,
  },
});

export default DeadlineCompletionScreen;
