import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CoverImagePicker from '../CoverImagePicker';
import { ALTERNATE_COVER_CONFIG } from '@/constants/database';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

// Mock Alert
const mockAlert = jest.fn();
Alert.alert = mockAlert;

jest.mock('@/components/themed', () => ({
  ThemedText: function MockThemedText({ children, color, style }: any) {
    const React = require('react');
    return React.createElement(
      'Text',
      {
        testID: `themed-text-${color}`,
        style,
      },
      children
    );
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: function MockIconSymbol({ name }: any) {
    const React = require('react');
    return React.createElement('View', {
      testID: `icon-${name}`,
      accessibilityLabel: name,
    });
  },
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      text: '#000000',
      textInverse: '#FFFFFF',
      textMuted: '#888888',
      textSecondary: '#666666',
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      border: '#CCCCCC',
      error: '#FF0000',
      primary: '#B8A9D9',
    },
  })),
}));

describe('CoverImagePicker', () => {
  const mockOnImageChange = jest.fn();
  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
  });

  describe('Component Structure', () => {
    it('should render mode selection when mode is none', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      expect(screen.getByTestId('cover-image-upload-button')).toBeTruthy();
      expect(screen.getByTestId('cover-image-url-button')).toBeTruthy();
    });

    it('should hide mode selection buttons when in upload or url mode', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      // Buttons should be hidden when in a specific mode
      expect(screen.queryByTestId('cover-image-upload-button')).toBeNull();
      expect(screen.queryByTestId('cover-image-url-button')).toBeNull();
    });

    it('should not render mode selection when not editable', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={false}
        />
      );

      expect(screen.queryByTestId('cover-image-upload-button')).toBeNull();
      expect(screen.queryByTestId('cover-image-url-button')).toBeNull();
    });
  });

  describe('Mode Selection', () => {
    it('should call onModeChange and pickImage when upload button is pressed', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const uploadButton = screen.getByTestId('cover-image-upload-button');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockOnModeChange).toHaveBeenCalledWith('upload');
        expect(
          ImagePicker.requestMediaLibraryPermissionsAsync
        ).toHaveBeenCalled();
      });
    });

    it('should call onModeChange when URL button is pressed', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const urlButton = screen.getByTestId('cover-image-url-button');
      fireEvent.press(urlButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('url');
    });
  });

  describe('Upload Mode', () => {
    it('should render upload placeholder when no image is selected', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      expect(screen.getByTestId('upload-placeholder')).toBeTruthy();
      expect(screen.getByText('Tap to select image')).toBeTruthy();
    });

    it('should render preview when image is selected', () => {
      render(
        <CoverImagePicker
          value="file:///path/to/image.jpg"
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      expect(screen.queryByTestId('upload-placeholder')).toBeNull();
      expect(screen.getByTestId('remove-cover-image-button')).toBeTruthy();
    });

    it('should not render remove button when not editable', () => {
      render(
        <CoverImagePicker
          value="file:///path/to/image.jpg"
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={false}
        />
      );

      expect(screen.queryByTestId('remove-cover-image-button')).toBeNull();
    });

    it('should call onImageChange and onModeChange when remove button is pressed', () => {
      render(
        <CoverImagePicker
          value="file:///path/to/image.jpg"
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const removeButton = screen.getByTestId('remove-cover-image-button');
      fireEvent.press(removeButton);

      expect(mockOnImageChange).toHaveBeenCalledWith(null);
      expect(mockOnModeChange).toHaveBeenCalledWith('none');
    });
  });

  describe('Image Picker Permissions', () => {
    it('should show alert when media library permission is denied', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: false,
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          'Please allow access to your photo library to upload a cover image.'
        );
      });
    });

    it('should show alert when camera permission is denied', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: false,
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate user choosing "Take Photo"
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Add Cover Image'
      );
      expect(alertCall).toBeTruthy();
      const takePhotoButton = alertCall[2].find(
        (btn: any) => btn.text === 'Take Photo'
      );
      await takePhotoButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          'Please allow camera access to take a photo.'
        );
      });
    });

    it('should show image picker options when permission is granted', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Add Cover Image',
          'Choose an option',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel' }),
            expect.objectContaining({ text: 'Take Photo' }),
            expect.objectContaining({ text: 'Choose from Library' }),
          ])
        );
      });
    });
  });

  describe('Image Selection', () => {
    it('should call onImageChange when valid image is selected from library', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file:///path/to/selected/image.jpg',
            fileSize: 2 * 1024 * 1024, // 2MB
          },
        ],
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate user choosing "Choose from Library"
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Add Cover Image'
      );
      const chooseButton = alertCall[2].find(
        (btn: any) => btn.text === 'Choose from Library'
      );
      await chooseButton.onPress();

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          allowsEditing: true,
          aspect: [2, 3],
          quality: 0.7,
          mediaTypes: 'images',
        });
        expect(mockOnImageChange).toHaveBeenCalledWith(
          'file:///path/to/selected/image.jpg'
        );
      });
    });

    it('should call onImageChange when valid image is captured from camera', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (
        ImagePicker.requestCameraPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file:///path/to/captured/photo.jpg',
            fileSize: 3 * 1024 * 1024, // 3MB
          },
        ],
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate user choosing "Take Photo"
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Add Cover Image'
      );
      const takePhotoButton = alertCall[2].find(
        (btn: any) => btn.text === 'Take Photo'
      );
      await takePhotoButton.onPress();

      await waitFor(() => {
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
          allowsEditing: true,
          aspect: [2, 3],
          quality: 0.7,
        });
        expect(mockOnImageChange).toHaveBeenCalledWith(
          'file:///path/to/captured/photo.jpg'
        );
      });
    });

    it('should not call onImageChange when image selection is canceled', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Add Cover Image'
      );
      const chooseButton = alertCall[2].find(
        (btn: any) => btn.text === 'Choose from Library'
      );
      await chooseButton.onPress();

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
        expect(mockOnImageChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('File Size Validation', () => {
    it('should show alert when selected image exceeds max file size', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file:///path/to/large/image.jpg',
            fileSize: 6 * 1024 * 1024, // 6MB (exceeds 5MB limit)
          },
        ],
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Add Cover Image'
      );
      const chooseButton = alertCall[2].find(
        (btn: any) => btn.text === 'Choose from Library'
      );
      await chooseButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'File Too Large',
          'Please select an image smaller than 5MB.'
        );
        expect(mockOnImageChange).not.toHaveBeenCalled();
      });
    });

    it('should handle images at exactly the max file size', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file:///path/to/max/image.jpg',
            fileSize: ALTERNATE_COVER_CONFIG.MAX_FILE_SIZE, // Exactly 5MB
          },
        ],
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Add Cover Image'
      );
      const chooseButton = alertCall[2].find(
        (btn: any) => btn.text === 'Choose from Library'
      );
      await chooseButton.onPress();

      await waitFor(() => {
        expect(mockOnImageChange).toHaveBeenCalledWith(
          'file:///path/to/max/image.jpg'
        );
      });
    });

    it('should handle images with undefined fileSize', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file:///path/to/image.jpg',
            fileSize: undefined,
          },
        ],
      });

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Add Cover Image'
      );
      const chooseButton = alertCall[2].find(
        (btn: any) => btn.text === 'Choose from Library'
      );
      await chooseButton.onPress();

      await waitFor(() => {
        // fileSize defaults to 0, which should pass validation
        expect(mockOnImageChange).toHaveBeenCalledWith(
          'file:///path/to/image.jpg'
        );
      });
    });
  });

  describe('URL Mode', () => {
    it('should render URL input when mode is url', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      expect(screen.getByTestId('cover-url-input')).toBeTruthy();
    });

    it('should call onImageChange when URL text changes', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const input = screen.getByTestId('cover-url-input');
      fireEvent.changeText(input, 'https://example.com/cover.jpg');

      expect(mockOnImageChange).toHaveBeenCalledWith(
        'https://example.com/cover.jpg'
      );
    });

    it('should call onImageChange with null when URL is cleared', () => {
      render(
        <CoverImagePicker
          value="https://example.com/cover.jpg"
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const input = screen.getByTestId('cover-url-input');
      fireEvent.changeText(input, '');

      expect(mockOnImageChange).toHaveBeenCalledWith(null);
    });

    it('should render clear button when URL is not empty', () => {
      render(
        <CoverImagePicker
          value="https://example.com/cover.jpg"
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      expect(screen.getByTestId('clear-url-button')).toBeTruthy();
    });

    it('should not render clear button when URL is empty', () => {
      render(
        <CoverImagePicker
          value=""
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      expect(screen.queryByTestId('clear-url-button')).toBeNull();
    });

    it('should call onImageChange and onModeChange when clear button is pressed', () => {
      render(
        <CoverImagePicker
          value="https://example.com/cover.jpg"
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const clearButton = screen.getByTestId('clear-url-button');
      fireEvent.press(clearButton);

      expect(mockOnImageChange).toHaveBeenCalledWith(null);
      expect(mockOnModeChange).toHaveBeenCalledWith('none');
    });

    it('should render URL preview when valid URL is provided', () => {
      render(
        <CoverImagePicker
          value="https://example.com/cover.jpg"
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const images = screen.UNSAFE_getAllByType('Image' as any);
      expect(images.length).toBeGreaterThan(0);
      expect(images[0].props.source.uri).toBe('https://example.com/cover.jpg');
    });

    it('should not be editable when editable prop is false', () => {
      render(
        <CoverImagePicker
          value="https://example.com/cover.jpg"
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={false}
        />
      );

      const input = screen.getByTestId('cover-url-input');
      expect(input.props.editable).toBe(false);
      expect(screen.queryByTestId('clear-url-button')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have correct accessibility labels for upload button', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const uploadButton = screen.getByTestId('cover-image-upload-button');
      expect(uploadButton.props.accessibilityLabel).toBe('Upload cover image');
      expect(uploadButton.props.accessibilityHint).toBe(
        'Opens image picker to select a cover'
      );
    });

    it('should have correct accessibility labels for URL button', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const urlButton = screen.getByTestId('cover-image-url-button');
      expect(urlButton.props.accessibilityLabel).toBe(
        'Provide cover image URL'
      );
      expect(urlButton.props.accessibilityHint).toBe(
        'Enter a web URL for the cover image'
      );
    });

    it('should have correct accessibility labels for remove button', () => {
      render(
        <CoverImagePicker
          value="file:///path/to/image.jpg"
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const removeButton = screen.getByTestId('remove-cover-image-button');
      expect(removeButton.props.accessibilityLabel).toBe('Remove cover image');
    });

    it('should have correct accessibility labels for upload placeholder', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      expect(placeholder.props.accessibilityLabel).toBe('Select cover image');
      expect(placeholder.props.accessibilityHint).toBe(
        'Opens image picker to choose a photo'
      );
    });

    it('should have correct accessibility labels for URL input', () => {
      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const input = screen.getByTestId('cover-url-input');
      expect(input.props.accessibilityLabel).toBe('Cover image URL');
      expect(input.props.accessibilityHint).toBe(
        'Enter the web address of the cover image'
      );
    });

    it('should have correct accessibility label for clear URL button', () => {
      render(
        <CoverImagePicker
          value="https://example.com/cover.jpg"
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const clearButton = screen.getByTestId('clear-url-button');
      expect(clearButton.props.accessibilityLabel).toBe('Clear URL');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid mode changes', () => {
      const { rerender } = render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      rerender(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      rerender(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      rerender(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="none"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      expect(screen.getByTestId('cover-image-upload-button')).toBeTruthy();
    });

    it('should handle switching from upload to URL with existing value', () => {
      const { rerender } = render(
        <CoverImagePicker
          value="file:///path/to/image.jpg"
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      rerender(
        <CoverImagePicker
          value="https://example.com/cover.jpg"
          onImageChange={mockOnImageChange}
          mode="url"
          onModeChange={mockOnModeChange}
          editable={true}
        />
      );

      const input = screen.getByTestId('cover-url-input');
      expect(input.props.value).toBe('https://example.com/cover.jpg');
    });

    it('should not trigger pickImage when not editable', async () => {
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockClear();

      render(
        <CoverImagePicker
          value={null}
          onImageChange={mockOnImageChange}
          mode="upload"
          onModeChange={mockOnModeChange}
          editable={false}
        />
      );

      const placeholder = screen.getByTestId('upload-placeholder');
      fireEvent.press(placeholder);

      await waitFor(() => {
        expect(
          ImagePicker.requestMediaLibraryPermissionsAsync
        ).not.toHaveBeenCalled();
      });
    });
  });
});
