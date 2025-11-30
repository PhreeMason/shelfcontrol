import AppHeader from '@/components/shared/AppHeader';
import { ToggleSwitch } from '@/components/shared/ToggleSwitch';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const PROGRESS_METHODS = ['Pages read', 'Percentage', 'Time listened (audio)'];

export default function ReadingPreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [pendingThreshold] = useState(20);
  const [readingPace, setReadingPace] = useState('50');
  const [progressMethod, setProgressMethod] = useState('Pages read');
  const [requirePauseNotes, setRequirePauseNotes] = useState(false);
  const [requireDNFNotes, setRequireDNFNotes] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Reading Preferences"
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
          Customize your reading tracking
        </ThemedText>

        {/* Days until Pending */}
        <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Days until Pending
          </ThemedText>
          <ThemedText
            typography="bodySmall"
            color="textSecondary"
            style={styles.sectionDesc}
          >
            Books due beyond this many days show in the Pending tab
          </ThemedText>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <ThemedText typography="bodySmall" color="textSecondary">
                7 days
              </ThemedText>
              <ThemedText typography="titleSmall" color="primary">
                {pendingThreshold} days
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                45 days
              </ThemedText>
            </View>
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
                    width: `${((pendingThreshold - 7) / 38) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Reading Pace */}
        <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Default Reading Pace
          </ThemedText>
          <ThemedText
            typography="bodySmall"
            color="textSecondary"
            style={styles.sectionDesc}
          >
            Your typical pages per day
          </ThemedText>
          <View style={styles.paceInputRow}>
            <TextInput
              value={readingPace}
              onChangeText={setReadingPace}
              keyboardType="numeric"
              style={[
                styles.paceInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
            <ThemedText typography="bodyMedium" color="textSecondary">
              pages/day
            </ThemedText>
          </View>
        </View>

        {/* Progress Update Method */}
        <View style={styles.section}>
          <ThemedText typography="titleSmall" style={styles.sectionTitle}>
            Progress Update Method
          </ThemedText>
          <View style={styles.radioGroup}>
            {PROGRESS_METHODS.map(method => (
              <Pressable
                key={method}
                onPress={() => setProgressMethod(method)}
                style={styles.radioOption}
              >
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor:
                        progressMethod === method
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  {progressMethod === method && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
                <ThemedText typography="bodyMedium">{method}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Optional Prompts */}
        <ThemedView
          style={[
            styles.optionCard,
            { backgroundColor: colors.cardEmptyState },
          ]}
        >
          <ThemedText typography="titleSmall" style={styles.optionTitle}>
            Optional Prompts
          </ThemedText>
          <View style={styles.toggleGroup}>
            <ToggleSwitch
              value={requirePauseNotes}
              onValueChange={setRequirePauseNotes}
              label="Require notes when pausing"
              testID="settings-require-pause-notes-toggle"
            />
            <ToggleSwitch
              value={requireDNFNotes}
              onValueChange={setRequireDNFNotes}
              label="Require notes when DNFing"
              testID="settings-require-dnf-notes-toggle"
            />
          </View>
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
            These preferences are for display only and will be saved in a future
            update.
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    marginBottom: Spacing.sm,
  },
  sliderContainer: {
    marginTop: Spacing.xs,
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
  paceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paceInput: {
    width: 80,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: Typography.bodyLarge.fontSize,
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
  optionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  optionTitle: {
    marginBottom: Spacing.md,
  },
  toggleGroup: {
    gap: Spacing.md,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
});
