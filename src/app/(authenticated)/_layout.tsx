import { HapticTab } from '@/components/navigation/HapticTab';
import Avatar from '@/components/shared/Avatar';
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
  const { session, profile } = useAuth();
  const { colors } = useTheme();
  if (!session) {
    // If not signed in, don't render the tabs
    return <Redirect href="/(auth)/sign-in" />;
  }

  const HomeTabButton = (props: any) => (
    <HapticTab {...props} testID="home-tab" />
  );
  const ProfileTabButton = (props: any) => (
    <HapticTab {...props} testID="profile-tab" />
  );
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        ...(TabBarBackground ? { tabBarBackground: TabBarBackground } : {}),
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
          tabBarButton: HomeTabButton,
        }}
      />
      <Tabs.Screen
        name="new-deadline"
        options={{
          tabBarIcon: () => (
            <View
              style={[
                styles.newDeadlineButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <IconSymbol size={40} name="plus" color={colors.textOnPrimary} />
            </View>
          ),
          href: Platform.OS === 'android' ? null : '/new-deadline',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.profileIconContainer,
                focused && {
                  borderWidth: 2,
                  borderColor: Colors[colorScheme ?? 'light'].tint,
                },
              ]}
            >
              <Avatar
                avatarUrl={profile?.avatar_url}
                username={profile?.username}
                size={24}
                showIcon={true}
                editable={false}
              />
            </View>
          ),
          tabBarButton: ProfileTabButton,
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
  },
  profileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
