import Checkbox from '@/components/shared/Checkbox';
import { ThemedText, ThemedView } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

interface Platform {
  id: string;
  platform_name: string;
  posted: boolean;
  posted_date: string | null;
  review_url: string | null;
}

interface PlatformChecklistProps {
  platforms: Platform[];
  onToggle: (id: string, posted: boolean) => void;
}

const PlatformChecklist: React.FC<PlatformChecklistProps> = ({ platforms, onToggle }) => {
  const handleToggle = (platform: Platform) => {
    const newPostedStatus = !platform.posted;
    onToggle(platform.id, newPostedStatus);

    if (newPostedStatus) {
      Toast.show({
        type: 'success',
        text1: 'Marked as posted',
        position: 'top',
        visibilityTime: 1500,
      });
    }
  };

  if (platforms.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText variant="secondary" style={styles.emptyText}>
          No platforms configured
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="title" style={styles.sectionTitle}>
        Platforms
      </ThemedText>
      {platforms.map(platform => {
        const labelWithDate = platform.posted && platform.posted_date
          ? `${platform.platform_name} • Posted: ${new Date(platform.posted_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}`
          : platform.platform_name;

        return (
          <View key={platform.id} style={styles.checkboxRow}>
            <Checkbox
              checked={platform.posted}
              onToggle={() => handleToggle(platform)}
              label={labelWithDate}
            />
          </View>
        );
      })}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 44,
  },
  emptyContainer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});

export default PlatformChecklist;
