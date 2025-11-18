import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

interface WebViewModalProps {
  visible: boolean;
  url: string;
  platformName: string;
  onClose: () => void;
}

const WebViewModal: React.FC<WebViewModalProps> = ({
  visible,
  url,
  platformName,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const slideAnim = useSharedValue(1000);
  const fadeAnim = useSharedValue(0);

  // Track timing for analytics
  const openTimeRef = useRef<number>(0);
  const loadStartTimeRef = useRef<number>(0);

  // Ensure URL has protocol
  const normalizedUrl = React.useMemo(() => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  }, [url]);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 200 });
      slideAnim.value = withSpring(0, { damping: 20, stiffness: 200 });
      openTimeRef.current = Date.now();

      // Track modal open
      try {
        const urlDomain = normalizedUrl
          ? new URL(normalizedUrl).hostname
          : 'unknown';
        analytics.track('review_webview_opened', {
          platform_name: platformName,
          url_domain: urlDomain,
        });
      } catch {
        // Invalid URL, still track the event
        analytics.track('review_webview_opened', {
          platform_name: platformName,
          url_domain: 'invalid',
        });
      }
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withSpring(1000, { damping: 20, stiffness: 200 });
      setIsLoading(true);
      setError(null);
    }
  }, [visible, slideAnim, fadeAnim, platformName, normalizedUrl]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  const handleRefresh = () => {
    setError(null);
    setIsLoading(true);
    webViewRef.current?.reload();

    // Track refresh action
    try {
      const urlDomain = normalizedUrl
        ? new URL(normalizedUrl).hostname
        : 'unknown';
      analytics.track('review_webview_refresh', {
        platform_name: platformName,
        trigger: error ? 'error_retry' : 'manual_refresh',
        url_domain: urlDomain,
      });
    } catch {
      analytics.track('review_webview_refresh', {
        platform_name: platformName,
        trigger: error ? 'error_retry' : 'manual_refresh',
        url_domain: 'invalid',
      });
    }
  };

  const handleClose = () => {
    // Track modal close
    const duration = Math.round((Date.now() - openTimeRef.current) / 1000);
    analytics.track('review_webview_closed', {
      platform_name: platformName,
      duration: duration,
      closed_via: 'close_button',
    });
    onClose();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Track successful load
    if (loadStartTimeRef.current > 0) {
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    loadStartTimeRef.current = Date.now();

    // Set a timeout to prevent infinite loading
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      const timeoutError =
        'Page took too long to load. Please check your connection and try again.';
      setError(timeoutError);
    }, 30000); // 30 second timeout
  };

  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: colors.background },
          animatedModalStyle,
        ]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <ThemedText typography="titleMediumPlus" numberOfLines={1}>
                {platformName}
              </ThemedText>
              <ThemedText
                typography="bodySmall"
                color="textSecondary"
                style={styles.subtitle}
                numberOfLines={1}
              >
                Review Link
              </ThemedText>
            </View>
            <View style={styles.headerButtons}>
              {error && (
                <Pressable
                  onPress={handleRefresh}
                  style={styles.headerButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol
                    name="arrow.clockwise"
                    size={22}
                    color={colors.primary}
                  />
                </Pressable>
              )}
              <Pressable
                onPress={handleClose}
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.webViewContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <IconSymbol
                name="exclamationmark.triangle"
                size={48}
                color={colors.textSecondary}
              />
              <ThemedText
                typography="titleMediumPlus"
                style={styles.errorTitle}
              >
                Unable to Load Page
              </ThemedText>
              <ThemedText
                typography="bodyMedium"
                color="textSecondary"
                style={styles.errorMessage}
              >
                {error}
              </ThemedText>
              <Pressable
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleRefresh}
              >
                <ThemedText
                  typography="bodyLarge"
                  style={[styles.retryButtonText, { color: colors.background }]}
                >
                  Try Again
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <WebView
                ref={webViewRef}
                source={{ uri: normalizedUrl }}
                style={styles.webView}
                onLoadStart={handleLoadStart}
                onLoadEnd={handleLoadEnd}
                onError={syntheticEvent => {
                  const { nativeEvent } = syntheticEvent;
                  setIsLoading(false);
                  const errorMsg =
                    nativeEvent.description || 'Failed to load page';
                  setError(errorMsg);
                }}
                onHttpError={syntheticEvent => {
                  const { nativeEvent } = syntheticEvent;
                  setIsLoading(false);
                  const errorMsg = `HTTP Error: ${nativeEvent.statusCode}`;
                  setError(errorMsg);
                }}
                allowsBackForwardNavigationGestures
                sharedCookiesEnabled
                pullToRefreshEnabled
                onContentProcessDidTerminate={() =>
                  webViewRef.current?.reload()
                }
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
              />
              {isLoading && (
                <View
                  style={[
                    styles.loadingOverlay,
                    { backgroundColor: colors.surface + 'F2' },
                  ]}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText
                    typography="bodyMedium"
                    color="textSecondary"
                    style={styles.loadingText}
                  >
                    Loading...
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  subtitle: {
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {},
});

export default WebViewModal;
