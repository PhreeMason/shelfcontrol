import { ThemedText } from '@/components/themed';
import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/Colors';
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
  return (
    <View style={styles.card}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.dateText}>{dateText}</ThemedText>
      <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.backgroundSecondary + '90',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  dateText: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Colors.light.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FontFamily.regular,
    color: Colors.light.textSecondary,
  },
});

export default StatsSummaryCard;
