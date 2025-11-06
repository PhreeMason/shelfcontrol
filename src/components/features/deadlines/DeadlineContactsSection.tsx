import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
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
import { Alert, Pressable, StyleSheet, View } from 'react-native';
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
        <View style={styles.titleColumn}>
          <ThemedText variant="title">Contacts</ThemedText>
          <ThemedText variant="secondary" style={styles.benefitText}>
            Track publisher relationships
          </ThemedText>
        </View>
        {!isAdding && !editingContactId && (
          <Pressable
            onPress={() => setIsAdding(true)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}>
            <IconSymbol
              name="plus.circle.fill"
              size={20}
              color={Colors.light.darkPurple}
              style={styles.addIcon}
            />
            <ThemedText style={styles.addButtonText}>Add</ThemedText>
          </Pressable>
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
            <Pressable
              style={styles.emptyStateCard}
              onPress={() => setIsAdding(true)}>
              <View style={styles.ghostContact}>
                <View style={styles.ghostIcon}>
                  <IconSymbol
                    name="person.circle.fill"
                    size={40}
                    color={Colors.light.primary}
                    style={styles.ghostIconSymbol}
                  />
                </View>
                <View style={styles.ghostContactInfo}>
                  <View style={[styles.ghostText, styles.ghostTextShort]} />
                  <View style={[styles.ghostText, styles.ghostTextMedium]} />
                </View>
              </View>
              <ThemedText variant="secondary" style={styles.emptyCta}>
                Add publisher, PR rep, or author contact
              </ThemedText>
            </Pressable>
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
    padding: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleColumn: {
    flex: 1,
  },
  benefitText: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addIcon: {
    marginRight: 2,
  },
  addButtonText: {
    color: Colors.light.darkPurple,
    fontSize: 16,
    fontWeight: '600',
  },
  contactsList: {
    gap: 12,
    marginBottom: 12,
  },
  addForm: {
    marginTop: 4,
  },
  emptyStateCard: {
    backgroundColor: Colors.light.cardEmptyState,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.light.primary,
    opacity: 0.7,
  },
  ghostContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ghostIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostIconSymbol: {
    opacity: 0.4,
  },
  ghostContactInfo: {
    flex: 1,
    gap: 6,
  },
  ghostText: {
    height: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
    opacity: 0.15,
  },
  ghostTextShort: {
    width: 120,
  },
  ghostTextMedium: {
    width: 180,
  },
  emptyCta: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
