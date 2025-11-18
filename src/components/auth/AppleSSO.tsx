import { ThemedView } from '@/components/themed';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, ViewStyle } from 'react-native';

interface AppleSSOProps {
  buttonType?: AppleAuthentication.AppleAuthenticationButtonType;
  style?: ViewStyle;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function AppleSSO({
  buttonType = AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
  style,
  onSuccess,
  onError,
}: AppleSSOProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const { updateProfileFromApple } = useAuth();

  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAvailable(available);
        } catch {
          setIsAvailable(false);
        }
      }
    };

    checkAvailability();
  }, []);
  const handleAppleSignIn = async () => {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        throw new Error('Apple Authentication not available');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const appleUserData = {
        email: credential.email,
        fullName: credential.fullName,
      };

      if (credential.identityToken) {
        const { user } = await authService.signInWithApple({
          identityToken: credential.identityToken,
        });

        if (user) {
          try {
            await updateProfileFromApple(appleUserData);
          } catch (profileError) {
            console.error(
              'Error updating profile from Apple data:',
              profileError
            );
          }

          onSuccess?.();
        }
      } else {
        const error = new Error('No identity token received from Apple');
        console.error('Apple sign-in error:', error);
        onError?.(error);
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled sign-in
      } else {
        console.error('Apple sign-in error:', e);
        onError?.(e);
      }
    }
  };

  if (isAvailable) {
    return (
      <ThemedView style={[styles.container, style]}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={buttonType}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.button}
          onPress={handleAppleSignIn}
        />
      </ThemedView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
  },
});

export default AppleSSO;
