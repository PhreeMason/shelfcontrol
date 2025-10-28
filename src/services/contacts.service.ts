import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import { DeadlineContact, DeadlineContactUpdate } from '@/types/contacts.types';
import { activityService } from './activity.service';

class ContactsService {
  async getContacts(
    userId: string,
    deadlineId: string
  ): Promise<DeadlineContact[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_CONTACTS as any)
      .select('*')
      .eq('user_id', userId)
      .eq('deadline_id', deadlineId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as DeadlineContact[];
  }

  async addContact(
    userId: string,
    deadlineId: string,
    contactData: {
      contact_name?: string | null;
      email?: string | null;
      username?: string | null;
    }
  ): Promise<DeadlineContact> {
    const finalContactId = generateId('dc');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.DEADLINE_CONTACTS as any)
      .insert({
        id: finalContactId,
        user_id: userId,
        deadline_id: deadlineId,
        contact_name: contactData.contact_name ?? null,
        email: contactData.email ?? null,
        username: contactData.username ?? null,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('contact_created', {
      deadlineId,
      contactId: finalContactId,
    });

    return data as unknown as DeadlineContact;
  }

  async updateContact(
    contactId: string,
    userId: string,
    contactData: DeadlineContactUpdate
  ): Promise<DeadlineContact> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_CONTACTS as any)
      .update({
        ...contactData,
      })
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .limit(1);

    if (error) throw error;

    activityService.trackUserActivity('contact_updated', {
      contactId,
    });

    return data?.[0] as unknown as DeadlineContact;
  }

  async deleteContact(contactId: string, userId: string): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.DEADLINE_CONTACTS as any)
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId);

    if (error) throw error;

    activityService.trackUserActivity('contact_deleted', {
      contactId,
    });

    return contactId;
  }
}

export const contactsService = new ContactsService();
