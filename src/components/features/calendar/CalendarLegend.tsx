import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ACTIVITY_DOT_COLOR } from '@/constants/activityTypes';
import { Spacing, Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { OPACITY } from '@/utils/formatters';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface LegendItemProps {
  color: string;
  label: string;
  opacity?: string;
  showText?: boolean;
}

const LegendItem: React.FC<LegendItemProps> = ({
  color,
  label,
  opacity = OPACITY.CALENDAR,
  showText = true,
}) => {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.colorBox, { backgroundColor: color + opacity }]}>
        {showText && <Text style={[styles.colorBoxText, { color }]}>12</Text>}
      </View>
      <ThemedText typography="labelMedium">{label}</ThemedText>
    </View>
  );
};

export const CalendarLegend: React.FC = () => {
  const { colors, borderRadius } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const dynamicStyles = {
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
    },
    infoContainer: {
      borderTopColor: colors.border,
    },
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    rotation.value = withTiming(isExpanded ? 0 : 90, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <Pressable
        onPress={toggleExpanded}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isExpanded ? 'Hide calendar legend' : 'Show calendar legend'
        }
        accessibilityState={{ expanded: isExpanded }}
        accessibilityHint="Tap to toggle the calendar legend explanation"
      >
        <ThemedText typography="titleSmall">Calendar Legend</ThemedText>
        <Animated.View style={chevronStyle}>
          <IconSymbol name="chevron.right" size={20} color={colors.text} />
        </Animated.View>
      </Pressable>

      {/* Legend Content */}
      {isExpanded && (
        <View style={styles.content}>
          <LegendItem color={colors.successGreen} label="Completed" />
          <LegendItem color={colors.good} label="On Track" />
          <LegendItem color={colors.approaching} label="Tight" />
          <LegendItem color={colors.urgent} label="Needs Replanning" />
          <LegendItem
            color={ACTIVITY_DOT_COLOR}
            label="Activity Event"
            opacity={OPACITY.SUBTLE}
          />

          {/* Multiple deadlines info */}
          <View style={[styles.infoContainer, dynamicStyles.infoContainer]}>
            <IconSymbol name="info.circle" size={14} color={colors.textMuted} />
            <ThemedText
              typography="bodySmall"
              color="textMuted"
              style={styles.infoText}
            >
              When multiple due dates fall on one day, the most urgent is shown.
              Book covers appear on dates with deadlines.
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerPressed: {
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorBoxText: {
    ...Typography.labelSmall,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
  },
  infoText: {
    flex: 1,
  },
});
