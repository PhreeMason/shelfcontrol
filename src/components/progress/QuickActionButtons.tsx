import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedButton } from '../themed';

interface QuickActionButtonsProps {
  onQuickUpdate: (increment: number) => void;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  onQuickUpdate,
}) => {
  const increments = [-1, 1, 5, 10];
  const { colors } = useTheme();
  return (
    <View style={styles.quickButtons}>
      {increments.map(inc => (
        <ThemedButton
          key={inc}
          title={`${inc > 0 ? '+' : ''}${inc}`}
          variant="outline"
          textStyle={{
            fontWeight: '900',
            color: inc > 0 ? colors.text : colors.accent,
          }}
          style={styles.quickBtn}
          onPress={() => onQuickUpdate(inc)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 8,
  },
  quickBtn: {
    flex: 1,
  },
});

export default QuickActionButtons;
