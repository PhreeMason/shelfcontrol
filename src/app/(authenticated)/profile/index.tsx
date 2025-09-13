import { CalendarLegend } from '@/components/features/deadlines/CalendarLegend';
import { DeadlineCalendar } from '@/components/features/deadlines/DeadlineCalendar';
import AppHeader from '@/components/shared/AppHeader';
import Avatar from '@/components/shared/Avatar';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useThemeColor';
import { useAuth } from '@/providers/AuthProvider';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
    const { profile, signOut, refreshProfile } = useAuth();
    const router = useRouter();
    const { colors } = useTheme();

    // Refresh profile when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [refreshProfile])
    );

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]
        );
    };

    const handleEditProfile = () => {
        router.push('/profile/edit');
    };

    const getDisplayName = () => {
        if (profile?.first_name || profile?.last_name) {
            return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
        }
        return null;
    };

    const editButton = (
        <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <IconSymbol name="pencil" size={20} color="white" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'bottom', 'left']}>
            <AppHeader 
                title="Profile"
                onBack={() => {}} // Not used since showBackButton is false
                rightElement={editButton}
                showBackButton={false}
            />
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <ThemedView style={styles.innerContainer}>

                <ThemedView style={styles.profileCard}>
                    <View style={styles.avatarSection}>
                        <Avatar 
                            avatarUrl={profile?.avatar_url}
                            size={120}
                            username={profile?.username}
                            showIcon={true}
                        />
                        <View style={styles.nameSection}>
                            <ThemedText style={styles.username}>
                                @{profile?.username || 'Unknown'}
                            </ThemedText>
                            {getDisplayName() && (
                                <ThemedText style={styles.displayName}>
                                    {getDisplayName()}
                                </ThemedText>
                            )}
                        </View>
                    </View>
                </ThemedView>

                <ThemedView style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <IconSymbol name="envelope" size={20} color="#666" />
                        <ThemedText style={styles.infoText}>
                            {profile?.email || 'No email provided'}
                        </ThemedText>
                    </View>

                    <View style={styles.infoItem}>
                        <IconSymbol name="calendar" size={20} color="#666" />
                        <ThemedText style={styles.infoText}>
                            Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                        </ThemedText>
                    </View>
                </ThemedView>

                <ThemedView style={styles.calendarSection}>
                    <ThemedText variant="title" style={styles.sectionTitle}>Your Deadlines</ThemedText>
                    <DeadlineCalendar />
                    <CalendarLegend />
                </ThemedView>

                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <IconSymbol name="arrow.right.square" size={20} color="#ff4444" />
                    <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
                </TouchableOpacity>
                </ThemedView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 50,
    },
    scrollContainer: {
        flex: 1,
    },
    innerContainer: {
        padding: 20,
    },
    editButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    profileCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        alignItems: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    nameSection: {
        alignItems: 'center',
        marginTop: 16,
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    displayName: {
        fontSize: 16,
        color: '#666',
    },
    infoSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 16,
        flex: 1,
    },
    linkText: {
        color: '#007AFF',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ff4444',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    signOutButtonText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: '600',
    },
    calendarSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 16,
        fontWeight: '600',
    },
});