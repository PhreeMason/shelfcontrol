import Checkbox from '@/components/shared/Checkbox';
import { ThemedText, ThemedView } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/Colors';
import { posthog } from '@/lib/posthog';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  platformUrlSchema,
  PlatformUrlFormData,
} from '@/utils/platformUrlSchema';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import WebViewModal from './WebViewModal';

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
  readOnly?: boolean;
}

const PlatformChecklist: React.FC<PlatformChecklistProps> = ({
  platforms,
  onToggle,
  needsLinkSubmission = false,
  onUpdateUrl,
  readOnly = false,
}) => {
  const [webViewModal, setWebViewModal] = useState<{
    visible: boolean;
    url: string;
    platformName: string;
  }>({
    visible: false,
    url: '',
    platformName: '',
  });

  const { control, reset } = useForm<PlatformUrlFormData>({
    resolver: zodResolver(platformUrlSchema),
    defaultValues: {
      platforms: {},
    },
  });

  const sortedPlatforms = useMemo(() => {
    return [...platforms].sort((a, b) =>
      a.platform_name.localeCompare(b.platform_name)
    );
  }, [platforms]);

  useEffect(() => {
    const initialUrls: Record<string, string> = {};
    platforms.forEach(platform => {
      initialUrls[platform.id] = platform.review_url || '';
    });
    reset({ platforms: initialUrls });
  }, [platforms, reset]);

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

  const handleUrlBlur = (platformId: string, url: string) => {
    if (onUpdateUrl) {
      const trimmedUrl = url.trim();
      const platform = platforms.find(p => p.id === platformId);

      if (platform && platform.review_url !== trimmedUrl) {
        onUpdateUrl(platformId, trimmedUrl);
      }
    }
  };

  const handleOpenUrl = (url: string, platformName: string) => {
    const hasUrl = !!url && url.trim() !== '';

    posthog.capture('review link viewed', {
      platform_name: platformName,
      has_url: hasUrl,
      source: 'platform_checklist',
    });

    if (!hasUrl) {
      Toast.show({
        type: 'error',
        text1: 'No URL provided',
        text2: 'Please add a review link first',
        position: 'top',
        visibilityTime: 2000,
      });
      return;
    }

    setWebViewModal({
      visible: true,
      url,
      platformName,
    });
  };

  const handleCloseWebView = () => {
    setWebViewModal({
      visible: false,
      url: '',
      platformName: '',
    });
  };

  const handleCopyUrl = async (url: string, platformName: string) => {
    try {
      await Clipboard.setStringAsync(url);

      posthog.capture('review link copied', {
        platform_name: platformName,
        source: 'platform_checklist',
      });

      Toast.show({
        type: 'success',
        text1: 'Link copied!',
        text2: 'Review URL copied to clipboard',
        position: 'top',
        visibilityTime: 1000,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to copy',
        text2: 'Please try again',
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
    <>
      <ThemedView style={styles.container}>
        {sortedPlatforms.map(platform => {
          return (
            <View key={platform.id} style={styles.platformItem}>
              <View style={styles.platformRow}>
                <Checkbox
                  checked={platform.posted}
                  onToggle={() => handleToggle(platform)}
                  label={platform.platform_name}
                  disabled={readOnly}
                />
                {platform.posted && platform.posted_date && (
                  <ThemedText style={styles.postedDate}>
                    {formatDate(platform.posted_date)}
                  </ThemedText>
                )}
              </View>

              {needsLinkSubmission && platform.posted && (
                <Controller
                  control={control}
                  name={`platforms.${platform.id}`}
                  render={({ field: { onChange, onBlur, value } }) => {
                    const currentUrl = value || '';
                    return (
                      <View style={styles.urlInputContainer}>
                        <View style={styles.inputRow}>
                          <TextInput
                            style={styles.urlInput}
                            placeholder="Paste review URL (optional)"
                            placeholderTextColor={Colors.light.textMuted}
                            value={currentUrl}
                            onChangeText={onChange}
                            onBlur={() => {
                              onBlur();
                              handleUrlBlur(platform.id, currentUrl);
                            }}
                            keyboardType="url"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!readOnly}
                          />
                          {currentUrl && (
                            <ThemedIconButton
                              icon="doc.on.clipboard"
                              onPress={() =>
                                handleCopyUrl(
                                  currentUrl,
                                  platform.platform_name
                                )
                              }
                              variant="ghost"
                              size="sm"
                              hapticsOnPress
                            />
                          )}
                        </View>
                        {currentUrl && (
                          <Pressable
                            onPress={() =>
                              handleOpenUrl(currentUrl, platform.platform_name)
                            }
                            style={styles.viewReviewLink}
                          >
                            <ThemedText style={styles.viewReviewText}>
                              View Review →
                            </ThemedText>
                          </Pressable>
                        )}
                      </View>
                    );
                  }}
                />
              )}
            </View>
          );
        })}
      </ThemedView>

      <WebViewModal
        visible={webViewModal.visible}
        url={webViewModal.url}
        platformName={webViewModal.platformName}
        onClose={handleCloseWebView}
      />
    </>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  urlInput: {
    flex: 1,
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
