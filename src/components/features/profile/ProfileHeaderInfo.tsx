import Avatar from '@/components/shared/Avatar';
import { ThemedText } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProfileHeaderInfoProps {
  avatarUrl?: string | null | undefined;
  username: string;
  email?: string | null | undefined;
  joinedDate?: string | null | undefined;
  rightElement?: React.ReactNode;
}

const ProfileHeaderInfo: React.FC<ProfileHeaderInfoProps> = ({
  avatarUrl,
  username,
  email,
  joinedDate,
  rightElement,
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
          @{username}
        </ThemedText>
        {email && (
          <ThemedText
            typography="bodyMedium"
            color="textInverse"
            style={styles.secondaryText}
          >
            {email}
          </ThemedText>
        )}
        {joinedDate && (
          <ThemedText
            typography="bodySmall"
            color="textInverse"
            style={styles.tertiaryText}
          >
            Joined {joinedDate}
          </ThemedText>
        )}
      </View>
      {rightElement}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  secondaryText: {
    opacity: 0.85,
  },
  tertiaryText: {
    opacity: 0.7,
  },
});

export default ProfileHeaderInfo;
