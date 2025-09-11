import { ThemedText } from '@/components/themed';
import { Typography } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
// import { useFetchBookById } from '@/hooks/useBooks';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

const urgencyBorderColorMap = {
  'complete': '#3B82F6',
  'set_aside': '#9CA3AF',
  'overdue': '#C17B7B',
  'urgent': '#C17B7B',
  'good': '#B8A9D9',
  'approaching': '#E8B4A0',
  'impossible': '#E8B4B8',
}

const urgencyTextColorMap = {
  'complete': '#3B82F6',
  'set_aside': '#9CA3AF',
  'overdue': '#C8698A',
  'urgent': '#C8698A',
  'good': '#8B5A8C',
  'approaching': '#D4876A',
  'impossible': '#C8698A',
}

const backgroundImageUrl = {
  default: 'https://images.unsplash.com/photo-1750712406219-549c4ba27210?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  desert: 'https://images.unsplash.com/photo-1750712406219-549c4ba27210?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  cherry: 'https://images.unsplash.com/photo-1750625991979-a008c832e04c?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
}


interface DeadlineCardProps {
  deadline: ReadingDeadlineWithProgress;
  disableNavigation?: boolean;
}

export function DeadlineCard({ deadline, disableNavigation = false }: DeadlineCardProps) {
  const { getDeadlineCalculations, formatUnitsPerDayForDisplay } = useDeadlines();
  const router = useRouter();

  // Fetch book data if deadline has a book_id
  const { data: bookData } = useFetchBookById(deadline.book_id);

  const {
    daysLeft,
    unitsPerDay,
    urgencyLevel,
    remaining
  } = getDeadlineCalculations(deadline);

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: 'rgba(184, 169, 217, 0.1)',
      shadowOffset: { width: 2, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: {
      elevation: 1,
    },
  });

  let countdownColor = urgencyTextColorMap[urgencyLevel];
  let borderColor = urgencyBorderColorMap[urgencyLevel];

  // Check if deadline is archived (completed or set aside)
  const latestStatus = deadline.status && deadline.status.length > 0
    ? deadline.status[deadline.status.length - 1].status
    : 'reading';

  const isArchived = latestStatus === 'complete' || latestStatus === 'set_aside';
  if (isArchived) {
    borderColor = urgencyBorderColorMap[latestStatus];
    countdownColor = urgencyBorderColorMap[latestStatus];
  }


  const handlePress = () => {
    if (!disableNavigation) {
      router.push(`/deadline/${deadline.id}/view`);
      // console.log('Deadline pressed, navigation not yet implemented');
    }
  };

  // Determine which background image to use
  const getBackgroundImageUrl = () => {
    // If we have book data and it has a cover image, use that
    if (bookData?.cover_image_url) {
      return bookData.cover_image_url;
    }
    // Otherwise, fall back to the default background
    return backgroundImageUrl['default'];
  };

  // Get random book cover icon from array
  const getBookCoverIcon = () => {
    const bookIcons = ['📕', '📗', '📘', '📙', '📔', '📓', '📚', '📖', '📑', '📜', '💰', '⚔️', '🏃', '🎭', '🔬', '🎨', '🏛️', '🌟', '🔮', '⭐'];
    
    // Create seed from multiple factors for better randomization
    const idSeed = typeof deadline.id === 'number' ? deadline.id : parseInt(deadline.id?.toString() || '0', 10) || 0;
    const titleSeed = deadline.book_title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const daysSeed = daysLeft * 7; // Multiply for more variation
    const formatSeed = deadline.format === 'audio' ? 100 : deadline.format === 'ebook' ? 200 : 300;
    
    const combinedSeed = idSeed + titleSeed + daysSeed + formatSeed;
    const index = combinedSeed % bookIcons.length;
    
    return bookIcons[index];
  };

  // Get gradient background with better randomization
  const getGradientBackground = () => {
    const gradients = [
      ['#FF6B6B', '#4DABF7'], // Red to Blue
      ['#9775FA', '#51CF66'], // Purple to Green  
      ['#FFD43B', '#FF6B6B'], // Yellow to Red
      ['#4DABF7', '#E599F7'], // Blue to Purple
      ['#51CF66', '#FFB366'], // Green to Orange
      ['#FF8787', '#74C0FC'], // Coral to Sky Blue
      ['#69DB7C', '#F783AC'], // Mint to Pink
      ['#FFB366', '#9775FA'], // Orange to Purple
      ['#E599F7', '#51CF66'], // Lavender to Green
      ['#74C0FC', '#FFD43B'], // Sky Blue to Yellow
      ['#F783AC', '#69DB7C'], // Pink to Mint
      ['#8CE99A', '#A78BFA'], // Light Green to Indigo
      ['#FFE066', '#FB7185'], // Bright Yellow to Rose
      ['#A78BFA', '#FFB366'], // Indigo to Orange
      ['#FB7185', '#74C0FC'], // Rose to Sky Blue
    ];
    
    // Combine multiple factors for better randomization
    const idSeed = typeof deadline.id === 'number' ? deadline.id : parseInt(deadline.id?.toString() || '0', 10) || 0;
    const titleSeed = deadline.book_title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const daysSeed = daysLeft * 13; // Use prime number for better distribution
    const formatSeed = deadline.format === 'audio' ? 137 : deadline.format === 'ebook' ? 239 : 349; // Prime numbers
    const dateSeed = new Date().getDate(); // Add some time-based variation
    
    const combinedSeed = (titleSeed * 31 + daysSeed * 17 + idSeed * 7 + formatSeed * 3 + dateSeed) % 10000;
    const index = Math.abs(combinedSeed) % gradients.length;
    
    return gradients[index] as [string, string];
  };

  // Book Cover Component
  const BookCover = ({ resizeMode = 'cover' }: { resizeMode?: 'cover' | 'contain' }) => {
    if (bookData?.cover_image_url) {
      return (
        <Image
          source={{ uri: getBackgroundImageUrl() }}
          style={styles.bookCover}
          resizeMode={resizeMode}
        />
      );
    }
    
    return (
      <LinearGradient
        colors={getGradientBackground()}
        style={[styles.bookCover, styles.bookCoverPlaceholder]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ThemedText style={styles.bookCoverIcon}>{getBookCoverIcon()}</ThemedText>
      </LinearGradient>
    );
  };

  // Countdown/Status Display Component
  const CountdownDisplay = () => (
    <View style={styles.countdownContainer}>
      <View style={[styles.countdownSquare, { borderColor }]}>
        {isArchived ? (
          <>
            <ThemedText style={[styles.archivedIcon, { color: countdownColor }]}>
              {latestStatus === 'complete' ? '✓' : '📌'}
            </ThemedText>
            <ThemedText style={[styles.countdownLabel, { color: countdownColor }]}>
              {latestStatus === 'complete' ? 'Done' : 'Paused'}
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={[styles.countdownNumber, { color: countdownColor }]}>
              {daysLeft}
            </ThemedText>
            <ThemedText style={[styles.countdownLabel, { color: countdownColor }]}>
              days
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [
      { opacity: pressed ? 0.8 : 1, backgroundColor: 'transparent' },
    ]}>
      <View style={[styles.cardContainer, isArchived && shadowStyle, { borderColor }]}>
        <View style={styles.bookContent}>
          <BookCover resizeMode={isArchived ? 'contain' : 'cover'} />
          <View style={styles.bookInfo}>
            <ThemedText style={styles.bookTitle} numberOfLines={2}>
              {deadline.book_title}
            </ThemedText>
            <ThemedText style={styles.bookDeadline}>
              {formatUnitsPerDayForDisplay(unitsPerDay, deadline.format, remaining, daysLeft)}
            </ThemedText>
          </View>
        </View>
        <CountdownDisplay />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderColor: 'rgba(232, 194, 185, 0.15)'
  },
  bookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    flex: 3,
    minWidth: 0,
  },
  bookCover: {
    width: 48,
    height: 64,
    borderRadius: 8,
    flexShrink: 0,
  },
  bookInfo: {
    flex: 1,
    minWidth: 0,
  },
  bookTitle: {
    color: '#2B3D4F',
    marginBottom: 2,
    ...Typography.titleMedium,
  },
  bookDeadline: {
    color: '#6B7280',
    fontSize: 11,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(232, 194, 185, 0.1)',
    minWidth: 100,
  },
  bookCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCoverIcon: {
    fontSize: 20,
  },
  countdownSquare: {
    width: 72,
    height: 72,
    borderWidth: 3,
    borderRadius: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: -6,
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: -2,
    opacity: 0.8,
  },
  archivedIcon: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 2,
  },
});

export default DeadlineCard