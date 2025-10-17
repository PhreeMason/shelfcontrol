import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

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
  gradientColors = ['#f9a8d4', '#d8b4fe'],
}) => {
  const shimmerTranslateX = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    if (!showShimmer) return;

    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: 40,
        duration: 1800,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerTranslateX, showShimmer]);

  return (
    <View
      style={[styles.progressBar, { height, backgroundColor, borderRadius }]}
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.progressFill,
          { width: `${progressPercentage}%`, borderRadius },
        ]}
      >
        {showShimmer && (
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          >
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
          </Animated.View>
        )}
      </LinearGradient>
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
