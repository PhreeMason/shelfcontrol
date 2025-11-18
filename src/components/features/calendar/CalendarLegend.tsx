import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
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
    rotation.value = withTiming(isExpanded ? 0 : 180, { duration: 200 });
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
        accessibilityHint="Double tap to toggle the calendar legend explanation"
      >
        <ThemedText typography="titleSmall">Calendar Legend</ThemedText>
        <Animated.View style={chevronStyle}>
          <IconSymbol name="chevron.down" size={20} color={colors.text} />
        </Animated.View>
      </Pressable>

      {/* Legend Content */}
      {isExpanded && (
        <View style={styles.content}>
          <LegendItem color={colors.pending} label="Activity event" />
          <LegendItem color={colors.good} label="On track due date" />
          <LegendItem color={colors.approaching} label="Tight due date" />
          <LegendItem color={colors.urgent} label="Urgent/Overdue due date" />

          {/* Multiple dots info */}
          <View style={[styles.infoContainer, dynamicStyles.infoContainer]}>
            <IconSymbol name="info.circle" size={14} color={colors.textMuted} />
            <ThemedText typography="bodySmall" color="textMuted" style={styles.infoText}>
              Multiple dots can appear on dates with both activities and due
              dates
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
