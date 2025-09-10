import Avatar from '@/components/shared/Avatar';
import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/providers/AuthProvider';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function Profile() {
    const { profile, signOut, refreshProfile } = useAuth();
    const router = useRouter();

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

    const handleWebsitePress = () => {
        if (profile?.website) {
            Linking.openURL(profile.website);
        }
    };

    const getDisplayName = () => {
        if (profile?.first_name || profile?.last_name) {
            return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
        }
        return null;
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.innerContainer}>
                <ThemedText variant="headline" style={styles.title}>Profile</ThemedText>

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

                    <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                        <IconSymbol name="pencil" size={18} color="#007AFF" />
                        <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
                    </TouchableOpacity>
                </ThemedView>

                <ThemedView style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <IconSymbol name="envelope" size={20} color="#666" />
                        <ThemedText style={styles.infoText}>
                            {profile?.email || 'No email provided'}
                        </ThemedText>
                    </View>

                    {profile?.website && (
                        <TouchableOpacity style={styles.infoItem} onPress={handleWebsitePress}>
                            <IconSymbol name="link" size={20} color="#666" />
                            <ThemedText style={[styles.infoText, styles.linkText]}>
                                {profile.website}
                            </ThemedText>
                        </TouchableOpacity>
                    )}

                    <View style={styles.infoItem}>
                        <IconSymbol name="calendar" size={20} color="#666" />
                        <ThemedText style={styles.infoText}>
                            Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                        </ThemedText>
                    </View>
                </ThemedView>

                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <IconSymbol name="arrow.right.square" size={20} color="#ff4444" />
                    <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 38,
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
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF15',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    editButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
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
});