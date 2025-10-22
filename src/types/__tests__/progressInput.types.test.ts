import {
  DEFAULT_PROGRESS_INPUT_MODES,
  getAvailableModesForFormat,
  getModeLabelForFormat,
} from '../progressInput.types';

describe('progressInput.types', () => {
  describe('DEFAULT_PROGRESS_INPUT_MODES', () => {
    it('should have direct mode as default for all formats', () => {
      expect(DEFAULT_PROGRESS_INPUT_MODES.physical).toBe('direct');
      expect(DEFAULT_PROGRESS_INPUT_MODES.eBook).toBe('direct');
      expect(DEFAULT_PROGRESS_INPUT_MODES.audio).toBe('direct');
    });
  });

  describe('getAvailableModesForFormat', () => {
    it('should return direct and percentage for physical format', () => {
      const modes = getAvailableModesForFormat('physical');
      expect(modes).toEqual(['direct', 'percentage']);
      expect(modes).toHaveLength(2);
    });

    it('should return direct and percentage for eBook format', () => {
      const modes = getAvailableModesForFormat('eBook');
      expect(modes).toEqual(['direct', 'percentage']);
      expect(modes).toHaveLength(2);
    });

    it('should return direct, percentage, and remaining for audio format', () => {
      const modes = getAvailableModesForFormat('audio');
      expect(modes).toEqual(['direct', 'percentage', 'remaining']);
      expect(modes).toHaveLength(3);
    });

    it('should not mutate the returned array', () => {
      const modes1 = getAvailableModesForFormat('audio');
      const modes2 = getAvailableModesForFormat('audio');
      expect(modes1).toEqual(modes2);
    });
  });

  describe('getModeLabelForFormat', () => {
    describe('direct mode labels', () => {
      it('should return "Page" for physical format', () => {
        expect(getModeLabelForFormat('direct', 'physical')).toBe('Page');
      });

      it('should return "Page" for eBook format', () => {
        expect(getModeLabelForFormat('direct', 'eBook')).toBe('Page');
      });

      it('should return "Time" for audio format', () => {
        expect(getModeLabelForFormat('direct', 'audio')).toBe('Time');
      });
    });

    describe('percentage mode labels', () => {
      it('should return "%" for all formats', () => {
        expect(getModeLabelForFormat('percentage', 'physical')).toBe('%');
        expect(getModeLabelForFormat('percentage', 'eBook')).toBe('%');
        expect(getModeLabelForFormat('percentage', 'audio')).toBe('%');
      });
    });

    describe('remaining mode labels', () => {
      it('should return "Left" for all formats', () => {
        expect(getModeLabelForFormat('remaining', 'physical')).toBe('Left');
        expect(getModeLabelForFormat('remaining', 'eBook')).toBe('Left');
        expect(getModeLabelForFormat('remaining', 'audio')).toBe('Left');
      });
    });

    describe('format-specific behavior', () => {
      it('should differentiate between page-based and time-based formats for direct mode', () => {
        const physicalLabel = getModeLabelForFormat('direct', 'physical');
        const audioLabel = getModeLabelForFormat('direct', 'audio');

        expect(physicalLabel).toBe('Page');
        expect(audioLabel).toBe('Time');
        expect(physicalLabel).not.toBe(audioLabel);
      });

      it('should use consistent labels for percentage across all formats', () => {
        const labels = [
          getModeLabelForFormat('percentage', 'physical'),
          getModeLabelForFormat('percentage', 'eBook'),
          getModeLabelForFormat('percentage', 'audio'),
        ];

        expect(new Set(labels).size).toBe(1);
        expect(labels[0]).toBe('%');
      });
    });
  });
});
