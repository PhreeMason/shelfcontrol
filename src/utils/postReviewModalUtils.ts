interface Platform {
  id: string;
  platform_name: string;
  posted: boolean;
  posted_date: string | null;
  review_url: string | null;
}

export interface ModalState {
  selectedPlatformIds: Set<string>;
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

  return {
    selectedPlatformIds: new Set(postedPlatformIds),
  };
};

export const prepareModalUpdates = (
  selectedPlatformIds: Set<string>
): PlatformUpdate[] => {
  return Array.from(selectedPlatformIds).map(id => ({
    id,
    posted: true,
  }));
};
