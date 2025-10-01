import { supabase } from '@/lib/supabase';

export interface ExportResponse {
  message: string;
  filename: string;
  recordCount: number;
  emailId: string;
}

export interface ExportError {
  error: string;
  message?: string;
  details?: string;
}

class ExportService {
  async exportReadingProgress(): Promise<ExportResponse> {
    const { data, error } = await supabase.functions.invoke<ExportResponse>(
      'export-reading-progress',
      {
        method: 'POST',
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      const errorMessage = (error as any)?.message || 'Failed to export data';
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error('No data returned from export function');
    }

    return data;
  }
}

export const exportService = new ExportService();
