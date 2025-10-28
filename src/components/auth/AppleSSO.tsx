import { ThemedView } from '@/components/themed';
import { analytics } from '@/lib/analytics/client';
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
        } catch (error) {
          console.log('Apple Authentication not available:', error);
          setIsAvailable(false);
        }
      }
    };

    checkAvailability();
  }, []);
  const handleAppleSignIn = async () => {
    try {
      analytics.track('apple_sso_started');

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

      console.log('Apple credential:', JSON.stringify(credential, null, 2));

      const appleUserData = {
        email: credential.email,
        fullName: credential.fullName,
      };

      console.log(
        'Extracted Apple user data:',
        JSON.stringify(appleUserData, null, 2)
      );

      if (credential.identityToken) {
        const { user } = await authService.signInWithApple({
          identityToken: credential.identityToken,
        });

        console.log('Apple sign-in result:', JSON.stringify({ user }, null, 2));

        if (user) {
          console.log('Apple sign-in successful');

          try {
            const profileUpdateResult =
              await updateProfileFromApple(appleUserData);
            console.log(
              'Profile update result:',
              JSON.stringify(profileUpdateResult, null, 2)
            );
          } catch (profileError) {
            console.error(
              'Error updating profile from Apple data:',
              profileError
            );
          }

          analytics.track('apple_sso_completed');
          onSuccess?.();
        }
      } else {
        const error = new Error('No identity token received from Apple');
        console.error('Apple sign-in error:', error);
        analytics.track('apple_sso_failed', {
          error_message: 'No identity token received',
        });
        onError?.(error);
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple sign-in canceled by user');
        analytics.track('apple_sso_cancelled');
      } else {
        console.error('Apple sign-in error:', e);
        analytics.track('apple_sso_failed', {
          error_message: e.message || 'Unknown error',
        });
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
