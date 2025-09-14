import { ThemedView } from '@/components/themed'
import { authService } from '@/services'
import { useAuth } from '@/providers/AuthProvider'
import * as AppleAuthentication from 'expo-apple-authentication'
import React, { useEffect, useState } from 'react'
import { Platform, StyleSheet, ViewStyle } from 'react-native'

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
  onError
}: AppleSSOProps) {
  const [isAvailable, setIsAvailable] = useState(false)
  const { updateProfileFromApple } = useAuth()

  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync()
          setIsAvailable(available)
        } catch (error) {
          console.log('Apple Authentication not available:', error)
          setIsAvailable(false)
        }
      }
    }
    
    checkAvailability()
  }, [])
  const handleAppleSignIn = async () => {
    try {
      // Double-check availability before attempting sign in
      const available = await AppleAuthentication.isAvailableAsync()
      if (!available) {
        throw new Error('Apple Authentication not available')
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      
      console.log('Apple credential:', JSON.stringify(credential, null, 2))
      
      // Extract real user data from Apple credential
      const appleUserData = {
        email: credential.email,
        fullName: credential.fullName
      }
      
      console.log('Extracted Apple user data:', JSON.stringify(appleUserData, null, 2))
      
      if (credential.identityToken) {
        const { user } = await authService.signInWithApple({
          identityToken: credential.identityToken,
        })
        
        console.log('Apple sign-in result:', JSON.stringify({ user }, null, 2))

        if (user) {
          console.log('Apple sign-in successful')

          // Update profile with real Apple data after successful authentication
          try {
            const profileUpdateResult = await updateProfileFromApple(appleUserData)
            console.log('Profile update result:', JSON.stringify(profileUpdateResult, null, 2))
          } catch (profileError) {
            console.error('Error updating profile from Apple data:', profileError)
            // Don't fail the entire sign-in process if profile update fails
          }

          onSuccess?.()
        }
      } else {
        const error = new Error('No identity token received from Apple')
        console.error('Apple sign-in error:', error)
        onError?.(error)
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow - don't show error
        console.log('Apple sign-in canceled by user')
      } else {
        console.error('Apple sign-in error:', e)
        onError?.(e)
      }
    }
  }

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
    )
  }
  
  return null // No Apple authentication on Android
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
})

export default AppleSSO