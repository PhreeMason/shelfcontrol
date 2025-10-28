import CustomInput from '@/components/shared/CustomInput';
import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useTheme';
import {
  ContactFormData,
  contactFormSchema,
} from '@/schemas/contactFormSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
  defaultValues?: ContactFormData;
  submitLabel?: string;
}

export const ContactForm = ({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = 'Save',
}: ContactFormProps) => {
  const { colors } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultValues || {
      contact_name: '',
      email: '',
      username: '',
    },
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <IconSymbol name="person.fill" size={16} color={colors.textMuted} />
          <ThemedText variant="secondary" style={styles.label}>
            Name (optional)
          </ThemedText>
        </View>
        <CustomInput
          control={control}
          name="contact_name"
          testID="input-contact-name"
          placeholder="Publisher, PR rep, or author name"
        />
      </View>

      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <IconSymbol name="envelope" size={16} color={colors.textMuted} />
          <ThemedText variant="secondary" style={styles.label}>
            Email (optional)
          </ThemedText>
        </View>
        <CustomInput
          control={control}
          name="email"
          testID="input-email"
          placeholder="contact@publisher.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <IconSymbol name="at" size={16} color={colors.textMuted} />
          <ThemedText variant="secondary" style={styles.label}>
            Username (optional)
          </ThemedText>
        </View>
        <CustomInput
          control={control}
          name="username"
          testID="input-username"
          placeholder="@username or handle"
          autoCapitalize="none"
        />
      </View>

      {errors.contact_name && (
        <ThemedText color="danger" style={styles.error}>
          {errors.contact_name.message}
        </ThemedText>
      )}

      <View style={styles.buttonRow}>
        <ThemedButton
          title={submitLabel}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitButton}
        />
        <ThemedButton
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.cancelButton}
        />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  fieldContainer: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  error: {
    fontSize: 13,
    marginTop: -8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});
