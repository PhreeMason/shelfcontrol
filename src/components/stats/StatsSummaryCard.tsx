import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StatsSummaryCardProps {
  label: string;
  dateText: string;
  subtitle: string;
  children?: React.ReactNode;
}

const StatsSummaryCard: React.FC<StatsSummaryCardProps> = ({
  label,
  dateText,
  subtitle,
  children,
}) => {
  const { colors } = useTheme();

  const dynamicStyles = {
    card: {
      backgroundColor: colors.backgroundSecondary + '90',
    },
  };

  return (
    <View style={[styles.card, dynamicStyles.card]}>
      <ThemedText
        typography="labelSmall"
        color="textSecondary"
        style={styles.label}
      >
        {label}
      </ThemedText>
      <ThemedText
        typography="headlineLarge"
        color="primary"
        style={styles.dateText}
      >
        {dateText}
      </ThemedText>
      <ThemedText typography="bodyMedium" color="textSecondary">
        {subtitle}
      </ThemedText>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  dateText: {
    marginBottom: 2,
  },
});

export default StatsSummaryCard;
