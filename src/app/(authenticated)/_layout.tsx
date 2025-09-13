import { HapticTab } from '@/components/navigation/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session } = useAuth();
  const { colors } = useTheme();
  if (!session) {
    // If not signed in, don't render the tabs
    return <Redirect href="/(auth)/sign-in" />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        ...(TabBarBackground ? { tabBarBackground: TabBarBackground } : {}),
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-deadline"
        options={{
          tabBarIcon: () => <View style={[styles.newDeadlineButton, { backgroundColor: colors.primary }]}>
            <IconSymbol size={40} name="plus" color={colors.textOnPrimary} />
          </View>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  newDeadlineButton: {
    width: 70,
    height: 70,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  }
})