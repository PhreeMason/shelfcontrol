import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { ReviewFormData } from '@/utils/reviewFormSchema';
import React from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface LinkSubmissionSectionProps {
  watch: UseFormWatch<ReviewFormData>;
  setValue: UseFormSetValue<ReviewFormData>;
}

export const LinkSubmissionSection: React.FC<LinkSubmissionSectionProps> = ({
  watch,
  setValue,
}) => {
  const { colors } = useTheme();
  const needsLinkSubmission = watch('needsLinkSubmission');

  return (
    <ThemedView
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="link-submission-section"
    >
      <ThemedView style={styles.section}>
        <ThemedText typography="titleMediumPlus" style={styles.sectionHeader}>
          Will you need to submit review links?
        </ThemedText>
        <ThemedView style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              { borderColor: colors.border },
              needsLinkSubmission && {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setValue('needsLinkSubmission', true)}
            activeOpacity={0.7}
            testID="needs-link-submission-yes"
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: colors.border },
                needsLinkSubmission && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              {needsLinkSubmission && (
                <View
                  style={[
                    styles.radioInnerCircle,
                    { backgroundColor: colors.textOnPrimary },
                  ]}
                />
              )}
            </View>
            <View style={styles.radioTextContainer}>
              <ThemedText typography="bodyMedium">
                Yes, I'll share review URLs
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                For ARC reviews or publisher requests
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioOption,
              { borderColor: colors.border },
              !needsLinkSubmission && {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setValue('needsLinkSubmission', false)}
            activeOpacity={0.7}
            testID="needs-link-submission-no"
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: colors.border },
                !needsLinkSubmission && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              {!needsLinkSubmission && (
                <View
                  style={[
                    styles.radioInnerCircle,
                    { backgroundColor: colors.textOnPrimary },
                  ]}
                />
              )}
            </View>
            <ThemedText typography="bodyMedium" style={styles.radioLabel}>
              No link submission needed
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
  },
  radioGroup: {
    gap: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    flex: 1,
  },
  radioTextContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
});
