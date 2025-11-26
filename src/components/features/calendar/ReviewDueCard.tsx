import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { EnrichedActivity } from '@/types/calendar.types';
import { OPACITY } from '@/utils/formatters';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ReviewDueCardProps {
    activity: EnrichedActivity;
    onPress?: () => void;
}

/**
 * ReviewDueCard Component
 * Renders review due items as all-day cards with orange color bar (matching DeadlineDueCard style)
 */
export const ReviewDueCard: React.FC<ReviewDueCardProps> = React.memo(
    function ReviewDueCard({ activity, onPress }) {
        const { colors } = useTheme();
        const config = ACTIVITY_TYPE_CONFIG.review_due;

        return (
            <Pressable
                testID="review-due-card"
                style={({ pressed }) => [styles.container, pressed && styles.pressed]}
                onPress={onPress}
                disabled={!onPress}
            >
                <View style={styles.timeColumn}>
                    <ThemedText typography="labelMedium" color="textMuted">
                        Due Today
                    </ThemedText>
                </View>

                <View style={styles.timelineColumn}>
                    <View
                        style={[
                            styles.iconCircle,
                            {
                                backgroundColor: config.color + OPACITY.SUBTLE,
                                borderColor: config.color,
                            },
                        ]}
                    >
                        <IconSymbol
                            name={config.icon}
                            size={16}
                            color={config.color}
                        />
                    </View>
                </View>

                {/* Content Column */}
                <View style={[styles.content, { borderColor: colors.border }]}>
                    <ThemedText
                        typography="bodyLarge"
                        style={styles.bookTitle}
                        numberOfLines={1}
                    >
                        {activity.book_title}
                    </ThemedText>
                    <ThemedText variant="muted">Review Due</ThemedText>
                </View>
            </Pressable>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 10,
    },
    pressed: {
        opacity: 0.7,
    },
    timeColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    timelineColumn: {
        alignItems: 'center',
        position: 'relative',
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1, // Ensure icon appears above the line
        borderWidth: 2, // Thicker border matching DeadlineDueCard
    },
    content: {
        flex: 1,
        paddingLeft: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
    },
    bookTitle: {
        marginBottom: 4,
    },
});
