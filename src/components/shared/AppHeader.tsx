import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
    title: string;
    onBack: () => void;
    rightElement?: React.ReactNode;
    showBackButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    onBack,
    rightElement,
    showBackButton = true,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={['#E8C2B9', '#B8A9D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 8 }]}
        >
            {showBackButton ? (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={Platform.OS === 'ios' ? 24 : 40} color={"white"} />
                </TouchableOpacity>
            ) : (
                <View style={styles.backButton} />
            )}

            <ThemedText variant="title" style={[styles.headerTitle, {color: 'white'}]}>
                {title}
            </ThemedText>

            {rightElement || <View style={styles.headerSpacer} />}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    backButton: {
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
});

export default AppHeader;