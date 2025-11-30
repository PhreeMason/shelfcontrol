import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import Constants from 'expo-constants';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';

interface HelpItem {
  title: string;
  description: string;
  iconBgColor: string;
  onPress: () => void;
}

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber =
    Platform.select({
      ios: Constants.expoConfig?.ios?.buildNumber,
      android: Constants.expoConfig?.android?.versionCode?.toString(),
    }) ?? '1';

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'Check out ShelfControl - the best app for tracking your reading deadlines! https://www.shelfcontrolapp.com',
      });
    } catch {
      // User cancelled or error
    }
  };

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/shelfcontrol', // Replace with actual App Store URL
      android: 'https://play.google.com/store/apps/details?id=com.shelfcontrol', // Replace with actual Play Store URL
    });
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(
      'Coming Soon',
      `${feature} will be available in a future update.`,
      [{ text: 'OK' }]
    );
  };

  const helpItems: HelpItem[] = [
    {
      title: 'Feature Tutorial',
      description: 'Learn how to use ShelfControl',
      iconBgColor: colors.primary,
      onPress: () => handleComingSoon('Feature Tutorial'),
    },
    {
      title: 'Help & FAQ',
      description: 'Common questions answered',
      iconBgColor: colors.primary,
      onPress: () => handleComingSoon('Help & FAQ'),
    },
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      iconBgColor: colors.good,
      onPress: () => Linking.openURL('mailto:support@shelfcontrolapp.com'),
    },
    {
      title: 'Report a Bug',
      description: 'Help us improve',
      iconBgColor: colors.approaching,
      onPress: () =>
        Linking.openURL('mailto:bugs@shelfcontrolapp.com?subject=Bug%20Report'),
    },
    {
      title: 'Request a Feature',
      description: 'Share your ideas',
      iconBgColor: colors.accent,
      onPress: () =>
        Linking.openURL(
          'mailto:feedback@shelfcontrolapp.com?subject=Feature%20Request'
        ),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="About & Support"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace(ROUTES.HOME)
        }
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText
          typography="bodyMedium"
          color="textSecondary"
          style={styles.subtitle}
        >
          Get help and learn more
        </ThemedText>

        {/* App Info Card */}
        <ThemedView
          style={[styles.appCard, { backgroundColor: colors.cardEmptyState }]}
        >
          <View
            style={[
              styles.appIconContainer,
              { backgroundColor: colors.primary },
            ]}
          >
            <IconSymbol name="books.vertical.fill" size={32} color="#FFFFFF" />
          </View>
          <ThemedText typography="titleLarge" style={styles.appName}>
            ShelfControl
          </ThemedText>
          <ThemedText typography="bodyMedium" color="textSecondary">
            Version {appVersion} (Build {buildNumber})
          </ThemedText>
          <View style={styles.taglineContainer}>
            <ThemedText typography="bodySmall" color="textMuted">
              Made with{' '}
            </ThemedText>
            <IconSymbol name="heart.fill" size={14} color={colors.primary} />
            <ThemedText typography="bodySmall" color="textMuted">
              {' '}
              by readers, for readers
            </ThemedText>
          </View>
        </ThemedView>

        {/* Help & Support */}
        <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Help & Support
          </ThemedText>
          <View style={styles.helpList}>
            {helpItems.map(item => (
              <Pressable
                key={item.title}
                onPress={item.onPress}
                style={[styles.helpItem, { borderColor: colors.border }]}
                testID={`settings-help-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <View
                  style={[
                    styles.helpIcon,
                    { backgroundColor: `${item.iconBgColor}20` },
                  ]}
                >
                  <IconSymbol
                    name="info.circle"
                    size={20}
                    color={item.iconBgColor}
                  />
                </View>
                <View style={styles.helpText}>
                  <ThemedText typography="titleSmall">{item.title}</ThemedText>
                  <ThemedText typography="bodySmall" color="textSecondary">
                    {item.description}
                  </ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Share Section */}
        <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Share ShelfControl
          </ThemedText>
          <Pressable
            onPress={handleShare}
            style={[
              styles.shareButton,
              {
                backgroundColor: `${colors.primary}10`,
                borderColor: colors.primary,
              },
            ]}
            testID="settings-share-button"
          >
            <View style={styles.shareContent}>
              <ThemedText typography="titleSmall">
                Share with Friends
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                Help others track their ARCs
              </ThemedText>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          <Pressable
            onPress={handleRateApp}
            style={[
              styles.shareButton,
              {
                backgroundColor: `${colors.approaching}10`,
                borderColor: colors.approaching,
              },
            ]}
            testID="settings-rate-app-button"
          >
            <View style={styles.shareContent}>
              <ThemedText typography="titleSmall">Rate on App Store</ThemedText>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <IconSymbol
                    key={i}
                    name="star.fill"
                    size={16}
                    color={colors.approaching}
                  />
                ))}
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        {/* Credits */}
        <ThemedView
          style={[
            styles.creditsCard,
            { backgroundColor: colors.cardEmptyState },
          ]}
        >
          <ThemedText typography="bodySmall" color="textSecondary">
            ShelfControl was shaped by ARC reviewers who helped test and improve
            it.
          </ThemedText>
          <Pressable
            onPress={() => handleComingSoon('Credits & Acknowledgments')}
            testID="settings-credits-link"
          >
            <ThemedText
              typography="labelLarge"
              color="primary"
              style={styles.creditsLink}
            >
              View Credits & Acknowledgments →
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 100 : Spacing.xxl,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  appCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  helpList: {
    gap: Spacing.sm,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    flex: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  shareContent: {
    flex: 1,
  },
  creditsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  creditsLink: {
    marginTop: Spacing.sm,
  },
});
