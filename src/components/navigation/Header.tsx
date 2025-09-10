import { ThemedText, ThemedView } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import TodaysGoals from '../progress/TodaysGoals';

const Header = () => {
    const today = Date.now();
    const formattedDate = dayjs(today).format('dddd, MMMM D');
    const insets = useSafeAreaInsets();
    const handleSettingsPress = () => {
        // router.push('/settings');
        console.log('Settings button pressed');
    };

    return (
        <LinearGradient
            colors={['#E8C2B9', '#B8A9D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}
        >
            <ThemedView style={styles.dateRow}>
                <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
                <TouchableOpacity
                    style={styles.settings}
                    onPress={handleSettingsPress}
                >
                    <IconSymbol size={28} name="gearshape.fill" color={"rgba(222, 222, 222, 0.76)"} />
                </TouchableOpacity>
            </ThemedView>
            {/* <TodaysGoals /> */}
        </LinearGradient>

    );
};

export default Header

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        gap: 10,
        paddingHorizontal: 20,
        paddingBottom: 13,
    },
    dateRow: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
        paddingTop: 18
    },
    dateText: {
        fontSize: 26,
        fontFamily: 'Nunito-Bold',
        letterSpacing: -0.4,
        lineHeight: 30,
        color: 'rgba(250, 248, 245, 1)',
    },
    statusSummary: {
        fontSize: 14,
    },
    readingTimeSummary: {
        fontSize: 14,
    },
    settings: {
        padding: 1,
        borderRadius: 50,
    }

})