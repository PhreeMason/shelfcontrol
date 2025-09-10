import { ActiveReads } from '@/components/features/deadlines';
import { Header } from '@/components/navigation';
import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerContent={<Header />}>
      <ActiveReads />
    </ParallaxScrollView>
  );
}
