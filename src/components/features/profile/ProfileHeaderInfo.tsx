import Avatar from '@/components/shared/Avatar';
import { ThemedText } from '@/components/themed';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProfileHeaderInfoProps {
  avatarUrl?: string | null | undefined;
  username: string;
  displayName?: string | null | undefined;
}

const ProfileHeaderInfo: React.FC<ProfileHeaderInfoProps> = ({
  avatarUrl,
  username,
  displayName,
}) => {
  return (
    <View testID='profile-header-info' style={styles.container}>
      <Avatar
        avatarUrl={avatarUrl}
        size={80}
        username={username}
        showIcon={true}
      />
      <View style={styles.textContainer}>
        <ThemedText style={styles.displayName}>{displayName}</ThemedText>
        <ThemedText style={styles.username}>@{username}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  username: {
    fontSize: 16,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});

export default ProfileHeaderInfo;
