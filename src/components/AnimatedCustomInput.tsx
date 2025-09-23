import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedCustomInputProps extends Omit<TextInputProps, 'onFocus' | 'onBlur' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelColor?: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  renderPasswordToggle?: () => React.ReactNode;
}

export interface AnimatedCustomInputRef {
  focus: () => void;
  blur: () => void;
}

export const AnimatedCustomInput = forwardRef<AnimatedCustomInputRef, AnimatedCustomInputProps>(
  (
    {
      label,
      value,
      onChangeText,
      onBlur,
      onFocus,
      containerStyle,
      inputStyle = {},
      labelColor = '#666',
      secureTextEntry = false,
      showPasswordToggle = false,
      renderPasswordToggle,
      ...textInputProps
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const labelAnimation = useSharedValue(0);
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      },
    }));

    const animatedLabelStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(
              labelAnimation.value,
              [0, 1],
              [18, -20]
            ),
          },
          {
            translateX: interpolate(
              labelAnimation.value,
              [0, 1],
              [16, 0]
            ),
          },
          {
            scale: interpolate(
              labelAnimation.value,
              [0, 1],
              [1, 0.85]
            ),
          },
        ],
        zIndex: 1,
        fontSize: interpolate(
          labelAnimation.value,
          [0, 1],
          [16, 14]
        ),
      };
    });

    const handleFocus = () => {
      setIsFocused(true);
      labelAnimation.value = withTiming(1, { duration: 200 });
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (!value) {
        labelAnimation.value = withTiming(0, { duration: 200 });
      }
      onBlur?.();
    };

    const handlePressContainer = () => {
      inputRef.current?.focus();
    };

    React.useEffect(() => {
      if (value && !isFocused) {
        labelAnimation.value = withTiming(1, { duration: 200 });
      }
    }, [value]);

    return (
      <Pressable onPress={handlePressContainer}>
        <View style={[styles.container, containerStyle]}>
          <Animated.Text style={[styles.label, { color: labelColor }, animatedLabelStyle]}>
            {label}
          </Animated.Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[styles.input, inputStyle, secureTextEntry && styles.secureInput]}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={isSecure}
              placeholderTextColor="#999"
              {...textInputProps}
            />
            {showPasswordToggle && secureTextEntry && (
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setIsSecure(!isSecure)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 20 }}>
                  {isSecure ? '👁' : '👁‍🗨'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    );
  }
);

AnimatedCustomInput.displayName = 'AnimatedCustomInput';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 60,
  },
  inputWrapper: {
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  secureInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
});