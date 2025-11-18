import { ThemedButton, ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing, Typography } from '@/constants/Colors';
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
        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <ThemedText variant="title">Disclosure Language</ThemedText>
            {deadline.disclosure_source_name && (
              <View
                style={[
                  styles.sourceBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <ThemedText typography="bodyMedium" style={[styles.sourceBadgeText, { color: colors.textInverse }]}>
                  {deadline.disclosure_source_name}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText variant="secondary" style={styles.benefitText}>
            Reuse required review language
          </ThemedText>
        </View>
        {!isEditing && !currentDisclosure && (
          <Pressable
            onPress={handleEditDisclosure}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <IconSymbol
              name="plus.circle.fill"
              size={20}
              color={colors.darkPurple}
              style={styles.addIcon}
            />
            <ThemedText
              typography="titleMedium"
              style={[styles.addButtonText, { color: colors.darkPurple }]}
            >
              Add
            </ThemedText>
          </Pressable>
        )}
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
                  <IconSymbol name="checkmark" size={14} color={colors.textInverse} />
                )}
              </View>
              <ThemedText typography="bodyMedium" style={styles.checkboxLabel}>
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
                <ThemedText typography="bodyMedium" style={styles.disclosureText}>
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
                  <ThemedText typography="bodyMedium" style={[styles.copySuccessText, { color: colors.textInverse }]}>
                    Copied!
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <Pressable
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: colors.cardEmptyState,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleEditDisclosure}
            >
              <View style={styles.ghostBadgeContainer}>
                <View
                  style={[
                    styles.ghostBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <ThemedText
                    typography="bodyMedium"
                    style={[styles.ghostBadgeText, { color: colors.primary }]}
                  >
                    NetGalley
                  </ThemedText>
                </View>
              </View>
              <View
                style={[
                  styles.ghostDisclosure,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.ghostDisclosureLine,
                    { width: '100%', backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.ghostDisclosureLine,
                    { width: '80%', backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.ghostDisclosureLine,
                    { width: '60%', backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <ThemedText typography="bodyMedium" color="textSecondary" style={styles.emptyCta}>
                Add required disclosure language
              </ThemedText>
            </Pressable>
          )}
        </>
      )}

      <ThemedText typography="bodyMedium" color="textSecondary" style={styles.helpText}>
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
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  benefitText: {
    marginTop: 2,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceBadgeText: {
    fontWeight: '600',
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
    fontWeight: '600',
    transform: [{ translateY: 1 }],
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
    ...Typography.bodyMedium,
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
    // Typography token provides fontSize and lineHeight
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
    fontWeight: '600',
  },
  emptyStateCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.7,
    marginBottom: 12,
  },
  ghostBadgeContainer: {
    marginBottom: 12,
  },
  ghostBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    opacity: 0.3,
  },
  ghostBadgeText: {
    fontWeight: '600',
  },
  ghostDisclosure: {
    opacity: 0.1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  ghostDisclosureLine: {
    height: 14,
    borderRadius: 4,
    opacity: 0.15,
  },
  emptyCta: {
    textAlign: 'center',
    fontWeight: '500',
  },
  helpText: {
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
    // Typography token provides fontSize and lineHeight
  },
});
