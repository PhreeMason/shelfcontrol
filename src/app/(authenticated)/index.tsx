import { ActiveReads } from '@/components/features/deadlines';
import { Header } from '@/components/navigation';
import { ThemedScrollView, ThemedView } from '@/components/themed';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView contentContainerStyle={styles.scrollContainer}>
        <Header />
        <ActiveReads />
      </ThemedScrollView>
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
});
