import {
  getCompletionFormSteps,
  getInitialStep,
  getTotalSteps,
  createCompletionSuccessToast,
  createCompletionErrorToast,
  getCurrentStepComponent,
  createCompletionCallbacks,
  handleReviewQuestionResponse,
  shouldShowCelebration,
  shouldShowReviewQuestion,
  shouldShowReviewForm,
  getCompletionStatus,
  validateCompletionFlow,
} from '../completionFlowUtils';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';

describe('completionFlowUtils', () => {
  describe('getCompletionFormSteps', () => {
    it('should return 3 steps for non-DNF flow', () => {
      const steps = getCompletionFormSteps(false);
      expect(steps).toEqual(['Celebration', 'Review Question', 'Review Setup']);
      expect(steps.length).toBe(3);
    });

    it('should return 2 steps for DNF flow', () => {
      const steps = getCompletionFormSteps(true);
      expect(steps).toEqual(['Review Question', 'Review Setup']);
      expect(steps.length).toBe(2);
    });
  });

  describe('getInitialStep', () => {
    it('should return 1 for non-DNF flow', () => {
      expect(getInitialStep(false)).toBe(1);
    });

    it('should return 2 for DNF flow', () => {
      expect(getInitialStep(true)).toBe(2);
    });
  });

  describe('getTotalSteps', () => {
    it('should return 3 for non-DNF flow', () => {
      expect(getTotalSteps(false)).toBe(3);
    });

    it('should return 2 for DNF flow', () => {
      expect(getTotalSteps(true)).toBe(2);
    });
  });

  describe('createCompletionSuccessToast', () => {
    it('should create success toast for complete status', () => {
      const toast = createCompletionSuccessToast(false, 'Test Book');
      expect(toast).toEqual({
        type: 'success',
        text1: 'All done!',
        text2: '"Test Book" marked as complete',
      });
    });

    it('should create success toast for DNF status', () => {
      const toast = createCompletionSuccessToast(true, 'Test Book');
      expect(toast).toEqual({
        type: 'success',
        text1: 'All done!',
        text2: '"Test Book" moved to DNF',
      });
    });

    it('should handle book titles with special characters', () => {
      const toast = createCompletionSuccessToast(false, 'Book: "Title"');
      expect(toast.text2).toBe('"Book: "Title"" marked as complete');
    });

    it('should handle empty book title', () => {
      const toast = createCompletionSuccessToast(false, '');
      expect(toast.text2).toBe('"" marked as complete');
    });
  });

  describe('createCompletionErrorToast', () => {
    it('should create error toast with default message', () => {
      const toast = createCompletionErrorToast();
      expect(toast).toEqual({
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Please try again.',
      });
    });

    it('should create error toast with error message', () => {
      const error = new Error('Network error');
      const toast = createCompletionErrorToast(error);
      expect(toast).toEqual({
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Network error',
      });
    });

    it('should use default message when error message is empty', () => {
      const error = new Error('');
      const toast = createCompletionErrorToast(error);
      expect(toast.text2).toBe('Please try again.');
    });
  });

  describe('getCurrentStepComponent', () => {
    it('should return celebration component for step 1 non-DNF', () => {
      const result = getCurrentStepComponent(1, false, null);
      expect(result).toEqual({ component: 'celebration', step: 1 });
    });

    it('should not return celebration component for step 1 DNF', () => {
      const result = getCurrentStepComponent(1, true, null);
      expect(result.component).not.toBe('celebration');
    });

    it('should return review question component for step 2', () => {
      const result = getCurrentStepComponent(2, false, null);
      expect(result).toEqual({ component: 'reviewQuestion', step: 2 });
    });

    it('should return review question component for step 2 DNF', () => {
      const result = getCurrentStepComponent(2, true, null);
      expect(result).toEqual({ component: 'reviewQuestion', step: 2 });
    });

    it('should return review form component for step 3 when needsReview is true', () => {
      const result = getCurrentStepComponent(3, false, true);
      expect(result).toEqual({ component: 'reviewForm', step: 3 });
    });

    it('should not return review form component for step 3 when needsReview is false', () => {
      const result = getCurrentStepComponent(3, false, false);
      expect(result).toEqual({ component: null, step: 3 });
    });

    it('should not return review form component for step 3 when needsReview is null', () => {
      const result = getCurrentStepComponent(3, false, null);
      expect(result).toEqual({ component: null, step: 3 });
    });

    it('should return null component for invalid step', () => {
      const result = getCurrentStepComponent(4, false, null);
      expect(result).toEqual({ component: null, step: 4 });
    });
  });

  describe('createCompletionCallbacks', () => {
    it('should call success callback with correct toast and navigation', () => {
      const showToast = jest.fn();
      const navigateToHome = jest.fn();

      const callbacks = createCompletionCallbacks(
        false,
        'Test Book',
        showToast,
        navigateToHome
      );

      callbacks.onSuccess();

      expect(showToast).toHaveBeenCalledWith({
        type: 'success',
        text1: 'All done!',
        text2: '"Test Book" marked as complete',
      });
      expect(navigateToHome).toHaveBeenCalled();
    });

    it('should call success callback for DNF with correct toast', () => {
      const showToast = jest.fn();
      const navigateToHome = jest.fn();

      const callbacks = createCompletionCallbacks(
        true,
        'Test Book',
        showToast,
        navigateToHome
      );

      callbacks.onSuccess();

      expect(showToast).toHaveBeenCalledWith({
        type: 'success',
        text1: 'All done!',
        text2: '"Test Book" moved to DNF',
      });
      expect(navigateToHome).toHaveBeenCalled();
    });

    it('should call error callback with toast and log error', () => {
      const showToast = jest.fn();
      const navigateToHome = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const callbacks = createCompletionCallbacks(
        false,
        'Test Book',
        showToast,
        navigateToHome
      );

      const error = new Error('Test error');
      callbacks.onError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating book status:',
        error
      );
      expect(showToast).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Test error',
      });
      expect(navigateToHome).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleReviewQuestionResponse', () => {
    it('should set needsReview to true and advance to step 3', () => {
      const setNeedsReview = jest.fn();
      const setCurrentStep = jest.fn();
      const handleDirectCompletion = jest.fn();

      handleReviewQuestionResponse(
        true,
        setNeedsReview,
        setCurrentStep,
        handleDirectCompletion
      );

      expect(setNeedsReview).toHaveBeenCalledWith(true);
      expect(setCurrentStep).toHaveBeenCalledWith(3);
      expect(handleDirectCompletion).not.toHaveBeenCalled();
    });

    it('should set needsReview to false and call handleDirectCompletion', () => {
      const setNeedsReview = jest.fn();
      const setCurrentStep = jest.fn();
      const handleDirectCompletion = jest.fn();

      handleReviewQuestionResponse(
        false,
        setNeedsReview,
        setCurrentStep,
        handleDirectCompletion
      );

      expect(setNeedsReview).toHaveBeenCalledWith(false);
      expect(setCurrentStep).not.toHaveBeenCalled();
      expect(handleDirectCompletion).toHaveBeenCalled();
    });
  });

  describe('shouldShowCelebration', () => {
    it('should return true for step 1 non-DNF', () => {
      expect(shouldShowCelebration(1, false)).toBe(true);
    });

    it('should return false for step 1 DNF', () => {
      expect(shouldShowCelebration(1, true)).toBe(false);
    });

    it('should return false for step 2 non-DNF', () => {
      expect(shouldShowCelebration(2, false)).toBe(false);
    });

    it('should return false for step 3 non-DNF', () => {
      expect(shouldShowCelebration(3, false)).toBe(false);
    });
  });

  describe('shouldShowReviewQuestion', () => {
    it('should return true for step 2', () => {
      expect(shouldShowReviewQuestion(2)).toBe(true);
    });

    it('should return false for step 1', () => {
      expect(shouldShowReviewQuestion(1)).toBe(false);
    });

    it('should return false for step 3', () => {
      expect(shouldShowReviewQuestion(3)).toBe(false);
    });
  });

  describe('shouldShowReviewForm', () => {
    it('should return true for step 3 with needsReview true', () => {
      expect(shouldShowReviewForm(3, true)).toBe(true);
    });

    it('should return false for step 3 with needsReview false', () => {
      expect(shouldShowReviewForm(3, false)).toBe(false);
    });

    it('should return false for step 3 with needsReview null', () => {
      expect(shouldShowReviewForm(3, null)).toBe(false);
    });

    it('should return false for step 2 with needsReview true', () => {
      expect(shouldShowReviewForm(2, true)).toBe(false);
    });

    it('should return false for step 1 with needsReview true', () => {
      expect(shouldShowReviewForm(1, true)).toBe(false);
    });
  });

  describe('getCompletionStatus', () => {
    it('should return "complete" for non-DNF', () => {
      expect(getCompletionStatus(false)).toBe('complete');
    });

    it('should return "did_not_finish" for DNF', () => {
      expect(getCompletionStatus(true)).toBe('did_not_finish');
    });
  });

  describe('validateCompletionFlow', () => {
    it('should return valid for existing deadline', () => {
      const deadline = {
        id: 'deadline-123',
        book_title: 'Test Book',
      } as ReadingDeadlineWithProgress;

      const result = validateCompletionFlow(deadline);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for undefined deadline', () => {
      const result = validateCompletionFlow(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Deadline not found');
    });
  });
});
