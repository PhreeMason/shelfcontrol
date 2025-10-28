import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import {
  CreateDisclosureTemplateInput,
  DisclosureTemplate,
  UpdateDisclosureTemplateInput,
} from '@/types/disclosure.types';
import { activityService } from './activity.service';

class DisclosureTemplatesService {
  async getTemplates(
    userId: string,
    sourceName?: string
  ): Promise<DisclosureTemplate[]> {
    let query = supabase
      .from(DB_TABLES.DISCLOSURE_TEMPLATES as any)
      .select('*')
      .eq('user_id', userId);

    if (sourceName) {
      query = query.eq('source_name', sourceName);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;
    return data as unknown as DisclosureTemplate[];
  }

  async getTemplateById(
    templateId: string,
    userId: string
  ): Promise<DisclosureTemplate> {
    const { data, error } = await supabase
      .from(DB_TABLES.DISCLOSURE_TEMPLATES as any)
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    if (!data?.[0]) throw new Error('Template not found');

    return data[0] as unknown as DisclosureTemplate;
  }

  async createTemplate(
    userId: string,
    templateData: CreateDisclosureTemplateInput
  ): Promise<DisclosureTemplate> {
    const finalTemplateId = generateId('dt');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.DISCLOSURE_TEMPLATES as any)
      .insert({
        id: finalTemplateId,
        user_id: userId,
        source_name: templateData.source_name,
        template_name: templateData.template_name ?? null,
        disclosure_text: templateData.disclosure_text,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('disclosure_template_created', {
      templateId: finalTemplateId,
      sourceName: templateData.source_name,
    });

    return data as unknown as DisclosureTemplate;
  }

  async updateTemplate(
    templateId: string,
    userId: string,
    templateData: UpdateDisclosureTemplateInput
  ): Promise<DisclosureTemplate> {
    const { data, error } = await supabase
      .from(DB_TABLES.DISCLOSURE_TEMPLATES as any)
      .update({
        ...templateData,
      })
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .limit(1);

    if (error) throw error;

    activityService.trackUserActivity('disclosure_template_updated', {
      templateId,
    });

    return data?.[0] as unknown as DisclosureTemplate;
  }

  async deleteTemplate(templateId: string, userId: string): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.DISCLOSURE_TEMPLATES as any)
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) throw error;

    activityService.trackUserActivity('disclosure_template_deleted', {
      templateId,
    });

    return templateId;
  }

  async updateDeadlineDisclosure(
    deadlineId: string,
    userId: string,
    disclosureData: {
      disclosure_text: string | null;
      disclosure_source_name: string | null;
      disclosure_template_id?: string | null;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from(DB_TABLES.DEADLINES as any)
      .update({
        disclosure_text: disclosureData.disclosure_text,
        disclosure_source_name: disclosureData.disclosure_source_name,
        disclosure_template_id: disclosureData.disclosure_template_id ?? null,
      })
      .eq('id', deadlineId)
      .eq('user_id', userId);

    if (error) throw error;

    activityService.trackUserActivity('deadline_disclosure_updated', {
      deadlineId,
    });
  }
}

export const disclosureTemplatesService = new DisclosureTemplatesService();
