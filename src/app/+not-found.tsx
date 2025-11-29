import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { Spacing } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText variant="headline">This screen does not exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText
            variant="default"
            style={{ textDecorationLine: 'underline' }}
          >
            Go to home screen!
          </ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  link: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
});
