import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import {
  DeadlineViewMode,
  usePreferences,
} from '@/providers/PreferencesProvider';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export function ViewToggleControl() {
  const { deadlineViewMode, setDeadlineViewMode } = usePreferences();
  const { colors } = useTheme();

  const handleToggle = (mode: DeadlineViewMode) => {
    setDeadlineViewMode(mode);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.toggleContainer,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <Pressable
          style={[
            styles.toggleButton,
            deadlineViewMode === 'list' && {
              backgroundColor: colors.tint,
            },
          ]}
          onPress={() => handleToggle('list')}
        >
          <IconSymbol
            name="list.bullet"
            size={20}
            color={deadlineViewMode === 'list' ? '#fff' : colors.text}
          />
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            deadlineViewMode === 'compact' && {
              backgroundColor: colors.tint,
            },
          ]}
          onPress={() => handleToggle('compact')}
        >
          <IconSymbol
            name="square.grid.2x2"
            size={20}
            color={deadlineViewMode === 'compact' ? '#fff' : colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: Spacing.xs,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
