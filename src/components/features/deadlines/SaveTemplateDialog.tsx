import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useTheme } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SaveTemplateDialogProps {
  visible: boolean;
  sourceName: string;
  onSave: (templateName: string) => void;
  onCancel: () => void;
  testID?: string;
}

export const SaveTemplateDialog = ({
  visible,
  sourceName,
  onSave,
  onCancel,
  testID = 'save-template-dialog',
}: SaveTemplateDialogProps) => {
  const { colors } = useTheme();
  const [templateName, setTemplateName] = useState('');

  const handleSave = () => {
    onSave(templateName.trim());
    setTemplateName('');
  };

  const handleCancel = () => {
    onCancel();
    setTemplateName('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      testID={testID}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.header}>
            <ThemedText variant="title" style={styles.title}>
              Save as Template
            </ThemedText>
            <ThemedText color="textMuted" style={styles.subtitle}>
              Save this disclosure as a reusable template for {sourceName}?
            </ThemedText>
          </View>

          <View style={styles.content}>
            <ThemedText variant="default" style={styles.label}>
              Template name (optional)
            </ThemedText>
            <TextInput
              testID="template-name-input"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g., Standard, Holiday Promo 2025"
              placeholderTextColor={colors.textMuted}
              value={templateName}
              onChangeText={setTemplateName}
              autoFocus
            />
            <ThemedText color="textMuted" style={styles.hint}>
              If left blank, it will be saved as "Unnamed template"
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              testID="save-template-cancel"
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: colors.background },
              ]}
              onPress={handleCancel}
            >
              <ThemedText style={styles.buttonText}>Skip template</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              testID="save-template-confirm"
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSave}
            >
              <ThemedText style={[styles.buttonText, styles.saveButtonText]}>
                Save as template
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 500,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.premium,
  },
  header: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 17,
  },
  content: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {},
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});
