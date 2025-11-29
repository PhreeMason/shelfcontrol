import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="appearance"
        options={{ title: 'Display & Appearance' }}
      />
      <Stack.Screen name="reading" options={{ title: 'Reading Preferences' }} />
      <Stack.Screen name="updates" options={{ title: 'App Updates' }} />
      <Stack.Screen name="data" options={{ title: 'Data & Privacy' }} />
      <Stack.Screen name="about" options={{ title: 'About & Support' }} />
      <Stack.Screen name="webview" options={{ title: 'Web View' }} />
    </Stack>
  );
}
