import { HapticTab } from '@/components/navigation/HapticTab';
import Avatar from '@/components/shared/Avatar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { analytics } from '@/lib/analytics/client';
import { useAuth } from '@/providers/AuthProvider';
import { Redirect, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { session, profile } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();
  const prevPathnameRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    analytics.track('session_started');
  }, []);

  React.useEffect(() => {
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      const getTabName = (path: string) => {
        if (path === '/' || path === '') return 'home';
        if (path.includes('stats')) return 'stats';
        if (path.includes('new-deadline')) return 'new_deadline';
        if (path.includes('calendar')) return 'calendar';
        if (path.includes('profile')) return 'profile';
        return path.replace(/^\//, '');
      };

      analytics.track('tab_switched', {
        from_tab: getTabName(prevPathnameRef.current),
        to_tab: getTabName(pathname),
      });
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  if (!session) {
    return <Redirect href="/(auth)/sign-up" />;
  }

  const HomeTabButton = (props: any) => (
    <HapticTab {...props} testID="home-tab" />
  );
  const CalendarTabButton = (props: any) => (
    <HapticTab {...props} testID="calendar-tab" />
  );
  const StatsTabButton = (props: any) => (
    <HapticTab {...props} testID="stats-tab" />
  );
  const ProfileTabButton = (props: any) => (
    <HapticTab {...props} testID="profile-tab" />
  );
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors['light'].tint,
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
        name="calendar"
        options={{
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
          tabBarButton: CalendarTabButton,
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
        name="stats"
        options={{
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
          tabBarButton: StatsTabButton,
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
                  borderColor: Colors['light'].tint,
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
