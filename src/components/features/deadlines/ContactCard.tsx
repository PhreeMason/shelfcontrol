import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useTheme';
import { DeadlineContact } from '@/types/contacts.types';
import { Pressable, StyleSheet, View } from 'react-native';

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

  const hasName =
    contact.contact_name && contact.contact_name.trim().length > 0;
  const hasEmail = contact.email && contact.email.trim().length > 0;
  const hasUsername = contact.username && contact.username.trim().length > 0;

  return (
    <ThemedView style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.contentContainer}>
        {hasName && (
          <View style={styles.infoRow}>
            <IconSymbol name="person.fill" size={16} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              {contact.contact_name}
            </ThemedText>
          </View>
        )}

        {hasEmail && (
          <View style={styles.infoRow}>
            <IconSymbol name="envelope" size={16} color={colors.primary} />
            <ThemedText style={styles.infoText}>{contact.email}</ThemedText>
          </View>
        )}

        {hasUsername && (
          <View style={styles.infoRow}>
            <IconSymbol name="at" size={16} color={colors.primary} />
            <ThemedText style={styles.infoText}>{contact.username}</ThemedText>
          </View>
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
  );
};

const styles = StyleSheet.create({
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
});
