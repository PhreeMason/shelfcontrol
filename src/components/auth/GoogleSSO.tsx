import { supabase } from '@/lib/supabase'
import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
} from '@react-native-google-signin/google-signin'
import { StyleSheet, ViewStyle } from 'react-native'
import { ThemedView } from '@/components/themed'
import React, { useEffect, useState } from 'react'

interface GoogleSSOProps {
  buttonSize?: number;
  buttonColor?: 'dark' | 'light';
  style?: ViewStyle;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function GoogleSSO({ 
  buttonSize = GoogleSigninButton.Size.Wide,
  buttonColor = 'dark',
  style,
  onSuccess,
  onError
}: GoogleSSOProps) {
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const configureGoogleSignIn = () => {
      try {
        GoogleSignin.configure({
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
          // webClientId: '1054682825818-jav9m5bm3g7ph59amg9f6bup2oqkucgm.apps.googleusercontent.com',
          webClientId: '1592845961725-o3cl2fu1cb39hir9q6tsb1ro2t67hhhi.apps.googleusercontent.com',
        })
        setIsConfigured(true)
      } catch (error) {
        console.log('Google Sign-In configuration failed:', error)
        setIsConfigured(false)
      }
    }
    
    configureGoogleSignIn()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      
      console.log('Google userInfo:', JSON.stringify(userInfo, null, 2))
      
      if (userInfo.data?.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        })
        
        console.log('Supabase auth result:', JSON.stringify({ error, data }, null, 2))
        
        if (error) {
          console.error('Google sign-in error:', error)
          onError?.(error)
        } else {
          console.log('Google sign-in successful')
          onSuccess?.()
        }
      } else {
        const error = new Error('No ID token received from Google')
        console.error('Google sign-in error:', error)
        onError?.(error)
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Google sign-in canceled by user')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Google sign-in already in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('Play services not available or outdated')
        onError?.(new Error('Google Play Services not available'))
      } else {
        console.error('Google sign-in error:', error)
        onError?.(error)
      }
    }
  }

  if (isConfigured) {
    return (
      <ThemedView style={[styles.container, style]}>
        <GoogleSigninButton
          size={buttonSize}
          color={buttonColor}
          onPress={handleGoogleSignIn}
          style={styles.button}
        />
      </ThemedView>
    )
  }
  
  return null
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

export default GoogleSSO