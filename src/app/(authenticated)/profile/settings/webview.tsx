import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { ROUTES } from '@/constants/routes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function WebViewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const [isLoading, setIsLoading] = useState(true);

  if (!url) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace(ROUTES.HOME)}
            style={styles.backButton}
            hitSlop={8}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={colors.textSecondary}
            />
            <ThemedText typography="bodyLarge" color="textSecondary">
              Back
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText typography="bodyLarge" color="textSecondary">
            No URL provided
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace(ROUTES.HOME)}
          style={styles.backButton}
          hitSlop={8}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.textSecondary}
          />
          <ThemedText typography="bodyLarge" color="textSecondary">
            Back
          </ThemedText>
        </Pressable>
        {title && (
          <ThemedText
            typography="titleSmall"
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {title}
          </ThemedText>
        )}
        <View style={styles.headerSpacer} />
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={[styles.webview, isLoading && styles.hidden]}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerSpacer: {
    width: 60, // Balance the back button width
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
