import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
  showBackButton?: boolean;
  headerStyle?: object;
  children?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightElement,
  children,
  showBackButton = true,
  headerStyle = {},
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.accent, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 10) + 8, ...headerStyle },
      ]}
    >
      <View style={styles.headerContent}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <IconSymbol
              name="chevron.left"
              size={Platform.OS === 'ios' ? 24 : 40}
              color={'white'}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <ThemedText
          variant="headline"
          style={[styles.headerTitle, { color: colors.textOnPrimary }]}
        >
          {title}
        </ThemedText>

        {rightElement || <View style={styles.headerSpacer} />}
      </View>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
});

export default AppHeader;
