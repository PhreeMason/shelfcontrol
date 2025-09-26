import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface PaceEstimateBoxProps {
  paceEstimate: string;
}

export const PaceEstimateBox: React.FC<PaceEstimateBoxProps> = ({
  paceEstimate,
}) => {
  const { colors } = useTheme();
  const borderOpacity = useSharedValue(0);
  const isOverdue = paceEstimate.includes('This deadline has already passed');

  useEffect(() => {
    if (isOverdue) {
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      borderOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOverdue, borderOpacity]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        borderOpacity.value,
        [0, 0.3, 1],
        [
          isOverdue ? colors.danger : colors.primary,
          isOverdue ? `${colors.danger}66` : colors.primary,
          isOverdue ? colors.danger : colors.primary,
        ]
      ),
      shadowColor: colors.danger,
      shadowOpacity: isOverdue ? borderOpacity.value * 0.5 : 0,
      shadowRadius: isOverdue ? 10 : 0,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  if (!paceEstimate) return null;

  return (
    <AnimatedLinearGradient
      colors={[
        colors.accent,
        isOverdue ? `${colors.danger}20` : `${colors.primary}`,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.estimateContainer, animatedBorderStyle]}
    >
      <ThemedText
        style={
          isOverdue ? styles.overdueEstimateStyle : styles.paceEstimateStyle
        }
        variant="defaultSemiBold"
        color="textOnPrimary"
      >
        {paceEstimate}
      </ThemedText>
      {!isOverdue && (
        <ThemedText
          variant="defaultSemiBold"
          color="textOnPrimary"
          style={{ fontSize: 14 }}
        >
          to finish on time
        </ThemedText>
      )}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  estimateContainer: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 34,
    marginTop: 10,
    alignItems: 'center',
  },
  paceEstimateStyle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overdueEstimateStyle: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
