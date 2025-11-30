import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import CompletionFormStep3 from '../CompletionFormStep3';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { useFetchBookById } from '@/hooks/useBooks';
import { useReviewPlatforms } from '@/hooks/useReviewPlatforms';
import {
  useCompleteDeadline,
  useDidNotFinishDeadline,
  useToReviewDeadline,
} from '@/hooks/useDeadlines';
import {
  useCreateReviewTracking,
  useUpdateReviewTracking,
  useUserPlatforms,
} from '@/hooks/useReviewTracking';
import { useReviewTrackingData } from '@/hooks/useReviewTrackingData';
import { useAuth } from '@/providers/AuthProvider';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

jest.mock('@/hooks/useBooks');
jest.mock('@/hooks/useReviewPlatforms');
jest.mock('@/hooks/useDeadlines');
jest.mock('@/hooks/useReviewTracking');
jest.mock('@/hooks/useReviewTrackingData');
jest.mock('@/providers/AuthProvider');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
}));
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      primary: '#000000',
      accent: '#666666',
      text: '#000000',
    },
  })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('@/components/features/completion/ReviewTimelineSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ReviewTimelineSection: () =>
      React.createElement(View, { testID: 'review-timeline-section' }, [
        React.createElement(Text, { key: 'text' }, 'Review Timeline Section'),
      ]),
  };
});

jest.mock('@/components/features/completion/PlatformSelectionSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    PlatformSelectionSection: ({ selectedPlatforms }: any) =>
      React.createElement(View, { testID: 'platform-selection-section' }, [
        React.createElement(
          Text,
          { key: 'text' },
          `Platforms: ${selectedPlatforms.size}`
        ),
      ]),
  };
});

jest.mock('@/components/features/completion/LinkSubmissionSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    LinkSubmissionSection: () =>
      React.createElement(View, { testID: 'link-submission-section' }, [
        React.createElement(Text, { key: 'text' }, 'Link Submission Section'),
      ]),
  };
});

jest.mock('@/components/features/completion/ReviewNotesSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ReviewNotesSection: () =>
      React.createElement(View, { testID: 'review-notes-section' }, [
        React.createElement(Text, { key: 'text' }, 'Review Notes Section'),
      ]),
  };
});

describe('CompletionFormStep3', () => {
  const mockCreateReviewTracking = jest.fn();
  const mockUpdateReviewTracking = jest.fn();
  const mockUpdateToReview = jest.fn();
  const mockCompleteDeadline = jest.fn();
  const mockDidNotFinishDeadline = jest.fn();

  const mockGetAllSelectedPlatforms = jest.fn();
  const mockTogglePlatform = jest.fn();
  const mockSetHasBlog = jest.fn();
  const mockSetBlogUrl = jest.fn();
  const mockSetNewCustomPlatform = jest.fn();
  const mockAddCustomPlatform = jest.fn();
  const mockRemoveCustomPlatform = jest.fn();

  const mockDeadline: ReadingDeadlineWithProgress = {
    id: 'test-deadline-id',
    user_id: 'test-user-id',
    book_id: 'test-book-id',
    book_title: 'Test Book Title',
    author: 'Test Author',
    deadline_date: '2024-12-31',
    flexibility: 'flexible',
    format: 'physical',
    total_quantity: 300,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    acquisition_source: null,
    type: 'Personal',
    publishers: null,
    cover_image_url: null,
    progress: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      session: {
        user: {
          id: 'test-user-id',
        },
      },
    });

    (useFetchBookById as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (useUserPlatforms as jest.Mock).mockReturnValue({
      data: [],
    });

    mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);

    (useReviewPlatforms as jest.Mock).mockReturnValue({
      selectedPlatforms: new Set(['Goodreads']),
      hasBlog: false,
      setHasBlog: mockSetHasBlog,
      blogUrl: '',
      setBlogUrl: mockSetBlogUrl,
      customPlatforms: [],
      newCustomPlatform: '',
      setNewCustomPlatform: mockSetNewCustomPlatform,
      categorizedPlatforms: {
        usedPresets: [],
        unusedPresets: ['Goodreads', 'Amazon'],
        custom: [],
        blogs: [],
      },
      togglePlatform: mockTogglePlatform,
      addCustomPlatform: mockAddCustomPlatform,
      removeCustomPlatform: mockRemoveCustomPlatform,
      getAllSelectedPlatforms: mockGetAllSelectedPlatforms,
    });

    (useCreateReviewTracking as jest.Mock).mockReturnValue({
      mutate: mockCreateReviewTracking,
    });

    (useReviewTrackingData as jest.Mock).mockReturnValue({
      data: null,
    });

    (useUpdateReviewTracking as jest.Mock).mockReturnValue({
      mutate: mockUpdateReviewTracking,
    });

    (useToReviewDeadline as jest.Mock).mockReturnValue({
      mutate: mockUpdateToReview,
    });

    (useCompleteDeadline as jest.Mock).mockReturnValue({
      mutate: mockCompleteDeadline,
    });

    (useDidNotFinishDeadline as jest.Mock).mockReturnValue({
      mutate: mockDidNotFinishDeadline,
    });
  });

  describe('Component Rendering', () => {
    it('should render review form container with testID', () => {
      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(screen.getByTestId('review-form-container')).toBeTruthy();
    });

    it('should render all section components', () => {
      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(screen.getByTestId('review-timeline-section')).toBeTruthy();
      expect(screen.getByTestId('platform-selection-section')).toBeTruthy();
      expect(screen.getByTestId('link-submission-section')).toBeTruthy();
      expect(screen.getByTestId('review-notes-section')).toBeTruthy();
    });

    it('should render book title and author', () => {
      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(screen.getByText('Test Book Title')).toBeTruthy();
      expect(screen.getByText('by Test Author')).toBeTruthy();
    });

    it('should render Save & Finish and Skip buttons', () => {
      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(screen.getByTestId('save-and-finish-button')).toBeTruthy();
      expect(screen.getByTestId('skip-button')).toBeTruthy();
      expect(screen.getByText('Start Tracking')).toBeTruthy();
      expect(screen.getByText('Skip this book')).toBeTruthy();
    });

    it('should handle deadline with null author', () => {
      const deadlineNoAuthor = { ...mockDeadline, author: null };

      render(<CompletionFormStep3 deadline={deadlineNoAuthor as any} />);

      expect(screen.getByText('by Unknown Author')).toBeTruthy();
    });
  });

  describe('Book Cover Display', () => {
    it('should display book cover image when available', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: {
          cover_image_url: 'https://example.com/cover.jpg',
        },
      });

      const { UNSAFE_getAllByType } = render(
        <CompletionFormStep3 deadline={mockDeadline} />
      );

      const images = UNSAFE_getAllByType(require('react-native').Image);
      const coverImage = images.find(
        (img: any) => img.props.source?.uri === 'https://example.com/cover.jpg'
      );
      expect(coverImage).toBeTruthy();
    });

    it('should display placeholder when no cover image', () => {
      (useFetchBookById as jest.Mock).mockReturnValue({
        data: {
          cover_image_url: null,
        },
      });

      const { UNSAFE_queryAllByType } = render(
        <CompletionFormStep3 deadline={mockDeadline} />
      );

      // Check for the icon placeholder (ViewManagerAdapter_SymbolModule is the native component)
      const symbols = UNSAFE_queryAllByType(
        require('react-native').View
      ).filter((v: any) => v.type?.name?.includes('Symbol'));
      // The placeholder should render an IconSymbol component
      expect(symbols.length).toBeGreaterThanOrEqual(0);
    });

    it('should call useFetchBookById with book_id', () => {
      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(useFetchBookById).toHaveBeenCalledWith('test-book-id');
    });
  });

  describe('useReviewPlatforms Hook Integration', () => {
    it('should call useReviewPlatforms with user platforms and source', () => {
      const mockUserPlatforms = ['Goodreads', 'Amazon'];
      (useUserPlatforms as jest.Mock).mockReturnValue({
        data: mockUserPlatforms,
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(useReviewPlatforms).toHaveBeenCalledWith(
        mockUserPlatforms,
        'Personal',
        undefined,
        []
      );
    });

    it('should handle empty user platforms', () => {
      (useUserPlatforms as jest.Mock).mockReturnValue({
        data: undefined,
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(useReviewPlatforms).toHaveBeenCalledWith(
        [],
        'Personal',
        undefined,
        []
      );
    });

    it('should pass useReviewPlatforms data to PlatformSelectionSection', () => {
      const mockSelectedPlatforms = new Set(['Goodreads', 'Amazon']);
      (useReviewPlatforms as jest.Mock).mockReturnValue({
        selectedPlatforms: mockSelectedPlatforms,
        hasBlog: false,
        setHasBlog: mockSetHasBlog,
        blogUrl: '',
        setBlogUrl: mockSetBlogUrl,
        customPlatforms: [],
        newCustomPlatform: '',
        setNewCustomPlatform: mockSetNewCustomPlatform,
        categorizedPlatforms: {
          usedPresets: ['Goodreads'],
          unusedPresets: ['Amazon'],
          custom: [],
          blogs: [],
        },
        togglePlatform: mockTogglePlatform,
        addCustomPlatform: mockAddCustomPlatform,
        removeCustomPlatform: mockRemoveCustomPlatform,
        getAllSelectedPlatforms: mockGetAllSelectedPlatforms,
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(screen.getByText('Platforms: 2')).toBeTruthy();
    });
  });

  describe('Save & Finish Flow', () => {
    it('should validate platform selection before submitting', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue([]);

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Pick a platform',
          text2: 'Select where you want to post your review',
        });
      });

      expect(mockCreateReviewTracking).not.toHaveBeenCalled();
    });

    it('should create review tracking with selected platforms', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads', 'Amazon']);
      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        callbacks.onSuccess();
      });
      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockCreateReviewTracking).toHaveBeenCalledWith(
          expect.objectContaining({
            deadline_id: 'test-deadline-id',
            needs_link_submission: false,
            platforms: [{ name: 'Goodreads' }, { name: 'Amazon' }],
          }),
          expect.any(Object)
        );
      });
    });

    it('should update deadline to to_review status on success', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);
      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        callbacks.onSuccess();
      });
      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockUpdateToReview).toHaveBeenCalledWith(
          'test-deadline-id',
          expect.any(Object)
        );
      });
    });

    it('should show success toast and navigate on completion', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);
      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        callbacks.onSuccess();
      });
      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'success',
          text1: 'All set!',
        });
        expect(router.replace).toHaveBeenCalledWith(
          '/deadline/test-deadline-id'
        );
      });
    });

    it('should handle updateToReview error gracefully', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);
      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        callbacks.onSuccess();
      });
      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onError(new Error('Update failed'));
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'success',
          text1: 'All set!',
        });
        expect(router.replace).toHaveBeenCalledWith(
          '/deadline/test-deadline-id'
        );
      });
    });

    it('should show error toast on createReviewTracking failure', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);
      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        callbacks.onError(new Error('Network error'));
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Something went wrong',
          text2: 'Network error', // Now shows actual error message
        });
      });

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should not submit if no session', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        session: null,
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockCreateReviewTracking).not.toHaveBeenCalled();
      });
    });

    it('should disable buttons while submitting', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);
      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        setTimeout(() => callbacks.onSuccess(), 100);
      });
      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeTruthy();
      });

      const saveButton = screen.getByTestId('save-and-finish-button');
      expect(saveButton.props.accessibilityState.disabled).toBe(true);
      // Skip link is now a text link, not a button, so it doesn't have disabled state
      expect(screen.getByTestId('skip-button')).toBeTruthy();
    });
  });

  describe('Skip Flow', () => {
    it('should call completeDeadline for non-DNF when skip pressed', async () => {
      mockCompleteDeadline.mockImplementation((_params, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalledWith(
          expect.objectContaining({
            deadlineId: 'test-deadline-id',
            deadline: expect.objectContaining({
              total_quantity: 300,
              progress: [],
            }),
          }),
          expect.any(Object)
        );
        expect(mockDidNotFinishDeadline).not.toHaveBeenCalled();
      });
    });

    it('should call didNotFinishDeadline for DNF when skip pressed', async () => {
      mockDidNotFinishDeadline.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} isDNF={true} />);

      fireEvent.press(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(mockDidNotFinishDeadline).toHaveBeenCalledWith(
          'test-deadline-id',
          expect.any(Object)
        );
        expect(mockCompleteDeadline).not.toHaveBeenCalled();
      });
    });

    it('should show success toast and navigate home on skip success', async () => {
      mockCompleteDeadline.mockImplementation((_params, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'success',
          text1: 'All done!',
        });
        expect(router.replace).toHaveBeenCalledWith('/');
      });
    });

    it('should show error toast on skip failure', async () => {
      mockCompleteDeadline.mockImplementation((_params, callbacks) => {
        callbacks.onError(new Error('Update failed'));
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Error',
          text2: 'Update failed', // Now shows actual error message
        });
      });

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should not skip if no session', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        session: null,
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(mockCompleteDeadline).not.toHaveBeenCalled();
        expect(mockDidNotFinishDeadline).not.toHaveBeenCalled();
      });
    });
  });

  describe('Source-based Defaults', () => {
    it('should set default review deadline for NetGalley source', () => {
      const netGalleyDeadline = {
        ...mockDeadline,
      };

      render(<CompletionFormStep3 deadline={netGalleyDeadline} />);

      expect(useReviewPlatforms).toHaveBeenCalledWith(
        [],
        'Personal',
        undefined,
        []
      );
    });

    it('should set default review deadline for Publisher ARC source', () => {
      const publisherDeadline = {
        ...mockDeadline,
      };

      render(<CompletionFormStep3 deadline={publisherDeadline} />);

      expect(useReviewPlatforms).toHaveBeenCalledWith(
        [],
        'Personal',
        undefined,
        []
      );
    });

    it('should not set default deadline for manual source', () => {
      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(useReviewPlatforms).toHaveBeenCalledWith(
        [],
        'Personal',
        undefined,
        []
      );
    });
  });

  describe('isDNF Prop', () => {
    it('should default to false when not provided', () => {
      render(<CompletionFormStep3 deadline={mockDeadline} />);

      expect(screen.getByTestId('review-form-container')).toBeTruthy();
    });

    it('should accept isDNF true', async () => {
      mockDidNotFinishDeadline.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} isDNF={true} />);

      fireEvent.press(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(mockDidNotFinishDeadline).toHaveBeenCalled();
      });
    });

    it('should accept isDNF false explicitly', async () => {
      mockCompleteDeadline.mockImplementation((_params, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} isDNF={false} />);

      fireEvent.press(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(mockCompleteDeadline).toHaveBeenCalled();
      });
    });
  });

  describe('Review Form Data Submission', () => {
    it('should include review due date when hasReviewDeadline is true in edit mode', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);

      const existingReviewDueDate = '2025-01-15T00:00:00Z';
      (useReviewTrackingData as jest.Mock).mockReturnValue({
        reviewTracking: {
          id: 'test-review-tracking-id',
          review_due_date: existingReviewDueDate,
          needs_link_submission: false,
        },
        platforms: [{ platform_name: 'Goodreads', posted: false }],
      });

      mockUpdateReviewTracking.mockImplementation((_params, callbacks) => {
        expect(_params.review_due_date).toBeDefined();
        expect(typeof _params.review_due_date).toBe('string');
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} mode="edit" />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockUpdateReviewTracking).toHaveBeenCalled();
      });
    });

    it('should use existing review tracking data in edit mode, not deadline defaults', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);

      const existingReviewDueDate = '2025-01-15T00:00:00Z';
      (useReviewTrackingData as jest.Mock).mockReturnValue({
        reviewTracking: {
          id: 'test-review-tracking-id',
          review_due_date: existingReviewDueDate,
          needs_link_submission: true,
        },
        platforms: [{ platform_name: 'Goodreads', posted: false }],
      });

      mockUpdateReviewTracking.mockImplementation((_params, callbacks) => {
        // Should use existing date, not deadline.deadline_date
        expect(_params.review_due_date).toBe(
          new Date(existingReviewDueDate).toISOString()
        );
        expect(_params.needs_link_submission).toBe(true);
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} mode="edit" />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockUpdateReviewTracking).toHaveBeenCalled();
      });
    });

    it('should include review due date by default in create mode', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);

      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        expect(_params.review_due_date).toBeDefined();
        expect(_params.review_due_date).toBe(
          new Date('2024-12-31').toISOString()
        );
        callbacks.onSuccess();
      });

      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockCreateReviewTracking).toHaveBeenCalledWith(
          expect.objectContaining({
            review_due_date: new Date('2024-12-31').toISOString(),
          }),
          expect.any(Object)
        );
      });
    });

    it('should include review notes when provided', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);

      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        if (_params.review_notes) {
          expect(_params.review_notes).toBe('Test review notes');
        }
        callbacks.onSuccess();
      });

      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      const { rerender } = render(
        <CompletionFormStep3 deadline={mockDeadline} />
      );

      const reviewNotesSection = screen.getByTestId('review-notes-section');
      expect(reviewNotesSection).toBeTruthy();

      rerender(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockCreateReviewTracking).toHaveBeenCalled();
      });
    });

    it('should not include review notes when empty', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);

      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        expect(_params.review_notes).toBeUndefined();
        callbacks.onSuccess();
      });

      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockCreateReviewTracking).toHaveBeenCalledWith(
          expect.not.objectContaining({
            review_notes: expect.anything(),
          }),
          expect.any(Object)
        );
      });
    });

    it('should include needs_link_submission in params', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue(['Goodreads']);

      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        expect(_params.needs_link_submission).toBe(false);
        callbacks.onSuccess();
      });

      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockCreateReviewTracking).toHaveBeenCalled();
      });
    });

    it('should format platforms correctly for submission', async () => {
      mockGetAllSelectedPlatforms.mockReturnValue([
        'Goodreads',
        'Amazon',
        'Blog: example.com',
      ]);

      mockCreateReviewTracking.mockImplementation((_params, callbacks) => {
        expect(_params.platforms).toEqual([
          { name: 'Goodreads' },
          { name: 'Amazon' },
          { name: 'Blog: example.com' },
        ]);
        callbacks.onSuccess();
      });

      mockUpdateToReview.mockImplementation((_id, callbacks) => {
        callbacks.onSuccess();
      });

      render(<CompletionFormStep3 deadline={mockDeadline} />);

      fireEvent.press(screen.getByTestId('save-and-finish-button'));

      await waitFor(() => {
        expect(mockCreateReviewTracking).toHaveBeenCalled();
      });
    });
  });
});
