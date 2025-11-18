import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../ThemedText';
import { Typography } from '@/constants/Colors';

// Mock the theme hook
jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: () => ({
    colors: {
      text: '#11181C',
      textSecondary: '#687076',
      textMuted: '#9CA3AF',
      textInverse: '#FFFFFF',
      primary: '#B8A9D9',
      error: '#E8B4B8',
    },
  }),
}));

// Mock ComponentVariants
jest.mock('@/constants/Theme', () => ({
  ComponentVariants: {
    text: {
      default: {
        color: 'text',
        typography: 'bodyLarge',
      },
      title: {
        color: 'text',
        typography: 'titleMedium',
      },
      secondary: {
        color: 'textSecondary',
        typography: 'bodyMedium',
      },
    },
  },
  createThemedStyle: {
    text: (
      _variant: string,
      _customColor?: string,
      customTypography?: keyof typeof Typography
    ) => {
      const TypographyMock: Record<string, any> = {
        headlineLarge: {
          fontSize: 32,
          lineHeight: 36,
          fontWeight: '800',
          fontFamily: 'Nunito-SemiBold',
        },
        headlineMedium: {
          fontSize: 28,
          lineHeight: 32,
          fontWeight: '600',
          fontFamily: 'Nunito-SemiBold',
        },
        headlineSmall: {
          fontSize: 24,
          lineHeight: 28,
          fontWeight: '600',
          fontFamily: 'Nunito-SemiBold',
        },
        titleLarge: {
          fontSize: 22,
          lineHeight: 26,
          fontWeight: '700',
          fontFamily: 'Nunito-Bold',
        },
        titleSubLarge: {
          fontSize: 20,
          lineHeight: 24,
          fontWeight: '600',
          fontFamily: 'Nunito-SemiBold',
        },
        titleMediumPlus: {
          fontSize: 18,
          lineHeight: 22,
          fontWeight: '600',
          fontFamily: 'Nunito-SemiBold',
        },
        titleMedium: {
          fontSize: 16,
          lineHeight: 20,
          fontWeight: '600',
          fontFamily: 'Nunito-SemiBold',
        },
        titleSmall: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: '600',
          fontFamily: 'Nunito-SemiBold',
        },
        bodyLarge: {
          fontSize: 16,
          lineHeight: 20,
          fontWeight: '400',
          fontFamily: 'Nunito-Regular',
        },
        bodyMedium: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: '400',
          fontFamily: 'Nunito-Regular',
        },
        bodySmall: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '400',
          fontFamily: 'Nunito-Regular',
        },
        labelLarge: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: '500',
          fontFamily: 'Nunito-Medium',
        },
        labelMedium: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '500',
          fontFamily: 'Nunito-Medium',
        },
        labelSmall: {
          fontSize: 10,
          lineHeight: 14,
          fontWeight: '500',
          fontFamily: 'Nunito-Medium',
        },
      };
      return TypographyMock[customTypography || 'bodyLarge'];
    },
  },
}));

describe('ThemedText', () => {
  describe('Basic Rendering', () => {
    it('should render text content', () => {
      const { getByText } = render(<ThemedText>Hello World</ThemedText>);
      expect(getByText('Hello World')).toBeTruthy();
    });

    it('should render with default variant when no props provided', () => {
      const { getByText } = render(<ThemedText>Default Text</ThemedText>);
      const element = getByText('Default Text');
      expect(element).toBeTruthy();
    });
  });

  describe('Typography Prop', () => {
    it('should apply titleLarge typography token', () => {
      const { getByText } = render(
        <ThemedText typography="titleLarge">Large Title</ThemedText>
      );
      const element = getByText('Large Title');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 22,
            lineHeight: 26,
            fontWeight: '700',
          }),
        ])
      );
    });

    it('should apply titleSubLarge typography token (20px)', () => {
      const { getByText } = render(
        <ThemedText typography="titleSubLarge">Modal Title</ThemedText>
      );
      const element = getByText('Modal Title');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 20,
            lineHeight: 24,
          }),
        ])
      );
    });

    it('should apply titleMediumPlus typography token (18px)', () => {
      const { getByText } = render(
        <ThemedText typography="titleMediumPlus">Section Header</ThemedText>
      );
      const element = getByText('Section Header');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 18,
            lineHeight: 22,
          }),
        ])
      );
    });

    it('should apply headlineSmall typography token', () => {
      const { getByText } = render(
        <ThemedText typography="headlineSmall">Headline</ThemedText>
      );
      const element = getByText('Headline');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 24,
            lineHeight: 28,
          }),
        ])
      );
    });
  });

  describe('Color Prop', () => {
    it('should apply custom color token', () => {
      const { getByText } = render(
        <ThemedText color="textInverse">Inverse Text</ThemedText>
      );
      const element = getByText('Inverse Text');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#FFFFFF',
          }),
        ])
      );
    });

    it('should apply primary color token', () => {
      const { getByText } = render(
        <ThemedText color="primary">Primary Text</ThemedText>
      );
      const element = getByText('Primary Text');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#B8A9D9',
          }),
        ])
      );
    });
  });

  describe('Typography + Color Combination', () => {
    it('should apply both typography and color tokens', () => {
      const { getByText } = render(
        <ThemedText typography="titleLarge" color="textInverse">
          Large Inverse Title
        </ThemedText>
      );
      const element = getByText('Large Inverse Title');
      // Check that style array contains both typography and color objects
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 22,
            lineHeight: 26,
            fontWeight: '700',
          }),
          expect.objectContaining({
            color: '#FFFFFF',
          }),
        ])
      );
    });

    it('should combine titleMediumPlus with primary color', () => {
      const { getByText } = render(
        <ThemedText typography="titleMediumPlus" color="primary">
          Section Header
        </ThemedText>
      );
      const element = getByText('Section Header');
      // Check that style array contains both typography and color objects
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 18,
          }),
          expect.objectContaining({
            color: '#B8A9D9',
          }),
        ])
      );
    });
  });

  describe('Variant Backward Compatibility', () => {
    it('should still support variant prop alone', () => {
      const { getByText } = render(
        <ThemedText variant="title">Title Variant</ThemedText>
      );
      const element = getByText('Title Variant');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            fontWeight: '600',
          }),
        ])
      );
    });

    it('should support variant="secondary"', () => {
      const { getByText } = render(
        <ThemedText variant="secondary">Secondary Text</ThemedText>
      );
      const element = getByText('Secondary Text');
      // Check style array contains both typography and color separately
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 14,
          }),
          expect.objectContaining({
            color: '#687076',
          }),
        ])
      );
    });
  });

  describe('Override Priority', () => {
    it('should prioritize typography prop over variant typography', () => {
      const { getByText } = render(
        <ThemedText variant="title" typography="titleLarge">
          Override Typography
        </ThemedText>
      );
      const element = getByText('Override Typography');
      // Should use titleLarge (22px) not titleMedium (16px) from variant
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 22,
            fontWeight: '700',
          }),
        ])
      );
    });

    it('should prioritize color prop over variant color', () => {
      const { getByText } = render(
        <ThemedText variant="secondary" color="primary">
          Override Color
        </ThemedText>
      );
      const element = getByText('Override Color');
      // Should use primary color not textSecondary from variant
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#B8A9D9',
          }),
        ])
      );
    });

    it('should allow both typography and color to override variant', () => {
      const { getByText } = render(
        <ThemedText
          variant="secondary"
          typography="titleLarge"
          color="textInverse"
        >
          Full Override
        </ThemedText>
      );
      const element = getByText('Full Override');
      // Should use titleLarge typography and textInverse color, not secondary's values
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 22,
            fontWeight: '700',
          }),
          expect.objectContaining({
            color: '#FFFFFF',
          }),
        ])
      );
    });
  });

  describe('Custom Style Prop', () => {
    it('should accept and merge custom style prop', () => {
      const customStyle = { marginTop: 10 };
      const { getByText } = render(
        <ThemedText style={customStyle}>Styled Text</ThemedText>
      );
      const element = getByText('Styled Text');
      expect(element.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining(customStyle)])
      );
    });

    it('should merge custom styles with typography prop', () => {
      const customStyle = { marginBottom: 20 };
      const { getByText } = render(
        <ThemedText typography="titleLarge" style={customStyle}>
          Styled Title
        </ThemedText>
      );
      const element = getByText('Styled Title');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 22,
          }),
          expect.objectContaining({
            marginBottom: 20,
          }),
        ])
      );
    });
  });

  describe('Line Height Inclusion', () => {
    it('should include lineHeight with titleLarge', () => {
      const { getByText } = render(
        <ThemedText typography="titleLarge">Title</ThemedText>
      );
      const element = getByText('Title');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            lineHeight: 26,
          }),
        ])
      );
    });

    it('should include lineHeight with titleSubLarge (20px)', () => {
      const { getByText } = render(
        <ThemedText typography="titleSubLarge">Modal</ThemedText>
      );
      const element = getByText('Modal');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            lineHeight: 24,
          }),
        ])
      );
    });

    it('should include lineHeight with titleMediumPlus (18px)', () => {
      const { getByText } = render(
        <ThemedText typography="titleMediumPlus">Header</ThemedText>
      );
      const element = getByText('Header');
      expect(element.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            lineHeight: 22,
          }),
        ])
      );
    });
  });

  describe('Component Rerendering', () => {
    it('should maintain same props on rerender', () => {
      const { getByText, rerender } = render(
        <ThemedText typography="titleLarge" color="primary">
          Stable Text
        </ThemedText>
      );

      const initialElement = getByText('Stable Text');
      const initialStyle = initialElement.props.style;

      rerender(
        <ThemedText typography="titleLarge" color="primary">
          Stable Text
        </ThemedText>
      );

      const rerenderedElement = getByText('Stable Text');
      expect(rerenderedElement.props.style).toEqual(initialStyle);
    });
  });
});
