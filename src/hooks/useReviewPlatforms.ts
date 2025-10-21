import { useState, useEffect, useMemo } from 'react';
import {
  extractCategorizedPlatforms,
  getReviewFormDefaults,
  CategorizedPlatforms,
} from '@/utils/reviewFormUtils';

export interface UseReviewPlatformsReturn {
  selectedPlatforms: Set<string>;
  hasBlog: boolean;
  setHasBlog: (value: boolean) => void;
  blogUrl: string;
  setBlogUrl: (value: string) => void;
  customPlatforms: string[];
  newCustomPlatform: string;
  setNewCustomPlatform: (value: string) => void;
  categorizedPlatforms: CategorizedPlatforms;
  togglePlatform: (platform: string) => void;
  addCustomPlatform: () => void;
  removeCustomPlatform: (index: number) => void;
  getAllSelectedPlatforms: () => string[];
}

export const useReviewPlatforms = (
  userPlatforms: string[],
  deadlineSource: string
): UseReviewPlatformsReturn => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set()
  );
  const [hasBlog, setHasBlog] = useState(false);
  const [blogUrl, setBlogUrl] = useState('');
  const [customPlatforms, setCustomPlatforms] = useState<string[]>([]);
  const [newCustomPlatform, setNewCustomPlatform] = useState('');

  const categorizedPlatforms = useMemo(
    () => extractCategorizedPlatforms(userPlatforms),
    [userPlatforms]
  );

  useEffect(() => {
    const defaults = getReviewFormDefaults(deadlineSource);
    setSelectedPlatforms(defaults.platforms);
  }, [deadlineSource]);

  useEffect(() => {
    if (hasBlog && !blogUrl && categorizedPlatforms.blogs.length > 0) {
      setBlogUrl(categorizedPlatforms.blogs[0]);
    }
  }, [hasBlog, blogUrl, categorizedPlatforms.blogs]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
      } else {
        newSet.add(platform);
      }
      return newSet;
    });
  };

  const addCustomPlatform = () => {
    if (newCustomPlatform.trim()) {
      setCustomPlatforms(prev => [...prev, newCustomPlatform.trim()]);
      setNewCustomPlatform('');
    }
  };

  const removeCustomPlatform = (index: number) => {
    setCustomPlatforms(prev => prev.filter((_, i) => i !== index));
  };

  const getAllSelectedPlatforms = (): string[] => {
    const platforms = Array.from(selectedPlatforms);
    if (hasBlog && blogUrl.trim()) {
      platforms.push(`Blog: ${blogUrl.trim()}`);
    }
    platforms.push(...customPlatforms);
    return platforms;
  };

  return {
    selectedPlatforms,
    hasBlog,
    setHasBlog,
    blogUrl,
    setBlogUrl,
    customPlatforms,
    newCustomPlatform,
    setNewCustomPlatform,
    categorizedPlatforms,
    togglePlatform,
    addCustomPlatform,
    removeCustomPlatform,
    getAllSelectedPlatforms,
  };
};
