import {
  CategorizedPlatforms,
  extractCategorizedPlatforms,
  getReviewFormDefaults,
} from '@/utils/reviewFormUtils';
import { useEffect, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

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
  postedPlatforms: string[];
}

export const useReviewPlatforms = (
  userPlatforms: string[],
  deadlineSource: string,
  initialPlatforms?: string[],
  postedPlatforms: string[] = []
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
    const areSetEqual = (a: Set<string>, b: Set<string>) => {
      if (a.size !== b.size) return false;
      for (const item of a) {
        if (!b.has(item)) return false;
      }
      return true;
    };

    const areArraysEqual = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      return a.every((item, index) => item === b[index]);
    };

    if (initialPlatforms && initialPlatforms.length > 0) {
      const presetPlatforms = new Set<string>();
      const customPlats: string[] = [];
      let blogPlatform: string | null = null;

      initialPlatforms.forEach(platform => {
        if (platform.startsWith('Blog: ')) {
          blogPlatform = platform.replace('Blog: ', '');
        } else if (
          categorizedPlatforms.usedPresets.includes(platform) ||
          categorizedPlatforms.unusedPresets.includes(platform) ||
          userPlatforms.includes(platform)
        ) {
          presetPlatforms.add(platform);
        } else {
          customPlats.push(platform);
        }
      });

      const platformsChanged = !areSetEqual(presetPlatforms, selectedPlatforms);
      const customsChanged = !areArraysEqual(customPlats, customPlatforms);
      const blogChanged =
        blogPlatform !== null && (!hasBlog || blogUrl !== blogPlatform);

      if (platformsChanged) {
        setSelectedPlatforms(presetPlatforms);
      }
      if (blogChanged && blogPlatform) {
        setHasBlog(true);
        setBlogUrl(blogPlatform);
      }
      if (customsChanged && customPlats.length > 0) {
        setCustomPlatforms(customPlats);
      }
    } else {
      const defaults = getReviewFormDefaults(deadlineSource);
      const defaultsChanged = !areSetEqual(
        defaults.platforms,
        selectedPlatforms
      );

      if (defaultsChanged) {
        setSelectedPlatforms(defaults.platforms);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineSource, initialPlatforms]);

  useEffect(() => {
    if (hasBlog && !blogUrl && categorizedPlatforms.blogs.length > 0) {
      setBlogUrl(categorizedPlatforms.blogs[0]);
    }
  }, [hasBlog, blogUrl, categorizedPlatforms.blogs]);

  const togglePlatform = (platform: string) => {
    if (postedPlatforms.includes(platform)) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Remove Posted Platform',
        text2: 'This platform has already been posted and cannot be removed.',
      });
      return;
    }

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
    const platformToRemove = customPlatforms[index];
    if (postedPlatforms.includes(platformToRemove)) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Remove Posted Platform',
        text2: 'This platform has already been posted and cannot be removed.',
      });
      return;
    }
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
    postedPlatforms,
  };
};
