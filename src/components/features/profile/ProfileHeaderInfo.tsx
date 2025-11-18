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
    <View testID="profile-header-info" style={styles.container}>
      <Avatar
        avatarUrl={avatarUrl}
        size={80}
        username={username}
        showIcon={true}
      />
      <View style={styles.textContainer}>
        <ThemedText typography="titleLarge" color="textInverse">
          {displayName}
        </ThemedText>
        <ThemedText variant="default" color="textInverse" style={styles.username}>
          @{username}
        </ThemedText>
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
  username: {
    opacity: 0.85,
  },
});

export default ProfileHeaderInfo;
