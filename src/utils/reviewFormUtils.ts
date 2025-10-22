import { PRESET_PLATFORMS } from '@/constants/platforms';

export interface CategorizedPlatforms {
  usedPresets: string[];
  unusedPresets: string[];
  custom: string[];
  blogs: string[];
}

export const extractCategorizedPlatforms = (
  userPlatforms: string[]
): CategorizedPlatforms => {
  const usedPresets: string[] = [];
  const custom: string[] = [];
  const blogs: string[] = [];

  userPlatforms.forEach(p => {
    if (p.startsWith('Blog: ')) {
      const blogUrl = p.replace('Blog: ', '');
      if (!blogs.includes(blogUrl)) {
        blogs.push(blogUrl);
      }
    } else if (PRESET_PLATFORMS.includes(p as any)) {
      if (!usedPresets.includes(p)) {
        usedPresets.push(p);
      }
    } else {
      if (!custom.includes(p)) {
        custom.push(p);
      }
    }
  });

  const unusedPresets = PRESET_PLATFORMS.filter(p => !usedPresets.includes(p));

  return { usedPresets, unusedPresets, custom, blogs };
};

export interface ReviewFormDefaults {
  platforms: Set<string>;
  hasReviewDeadline: boolean;
  reviewDueDate: Date | null;
}

export const getReviewFormDefaults = (source: string): ReviewFormDefaults => {
  const defaults: ReviewFormDefaults = {
    platforms: new Set(),
    hasReviewDeadline: false,
    reviewDueDate: null,
  };

  if (source === 'NetGalley') {
    defaults.platforms.add('NetGalley');
    defaults.platforms.add('Goodreads');
    defaults.hasReviewDeadline = true;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    defaults.reviewDueDate = defaultDate;
  } else if (source === 'Publisher ARC') {
    defaults.platforms.add('Goodreads');
    defaults.hasReviewDeadline = true;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    defaults.reviewDueDate = defaultDate;
  }

  return defaults;
};

export const createPlatformToggleHandler = (
  selectedPlatforms: Set<string>,
  setSelectedPlatforms: (platforms: Set<string>) => void
) => {
  return (platform: string) => {
    const newSet = new Set(selectedPlatforms);
    if (newSet.has(platform)) {
      newSet.delete(platform);
    } else {
      newSet.add(platform);
    }
    setSelectedPlatforms(newSet);
  };
};

export const prepareSelectedPlatforms = (
  selectedPlatforms: Set<string>,
  hasBlog: boolean,
  blogUrl: string,
  customPlatforms: string[]
): string[] => {
  const platforms = Array.from(selectedPlatforms);
  if (hasBlog && blogUrl.trim()) {
    platforms.push(`Blog: ${blogUrl.trim()}`);
  }
  platforms.push(...customPlatforms);
  return platforms;
};

export interface ReviewTrackingParams {
  deadline_id: string;
  needs_link_submission: boolean;
  platforms: { name: string }[];
  review_due_date?: string;
  review_notes?: string;
}

export const prepareReviewTrackingParams = (
  deadlineId: string,
  platforms: string[],
  needsLinkSubmission: boolean,
  reviewDueDate: Date | null,
  reviewNotes?: string
): ReviewTrackingParams => {
  const params: ReviewTrackingParams = {
    deadline_id: deadlineId,
    needs_link_submission: needsLinkSubmission,
    platforms: platforms.map(name => ({ name })),
  };

  if (reviewDueDate) {
    params.review_due_date = reviewDueDate.toISOString();
  }

  if (reviewNotes && reviewNotes.trim()) {
    params.review_notes = reviewNotes;
  }

  return params;
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePlatformSelection = (
  platforms: string[]
): ValidationResult => {
  if (platforms.length === 0) {
    return {
      isValid: false,
      error: 'Please select at least one platform',
    };
  }
  return { isValid: true };
};

export const shouldSetDefaultDate = (
  hasReviewDeadline: boolean,
  reviewDueDate: Date | null
): boolean => {
  return hasReviewDeadline && !reviewDueDate;
};

export const getDefaultReviewDueDate = (): Date => {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  return defaultDate;
};

export const shouldClearReviewDueDate = (
  hasReviewDeadline: boolean
): boolean => {
  return !hasReviewDeadline;
};

export const createCustomPlatformHandler = (
  newPlatform: string,
  customPlatforms: string[],
  setCustomPlatforms: (platforms: string[]) => void,
  clearInput: () => void
) => {
  return () => {
    if (newPlatform.trim()) {
      setCustomPlatforms([...customPlatforms, newPlatform.trim()]);
      clearInput();
    }
  };
};

export const createRemovePlatformHandler = (
  customPlatforms: string[],
  setCustomPlatforms: (platforms: string[]) => void
) => {
  return (index: number) => {
    setCustomPlatforms(customPlatforms.filter((_, i) => i !== index));
  };
};

export const shouldSetDefaultBlog = (
  hasBlog: boolean,
  blogUrl: string,
  availableBlogs: string[]
): boolean => {
  return hasBlog && !blogUrl && availableBlogs.length > 0;
};

export interface ReviewFormToastConfig {
  type: 'success' | 'error';
  text1: string;
  text2?: string;
}

export const createReviewTrackingSuccessToast = (): ReviewFormToastConfig => ({
  type: 'success',
  text1: 'Review tracking set up!',
});

export const createReviewTrackingErrorToast = (
  error?: Error
): ReviewFormToastConfig => ({
  type: 'error',
  text1: 'Error',
  text2:
    error?.message || 'Failed to set up review tracking. Please try again.',
});

export const createPlatformRequiredToast = (): ReviewFormToastConfig => ({
  type: 'error',
  text1: 'Platform Required',
  text2: 'Please select at least one platform',
});

export const createSkipSuccessToast = (): ReviewFormToastConfig => ({
  type: 'success',
  text1: 'All done!',
});

export const createSkipErrorToast = (error?: Error): ReviewFormToastConfig => ({
  type: 'error',
  text1: 'Error',
  text2: error?.message || 'Failed to update deadline. Please try again.',
});
