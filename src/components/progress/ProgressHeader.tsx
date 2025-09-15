import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '../themed';

const ProgressHeader: React.FC = () => {
  const {colors, typography} = useTheme();
  return (
    <ThemedView style={styles.sectionTitle}>
      <ThemedText style={[typography.bodyLarge, { color: colors.text, fontWeight: 'bold' }]}>Reading Progress</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  }
});

export default ProgressHeader;
