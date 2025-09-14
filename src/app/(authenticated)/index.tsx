import { ActiveReads } from '@/components/features/deadlines';
import { Header } from '@/components/navigation';
import { ThemedScrollView, ThemedView } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { Link } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView contentContainerStyle={styles.scrollContainer}>
        <Header />
        <ActiveReads />
      </ThemedScrollView>
      {Platform.OS === 'android' ?
        <Link href="/deadline/new" asChild>
          <ThemedIconButton
            icon="plus"
            style={styles.floatingActionButton}
            variant="primary"
            size="lg"
          />
        </Link> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    width: 56,
    height: 56,
    padding: 0,
    borderRadius: 28,
    elevation: 6,
    zIndex: 1000,
  },
  scrollContainer: {
    paddingBottom: 60,
  },
});
