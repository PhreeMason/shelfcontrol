import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: IconSymbolName;
  iconBackgroundColor: string;
  onPress: () => void;
}

interface SettingsSectionListProps {
  sections: SettingsSection[];
}

const SettingsSectionList: React.FC<SettingsSectionListProps> = ({
  sections,
}) => {
  const { colors } = useTheme();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      {sections.map((section, index) => (
        <View key={section.id}>
          <Pressable
            onPress={section.onPress}
            style={({ pressed }) => [
              styles.sectionItem,
              pressed && { backgroundColor: colors.pressed },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${section.iconBackgroundColor}20` },
              ]}
            >
              <IconSymbol
                name={section.icon}
                size={24}
                color={section.iconBackgroundColor}
              />
            </View>
            <View style={styles.textContainer}>
              <ThemedText typography="titleMedium" color="text">
                {section.title}
              </ThemedText>
              <ThemedText typography="bodySmall" color="textSecondary">
                {section.description}
              </ThemedText>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          {index < sections.length - 1 && (
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
          )}
        </View>
      ))}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    ...Shadows.subtle,
    overflow: 'hidden',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.sm,
  },
});

export default SettingsSectionList;
