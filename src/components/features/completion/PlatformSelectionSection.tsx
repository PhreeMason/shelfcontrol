import Checkbox from '@/components/shared/Checkbox';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { CategorizedPlatforms } from '@/utils/reviewFormUtils';
import React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface PlatformSelectionSectionProps {
  categorizedPlatforms: CategorizedPlatforms;
  selectedPlatforms: Set<string>;
  togglePlatform: (platform: string) => void;
  hasBlog: boolean;
  setHasBlog: (value: boolean) => void;
  blogUrl: string;
  setBlogUrl: (url: string) => void;
  customPlatforms: string[];
  newCustomPlatform: string;
  setNewCustomPlatform: (value: string) => void;
  addCustomPlatform: () => void;
  removeCustomPlatform: (index: number) => void;
}

export const PlatformSelectionSection: React.FC<PlatformSelectionSectionProps> = ({
  categorizedPlatforms,
  selectedPlatforms,
  togglePlatform,
  hasBlog,
  setHasBlog,
  blogUrl,
  setBlogUrl,
  customPlatforms,
  newCustomPlatform,
  setNewCustomPlatform,
  addCustomPlatform,
  removeCustomPlatform,
}) => {
  const { colors } = useTheme();

  return (
    <ThemedView
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID="platform-selection-section"
    >
      <ThemedView style={styles.section}>
        <ThemedText variant="title" style={styles.sectionHeader}>
          Where to Post Reviews
        </ThemedText>
        <ThemedText variant="secondary" style={styles.sectionSubtext}>
          Select all that apply:
        </ThemedText>
        <ThemedView style={styles.platformsList}>
          <ThemedView style={styles.platformsGrid}>
            {categorizedPlatforms.usedPresets.map((platform) => (
              <ThemedView key={platform} style={styles.platformItem}>
                <Checkbox
                  label={platform}
                  checked={selectedPlatforms.has(platform)}
                  onToggle={() => togglePlatform(platform)}
                />
              </ThemedView>
            ))}
            {categorizedPlatforms.custom.map((platform) => (
              <ThemedView key={`history-${platform}`} style={styles.platformItem}>
                <Checkbox
                  label={platform}
                  checked={selectedPlatforms.has(platform)}
                  onToggle={() => togglePlatform(platform)}
                />
              </ThemedView>
            ))}
            {categorizedPlatforms.unusedPresets.map((platform) => (
              <ThemedView key={platform} style={styles.platformItem}>
                <Checkbox
                  label={platform}
                  checked={selectedPlatforms.has(platform)}
                  onToggle={() => togglePlatform(platform)}
                />
              </ThemedView>
            ))}
            {customPlatforms.map((platform, index) => (
              <ThemedView key={`custom-${index}`} style={styles.platformItem}>
                <Checkbox
                  label={platform}
                  checked={true}
                  onToggle={() => removeCustomPlatform(index)}
                />
              </ThemedView>
            ))}
          </ThemedView>

          <Checkbox
            label="My blog"
            checked={hasBlog}
            onToggle={() => setHasBlog(!hasBlog)}
          />
          {hasBlog && (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={blogUrl}
              onChangeText={setBlogUrl}
              placeholder="Enter blog URL..."
              autoCorrect={false}
              autoCapitalize="none"
              placeholderTextColor={colors.textMuted}
              testID="blog-url-input"
            />
          )}

          <ThemedView style={styles.addCustomContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  flex: 1,
                },
              ]}
              value={newCustomPlatform}
              onChangeText={setNewCustomPlatform}
              placeholder="Enter platform name..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={addCustomPlatform}
              testID="custom-platform-input"
            />
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.primary }]}
              onPress={addCustomPlatform}
              testID="add-custom-platform-button"
            >
              <IconSymbol name="plus" size={16} color={colors.primary} />
              <ThemedText color="primary" style={styles.addButtonText}>
                Add
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
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
    fontSize: 16,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  sectionSubtext: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  platformsList: {
    gap: Spacing.md,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformItem: {
    width: '48%',
  },
  input: {
    borderWidth: 2,
    padding: 16,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    lineHeight: 20,
  },
  addCustomContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
});
