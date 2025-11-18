import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

interface PaceEstimateBoxProps {
  paceEstimate: string;
}

export const PaceEstimateBox: React.FC<PaceEstimateBoxProps> = ({
  paceEstimate,
}) => {
  const { colors } = useTheme();
  const isOverdue = paceEstimate.includes('passed');

  if (!paceEstimate) return null;

  return (
    <LinearGradient
      colors={[
        colors.outline,
        isOverdue ? `${colors.outline}` : `${colors.primary}`,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.estimateContainer,
        {
          borderColor: isOverdue ? colors.secondary : colors.primary,
        },
      ]}
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
    </LinearGradient>
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
  },
  overdueEstimateStyle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 'bold',
  },
});
