import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAvatarPath, useAvatarSignedUrl } from '@/hooks/useProfile';
import { useAuth } from '@/providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const isExternalUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

interface AvatarProps {
  avatarUrl?: string | null | undefined;
  size?: number;
  editable?: boolean;
  onImageChange?: (uri: string) => void;
  username?: string | null | undefined;
  newImageUri?: string | null;
  showIcon?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  avatarUrl,
  size = 100,
  editable = false,
  onImageChange,
  username,
  newImageUri,
  showIcon = false,
}) => {
  const { session } = useAuth();

  const isAvatarUrlExternal = isExternalUrl(avatarUrl);

  const shouldFetchUserAvatar =
    !newImageUri && !avatarUrl && !!session?.user?.id;
  const { data: userAvatarPath } = useAvatarPath(
    shouldFetchUserAvatar ? session?.user?.id : undefined
  );

  const avatarPathToConvert = isAvatarUrlExternal
    ? null
    : avatarUrl || userAvatarPath;
  const { data: signedUrl } = useAvatarSignedUrl(
    !newImageUri ? avatarPathToConvert : null
  );

  const displayUrl = useMemo(() => {
    if (newImageUri) return newImageUri;
    if (isAvatarUrlExternal) return avatarUrl;
    if (signedUrl) return signedUrl;
    return null;
  }, [newImageUri, isAvatarUrlExternal, avatarUrl, signedUrl]);
  const pickImage = async () => {
    if (!editable || !onImageChange) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to change your profile picture.'
      );
      return;
    }

    Alert.alert('Change Profile Picture', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => openCamera() },
      { text: 'Choose from Library', onPress: () => openImageLibrary() },
    ]);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to take a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onImageChange?.(result.assets[0].uri);
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onImageChange?.(result.assets[0].uri);
    }
  };

  const getInitials = () => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size / 2 },
  ];

  const content = displayUrl ? (
    <Image
      source={{ uri: displayUrl }}
      style={[
        styles.image,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      resizeMode="cover"
    />
  ) : (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {showIcon ? (
        <IconSymbol name="person.fill" size={size * 0.5} color="#fff" />
      ) : (
        <ThemedText style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials()}
        </ThemedText>
      )}
    </View>
  );

  if (editable) {
    return (
      <TouchableOpacity onPress={pickImage} style={containerStyle}>
        {content}
        <View style={styles.editOverlay}>
          <IconSymbol name="camera.fill" size={size * 0.25} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
});

export default Avatar;
