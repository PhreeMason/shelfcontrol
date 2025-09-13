import { ThemedText } from '@/components/themed';
import { useTheme } from '@/theme';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    View
} from 'react-native';

type CustomInputProps<T extends FieldValues> = {
    control: Control<T>; // custom fields
    name: Path<T>;
    inputType?: 'string' | 'number' | 'integer'; // explicit type declaration
} & TextInputProps;

export default function CustomInput<T extends FieldValues>({
    control,
    name,
    inputType = 'string', // default to string
    ...props
}: CustomInputProps<T>) {
    const { theme } = useTheme();
    const textMutedColor = theme.textMuted;
    const cardColor = theme.surface;
    const textColor = theme.text;
    const borderColor = theme.border;
    const dangerColor = theme.danger;

    return (
        <Controller
            control={control}
            name={name}
            render={({
                field: { value, onChange, onBlur },
                fieldState: { error },
            }: {
                field: {
                    value: string | number;
                    onChange: (value: string | number) => void;
                    onBlur: () => void;
                };
                fieldState: {
                    error?: { message?: string };
                };
            }) => (
                <View style={styles.container}>
                    <TextInput
                        {...props}
                        value={
                            // For numeric inputs, show empty string (placeholder) when value is undefined
                            // This allows placeholders to show for new forms
                            inputType === 'integer' || inputType === 'number'
                                ? (value === undefined ? '' : value.toString())
                                : (typeof value === 'number' ? value.toString() : (value ?? ''))
                        }
                        onChangeText={(text) => {
                            // Always pass the raw text to the form - let the schema handle validation and conversion
                            onChange(text);
                        }}
                        onBlur={onBlur}
                        placeholderTextColor={textMutedColor}
                        style={[
                            styles.input,
                            { 
                                backgroundColor: cardColor,
                                color: textColor,
                                borderColor: error ? dangerColor : borderColor
                            },
                            props.style,
                        ]}
                    />
                    {error ? (
                        <ThemedText color="danger" style={styles.error}>{error.message}</ThemedText>
                    ) : (
                        <View style={{ height: 18 }} />
                    )}
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 4,
    },
    input: {
        borderWidth: 2,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    error: {
        minHeight: 18,
    },
});
