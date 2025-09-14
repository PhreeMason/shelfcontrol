import DailyReadingChart from '@/components/charts/DailyReadingChart';
import BookDetailsSection from '@/components/features/deadlines/BookDetailsSection';
import DeadlineActionButtons from '@/components/features/deadlines/DeadlineActionButtons';
import DeadlineHeroSection from '@/components/features/deadlines/DeadlineHeroSection';
import DeadlineViewHeader from '@/components/features/deadlines/DeadlineViewHeader';
import ReadingProgress from '@/components/shared/ReadingProgress';
import { ThemedButton, ThemedScrollView, ThemedText, ThemedView } from '@/components/themed';
import { useGetDeadlineById } from '@/hooks/useDeadlines';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DeadlineView = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { deadlines } = useDeadlines();
    const { colors } = useTheme();

    // First try to find deadline in context (for active deadlines)
    let deadline = deadlines.find(d => d.id === id);
    // If not found, use fallback hook (for archived deadlines)
    const { data: fallbackDeadline, isLoading: isFallbackLoading, error: fallbackError } = useGetDeadlineById(deadline ? undefined : id);

    // Use fallback deadline if context deadline not found
    if (!deadline && fallbackDeadline) {
        deadline = fallbackDeadline;
    }

    // Show loading state when using fallback
    if (!deadline && isFallbackLoading) {
        return (
            <SafeAreaView
                edges={['right', 'bottom', 'left']}
                style={{ flex: 1, backgroundColor: colors.background }}>
                <ThemedView style={[styles.container, { padding: 20, justifyContent: 'center', alignItems: 'center' }]}>
                    <ThemedText>Loading deadline...</ThemedText>
                </ThemedView>
            </SafeAreaView>
        );
    }

    // Show error or not found state
    if (!deadline || fallbackError) {
        return (
            <SafeAreaView
                edges={['right', 'bottom', 'left']}
                style={{ flex: 1, backgroundColor: colors.background }}>
                <ThemedView style={[styles.container, { padding: 20 }]}>
                    <ThemedText variant="title">Deadline not found</ThemedText>
                    <ThemedButton
                        title="Go Back"
                        onPress={() => router.back()}
                        style={{ marginTop: 16 }}
                    />
                </ThemedView>
            </SafeAreaView>
        );
    }

    const isArchived = deadline.status && deadline.status.length > 0
        && deadline.status[deadline.status.length - 1].status !== 'reading';
    const handleEdit = () => {
        router.push(`/deadline/${id}/edit`);
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView
            edges={['right', 'bottom', 'left']}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <DeadlineViewHeader
                onBack={handleBack}
                onEdit={handleEdit}
            />

            <ThemedScrollView style={[styles.content, { backgroundColor: 'white' }]}>
                <DeadlineHeroSection deadline={deadline} />

                {isArchived ? null : <ReadingProgress deadline={deadline} />}

                <DailyReadingChart deadline={deadline} />

                <BookDetailsSection deadline={deadline} />

                <DeadlineActionButtons
                    deadline={deadline}
                />
            </ThemedScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        marginBottom: 20,
    },
});

export default DeadlineView;