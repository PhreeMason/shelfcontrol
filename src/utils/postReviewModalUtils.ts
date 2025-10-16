interface Platform {
  id: string;
  platform_name: string;
  posted: boolean;
  posted_date: string | null;
  review_url: string | null;
}

export interface ModalState {
  selectedPlatformIds: Set<string>;
  platformUrls: Record<string, string>;
  needsLinkSubmission: boolean;
}

export interface PlatformUpdate {
  id: string;
  posted: boolean;
  review_url?: string;
}

export const initializeModalState = (
  platforms: Platform[],
  visible: boolean
): ModalState | null => {
  if (!visible) {
    return null;
  }

  const postedPlatformIds = platforms
    .filter(p => p.posted)
    .map(p => p.id);

  const existingUrls = platforms.reduce((acc, p) => {
    if (p.review_url) {
      acc[p.id] = p.review_url;
    }
    return acc;
  }, {} as Record<string, string>);

  const hasAnyUrls = Object.keys(existingUrls).length > 0;

  return {
    selectedPlatformIds: new Set(postedPlatformIds),
    platformUrls: existingUrls,
    needsLinkSubmission: hasAnyUrls,
  };
};

export const prepareModalUpdates = (
  selectedPlatformIds: Set<string>,
  needsLinkSubmission: boolean,
  platformUrls: Record<string, string>
): PlatformUpdate[] => {
  return Array.from(selectedPlatformIds).map(id => {
    const update: PlatformUpdate = {
      id,
      posted: true,
    };

    if (needsLinkSubmission && platformUrls[id]) {
      update.review_url = platformUrls[id];
    }

    return update;
  });
};
