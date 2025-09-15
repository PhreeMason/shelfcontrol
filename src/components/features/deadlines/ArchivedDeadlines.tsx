import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard'
import { ThemedScrollView, ThemedText, ThemedView } from '@/components/themed'
import { useGetArchivedDeadlines } from '@/hooks/useDeadlines'
import { ReadingDeadlineWithProgress } from '@/types/deadline.types'
import { StyleSheet, View } from 'react-native'

const ArchivedDeadlines = () => {
    const { data: ArchivedDeadlines = [], isLoading, error } = useGetArchivedDeadlines();
    
    // Separate completed and set aside deadlines
    const completed = ArchivedDeadlines.filter(deadline => {
        const latestStatus = deadline.status?.[deadline.status.length - 1]?.status;
        return latestStatus === 'complete';
    });
    
    const setAside = ArchivedDeadlines.filter(deadline => {
        const latestStatus = deadline.status?.[deadline.status.length - 1]?.status;
        return latestStatus === 'set_aside';
    });

    if (isLoading) {
        return (
            <ThemedScrollView>
                <ThemedView style={styles.container}>
                    <ThemedText>Loading archives...</ThemedText>
                </ThemedView>
            </ThemedScrollView>
        );
    }   

    if (error) {
        return (
            <ThemedScrollView>
                <ThemedView style={styles.container}>
                    <ThemedText variant="error" style={styles.errorText}>Error loading archives: {error.message}</ThemedText>
                </ThemedView>
            </ThemedScrollView>
        );
    }

    const renderSection = (title: string, deadlines: ReadingDeadlineWithProgress[]) => {
        if (deadlines.length === 0) return null;
        
        return (
            <View style={styles.section}>
                <ThemedText
                    variant='label'
                    style={styles.sectionTitle}
                >
                    {title}
                </ThemedText>
                {deadlines.map((deadline) => (
                    <DeadlineCard
                        key={deadline.id}
                        deadline={deadline}
                    />
                ))}
            </View>
        );
    };

    return (
        <ThemedScrollView>
            <ThemedView style={styles.container}>
                {ArchivedDeadlines.length > 0 ? (
                    <>
                        {renderSection('COMPLETED', completed)}
                        {renderSection('PAUSED', setAside)}
                    </>
                ) : (
                    <ThemedText
                        style={styles.emptyText}
                        variant='muted'
                    >
                        No deadlines added to archives
                    </ThemedText>
                )}
            </ThemedView>
        </ThemedScrollView>
    )
}

export default ArchivedDeadlines

const styles = StyleSheet.create({
    container: {
        padding: 20,
        gap: 20
    },
    section: {
        gap: 20,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 50,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center'
    },
})