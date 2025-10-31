import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useTheme';
import { DeadlineContact } from '@/types/contacts.types';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

interface ContactCardProps {
  contact: DeadlineContact;
  onEdit: () => void;
  onDelete: () => void;
}

export const ContactCard = ({
  contact,
  onEdit,
  onDelete,
}: ContactCardProps) => {
  const { colors } = useTheme();
  const [copySuccess, setCopySuccess] = useState(false);

  const hasName =
    contact.contact_name && contact.contact_name.trim().length > 0;
  const hasEmail = contact.email && contact.email.trim().length > 0;
  const hasUsername = contact.username && contact.username.trim().length > 0;

  const handleLongPressCopy = async (value: string | null) => {
    if (!value || value.trim().length === 0) return;

    try {
      await Clipboard.setStringAsync(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <ThemedView style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.contentContainer}>
        {hasName && (
          <Pressable
            onLongPress={() =>
              handleLongPressCopy(contact.contact_name)
            }
            style={({ pressed }) => [
              styles.infoRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <IconSymbol name="person.fill" size={16} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              {contact.contact_name}
            </ThemedText>
          </Pressable>
        )}

        {hasEmail && (
          <Pressable
            onLongPress={() => handleLongPressCopy(contact.email)}
            style={({ pressed }) => [
              styles.infoRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <IconSymbol name="envelope" size={16} color={colors.primary} />
            <ThemedText style={styles.infoText}>{contact.email}</ThemedText>
          </Pressable>
        )}

        {hasUsername && (
          <Pressable
            onLongPress={() =>
              handleLongPressCopy(contact.username)
            }
            style={({ pressed }) => [
              styles.infoRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <IconSymbol name="at" size={16} color={colors.primary} />
            <ThemedText style={styles.infoText}>{contact.username}</ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <IconSymbol name="pencil" size={16} color={colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.danger} />
        </Pressable>
      </View>
      </ThemedView>
      {copySuccess && (
        <View
          style={[styles.copySuccessBadge, { backgroundColor: colors.success }]}
        >
          <ThemedText style={styles.copySuccessText}>Copied!</ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  contentContainer: {
    flex: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    // paddingHorizontal: 1,
  },
  copySuccessBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  copySuccessText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
