import TodaysGoals from '@/components/progress/TodaysGoals';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing, Typography } from '@/constants/Colors';
import { dayjs } from '@/lib/dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

interface HeaderProps {
  onOpenShelvesPanel?: () => void;
}

const Header = ({ onOpenShelvesPanel }: HeaderProps) => {
  const today = Date.now();
  const formattedDate = dayjs(today).format('dddd, MMMM D');

  return (
    <LinearGradient
      colors={['#E8C2B9', '#B8A9D9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ThemedView style={styles.dateRow}>
        {onOpenShelvesPanel && (
          <Pressable
            style={styles.menuButton}
            onPress={onOpenShelvesPanel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              name="line.3.horizontal"
              size={24}
              color="rgba(250, 248, 245, 1)"
            />
          </Pressable>
        )}
        <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
      </ThemedView>
      <TodaysGoals />
    </LinearGradient>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
  },
  dateRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 10,
    gap: Spacing.md,
  },
  menuButton: {
    padding: Spacing.xs,
  },
  dateText: {
    ...Typography.titleLarge,
    fontSize: 26,
    letterSpacing: -0.4,
    lineHeight: 30,
    color: 'rgba(250, 248, 245, 1)',
  },
  statusSummary: {
    fontSize: 14,
  },
  readingTimeSummary: {
    fontSize: 14,
  },
  settings: {
    padding: 1,
    borderRadius: 50,
  },
});
