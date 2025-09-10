import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '../themed';

const ProgressHeader: React.FC = () => {
  return (
    <ThemedView style={styles.sectionTitle}>
      <ThemedText style={styles.sectionIcon}>📊</ThemedText>
      <ThemedText variant="title">Reading Progress</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
});

export default ProgressHeader;
