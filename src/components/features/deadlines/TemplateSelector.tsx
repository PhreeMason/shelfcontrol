import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useThemeColor';
import { DisclosureTemplate } from '@/types/disclosure.types';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface TemplateSelectorProps {
  templates: DisclosureTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: DisclosureTemplate | null) => void;
  label?: string;
  testID?: string;
}

export const TemplateSelector = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  label = 'Choose a template or write custom',
  testID = 'template-selector',
}: TemplateSelectorProps) => {
  const { colors } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const getDisplayText = () => {
    if (!selectedTemplateId) {
      return 'Write custom disclosure';
    }
    if (selectedTemplate) {
      return selectedTemplate.template_name || 'Unnamed template';
    }
    return 'Select a template';
  };

  const getPreviewText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText variant="default" style={styles.label}>
          {label}
        </ThemedText>
      )}

      <Pressable
        testID={testID}
        onPress={() => setShowDropdown(!showDropdown)}
        style={[
          styles.selectButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.selectContent}>
          <ThemedText
            color={selectedTemplate ? 'text' : 'textMuted'}
            style={styles.selectText}
          >
            {getDisplayText()}
          </ThemedText>
          {selectedTemplate && (
            <ThemedText color="textMuted" style={styles.preview}>
              {getPreviewText(selectedTemplate.disclosure_text)}
            </ThemedText>
          )}
        </View>
        <IconSymbol
          name="chevron.down"
          size={16}
          color={colors.textMuted}
          style={[styles.chevron, showDropdown && styles.chevronRotated]}
        />
      </Pressable>

      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <FlatList
            data={[
              {
                id: null,
                template_name: '+ Write custom disclosure',
                disclosure_text: '',
              },
              ...templates,
            ]}
            keyExtractor={(item, index) => item.id || `custom-${index}`}
            renderItem={({ item }) => {
              const isCustom = item.id === null;
              const isSelected = isCustom
                ? selectedTemplateId === null
                : selectedTemplateId === item.id;

              return (
                <TouchableOpacity
                  testID={`template-option-${item.id || 'custom'}`}
                  style={[
                    styles.dropdownItem,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: isSelected
                        ? `${colors.primary}20`
                        : colors.surface,
                    },
                  ]}
                  onPress={() => {
                    onSelectTemplate(
                      isCustom ? null : (item as DisclosureTemplate)
                    );
                    setShowDropdown(false);
                  }}
                >
                  <View style={styles.dropdownItemContent}>
                    <ThemedText
                      color={isSelected ? 'primary' : 'text'}
                      style={[
                        styles.dropdownItemText,
                        isCustom && styles.customOptionText,
                      ]}
                    >
                      {item.template_name || 'Unnamed template'}
                    </ThemedText>
                    {!isCustom && item.disclosure_text && (
                      <ThemedText
                        color="textMuted"
                        style={styles.dropdownPreview}
                      >
                        {getPreviewText(item.disclosure_text, 60)}
                      </ThemedText>
                    )}
                  </View>
                  {isSelected && (
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            scrollEnabled={templates.length > 5}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  selectContent: {
    flex: 1,
    gap: 4,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '600',
  },
  preview: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemContent: {
    flex: 1,
    gap: 4,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customOptionText: {
    fontWeight: '400',
  },
  dropdownPreview: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
