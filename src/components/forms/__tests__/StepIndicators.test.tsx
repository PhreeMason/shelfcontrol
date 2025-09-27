import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useTheme } from '@/hooks/useThemeColor';
import { StepIndicators } from '../StepIndicators';

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn()
}));

describe('StepIndicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      colors: { textOnPrimary: '#ffffff' }
    });
  });

  describe('Basic Rendering', () => {
    it('should render correct number of steps', () => {
      render(<StepIndicators currentStep={2} totalSteps={3} />);

      expect(screen.getByTestId('steps-container')).toBeTruthy();
      expect(screen.getAllByTestId('step-indicator')).toHaveLength(3);
    });

    it('should handle single step', () => {
      render(<StepIndicators currentStep={1} totalSteps={1} />);

      expect(screen.getAllByTestId('step-indicator')).toHaveLength(1);
    });

    it('should handle many steps', () => {
      render(<StepIndicators currentStep={5} totalSteps={10} />);

      expect(screen.getAllByTestId('step-indicator')).toHaveLength(10);
    });
  });

  describe('Step States', () => {
    it('should handle first step active', () => {
      render(<StepIndicators currentStep={1} totalSteps={3} />);

      const steps = screen.getAllByTestId('step-indicator');
      expect(steps).toHaveLength(3);
    });

    it('should handle middle step active', () => {
      render(<StepIndicators currentStep={2} totalSteps={3} />);

      const steps = screen.getAllByTestId('step-indicator');
      expect(steps).toHaveLength(3);
    });

    it('should handle last step active', () => {
      render(<StepIndicators currentStep={3} totalSteps={3} />);

      const steps = screen.getAllByTestId('step-indicator');
      expect(steps).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero steps gracefully', () => {
      render(<StepIndicators currentStep={0} totalSteps={0} />);

      expect(screen.getByTestId('steps-container')).toBeTruthy();
      expect(screen.queryAllByTestId('step-indicator')).toHaveLength(0);
    });

    it('should handle currentStep beyond totalSteps', () => {
      render(<StepIndicators currentStep={5} totalSteps={3} />);

      expect(screen.getAllByTestId('step-indicator')).toHaveLength(3);
    });

    it('should handle negative currentStep', () => {
      render(<StepIndicators currentStep={-1} totalSteps={3} />);

      expect(screen.getAllByTestId('step-indicator')).toHaveLength(3);
    });
  });

  describe('Theme Integration', () => {
    it('should use theme colors', () => {
      const customColors = { textOnPrimary: '#ff0000' };
      (useTheme as jest.Mock).mockReturnValue({ colors: customColors });

      render(<StepIndicators currentStep={2} totalSteps={3} />);

      expect(useTheme).toHaveBeenCalled();
      expect(screen.getByTestId('steps-container')).toBeTruthy();
    });

    it('should handle missing theme colors', () => {
      (useTheme as jest.Mock).mockReturnValue({ colors: {} });

      render(<StepIndicators currentStep={2} totalSteps={3} />);

      expect(screen.getByTestId('steps-container')).toBeTruthy();
    });
  });
});