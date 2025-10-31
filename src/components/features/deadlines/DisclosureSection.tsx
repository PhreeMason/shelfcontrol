import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  useCreateTemplate,
  useGetTemplates,
  useUpdateDeadlineDisclosure,
} from '@/hooks/useDisclosureTemplates';
import { useTheme } from '@/hooks/useTheme';
import { analytics } from '@/lib/analytics/client';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { DisclosureTemplate } from '@/types/disclosure.types';
import { getDeadlineSourceOptions } from '@/utils/getDeadlineSourceOptions';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { SourceSelector } from './SourceSelector';
import { TemplateSelector } from './TemplateSelector';

interface DisclosureSectionProps {
  deadline: ReadingDeadlineWithProgress;
}

export const DisclosureSection = ({ deadline }: DisclosureSectionProps) => {
  const { colors } = useTheme();
  const updateDeadlineDisclosureMutation = useUpdateDeadlineDisclosure();
  const createTemplateMutation = useCreateTemplate();

  const latestStatus =
    deadline.status && deadline.status.length > 0
      ? (deadline.status[deadline.status.length - 1].status ?? 'reading')
      : 'reading';

  const [isEditing, setIsEditing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(
    deadline.disclosure_source_name || null
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    deadline.disclosure_template_id || null
  );
  const [disclosureText, setDisclosureText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingDisclosureData, setPendingDisclosureData] = useState<{
    text: string;
    source: string;
    templateId: string | null;
  } | null>(null);
  const [shouldSaveAsTemplate, setShouldSaveAsTemplate] = useState(false);

  const sourceOptions = getDeadlineSourceOptions(deadline);
  const { data: templates = [] } = useGetTemplates(selectedSource || undefined);

  const currentDisclosure = deadline.disclosure_text || '';

  useEffect(() => {
    if (isEditing && selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setDisclosureText(template.disclosure_text);
      }
    }
  }, [selectedTemplateId, isEditing, templates]);

  const handleEditDisclosure = () => {
    setDisclosureText(currentDisclosure);
    if (!selectedSource && sourceOptions.length > 0) {
      setSelectedSource(sourceOptions[0].value);
    }
    setIsEditing(true);
  };

  const handleSelectTemplate = (template: DisclosureTemplate | null) => {
    if (template) {
      analytics.track('deadline_disclosure_template_selected', {
        deadline_id: deadline.id,
        template_name: template.template_name || 'Unnamed Template',
      });
      setSelectedTemplateId(template.id);
      setDisclosureText(template.disclosure_text);
    } else {
      setSelectedTemplateId(null);
      setDisclosureText('');
    }
  };

  const checkIfShouldPromptSave = (text: string, source: string): boolean => {
    if (!text.trim() || !source) return false;

    const existingTemplate = templates.find(
      t => t.disclosure_text.trim() === text.trim()
    );
    return !existingTemplate;
  };

  const saveDisclosure = (
    text: string,
    source: string,
    templateId: string | null
  ) => {
    const isNewDisclosure = !currentDisclosure;
    updateDeadlineDisclosureMutation.mutate(
      {
        deadlineId: deadline.id,
        disclosureData: {
          disclosure_text: text || null,
          disclosure_source_name: source || null,
          disclosure_template_id: templateId,
        },
      },
      {
        onSuccess: () => {
          if (isNewDisclosure) {
            analytics.track('deadline_disclosure_added', {
              deadline_id: deadline.id,
              deadline_status: latestStatus as
                | 'pending'
                | 'reading'
                | 'completed'
                | 'paused'
                | 'dnf',
              source,
              character_count: text.length,
              was_template_used: !!templateId,
            });
          } else {
            analytics.track('deadline_disclosure_edited', {
              deadline_id: deadline.id,
              deadline_status: latestStatus as
                | 'pending'
                | 'reading'
                | 'completed'
                | 'paused'
                | 'dnf',
              source,
              character_count: text.length,
            });
          }
          setIsEditing(false);
          setShouldSaveAsTemplate(false);
        },
        onError: () => {
          Alert.alert('Error', 'Failed to save disclosure');
        },
      }
    );
  };

  const handleSaveDisclosure = () => {
    if (!selectedSource) {
      Alert.alert('Error', 'Please select a source');
      return;
    }

    if (!shouldSaveAsTemplate) {
      saveDisclosure(disclosureText, selectedSource, null);
      return;
    }

    if (checkIfShouldPromptSave(disclosureText, selectedSource)) {
      setPendingDisclosureData({
        text: disclosureText,
        source: selectedSource,
        templateId: selectedTemplateId,
      });
      setShowSaveDialog(true);
    } else {
      saveDisclosure(disclosureText, selectedSource, selectedTemplateId);
    }
  };

  const handleSaveAsTemplate = (templateName: string) => {
    if (!pendingDisclosureData) return;

    createTemplateMutation.mutate(
      {
        source_name: pendingDisclosureData.source,
        ...(templateName && { template_name: templateName }),
        disclosure_text: pendingDisclosureData.text,
      },
      {
        onSuccess: newTemplate => {
          analytics.track('deadline_disclosure_saved_as_template', {
            template_name: templateName || 'Unnamed Template',
            character_count: pendingDisclosureData.text.length,
          });
          saveDisclosure(
            pendingDisclosureData.text,
            pendingDisclosureData.source,
            newTemplate.id
          );
          setShowSaveDialog(false);
          setPendingDisclosureData(null);
        },
        onError: () => {
          Alert.alert('Error', 'Failed to save template');
        },
      }
    );
  };

  const handleDontSaveAsTemplate = () => {
    if (pendingDisclosureData) {
      saveDisclosure(
        pendingDisclosureData.text,
        pendingDisclosureData.source,
        null
      );
    }
    setShowSaveDialog(false);
    setPendingDisclosureData(null);
  };

  const handleCancelDisclosure = () => {
    setIsEditing(false);
    setDisclosureText('');
    setSelectedSource(deadline.disclosure_source_name || null);
    setSelectedTemplateId(deadline.disclosure_template_id || null);
    setShouldSaveAsTemplate(false);
  };

  const handleCopyDisclosure = async () => {
    try {
      await Clipboard.setStringAsync(currentDisclosure);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleDeleteDisclosure = () => {
    Alert.alert(
      'Delete Disclosure',
      'Are you sure you want to delete this disclosure message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            updateDeadlineDisclosureMutation.mutate(
              {
                deadlineId: deadline.id,
                disclosureData: {
                  disclosure_text: null,
                  disclosure_source_name: null,
                  disclosure_template_id: null,
                },
              },
              {
                onSuccess: () => {
                  analytics.track('deadline_disclosure_deleted', {
                    deadline_id: deadline.id,
                    deadline_status: latestStatus as
                      | 'pending'
                      | 'reading'
                      | 'completed'
                      | 'paused'
                      | 'dnf',
                  });
                  setSelectedSource(null);
                  setSelectedTemplateId(null);
                  setDisclosureText('');
                },
                onError: () => {
                  Alert.alert('Error', 'Failed to delete disclosure');
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText variant="title">Disclosure Language</ThemedText>
          {deadline.disclosure_source_name && (
            <View
              style={[styles.sourceBadge, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={styles.sourceBadgeText}>
                {deadline.disclosure_source_name}
              </ThemedText>
            </View>
          )}
        </View>
        {!isEditing && currentDisclosure && (
          <View style={styles.actions}>
            <Pressable
              onPress={handleCopyDisclosure}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            >
              <IconSymbol
                name="doc.on.clipboard"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
            <Pressable
              onPress={handleEditDisclosure}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            >
              <IconSymbol name="pencil" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={handleDeleteDisclosure}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
              disabled={updateDeadlineDisclosureMutation.isPending}
              testID="delete-disclosure-button"
            >
              <IconSymbol
                name="trash"
                size={18}
                color={
                  updateDeadlineDisclosureMutation.isPending
                    ? colors.textMuted
                    : colors.danger
                }
              />
            </Pressable>
          </View>
        )}
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <SourceSelector
            value={selectedSource}
            options={sourceOptions}
            onChange={value => {
              setSelectedSource(value);
              setSelectedTemplateId(null);
              setDisclosureText('');
            }}
          />

          {selectedSource && templates.length > 0 && (
            <TemplateSelector
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={handleSelectTemplate}
            />
          )}

          <TextInput
            value={disclosureText}
            onChangeText={setDisclosureText}
            placeholder="Enter disclosure language or select a template above..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={[
              styles.textarea,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />

          {!currentDisclosure && (
            <Pressable
              onPress={() => setShouldSaveAsTemplate(!shouldSaveAsTemplate)}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: colors.border,
                    backgroundColor: shouldSaveAsTemplate
                      ? colors.primary
                      : 'transparent',
                  },
                ]}
              >
                {shouldSaveAsTemplate && (
                  <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <ThemedText style={styles.checkboxLabel}>
                Save this message as a template
              </ThemedText>
            </Pressable>
          )}

          <View style={styles.buttonRow}>
            <ThemedButton
              title="Cancel"
              onPress={handleCancelDisclosure}
              variant="outline"
              disabled={
                updateDeadlineDisclosureMutation.isPending ||
                createTemplateMutation.isPending
              }
              style={styles.cancelButton}
            />
            <ThemedButton
              title={
                updateDeadlineDisclosureMutation.isPending ||
                createTemplateMutation.isPending
                  ? 'Saving...'
                  : 'Save'
              }
              onPress={handleSaveDisclosure}
              disabled={
                updateDeadlineDisclosureMutation.isPending ||
                createTemplateMutation.isPending
              }
              style={styles.saveButton}
            />
          </View>
        </View>
      ) : (
        <>
          {currentDisclosure ? (
            <View style={styles.disclosureContainer}>
              <View
                style={[
                  styles.disclosureBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ThemedText style={styles.disclosureText}>
                  {currentDisclosure}
                </ThemedText>
              </View>
              {copySuccess && (
                <View
                  style={[
                    styles.copySuccessBadge,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <ThemedText style={styles.copySuccessText}>
                    Copied!
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <Pressable
              onPress={handleEditDisclosure}
              style={({ pressed }) => [
                styles.emptyState,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText variant="secondary" style={styles.emptyStateText}>
                + Add disclosure language
              </ThemedText>
            </Pressable>
          )}
        </>
      )}

      <ThemedText variant="secondary" style={styles.helpText}>
        Required disclosure language for reviews from this publisher or PR
        company
      </ThemedText>

      <SaveTemplateDialog
        visible={showSaveDialog}
        sourceName={pendingDisclosureData?.source || ''}
        onSave={handleSaveAsTemplate}
        onCancel={handleDontSaveAsTemplate}
      />
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
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editContainer: {
    gap: 16,
    marginBottom: 12,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  disclosureContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  disclosureBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  disclosureText: {
    fontSize: 14,
    lineHeight: 20,
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
  emptyState: {
    paddingVertical: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
});
