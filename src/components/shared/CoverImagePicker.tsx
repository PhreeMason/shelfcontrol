import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Theme';
import { ALTERNATE_COVER_CONFIG } from '@/constants/database';
import { useTheme } from '@/hooks/useThemeColor';
import {
  getPreviewImageUri,
  isShowingDefaultImage,
} from '@/utils/coverImageUtils';
import { validateImageResult } from '@/utils/imageValidation';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CoverImagePickerProps {
  value?: string | null;
  onImageChange: (uri: string | null) => void;
  mode: 'upload' | 'url' | 'none';
  onModeChange: (mode: 'upload' | 'url' | 'none') => void;
  editable?: boolean;
  defaultPreviewUrl?: string | null;
}

const CoverImagePicker: React.FC<CoverImagePickerProps> = ({
  value,
  onImageChange,
  mode,
  onModeChange,
  editable = true,
  defaultPreviewUrl = null,
}) => {
  const { colors } = useTheme();
  const [isUrlInputFocused, setIsUrlInputFocused] = React.useState(false);

  // Helper to handle image result validation and update
  const handleImageResult = (result: ImagePicker.ImagePickerResult) => {
    const validation = validateImageResult(
      result,
      ALTERNATE_COVER_CONFIG.MAX_FILE_SIZE
    );

    if (validation.valid) {
      onImageChange(validation.uri);
    } else if (validation.error.type === 'FILE_TOO_LARGE') {
      Alert.alert('File Too Large', validation.error.message);
    }
    // Silently ignore SELECTION_CANCELED and other errors
  };

  const pickImage = async () => {
    if (!editable) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload a cover image.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
      mediaTypes: 'images',
    });

    handleImageResult(result);
  };

  const handleUrlChange = (text: string) => {
    onImageChange(text || null);
  };

  const handleClear = () => {
    onImageChange(null);
    onModeChange('none');
  };

  const handleUploadMode = () => {
    onModeChange('upload');
    pickImage();
  };

  const handleUrlMode = () => {
    onModeChange('url');
  };

  // Determine which image to show in the unified preview
  const previewImage = getPreviewImageUri(
    mode,
    value ?? null,
    defaultPreviewUrl
  );
  const showingDefault = isShowingDefaultImage(mode, defaultPreviewUrl);

  return (
    <View style={styles.container}>
      {/* Unified Preview Section */}
      {previewImage && (
        <View style={styles.previewSection}>
          <View style={styles.previewWrapper}>
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="cover"
              onError={
                mode === 'url'
                  ? () => {
                      Alert.alert(
                        'Invalid Image URL',
                        'The URL does not point to a valid image.'
                      );
                    }
                  : undefined
              }
            />
            {editable && !showingDefault && (
              <TouchableOpacity
                testID="remove-cover-image-button"
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                onPress={handleClear}
                accessibilityLabel="Remove cover image"
              >
                <IconSymbol name="xmark" size={16} color={colors.textInverse} />
              </TouchableOpacity>
            )}
          </View>
          {showingDefault && (
            <ThemedText
              color="textMuted"
              typography="bodySmall"
              style={styles.previewLabel}
            >
              Default Book Cover
            </ThemedText>
          )}
        </View>
      )}

      {/* Placeholder - Show when upload/url mode but no image selected */}
      {(mode === 'upload' || mode === 'url') && !value && (
        <View style={styles.uploadContainer}>
          <View style={styles.previewWrapper}>
            {mode === 'upload' ? (
              <TouchableOpacity
                testID="upload-placeholder"
                style={[
                  styles.uploadPlaceholder,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                onPress={pickImage}
                disabled={!editable}
                accessibilityLabel="Select cover image"
                accessibilityHint="Opens image picker to choose a photo"
              >
                <IconSymbol name="photo" size={48} color={colors.textMuted} />
                <ThemedText
                  typography="bodyMedium"
                  color="textMuted"
                  style={styles.placeholderText}
                >
                  Tap to select image
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.uploadPlaceholder,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
              >
                <IconSymbol name="link" size={48} color={colors.textMuted} />
                <ThemedText
                  typography="bodyMedium"
                  color="textMuted"
                  style={styles.placeholderText}
                >
                  Enter URL below
                </ThemedText>
              </View>
            )}
            {editable && (
              <TouchableOpacity
                testID={
                  mode === 'upload'
                    ? 'cancel-upload-button'
                    : 'cancel-url-button'
                }
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                onPress={handleClear}
                accessibilityLabel={
                  mode === 'upload' ? 'Cancel upload' : 'Cancel URL input'
                }
              >
                <IconSymbol name="xmark" size={16} color={colors.textInverse} />
              </TouchableOpacity>
            )}
          </View>
          {/* Spacer to match preview label height when showing default cover */}
          <View style={styles.previewLabelSpacer} />
        </View>
      )}

      {/* URL Mode - Input field */}
      {mode === 'url' && (
        <View style={styles.urlContainer}>
          <View style={styles.urlInputContainer}>
            <TextInput
              testID="cover-url-input"
              style={[
                styles.urlInput,
                {
                  backgroundColor: isUrlInputFocused
                    ? colors.surface
                    : colors.inputBlurBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={value || ''}
              onChangeText={handleUrlChange}
              onFocus={() => setIsUrlInputFocused(true)}
              onBlur={() => setIsUrlInputFocused(false)}
              placeholder="https://example.com/cover.jpg"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={editable}
              accessibilityLabel="Cover image URL"
              accessibilityHint="Enter the web address of the cover image"
            />
            {editable && value && (
              <TouchableOpacity
                testID="clear-url-button"
                style={styles.clearUrlButton}
                onPress={handleClear}
                accessibilityLabel="Clear URL"
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Mode Selection - Only visible when no mode selected */}
      {editable && mode === 'none' && (
        <View style={styles.modeSelection}>
          <TouchableOpacity
            testID="cover-image-upload-button"
            style={[
              styles.modeButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              Shadows.subtle,
            ]}
            onPress={handleUploadMode}
            accessibilityLabel="Upload cover image"
            accessibilityHint="Opens image picker to select a cover"
            accessibilityState={{ selected: false }}
          >
            <IconSymbol name="photo" size={24} color={colors.text} />
            <ThemedText
              typography="bodyMedium"
              color="text"
              style={styles.modeButtonText}
            >
              Upload Image
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            testID="cover-image-url-button"
            style={[
              styles.modeButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              Shadows.subtle,
            ]}
            onPress={handleUrlMode}
            accessibilityLabel="Provide cover image URL"
            accessibilityHint="Enter a web URL for the cover image"
            accessibilityState={{ selected: false }}
          >
            <IconSymbol name="link" size={24} color={colors.text} />
            <ThemedText
              typography="bodyMedium"
              color="text"
              style={styles.modeButtonText}
            >
              Provide URL
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  modeSelection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  modeButtonText: {
    textAlign: 'center',
  },
  // Unified preview section (centered, consistent sizing)
  previewSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  previewWrapper: {
    position: 'relative',
    width: Layout.COVER_IMAGE_PREVIEW_WIDTH,
    height: Layout.COVER_IMAGE_PREVIEW_HEIGHT,
  },
  previewImage: {
    width: Layout.COVER_IMAGE_PREVIEW_WIDTH,
    height: Layout.COVER_IMAGE_PREVIEW_HEIGHT,
    borderRadius: BorderRadius.md,
  },
  previewLabel: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  previewLabelSpacer: {
    height: 20, // Match previewLabel height (marginTop: 4px + lineHeight: 16px)
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: Layout.REMOVE_BUTTON_SIZE,
    height: Layout.REMOVE_BUTTON_SIZE,
    borderRadius: Layout.REMOVE_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Upload mode specific
  uploadContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: Spacing.md, // Match previewSection margins
  },
  uploadPlaceholder: {
    width: Layout.COVER_IMAGE_PREVIEW_WIDTH,
    height: Layout.COVER_IMAGE_PREVIEW_HEIGHT,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  placeholderText: {
    marginTop: Spacing.sm,
  },
  // URL mode specific
  urlContainer: {
    width: '100%',
    marginBottom: Spacing.md, // Match modeSelection marginBottom
  },
  urlInputContainer: {
    position: 'relative',
    width: '100%',
  },
  urlInput: {
    ...Typography.bodyLarge,
    borderWidth: 2,
    padding: 16,
    borderRadius: BorderRadius.lg,
    paddingRight: Layout.INPUT_ICON_OFFSET,
  },
  clearUrlButton: {
    position: 'absolute',
    right: Spacing.md,
    top: 16, // Align with input padding to center icon with text
  },
});

export default CoverImagePicker;
