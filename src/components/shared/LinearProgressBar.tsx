import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type LinearProgressBarProps = {
  progressPercentage: number;
  height?: number;
  backgroundColor?: string;
  borderRadius?: number;
  showShimmer?: boolean;
  gradientColors?: string[];
};

const LinearProgressBar: React.FC<LinearProgressBarProps> = ({
  progressPercentage,
  height = 8,
  backgroundColor = 'rgba(232, 194, 185, 0.2)',
  borderRadius = 100,
  showShimmer = true,
  gradientColors = ['#E8C2B9', '#B8A9D9'],
}) => {
  const animatedWidth = useSharedValue(progressPercentage);
  const shimmerTranslateX = useSharedValue(-40);

  useEffect(() => {
    animatedWidth.value = withSpring(progressPercentage, {
      damping: 10,
      stiffness: 10,
    });
  }, [progressPercentage, animatedWidth]);

  useEffect(() => {
    if (showShimmer) {
      shimmerTranslateX.value = withRepeat(
        withTiming(40, { duration: 1800 }),
        -1,
        false
      );
    }
  }, [showShimmer, shimmerTranslateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  return (
    <View
      style={[styles.progressBar, { height, backgroundColor, borderRadius }]}
    >
      <Reanimated.View
        style={[styles.progressFill, { borderRadius }, animatedStyle]}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.progressFill}
        >
          {showShimmer && (
            <Reanimated.View style={[styles.shimmer, shimmerAnimatedStyle]}>
              <LinearGradient
                colors={[
                  gradientColors[0] + '90',
                  gradientColors[1] + '90',
                  gradientColors[1] + '90',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Reanimated.View>
          )}
        </LinearGradient>
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 20,
  },
  shimmerGradient: {
    flex: 1,
  },
});

export default LinearProgressBar;
