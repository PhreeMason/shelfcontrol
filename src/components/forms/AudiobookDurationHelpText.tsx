import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { AudiobookData } from '@/types/audiobook.types';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface AudiobookDurationHelpTextProps {
  selectedFormat: 'physical' | 'eBook' | 'audio';
  audiobookRequest: {
    bookId?: string | undefined;
    title: string;
    author?: string | undefined;
  } | null;
  isLoadingAudiobook: boolean;
  isLoadingAudible: boolean;
  rejectedSpotify: boolean;
  audiobookData?: AudiobookData | undefined;
  audibleData?: { duration_ms?: number | null } | null | undefined;
  onRejectSpotify: () => void;
}

export const AudiobookDurationHelpText = ({
  selectedFormat,
  audiobookRequest,
  isLoadingAudiobook,
  isLoadingAudible,
  rejectedSpotify,
  audiobookData,
  audibleData,
  onRejectSpotify,
}: AudiobookDurationHelpTextProps) => {
  const { colors } = useTheme();

  // Non-audiobook format - show generic help text
  if (selectedFormat !== 'audio') {
    return (
      <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
        We'll use this to calculate your daily reading pace
      </ThemedText>
    );
  }

  // Audiobook format but no request (missing title)
  if (!audiobookRequest) {
    return (
      <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
        We'll use this to calculate your daily listening pace
      </ThemedText>
    );
  }

  // Loading state: Initial lookup
  if (isLoadingAudiobook && !rejectedSpotify) {
    return (
      <View style={styles.audiobookHelpRow}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
          Looking up audiobook duration...
        </ThemedText>
      </View>
    );
  }

  // Loading state: Retry lookup
  if (rejectedSpotify && isLoadingAudible) {
    return (
      <View style={styles.audiobookHelpRow}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
          Looking up duration...
        </ThemedText>
      </View>
    );
  }

  // Success state: Found duration after retry
  if (rejectedSpotify && audibleData?.duration_ms) {
    return (
      <View style={styles.audiobookHelpRow}>
        <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
          ✓ Duration auto-filled
        </ThemedText>
      </View>
    );
  }

  // Error state: Retry lookup failed
  if (rejectedSpotify && !isLoadingAudible) {
    return (
      <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
        Not found - please enter duration manually
      </ThemedText>
    );
  }

  // Success state: Found duration
  if (audiobookData?.duration_ms && !rejectedSpotify) {
    return (
      <View style={styles.audiobookHelpRow}>
        <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
          ✓ Duration auto-filled
        </ThemedText>
        <TouchableOpacity
          onPress={onRejectSpotify}
          style={styles.notRightButton}
        >
          <ThemedText
            color="primary"
            typography="bodySmall"
            style={{ lineHeight: 18 }}
          >
            Not right?
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  // No results state: Initial lookup finished but found nothing
  if (!isLoadingAudiobook && !rejectedSpotify && !audiobookData?.duration_ms) {
    return (
      <View style={styles.audiobookHelpRow}>
        <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
          Not found
        </ThemedText>
        <TouchableOpacity
          onPress={onRejectSpotify}
          style={styles.notRightButton}
        >
          <ThemedText
            color="primary"
            typography="bodySmall"
            style={{ lineHeight: 18 }}
          >
            Try again?
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  // Default state: No data found, show generic help text
  return (
    <ThemedText color="textMuted" style={{ lineHeight: 18 }}>
      We'll use this to calculate your daily listening pace
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  audiobookHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  notRightButton: {
    marginLeft: 4,
  },
});
