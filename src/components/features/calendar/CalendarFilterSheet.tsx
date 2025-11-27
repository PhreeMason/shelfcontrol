import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedText } from '@/components/themed/ThemedText';
import { ActivityType } from '@/constants/activityTypes';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import React, { useEffect } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CalendarFilterSheetProps {
    visible: boolean;
    onClose: () => void;
    excludedActivities: ActivityType[];
    onExcludedActivitiesChange: (activities: ActivityType[]) => void;
}

const ACTIVITY_FILTERS: { type: ActivityType; label: string }[] = [
    { type: 'deadline_due', label: 'Books Due' },
    { type: 'deadline_created', label: 'New Books Added' },
    { type: 'progress', label: 'Progress Updates' },
    { type: 'status', label: 'Status Changes' },
    { type: 'note', label: 'Notes' },
    { type: 'review', label: 'Reviews' },
    { type: 'review_due', label: 'Review Due Dates' },
];

export const CalendarFilterSheet: React.FC<CalendarFilterSheetProps> = ({
    visible,
    onClose,
    excludedActivities,
    onExcludedActivitiesChange,
}) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(1000);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        } else {
            translateY.value = withSpring(1000, { damping: 20, stiffness: 200 });
        }
    }, [visible, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const toggleActivity = (type: ActivityType) => {
        if (excludedActivities.includes(type)) {
            onExcludedActivitiesChange(excludedActivities.filter(t => t !== type));
        } else {
            onExcludedActivitiesChange([...excludedActivities, type]);
        }
    };

    const clearAllFilters = () => {
        onExcludedActivitiesChange([]);
    };

    const hasActiveFilters = excludedActivities.length > 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.backdrop}
                onPress={onClose}
                accessibilityLabel="Close filter sheet"
            >
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: colors.surface,
                            paddingBottom: insets.bottom + Spacing.md,
                        },
                        animatedStyle,
                    ]}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={styles.header}>
                        <ThemedText typography="titleSubLarge" style={styles.title}>
                            Filter Activities
                        </ThemedText>
                        <View style={styles.headerActions}>
                            {hasActiveFilters && (
                                <TouchableOpacity
                                    onPress={clearAllFilters}
                                    style={styles.clearButton}
                                >
                                    <ThemedText
                                        typography="titleMedium"
                                        style={[styles.closeButton, { color: colors.darkPink }]}
                                    >
                                        Clear All
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose}>
                                <ThemedText
                                    typography="titleMedium"
                                    style={styles.closeButton}
                                >
                                    Done
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                    >
                        <View style={styles.section}>
                            <ThemedText typography="titleMedium" style={styles.sectionTitle}>
                                Activity Types
                            </ThemedText>
                            <View style={styles.filterRow}>
                                {ACTIVITY_FILTERS.map(filter => {
                                    const isExcluded = excludedActivities.includes(filter.type);
                                    return (
                                        <ThemedButton
                                            key={filter.type}
                                            title={filter.label}
                                            style={styles.filterPill}
                                            variant={!isExcluded ? 'primary' : 'outline'}
                                            onPress={() => toggleActivity(filter.type)}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <ThemedButton
                            title="APPLY"
                            variant="primary"
                            style={styles.applyButton}
                            onPress={onClose}
                        />
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
        maxHeight: '85%',
        ...Shadows.elevated,
    },
    scrollView: {
        flexGrow: 0,
        flexShrink: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xs,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    clearButton: {
        marginRight: 0,
    },
    title: {
        fontWeight: '700',
    },
    closeButton: {
        fontWeight: '600',
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    filterPill: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minWidth: 'auto',
    },
    footer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    applyButton: {
        paddingVertical: Spacing.md,
        width: '100%',
    },
});
