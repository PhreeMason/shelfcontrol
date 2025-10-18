import Checkbox from '@/components/shared/Checkbox';
import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/Colors';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
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
  needsLinkSubmission?: boolean;
  onUpdateUrl?: (id: string, url: string) => void;
}

const PlatformChecklist: React.FC<PlatformChecklistProps> = ({
  platforms,
  onToggle,
  needsLinkSubmission = false,
  onUpdateUrl,
}) => {
  const [editingUrl, setEditingUrl] = useState<string | null>(null);

  const sortedPlatforms = useMemo(() => {
    return [...platforms].sort((a, b) =>
      a.platform_name.localeCompare(b.platform_name)
    );
  }, [platforms]);

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

  const handleUrlChange = (platformId: string, url: string) => {
    if (onUpdateUrl) {
      onUpdateUrl(platformId, url);
    }
  };

  const handleOpenUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid URL',
        text2: 'Unable to open the review link',
        position: 'top',
        visibilityTime: 2000,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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
      {sortedPlatforms.map(platform => {
        return (
          <View key={platform.id} style={styles.platformItem}>
            <View style={styles.platformRow}>
              <Checkbox
                checked={platform.posted}
                onToggle={() => handleToggle(platform)}
                label={platform.platform_name}
              />
              {platform.posted && platform.posted_date && (
                <ThemedText style={styles.postedDate}>
                  {formatDate(platform.posted_date)}
                </ThemedText>
              )}
            </View>

            {needsLinkSubmission && platform.posted && (
              <View style={styles.urlInputContainer}>
                <TextInput
                  style={styles.urlInput}
                  placeholder="Paste review URL (optional)"
                  placeholderTextColor={Colors.light.textMuted}
                  value={editingUrl === platform.id ? undefined : (platform.review_url || '')}
                  onChangeText={(text) => handleUrlChange(platform.id, text)}
                  onFocus={() => setEditingUrl(platform.id)}
                  onBlur={() => setEditingUrl(null)}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {platform.review_url && (
                  <Pressable
                    onPress={() => handleOpenUrl(platform.review_url!)}
                    style={styles.viewReviewLink}
                  >
                    <ThemedText style={styles.viewReviewText}>
                      View Review →
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  platformItem: {
    gap: Spacing.sm,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  postedDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  urlInputContainer: {
    marginLeft: 36,
    gap: Spacing.xs,
  },
  urlInput: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  viewReviewLink: {
    alignSelf: 'flex-start',
  },
  viewReviewText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontFamily: FontFamily.medium,
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
