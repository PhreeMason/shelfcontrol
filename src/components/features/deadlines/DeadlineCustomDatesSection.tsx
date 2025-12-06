import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import {
  useAddCustomDate,
  useDeleteCustomDate,
  useGetCustomDates,
  useUpdateCustomDate,
} from '@/hooks/useCustomDates';
import { useTheme } from '@/hooks/useTheme';
import { analytics } from '@/lib/analytics/client';
import { CustomDateFormData } from '@/schemas/customDateFormSchema';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { CustomDateCard } from './CustomDateCard';
import { CustomDateForm } from './CustomDateForm';

interface DeadlineCustomDatesSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DeadlineCustomDatesSection = ({
  deadline,
}: DeadlineCustomDatesSectionProps) => {
  const { colors } = useTheme();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomDateId, setEditingCustomDateId] = useState<string | null>(
    null
  );

  const { data: customDates = [], isLoading } = useGetCustomDates(deadline.id);
  const addCustomDateMutation = useAddCustomDate();
  const updateCustomDateMutation = useUpdateCustomDate();
  const deleteCustomDateMutation = useDeleteCustomDate();

  const latestStatus =
    deadline.status && deadline.status.length > 0
      ? (deadline.status[deadline.status.length - 1].status ?? 'reading')
      : 'reading';

  const handleAddCustomDate = (data: CustomDateFormData) => {
    addCustomDateMutation.mutate(
      {
        deadlineId: deadline.id,
        customDateData: {
          name: data.name,
          date: data.date,
        },
      },
      {
        onSuccess: () => {
          analytics.track('custom_date_added', {
            deadline_id: deadline.id,
            deadline_status: latestStatus as
              | 'pending'
              | 'reading'
              | 'completed'
              | 'paused'
              | 'dnf',
            name: data.name,
          });
          setIsAdding(false);
        },
      }
    );
  };

  const handleUpdateCustomDate = (
    customDateId: string,
    data: CustomDateFormData
  ) => {
    updateCustomDateMutation.mutate(
      {
        customDateId,
        deadlineId: deadline.id,
        customDateData: {
          name: data.name,
          date: data.date,
        },
      },
      {
        onSuccess: () => {
          analytics.track('custom_date_edited', {
            deadline_id: deadline.id,
            deadline_status: latestStatus as
              | 'pending'
              | 'reading'
              | 'completed'
              | 'paused'
              | 'dnf',
          });
          setEditingCustomDateId(null);
        },
      }
    );
  };

  const handleDeleteCustomDate = (customDateId: string) => {
    Alert.alert('Delete Date', 'Are you sure you want to delete this date?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCustomDateMutation.mutate(
            {
              customDateId,
              deadlineId: deadline.id,
            },
            {
              onSuccess: () => {
                analytics.track('custom_date_deleted', {
                  deadline_id: deadline.id,
                  deadline_status: latestStatus as
                    | 'pending'
                    | 'reading'
                    | 'completed'
                    | 'paused'
                    | 'dnf',
                });
              },
            }
          );
        },
      },
    ]);
  };

  const editingCustomDate = customDates.find(
    cd => cd.id === editingCustomDateId
  );

  return (
    <ThemedView style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <ThemedText variant="title">Important Dates</ThemedText>
          <ThemedText variant="secondary" style={styles.benefitMargin}>
            Track cover reveals, blog tours, and more
          </ThemedText>
        </View>
        {!isAdding && !editingCustomDateId && (
          <Pressable
            onPress={() => setIsAdding(true)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <IconSymbol
              name="plus.circle.fill"
              size={20}
              color={colors.darkPurple}
              style={styles.addIcon}
            />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ThemedText variant="secondary">Loading dates...</ThemedText>
      ) : (
        <View style={styles.customDatesList}>
          {customDates.map(customDate => (
            <View key={customDate.id}>
              {editingCustomDateId === customDate.id ? (
                <CustomDateForm
                  onSubmit={data => handleUpdateCustomDate(customDate.id, data)}
                  onCancel={() => setEditingCustomDateId(null)}
                  defaultValues={{
                    name: editingCustomDate?.name || '',
                    date:
                      editingCustomDate?.date || dayjs().format('YYYY-MM-DD'),
                  }}
                />
              ) : (
                <CustomDateCard
                  customDate={customDate}
                  onEdit={() => setEditingCustomDateId(customDate.id)}
                  onDelete={() => handleDeleteCustomDate(customDate.id)}
                />
              )}
            </View>
          ))}

          {isAdding && (
            <View style={styles.addForm}>
              <CustomDateForm
                onSubmit={handleAddCustomDate}
                onCancel={() => setIsAdding(false)}
              />
            </View>
          )}

          {customDates.length === 0 && !isAdding && (
            <Pressable
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: colors.cardEmptyState,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setIsAdding(true)}
            >
              <View style={styles.ghostDate}>
                <View style={styles.ghostIcon}>
                  <IconSymbol
                    name="calendar.badge.plus"
                    size={40}
                    color={colors.primary}
                    style={styles.ghostIconSymbol}
                  />
                </View>
                <View style={styles.ghostDateInfo}>
                  <View
                    style={[
                      styles.ghostText,
                      styles.ghostTextShort,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.ghostText,
                      styles.ghostTextMedium,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </View>
              <ThemedText
                typography="labelLarge"
                color="textSecondary"
                style={styles.emptyCta}
              >
                Add cover reveal, blog tour, etc. dates to track here
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}

      <ThemedText variant="secondary" style={styles.helpTextCenter}>
        These dates appear on your calendar as all-day events
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleColumn: {
    flex: 1,
  },
  benefitMargin: {
    marginTop: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addIcon: {
    marginRight: Spacing.xs,
  },
  customDatesList: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  addForm: {
    marginTop: Spacing.xs,
  },
  emptyStateCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  ghostDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  ghostIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostIconSymbol: {
    opacity: 0.4,
  },
  ghostDateInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  ghostText: {
    height: 16,
    borderRadius: BorderRadius.sm,
    opacity: 0.15,
  },
  ghostTextShort: {
    width: 100,
  },
  ghostTextMedium: {
    width: 160,
  },
  emptyCta: {
    textAlign: 'center',
  },
  helpTextCenter: {
    textAlign: 'center',
  },
});
