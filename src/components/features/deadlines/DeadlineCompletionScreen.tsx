import { ThemedText } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import React, { useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { captureRef } from 'react-native-view-shot';

interface DeadlineCompletionScreenProps {
  deadline: ReadingDeadlineWithProgress;
  nextDeadline: ReadingDeadlineWithProgress | undefined;
  onContinue: () => void;
}

const congratsQuotes = [
  "finished with 2 days to spare - look at you being ahead of schedule",
  "finished early enough to actually write a thoughtful review",
  "from 'too far gone' to 'finished on time' - that's the glow up",
  "no last-minute speed reading required - you planned this perfectly",
  "finished without that guilty 'barely made it' feeling",
  "you actually had time to enjoy the ending - imagine that",
];

const DeadlineCompletionScreen: React.FC<DeadlineCompletionScreenProps> = ({
  deadline,
  nextDeadline: _nextDeadline,
  onContinue,
}) => {
  const { colors } = useTheme();
  const { data: bookData } = useFetchBookById(deadline.book_id);
  const { width, height } = Dimensions.get('window');
  const viewRef = useRef(null);

  const handleContinue = () => {
    onContinue();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // wait 100 ms to ensure any animations have settled
    await new Promise(resolve => setTimeout(resolve, 200));
    try {
      const uri = await captureRef(viewRef, {
        format: 'jpg',
        quality: 0.8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        alert('Sharing is not available on this platform');
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Failed to capture and share screenshot', error);
    }
  };

  return (
    <LinearGradient
      colors={['#F5F1EA', colors.accent, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
      ref={viewRef}
    >
      <View style={styles.captureWrapper}>
        {/* <View style={styles.overlay} /> */}
        <View style={[styles.content, {
          backgroundColor: colors.surfaceContainer,
        }, styles.lightShadow]}>
          <View style={styles.lightShadow}>
            {bookData?.cover_image_url ? (
              <View style={styles.bookCoverContainer}>
                <Image
                  source={{ uri: bookData.cover_image_url }}
                  style={styles.bookCover}
                  contentFit="cover"
                />
                <View style={styles.checkmarkBadge}>
                  <ThemedText style={styles.checkmarkIcon}>✓</ThemedText>
                </View>
              </View>
            ) : (
              <View
                style={[styles.fallbackIcon, { backgroundColor: colors.accent }]}
              >
                <ThemedText style={styles.celebrationEmoji}>🎉</ThemedText>
              </View>
            )}
          </View>

          <ThemedText color="text" style={styles.title}>
            You finished!
          </ThemedText>

          <LinearGradient
            colors={['#FFF7ED', '#FFF4E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subtitleContainer}
          >
            <ThemedText color="darkPurple" style={styles.subtitle}>
              {congratsQuotes[
                Math.floor(Math.random() * congratsQuotes.length)
              ]}
            </ThemedText>
          </LinearGradient>

          <View style={[styles.actionButtons]}>
            <Pressable
              onPress={handleContinue}
              style={styles.backToShelfButton}
            >
              <LinearGradient
                colors={[colors.randoPurple, colors.success]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, }}
              >
                <ThemedText variant='default' color="textOnPrimary" style={{ fontWeight: '700', fontSize: 18, lineHeight: 20, alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
                  Continue
                </ThemedText>
              </LinearGradient>
            </Pressable>
            {/* share button */}
            <ThemedIconButton
              icon="square.and.arrow.up"
              variant='outline'
              iconColor='darkPurple'
              onPress={handleShare}
            />
          </View>


        </View>
      </View>
      {/* {nextDeadline ?
          <DeadlineCard deadline={nextDeadline} />
          : null
        } */}
      <ConfettiCannon
        count={200}
        origin={{ x: width / 2, y: height - 10 }}
        autoStart={true}
        fadeOut={true}
        fallSpeed={1800}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  captureWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 35,
    marginHorizontal: 28,
    marginVertical: 100,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  lightShadow: {
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
    width: 114,
    height: 190,
    borderRadius: 8,
    padding: 1
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -20,
    right: -20,
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
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitleContainer: {
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd5809d',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButtons: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    shadowColor: '#0000006b',
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 8,
  },
  backToShelfButton: {
    flexGrow: 1,
  },
  bookTitle: {
    fontWeight: '800',
    fontSize: 18,
  },
});

export default DeadlineCompletionScreen;
