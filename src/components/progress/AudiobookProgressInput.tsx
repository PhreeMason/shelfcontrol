import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '../themed';

interface AudiobookProgressInputProps {
  value: number; // Always in minutes
  onChange: (minutes: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  testID?: string;
}

/**
 * Parse various audiobook time formats into minutes
 * Handles formats like:
 * - "3h 2m", "3H 2M", "3h2m"
 * - "03h 02m", "3h 02m"
 * - "3:02", "03:02:15" (ignores seconds)
 * - "3.5h", "2,5h"
 * - "3 hours 2 minutes", "3 hr 2 min"
 * - "45m", "45" (plain number assumes minutes)
 */
export function parseAudiobookTime(input: string): number | null {
  if (typeof input !== 'string') return null;
  
  // Remove extra spaces and trim
  const normalized = input.toString().replace(/\s+/g, ' ').trim();
  
  if (!normalized) return 0;
  
  // Try colon format first (e.g., "3:02", "03:02:15")
  const colonMatch = normalized.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1]) || 0;
    const minutes = parseInt(colonMatch[2]) || 0;
    // Ignore seconds (colonMatch[3]) - round down
    return hours * 60 + minutes;
  }
  
  // Try decimal hours (e.g., "2.5h", "2,5h")
  const decimalHoursMatch = normalized.match(/^(\d+)[.,](\d+)\s*h(?:ours?)?$/i);
  if (decimalHoursMatch) {
    const hours = parseInt(decimalHoursMatch[1]) || 0;
    const decimal = parseInt(decimalHoursMatch[2]) || 0;
    // Convert decimal to fraction (e.g., .5 = 30 minutes)
    const decimalPlaces = decimalHoursMatch[2].length;
    const fraction = decimal / Math.pow(10, decimalPlaces);
    return Math.floor(hours * 60 + fraction * 60);
  }
  
  // Try hours and minutes format
  // This regex handles: "3h 2m", "3 hours 2 minutes", "3hr 2min", etc.
  const hoursAndMinutesMatch = normalized.match(
    /^(\d+)\s*(?:h|hours?|hrs?)\s*(?:(\d+)\s*(?:m|minutes?|mins?))?$/i
  );
  
  if (hoursAndMinutesMatch) {
    const hours = parseInt(hoursAndMinutesMatch[1]) || 0;
    const minutes = parseInt(hoursAndMinutesMatch[2]) || 0;
    return hours * 60 + minutes;
  }
  
  // Try minutes only format (e.g., "45m", "45 minutes")
  const minutesOnlyMatch = normalized.match(/^(\d+)\s*(?:m|minutes?|mins?)$/i);
  if (minutesOnlyMatch) {
    return parseInt(minutesOnlyMatch[1]) || 0;
  }
  
  // Try plain number (assume minutes for audiobooks)
  const plainNumberMatch = normalized.match(/^(\d+)$/);
  if (plainNumberMatch) {
    return parseInt(plainNumberMatch[1]) || 0;
  }
  
  // If no pattern matches, return null (invalid)
  return null;
}

/**
 * Format minutes into a user-friendly display string
 */
export function formatAudiobookTime(minutes: number): string {
  if (!minutes || minutes < 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const AudiobookProgressInput: React.FC<AudiobookProgressInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "e.g., 3h 2m or 3:02",
  testID
}) => {
  const textMuted = useThemeColor({}, 'textMuted');
  const background = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const displayValueRef = useRef(displayValue);
  
  // Keep ref in sync with state
  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);
  
  // Update display when value prop changes
  useEffect(() => {
    const formattedValue = formatAudiobookTime(value);
    
    if (!isFocused) {
      // When not focused, always update to the formatted value
      setDisplayValue(formattedValue);
    } else {
      // When focused, only update if the current display value doesn't parse to the same value
      // This allows quick actions to work while preserving user input during typing
      const currentParsed = parseAudiobookTime(displayValueRef.current);
      if (currentParsed !== value) {
        setDisplayValue(formattedValue);
      }
    }
  }, [value, isFocused]);
  
  const handleChangeText = (text: string) => {
    setDisplayValue(text);
    
    // Parse in real-time to show validation
    const parsed = parseAudiobookTime(text);
    setIsValid(parsed !== null);
    
    // Only update parent if valid
    if (parsed !== null) {
      onChange(parsed);
    }
  };
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    
    // Parse and validate
    const parsed = parseAudiobookTime(displayValue);
    
    if (parsed !== null) {
      // Update with parsed value
      onChange(parsed);
      // Format for display
      setDisplayValue(formatAudiobookTime(parsed));
      setIsValid(true);
    } else if (displayValue.trim() === '') {
      // Empty is valid (0 minutes)
      onChange(0);
      setDisplayValue('0m');
      setIsValid(true);
    } else {
      // Invalid input - restore previous valid value
      setDisplayValue(formatAudiobookTime(value));
      setIsValid(true);
    }
    
    onBlur?.();
  };
  
  return (
    <View style={styles.container}>
      <TextInput
        testID={testID}
        value={displayValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={textMuted}
        style={[
          styles.input,
          {
            backgroundColor: background,
            color: primary,
            borderColor: isValid ? border : danger,
            borderWidth: isValid ? 1 : 2,
          }
        ]}
      />
      {!isValid && isFocused && (
        <ThemedText variant="muted" style={[styles.helpText, { color: danger }]}>
          Use formats like: 3h 2m, 3:02, or 45m
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 8,
  },
});

export default AudiobookProgressInput;