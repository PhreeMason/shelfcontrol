import { ActiveReads } from '@/components/features/deadlines';
import { Header } from '@/components/navigation';
import { ThemedScrollView, ThemedView } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView contentContainerStyle={styles.scrollContainer}>
        <Header />
        <ActiveReads />
      </ThemedScrollView>
      <Link href="/deadline/new" asChild>
        <ThemedIconButton
          icon="plus"
          style={styles.floatingActionButton}
          variant="primary"
          size="lg"
        />
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 90,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
});
