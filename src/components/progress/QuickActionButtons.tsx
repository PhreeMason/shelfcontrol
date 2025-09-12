import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedButton } from '../themed';

interface QuickActionButtonsProps {
    onQuickUpdate: (increment: number) => void;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
    onQuickUpdate
}) => {

    return (
        <View style={styles.quickButtons}>
            <ThemedButton
                title={`-${1}`}
                variant="accent"
                style={styles.quickBtn}
                onPress={() => onQuickUpdate(-1)}
            />
            <ThemedButton
                title={`+1`}
                variant="accent"
                style={styles.quickBtn}
                onPress={() => onQuickUpdate(1)}
            />
            <ThemedButton
                title={`+${5}`}
                variant="accent"
                style={styles.quickBtn}
                onPress={() => onQuickUpdate(5)}
            />
            <ThemedButton
                title={`+${5 * 2}`}
                variant="accent"
                style={styles.quickBtn}
                onPress={() => onQuickUpdate(5 * 2)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    quickButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        gap: 8,
    },
    quickBtn: {
        flex: 1,
    },
});

export default QuickActionButtons;
