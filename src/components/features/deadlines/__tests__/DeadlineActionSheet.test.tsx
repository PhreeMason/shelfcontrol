import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { render } from '@testing-library/react-native';
import React from 'react';
import { DeadlineActionSheet } from '../DeadlineActionSheet';

const mockDeadline: ReadingDeadlineWithProgress = {
  id: '1',
  user_id: 'user-1',
  book_id: 'book-1',
  book_title: 'Test Book',
  author: 'Test Author',
  deadline_date: '2025-12-31',
  flexibility: 'flexible',
  total_quantity: 300,
  format: 'physical',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  acquisition_source: null,
  type: 'Personal',
  publishers: null,
  cover_image_url: null,
  progress: [],
  status: [],
};

jest.mock('@/components/ui/ActionSheet', () => ({
  ActionSheet: ({ options }: { options: { label: string }[] }) => {
    const { Text } = require('react-native');
    return (
      <>
        {options.map((option, index) => (
          <Text key={index}>{option.label}</Text>
        ))}
      </>
    );
  },
}));

jest.mock('../modals/UpdateDeadlineDateModal', () => ({
  UpdateDeadlineDateModal: () => null,
}));

jest.mock('../modals/DeleteDeadlineModal', () => ({
  DeleteDeadlineModal: () => null,
}));

jest.mock('../modals/ProgressCheckModal', () => ({
  ProgressCheckModal: () => null,
}));

jest.mock('../../review/PostReviewModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      primary: '#B8A9D9',
      secondary: '#A0C4E8',
      approaching: '#E8B4A0',
      error: '#E8B4B8',
      good: '#10B981',
      text: '#000000',
      surface: '#FFFFFF',
      border: '#E2E8F0',
    },
  })),
}));

const mockStartReadingDeadline = jest.fn();
const mockReactivateDeadline = jest.fn();

jest.mock('@/providers/DeadlineProvider', () => ({
  useDeadlines: jest.fn(() => ({
    startReadingDeadline: mockStartReadingDeadline,
    reactivateDeadline: mockReactivateDeadline,
  })),
}));

jest.mock('@/hooks/useReviewTrackingData', () => ({
  useReviewTrackingData: jest.fn(() => ({
    reviewTracking: null,
    platforms: [],
    completionPercentage: 0,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

const mockUpdatePlatforms = jest.fn();

jest.mock('@/hooks/useReviewTrackingMutation', () => ({
  useReviewTrackingMutation: jest.fn(() => ({
    updatePlatforms: mockUpdatePlatforms,
    isUpdating: false,
  })),
}));

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
    back: jest.fn(),
    replace: jest.fn(),
  })),
}));

describe('DeadlineActionSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show update deadline date action for active deadline', () => {
    const activeDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: '1',
          deadline_id: '1',
          status: 'reading',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    };

    const { getByText } = render(
      <DeadlineActionSheet
        deadline={activeDeadline}
        visible={true}
        onClose={jest.fn()}
      />
    );

    expect(getByText('Update Date')).toBeTruthy();
  });

  it('should not show update deadline date action for completed deadline', () => {
    const completedDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: '1',
          deadline_id: '1',
          status: 'complete',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    };

    const { queryByText } = render(
      <DeadlineActionSheet
        deadline={completedDeadline}
        visible={true}
        onClose={jest.fn()}
      />
    );

    expect(queryByText('Update Date')).toBeNull();
  });

  it('should not show mark as completed action for completed deadline', () => {
    const completedDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: '1',
          deadline_id: '1',
          status: 'complete',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    };

    const { queryByText } = render(
      <DeadlineActionSheet
        deadline={completedDeadline}
        visible={true}
        onClose={jest.fn()}
      />
    );

    expect(queryByText("I'm done reading")).toBeNull();
  });

  it('should always show delete action', () => {
    const completedDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: '1',
          deadline_id: '1',
          status: 'complete',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    };

    const { getByText } = render(
      <DeadlineActionSheet
        deadline={completedDeadline}
        visible={true}
        onClose={jest.fn()}
      />
    );

    expect(getByText('Delete This Book')).toBeTruthy();
  });

  it('should show Start Reading action for pending deadline', () => {
    const pendingDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: '1',
          deadline_id: '1',
          status: 'pending',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    };

    const { getByTestId } = render(
      <DeadlineActionSheet
        deadline={pendingDeadline}
        visible={true}
        onClose={jest.fn()}
      />
    );

    const primaryButton = getByTestId('primary-action-button');
    expect(primaryButton).toBeTruthy();
  });

  it('should not show any status change action for completed deadline', () => {
    const completedDeadline: ReadingDeadlineWithProgress = {
      ...mockDeadline,
      status: [
        {
          id: '1',
          deadline_id: '1',
          status: 'complete',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ],
    };

    const { queryByText } = render(
      <DeadlineActionSheet
        deadline={completedDeadline}
        visible={true}
        onClose={jest.fn()}
      />
    );

    expect(queryByText('Start Reading')).toBeNull();
    expect(queryByText('Resume Reading')).toBeNull();
  });

  describe('Primary Action Button Integration', () => {
    it('should execute startReadingDeadline for pending status', () => {
      const pendingDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'pending',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByTestId } = render(
        <DeadlineActionSheet
          deadline={pendingDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      const primaryButton = getByTestId('primary-action-button');
      require('@testing-library/react-native').fireEvent.press(primaryButton);

      expect(mockStartReadingDeadline).toHaveBeenCalledWith(
        '1',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should call onClose on successful mutation', () => {
      mockStartReadingDeadline.mockImplementation(
        (_id, onSuccess) => onSuccess && onSuccess()
      );

      const pendingDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'pending',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const onClose = jest.fn();
      const { getByTestId } = render(
        <DeadlineActionSheet
          deadline={pendingDeadline}
          visible={true}
          onClose={onClose}
        />
      );

      const primaryButton = getByTestId('primary-action-button');
      require('@testing-library/react-native').fireEvent.press(primaryButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not show primary action button for archived deadline', () => {
      const archivedDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'complete',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { queryByTestId } = render(
        <DeadlineActionSheet
          deadline={archivedDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(queryByTestId('primary-action-button')).toBeNull();
    });
  });

  describe('Status Badge Display', () => {
    it('should show correct badge for pending status', () => {
      const pendingDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'pending',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={pendingDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('Pending')).toBeTruthy();
    });

    it('should show correct badge for active status', () => {
      const activeDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'reading',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={activeDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('Active')).toBeTruthy();
    });

    it('should show correct badge for completed status', () => {
      const completedDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'complete',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={completedDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('Completed')).toBeTruthy();
    });

    it('should show correct badge for did_not_finish status', () => {
      const didNotFinishDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'did_not_finish',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={didNotFinishDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText('Did Not Finish')).toBeTruthy();
    });
  });

  describe('Date Display', () => {
    it('should show "Due" date for non-archived deadline', () => {
      const activeDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        deadline_date: '2025-12-25',
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'reading',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={activeDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText(/Due Dec 25, 2025/)).toBeTruthy();
    });

    it('should show "Archived" date for completed deadline', () => {
      const completedDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        deadline_date: '2025-12-25',
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'complete',
            created_at: '2025-06-15T10:30:00Z',
            updated_at: '2025-06-15T10:30:00Z',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={completedDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText(/Jun 15, 2025/)).toBeTruthy();
    });

    it('should show "Archived" date for did_not_finish deadline', () => {
      const dnfDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        deadline_date: '2025-12-25',
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'did_not_finish',
            created_at: '2025-03-10T14:20:00Z',
            updated_at: '2025-03-10T14:20:00Z',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={dnfDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText(/Mar 10, 2025/)).toBeTruthy();
    });
  });

  describe('Action List Rendering', () => {
    it('should show all non-archived actions for active deadline', () => {
      const activeDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'reading',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByText } = render(
        <DeadlineActionSheet
          deadline={activeDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(getByText("I'm done reading")).toBeTruthy();
      expect(getByText('Update Date')).toBeTruthy();
      expect(getByText('Book Details')).toBeTruthy();
      expect(getByText('Delete This Book')).toBeTruthy();
    });

    it('should hide Update Deadline Date for archived deadline', () => {
      const archivedDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'complete',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { queryByText } = render(
        <DeadlineActionSheet
          deadline={archivedDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(queryByText('Update Date')).toBeNull();
    });

    it('should only show Delete action for archived deadline', () => {
      const archivedDeadline: ReadingDeadlineWithProgress = {
        ...mockDeadline,
        status: [
          {
            id: '1',
            deadline_id: '1',
            status: 'complete',
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        ],
      };

      const { getByText, queryByText } = render(
        <DeadlineActionSheet
          deadline={archivedDeadline}
          visible={true}
          onClose={jest.fn()}
        />
      );

      expect(queryByText("I'm done reading")).toBeNull();
      expect(queryByText('Update Date')).toBeNull();
      expect(queryByText('Book Details')).toBeNull();
      expect(getByText('Delete This Book')).toBeTruthy();
    });
  });
});
