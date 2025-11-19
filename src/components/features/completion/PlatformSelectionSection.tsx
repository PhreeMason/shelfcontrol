import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { CategorizedPlatforms } from '@/utils/reviewFormUtils';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  postedPlatforms?: string[];
}

export const PlatformSelectionSection: React.FC<
  PlatformSelectionSectionProps
> = ({
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
  postedPlatforms = [],
}) => {
  const { colors } = useTheme();
  const [showMorePlatforms, setShowMorePlatforms] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const isPlatformPosted = (platform: string) =>
    postedPlatforms.includes(platform);

  // Build complete ordered platform list - PRESERVE EXISTING ORDER
  const allPlatformsOrdered = useMemo(() => {
    const platforms: { name: string; source: string }[] = [];

    // IMPORTANT: Maintain existing categorization order
    categorizedPlatforms.usedPresets.forEach(p =>
      platforms.push({ name: p, source: 'usedPreset' })
    );
    categorizedPlatforms.custom.forEach(p =>
      platforms.push({ name: p, source: 'custom' })
    );
    categorizedPlatforms.unusedPresets.forEach(p =>
      platforms.push({ name: p, source: 'unusedPreset' })
    );
    customPlatforms.forEach((p, idx) =>
      platforms.push({ name: p, source: `temp-${idx}` })
    );

    return platforms;
  }, [categorizedPlatforms, customPlatforms]);

  // First 3 platforms from ordered list
  const first3Platforms = allPlatformsOrdered.slice(0, 3);
  const remainingPlatforms = allPlatformsOrdered.slice(3);

  // Implement "float to top" logic matching mock
  const { topSectionPlatforms, moreSectionPlatforms } = useMemo(() => {
    // Keep original top 3 in their original order, regardless of selection state
    const top3InOriginalOrder = first3Platforms;

    // Selected platforms from remaining (these float up to top section)
    const selectedRemaining = remainingPlatforms.filter(p => {
      const isTemp = p.source.startsWith('temp-');
      const isSelected = isTemp || selectedPlatforms.has(p.name);
      return isSelected;
    });

    // Unselected platforms from remaining (these go in "More" section)
    const unselectedRemaining = remainingPlatforms.filter(p => {
      const isTemp = p.source.startsWith('temp-');
      const isSelected = isTemp || selectedPlatforms.has(p.name);
      return !isSelected;
    });

    // Top section = original top 3 (in order) + selected platforms from beyond top 3
    const topSection = [...top3InOriginalOrder, ...selectedRemaining];

    return {
      topSectionPlatforms: topSection,
      moreSectionPlatforms: unselectedRemaining,
    };
  }, [
    allPlatformsOrdered,
    first3Platforms,
    remainingPlatforms,
    selectedPlatforms,
  ]);

  const handleAddCustomPlatform = () => {
    addCustomPlatform();
    setShowCustomInput(false);
  };

  const renderPlatform = (
    platform: { name: string; source: string },
    showRemove = false
  ) => {
    const isPosted = isPlatformPosted(platform.name);
    const isTemp = platform.source.startsWith('temp-');
    const tempIndex = isTemp ? parseInt(platform.source.split('-')[1]) : -1;
    const isSelected = isTemp || selectedPlatforms.has(platform.name);

    return (
      <TouchableOpacity
        key={`${platform.source}-${platform.name}`}
        style={[
          styles.platformCard,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected
              ? colors.primaryContainer
              : colors.surface,
          },
          isPosted && { opacity: 0.6 },
        ]}
        onPress={() => {
          if (!isPosted) {
            if (isTemp) {
              removeCustomPlatform(tempIndex);
            } else {
              togglePlatform(platform.name);
            }
          }
        }}
        disabled={isPosted}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkboxIcon,
            {
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: isSelected ? colors.primary : 'transparent',
            },
          ]}
        >
          {isSelected && (
            <IconSymbol name="checkmark" size={16} color={colors.textInverse} />
          )}
        </View>
        <ThemedText
          typography="bodyMedium"
          style={[styles.platformLabel, { fontWeight: '500' }]}
        >
          {isPosted ? `${platform.name} ✓` : platform.name}
        </ThemedText>
        {showRemove && isTemp && (
          <TouchableOpacity
            onPress={() => removeCustomPlatform(tempIndex)}
            style={styles.removeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="platform-selection-section"
    >
      <ThemedView style={styles.section}>
        <ThemedText typography="titleMediumPlus" style={styles.sectionHeader}>
          Where will you post?
        </ThemedText>
        <ThemedText
          typography="bodySmall"
          color="textSecondary"
          style={styles.helpText}
        >
          Select all that apply
        </ThemedText>

        <ThemedView style={styles.platformsList}>
          {/* Top section: unselected first 3 + all selected */}
          <ThemedView style={styles.platformsColumn}>
            {topSectionPlatforms.map(p => renderPlatform(p, true))}

            {/* "My blog" handled separately with URL input */}
            {hasBlog && (
              <ThemedView>
                <TouchableOpacity
                  style={[
                    styles.platformCard,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryContainer,
                    },
                  ]}
                  onPress={() => setHasBlog(false)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkboxIcon,
                      {
                        borderColor: colors.primary,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={colors.textInverse}
                    />
                  </View>
                  <ThemedText
                    typography="bodyMedium"
                    style={[styles.platformLabel, { fontWeight: '500' }]}
                  >
                    My blog
                  </ThemedText>
                </TouchableOpacity>

                {/* Blog URL input */}
                <ThemedView style={styles.blogUrlContainer}>
                  <TextInput
                    style={[
                      styles.blogUrlInput,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.primary,
                        color: colors.text,
                      },
                    ]}
                    value={blogUrl}
                    onChangeText={setBlogUrl}
                    placeholder="https://yourblog.com"
                    autoCorrect={false}
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                    testID="blog-url-input"
                  />
                  <ThemedText typography="bodySmall" color="textSecondary">
                    We'll save this with your book
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>

          {/* More options toggle - only show if there are unselected platforms */}
          {moreSectionPlatforms.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.morePlatformsButton}
                onPress={() => setShowMorePlatforms(!showMorePlatforms)}
                testID="more-platforms-toggle"
              >
                <ThemedText
                  typography="bodyMedium"
                  color="primary"
                  style={{ fontWeight: '600' }}
                >
                  {showMorePlatforms ? 'Fewer options' : 'More options'}
                </ThemedText>
                <IconSymbol
                  name={showMorePlatforms ? 'chevron.up' : 'chevron.down'}
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {/* More section: only unselected platforms */}
              {showMorePlatforms && (
                <ThemedView
                  style={[
                    styles.morePlatformsSection,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <ThemedView style={styles.platformsColumn}>
                    {moreSectionPlatforms.map(p => renderPlatform(p, false))}

                    {/* "My blog" if not selected */}
                    {!hasBlog && (
                      <TouchableOpacity
                        style={[
                          styles.platformCard,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          },
                        ]}
                        onPress={() => setHasBlog(true)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkboxIcon,
                            { borderColor: colors.border },
                          ]}
                        />
                        <ThemedText
                          typography="bodyMedium"
                          style={[styles.platformLabel, { fontWeight: '500' }]}
                        >
                          My blog
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </ThemedView>

                  {/* Custom platform section */}
                  <ThemedView
                    style={[
                      styles.customPlatformSection,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    {!showCustomInput ? (
                      <TouchableOpacity
                        style={[
                          styles.addCustomButton,
                          { borderColor: colors.primary },
                        ]}
                        onPress={() => setShowCustomInput(true)}
                        testID="show-custom-platform-input"
                      >
                        <ThemedText
                          typography="bodyMedium"
                          color="primary"
                          style={{ fontWeight: '600' }}
                        >
                          + Add other platform
                        </ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <ThemedView style={styles.addCustomInputContainer}>
                        <ThemedView style={styles.addCustomRow}>
                          <TextInput
                            style={[
                              styles.customPlatformInput,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.primary,
                                color: colors.text,
                              },
                            ]}
                            value={newCustomPlatform}
                            onChangeText={setNewCustomPlatform}
                            placeholder="Platform name"
                            placeholderTextColor={colors.textMuted}
                            onSubmitEditing={handleAddCustomPlatform}
                            autoFocus
                            testID="custom-platform-input"
                          />
                          <TouchableOpacity
                            style={[
                              styles.addButton,
                              {
                                backgroundColor: newCustomPlatform.trim()
                                  ? colors.primary
                                  : colors.textMuted,
                              },
                            ]}
                            onPress={handleAddCustomPlatform}
                            disabled={!newCustomPlatform.trim()}
                            testID="add-custom-platform-button"
                          >
                            <ThemedText
                              typography="bodyMedium"
                              color="textInverse"
                              style={{ fontWeight: '600' }}
                            >
                              Add
                            </ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                        <TouchableOpacity
                          onPress={() => {
                            setShowCustomInput(false);
                            setNewCustomPlatform('');
                          }}
                        >
                          <ThemedText
                            typography="bodySmall"
                            color="textSecondary"
                          >
                            Cancel
                          </ThemedText>
                        </TouchableOpacity>
                      </ThemedView>
                    )}
                  </ThemedView>
                </ThemedView>
              )}
            </>
          )}

          {postedPlatforms.length > 0 && (
            <ThemedText
              typography="bodySmall"
              color="textSecondary"
              style={styles.postedHelpText}
            >
              Platforms marked with ✓ have been posted and cannot be removed.
            </ThemedText>
          )}
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
  helpText: {
    marginBottom: Spacing.sm,
  },
  platformsList: {
    gap: Spacing.md,
  },
  platformsColumn: {
    gap: Spacing.sm,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  checkboxIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformLabel: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  blogUrlContainer: {
    marginTop: Spacing.sm,
    marginLeft: 44, // 20 (checkbox) + 12 (gap) + 12 (padding)
    gap: Spacing.xs,
  },
  blogUrlInput: {
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Typography.bodyMedium,
  },
  morePlatformsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  morePlatformsSection: {
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  customPlatformSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  addCustomButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomInputContainer: {
    gap: Spacing.sm,
  },
  addCustomRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  customPlatformInput: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Typography.bodyMedium,
  },
  addButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  postedHelpText: {
    marginTop: Spacing.xs,
  },
});
