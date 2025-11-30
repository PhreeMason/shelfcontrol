import AppHeader from '@/components/shared/AppHeader';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const THEMES = [
  { id: 'default', name: 'Default', primary: '#B8A9D9', secondary: '#E8B4B8' },
  { id: 'dark', name: 'Dark', primary: '#2B3D4F', secondary: '#374A5E' },
  { id: 'warm', name: 'Warm', primary: '#E8C2B9', secondary: '#F5C2A1' },
  { id: 'cool', name: 'Cool', primary: '#A8C5D1', secondary: '#B8D8E8' },
  { id: 'mint', name: 'Mint', primary: '#B8E8D9', secondary: '#C8F5E8' },
  { id: 'mono', name: 'Mono', primary: '#888888', secondary: '#AAAAAA' },
];

const COLORBLIND_MODES = [
  'None',
  'Red-Green (Deuteranopia)',
  'Blue-Yellow (Tritanopia)',
];

export default function AppearanceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [fontSize] = useState(100);
  const [colorblindMode, setColorblindMode] = useState('None');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Display & Appearance"
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
          Customize how ShelfControl looks
        </ThemedText>

        {/* Theme Selector */}
        <ThemedText typography="titleSmall" style={styles.sectionTitle}>
          Color Theme
        </ThemedText>
        <View style={styles.themeList}>
          {THEMES.map(theme => (
            <Pressable
              key={theme.id}
              onPress={() => setSelectedTheme(theme.id)}
              style={[
                styles.themeOption,
                {
                  borderColor:
                    selectedTheme === theme.id ? theme.primary : colors.border,
                  backgroundColor:
                    selectedTheme === theme.id
                      ? `${theme.primary}15`
                      : colors.surface,
                },
              ]}
            >
              <View style={styles.themeColors}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: theme.secondary },
                  ]}
                />
              </View>
              <ThemedText typography="titleSmall">{theme.name}</ThemedText>
              {selectedTheme === theme.id && (
                <View
                  style={[styles.checkmark, { backgroundColor: theme.primary }]}
                >
                  <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Colorblind Modes */}
        <ThemedView
          style={[
            styles.optionCard,
            { backgroundColor: colors.cardEmptyState },
          ]}
        >
          <ThemedText typography="titleSmall" style={styles.optionTitle}>
            Colorblind Modes
          </ThemedText>
          <View style={styles.radioGroup}>
            {COLORBLIND_MODES.map(mode => (
              <Pressable
                key={mode}
                onPress={() => setColorblindMode(mode)}
                style={styles.radioOption}
              >
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor:
                        colorblindMode === mode
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  {colorblindMode === mode && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
                <ThemedText typography="bodyMedium">{mode}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        {/* Text Size */}
        <ThemedText typography="titleSmall" style={styles.sectionTitle}>
          Text Size
        </ThemedText>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderLabels}>
            <ThemedText typography="bodySmall" color="textSecondary">
              Small
            </ThemedText>
            <ThemedText typography="titleSmall" color="primary">
              {fontSize}%
            </ThemedText>
            <ThemedText typography="bodySmall" color="textSecondary">
              Large
            </ThemedText>
          </View>
          {/* Note: Actual slider would go here - using placeholder for now */}
          <View
            style={[
              styles.sliderTrack,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <View
              style={[
                styles.sliderFill,
                {
                  backgroundColor: colors.primary,
                  width: `${((fontSize - 80) / 70) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Preview */}
        <ThemedView
          style={[
            styles.previewCard,
            { backgroundColor: colors.cardEmptyState },
          ]}
        >
          <ThemedText typography="titleMedium">Preview: Book Title</ThemedText>
          <ThemedText typography="bodyMedium" color="textSecondary">
            47 pages per day needed
          </ThemedText>
          <ThemedText typography="bodySmall" color="textMuted">
            Due in 8 days
          </ThemedText>
        </ThemedView>

        {/* Info Note */}
        <View
          style={[
            styles.infoNote,
            { backgroundColor: colors.primaryContainer },
          ]}
        >
          <IconSymbol name="info.circle" size={16} color={colors.primary} />
          <ThemedText typography="bodySmall" color="textSecondary">
            Theme selection coming soon. Text will scale throughout the entire
            app.
          </ThemedText>
        </View>
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
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  themeList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  themeColors: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
  },
  checkmark: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  optionTitle: {
    marginBottom: Spacing.sm,
  },
  radioGroup: {
    gap: Spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  previewCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
});
