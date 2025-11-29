import { getGradientBackground } from '@/utils/deadlineDisplayUtils';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface DeadlineBookCoverProps {
  coverImageUrl: string | null | undefined;
  deadline: {
    id: string | number;
    book_title: string;
    format: 'physical' | 'eBook' | 'audio';
  };
  daysLeft: number;
}

export function DeadlineBookCover({
  coverImageUrl,
  deadline,
  daysLeft,
}: DeadlineBookCoverProps) {
  if (coverImageUrl !== null && coverImageUrl !== undefined) {
    return (
      <Image
        source={{ uri: coverImageUrl }}
        style={styles.bookCover}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={getGradientBackground(deadline, daysLeft)}
      style={styles.bookCover}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

const styles = StyleSheet.create({
  bookCover: {
    width: 63,
    height: 100,
    borderRadius: 5,
    flexShrink: 0,
  },
});
