import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard';
import { ViewToggleControl } from '@/components/features/deadlines/ViewToggleControl';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing, Typography } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { usePreferences } from '@/providers/PreferencesProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DeadlineCardCompact } from './DeadlineCardCompact';

interface DeadlinesListProps {
  deadlines: ReadingDeadlineWithProgress[];
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DeadlinesList: React.FC<DeadlinesListProps> = ({
  deadlines,
  isLoading,
  error,
  emptyMessage,
  searchQuery,
  onSearchChange,
}) => {
  const { deadlineViewMode } = usePreferences();
  const { colors } = useTheme();

  const renderContent = () => {
    if (isLoading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText typography="bodyMedium" style={styles.loadingText}>
            Loading books...
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText
            typography="bodyMedium"
            color="error"
            style={styles.errorText}
          >
            Error loading deadlines: {error.message}
          </ThemedText>
        </ThemedView>
      );
    }

    if (deadlines.length === 0) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText typography="bodyMedium" style={styles.emptyText}>
            {emptyMessage}
          </ThemedText>
        </ThemedView>
      );
    }

    return deadlineViewMode === 'compact' ? (
      <View style={styles.gridContainer}>
        {deadlines.map(deadline => (
          <DeadlineCardCompact key={deadline.id} deadline={deadline} />
        ))}
      </View>
    ) : (
      <View style={styles.container}>
        {deadlines.map(deadline => (
          <DeadlineCard key={deadline.id} deadline={deadline} />
        ))}
      </View>
    );
  };

  return (
    <>
      <View style={styles.searchAndToggleContainer}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search list by title or author"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => onSearchChange('')}
              hitSlop={8}
              style={styles.clearButton}
            >
              <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <ViewToggleControl />
      </View>
      {renderContent()}
    </>
  );
};

const styles = StyleSheet.create({
  searchAndToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: 4,
  },
  container: {
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 15,
    gap: 15,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default DeadlinesList;
