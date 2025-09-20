import { FilteredDeadlines } from '@/components/features/deadlines';
import { Header } from '@/components/navigation';
import { ThemedScrollView, ThemedView } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ThemedView style={[styles.container]}>
      <LinearGradient
        colors={['#E8C2B9', '#ccafc9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: Math.max(insets.top, 10) }}
      />
      <ThemedScrollView contentContainerStyle={styles.scrollContainer}>
        <Header />
        <FilteredDeadlines />
      </ThemedScrollView>
      {Platform.OS === 'android' ? (
        <Link href="/deadline/new" asChild>
          <ThemedIconButton
            icon="plus"
            style={styles.floatingActionButton}
            variant="primary"
            size="lg"
          />
        </Link>
      ) : null}
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
