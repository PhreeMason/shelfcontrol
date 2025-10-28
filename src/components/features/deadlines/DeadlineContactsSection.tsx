import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import {
  useAddContact,
  useDeleteContact,
  useGetContacts,
  useUpdateContact,
} from '@/hooks/useContacts';
import { analytics } from '@/lib/analytics/client';
import { ContactFormData } from '@/schemas/contactFormSchema';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ContactCard } from './ContactCard';
import { ContactForm } from './ContactForm';

interface DeadlineContactsSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DeadlineContactsSection = ({
  deadline,
}: DeadlineContactsSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const { data: contacts = [], isLoading } = useGetContacts(deadline.id);
  const addContactMutation = useAddContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();

  const latestStatus =
    deadline.status && deadline.status.length > 0
      ? (deadline.status[deadline.status.length - 1].status ?? 'reading')
      : 'reading';

  const handleAddContact = (data: ContactFormData) => {
    addContactMutation.mutate(
      {
        deadlineId: deadline.id,
        contactData: {
          contact_name: data.contact_name || null,
          email: data.email || null,
          username: data.username || null,
        },
      },
      {
        onSuccess: () => {
          analytics.track('deadline_contact_added', {
            deadline_id: deadline.id,
            deadline_status: latestStatus as
              | 'pending'
              | 'reading'
              | 'completed'
              | 'paused'
              | 'dnf',
            has_email: !!data.email,
            has_username: !!data.username,
            has_name: !!data.contact_name,
          });
          setIsAdding(false);
        },
      }
    );
  };

  const handleUpdateContact = (contactId: string, data: ContactFormData) => {
    updateContactMutation.mutate(
      {
        contactId,
        deadlineId: deadline.id,
        contactData: {
          contact_name: data.contact_name || null,
          email: data.email || null,
          username: data.username || null,
        },
      },
      {
        onSuccess: () => {
          analytics.track('deadline_contact_edited', {
            deadline_id: deadline.id,
            deadline_status: latestStatus as
              | 'pending'
              | 'reading'
              | 'completed'
              | 'paused'
              | 'dnf',
            has_email: !!data.email,
            has_username: !!data.username,
            has_name: !!data.contact_name,
          });
          setEditingContactId(null);
        },
      }
    );
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContactMutation.mutate(
              {
                contactId,
                deadlineId: deadline.id,
              },
              {
                onSuccess: () => {
                  analytics.track('deadline_contact_deleted', {
                    deadline_id: deadline.id,
                    deadline_status: latestStatus as
                      | 'pending'
                      | 'reading'
                      | 'completed'
                      | 'paused'
                      | 'dnf',
                  });
                },
              }
            );
          },
        },
      ]
    );
  };

  const editingContact = contacts.find(c => c.id === editingContactId);

  return (
    <ThemedView style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText variant="title">Contacts</ThemedText>
        </View>
        {!isAdding && !editingContactId && (
          <ThemedButton
            title="+ Add"
            onPress={() => setIsAdding(true)}
            variant="ghost"
            style={styles.addButton}
          />
        )}
      </View>

      {isLoading ? (
        <ThemedText variant="secondary">Loading contacts...</ThemedText>
      ) : (
        <View style={styles.contactsList}>
          {contacts.map(contact => (
            <View key={contact.id}>
              {editingContactId === contact.id ? (
                <ContactForm
                  onSubmit={data => handleUpdateContact(contact.id, data)}
                  onCancel={() => setEditingContactId(null)}
                  defaultValues={{
                    contact_name: editingContact?.contact_name || '',
                    email: editingContact?.email || '',
                    username: editingContact?.username || '',
                  }}
                />
              ) : (
                <ContactCard
                  contact={contact}
                  onEdit={() => setEditingContactId(contact.id)}
                  onDelete={() => handleDeleteContact(contact.id)}
                />
              )}
            </View>
          ))}

          {isAdding && (
            <View style={styles.addForm}>
              <ContactForm
                onSubmit={handleAddContact}
                onCancel={() => setIsAdding(false)}
              />
            </View>
          )}

          {contacts.length === 0 && !isAdding && (
            <ThemedText variant="secondary" style={styles.emptyText}>
              No contacts added yet
            </ThemedText>
          )}
        </View>
      )}

      <ThemedText variant="secondary" style={styles.helpText}>
        Track publisher contacts, PR reps, authors, or coordinators
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contactsList: {
    gap: 12,
    marginBottom: 12,
  },
  addForm: {
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
