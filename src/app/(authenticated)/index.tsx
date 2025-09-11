import { ActiveReads } from '@/components/features/deadlines';
import { Header } from '@/components/navigation';
import { ThemedScrollView } from '@/components/themed';
export default function HomeScreen() {
  return (
    <ThemedScrollView>
      <Header />
      <ActiveReads />
    </ThemedScrollView>
  );
}
