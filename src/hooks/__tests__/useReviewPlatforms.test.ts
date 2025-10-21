import { renderHook, act } from '@testing-library/react-native';
import { useReviewPlatforms } from '../useReviewPlatforms';

describe('useReviewPlatforms', () => {
  describe('initialization', () => {
    it('should initialize with empty state for non-NetGalley source', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      expect(result.current.selectedPlatforms.size).toBe(0);
      expect(result.current.hasBlog).toBe(false);
      expect(result.current.blogUrl).toBe('');
      expect(result.current.customPlatforms).toEqual([]);
      expect(result.current.newCustomPlatform).toBe('');
    });

    it('should initialize with NetGalley defaults for NetGalley source', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'NetGalley'));

      expect(result.current.selectedPlatforms.has('NetGalley')).toBe(true);
      expect(result.current.selectedPlatforms.has('Goodreads')).toBe(true);
      expect(result.current.selectedPlatforms.size).toBe(2);
    });

    it('should initialize with Publisher ARC defaults', () => {
      const { result } = renderHook(() =>
        useReviewPlatforms([], 'Publisher ARC')
      );

      expect(result.current.selectedPlatforms.has('Goodreads')).toBe(true);
      expect(result.current.selectedPlatforms.size).toBe(1);
    });

    it('should categorize user platforms on mount', () => {
      const userPlatforms = [
        'NetGalley',
        'Blog: https://myblog.com',
        'CustomPlatform',
      ];
      const { result } = renderHook(() =>
        useReviewPlatforms(userPlatforms, 'Personal')
      );

      expect(result.current.categorizedPlatforms.usedPresets).toContain(
        'NetGalley'
      );
      expect(result.current.categorizedPlatforms.blogs).toContain(
        'https://myblog.com'
      );
      expect(result.current.categorizedPlatforms.custom).toContain(
        'CustomPlatform'
      );
    });
  });

  describe('default values update on source change', () => {
    it('should update selected platforms when source changes to NetGalley', () => {
      const { result, rerender } = renderHook(
        (props: { source: string }) => useReviewPlatforms([], props.source),
        { initialProps: { source: 'Personal' } }
      );

      expect(result.current.selectedPlatforms.size).toBe(0);

      rerender({ source: 'NetGalley' });

      expect(result.current.selectedPlatforms.has('NetGalley')).toBe(true);
      expect(result.current.selectedPlatforms.has('Goodreads')).toBe(true);
    });

    it('should update selected platforms when source changes to Publisher ARC', () => {
      const { result, rerender } = renderHook(
        (props: { source: string }) => useReviewPlatforms([], props.source),
        { initialProps: { source: 'Personal' } }
      );

      rerender({ source: 'Publisher ARC' });

      expect(result.current.selectedPlatforms.has('Goodreads')).toBe(true);
    });
  });

  describe('togglePlatform', () => {
    it('should add platform when not selected', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.togglePlatform('NetGalley');
      });

      expect(result.current.selectedPlatforms.has('NetGalley')).toBe(true);
    });

    it('should remove platform when already selected', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'NetGalley'));

      expect(result.current.selectedPlatforms.has('NetGalley')).toBe(true);

      act(() => {
        result.current.togglePlatform('NetGalley');
      });

      expect(result.current.selectedPlatforms.has('NetGalley')).toBe(false);
    });

    it('should toggle multiple platforms independently', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.togglePlatform('NetGalley');
        result.current.togglePlatform('Goodreads');
      });

      expect(result.current.selectedPlatforms.has('NetGalley')).toBe(true);
      expect(result.current.selectedPlatforms.has('Goodreads')).toBe(true);

      act(() => {
        result.current.togglePlatform('NetGalley');
      });

      expect(result.current.selectedPlatforms.has('NetGalley')).toBe(false);
      expect(result.current.selectedPlatforms.has('Goodreads')).toBe(true);
    });
  });

  describe('custom platform management', () => {
    it('should add custom platform when input is valid', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('MyCustomPlatform');
      });

      expect(result.current.newCustomPlatform).toBe('MyCustomPlatform');

      act(() => {
        result.current.addCustomPlatform();
      });

      expect(result.current.customPlatforms).toContain('MyCustomPlatform');
      expect(result.current.newCustomPlatform).toBe('');
    });

    it('should trim custom platform name before adding', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('  MyCustomPlatform  ');
      });

      act(() => {
        result.current.addCustomPlatform();
      });

      expect(result.current.customPlatforms).toContain('MyCustomPlatform');
    });

    it('should not add custom platform when input is empty', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('');
        result.current.addCustomPlatform();
      });

      expect(result.current.customPlatforms).toEqual([]);
    });

    it('should not add custom platform when input is only whitespace', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('   ');
        result.current.addCustomPlatform();
      });

      expect(result.current.customPlatforms).toEqual([]);
    });

    it('should add multiple custom platforms', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('Platform1');
      });

      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.setNewCustomPlatform('Platform2');
      });

      act(() => {
        result.current.addCustomPlatform();
      });

      expect(result.current.customPlatforms).toEqual([
        'Platform1',
        'Platform2',
      ]);
    });

    it('should remove custom platform at specified index', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('Platform1');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.setNewCustomPlatform('Platform2');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.setNewCustomPlatform('Platform3');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      expect(result.current.customPlatforms).toEqual([
        'Platform1',
        'Platform2',
        'Platform3',
      ]);

      act(() => {
        result.current.removeCustomPlatform(1);
      });

      expect(result.current.customPlatforms).toEqual([
        'Platform1',
        'Platform3',
      ]);
    });

    it('should remove first custom platform', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('Platform1');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.setNewCustomPlatform('Platform2');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.removeCustomPlatform(0);
      });

      expect(result.current.customPlatforms).toEqual(['Platform2']);
    });

    it('should remove last custom platform', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('Platform1');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.setNewCustomPlatform('Platform2');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.removeCustomPlatform(1);
      });

      expect(result.current.customPlatforms).toEqual(['Platform1']);
    });
  });

  describe('blog URL management', () => {
    it('should set blog URL manually', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setBlogUrl('https://myblog.com');
      });

      expect(result.current.blogUrl).toBe('https://myblog.com');
    });

    it('should set hasBlog flag', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      expect(result.current.hasBlog).toBe(false);

      act(() => {
        result.current.setHasBlog(true);
      });

      expect(result.current.hasBlog).toBe(true);
    });

    it('should set default blog URL from categorized blogs when hasBlog is enabled', () => {
      const userPlatforms = ['Blog: https://existingblog.com'];
      const { result } = renderHook(() =>
        useReviewPlatforms(userPlatforms, 'Personal')
      );

      act(() => {
        result.current.setHasBlog(true);
      });

      expect(result.current.blogUrl).toBe('https://existingblog.com');
    });

    it('should not override manually set blog URL', () => {
      const userPlatforms = ['Blog: https://existingblog.com'];
      const { result } = renderHook(() =>
        useReviewPlatforms(userPlatforms, 'Personal')
      );

      act(() => {
        result.current.setBlogUrl('https://manualblog.com');
        result.current.setHasBlog(true);
      });

      expect(result.current.blogUrl).toBe('https://manualblog.com');
    });

    it('should not set default blog when no existing blogs are available', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setHasBlog(true);
      });

      expect(result.current.blogUrl).toBe('');
    });
  });

  describe('getAllSelectedPlatforms', () => {
    it('should return all selected preset platforms', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'NetGalley'));

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms).toContain('NetGalley');
      expect(allPlatforms).toContain('Goodreads');
    });

    it('should include blog when hasBlog is true and blogUrl is set', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setHasBlog(true);
        result.current.setBlogUrl('https://myblog.com');
      });

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms).toContain('Blog: https://myblog.com');
    });

    it('should not include blog when hasBlog is false', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setHasBlog(false);
        result.current.setBlogUrl('https://myblog.com');
      });

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms).not.toContain('Blog: https://myblog.com');
    });

    it('should not include blog when blogUrl is empty', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setHasBlog(true);
        result.current.setBlogUrl('');
      });

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms.some(p => p.startsWith('Blog:'))).toBe(false);
    });

    it('should trim blog URL before including', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setHasBlog(true);
        result.current.setBlogUrl('  https://myblog.com  ');
      });

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms).toContain('Blog: https://myblog.com');
    });

    it('should include all custom platforms', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      act(() => {
        result.current.setNewCustomPlatform('Platform1');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      act(() => {
        result.current.setNewCustomPlatform('Platform2');
      });
      act(() => {
        result.current.addCustomPlatform();
      });

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms).toContain('Platform1');
      expect(allPlatforms).toContain('Platform2');
    });

    it('should combine preset platforms, blog, and custom platforms', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'NetGalley'));

      act(() => {
        result.current.setHasBlog(true);
        result.current.setBlogUrl('https://myblog.com');
        result.current.setNewCustomPlatform('CustomPlatform');
      });

      act(() => {
        result.current.addCustomPlatform();
      });

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms).toContain('NetGalley');
      expect(allPlatforms).toContain('Goodreads');
      expect(allPlatforms).toContain('Blog: https://myblog.com');
      expect(allPlatforms).toContain('CustomPlatform');
      expect(allPlatforms.length).toBe(4);
    });

    it('should return empty array when no platforms are selected', () => {
      const { result } = renderHook(() => useReviewPlatforms([], 'Personal'));

      const allPlatforms = result.current.getAllSelectedPlatforms();

      expect(allPlatforms).toEqual([]);
    });
  });

  describe('categorized platforms reactivity', () => {
    it('should update categorized platforms when userPlatforms change', () => {
      const { result, rerender } = renderHook(
        (props: { platforms: string[] }) =>
          useReviewPlatforms(props.platforms, 'Personal'),
        { initialProps: { platforms: [] as string[] } }
      );

      expect(result.current.categorizedPlatforms.usedPresets).toEqual([]);

      rerender({ platforms: ['NetGalley', 'Goodreads'] });

      expect(result.current.categorizedPlatforms.usedPresets).toContain(
        'NetGalley'
      );
      expect(result.current.categorizedPlatforms.usedPresets).toContain(
        'Goodreads'
      );
    });
  });
});
