import { exportService } from '@/services/export.service';
import { useMutation } from '@tanstack/react-query';

export const useExportReadingProgress = () => {
  return useMutation({
    mutationKey: ['exportReadingProgress'],
    mutationFn: async () => {
      return exportService.exportReadingProgress();
    },
    onError: error => {
      console.error('Error exporting reading progress:', error);
    },
  });
};