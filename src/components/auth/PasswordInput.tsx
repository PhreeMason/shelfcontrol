import { useTheme } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  style?: any;
  ref?: React.Ref<TextInput>;
}

export function PasswordInput({ style, ref, ...props }: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { colors } = useTheme();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        ref={ref}
        style={[
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
          },
          styles.input,
          style,
        ]}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
        autoComplete="current-password"
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={togglePasswordVisibility}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: '100%',
  },
});
