import { forwardRef, useState, type ComponentRef } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';
import { T } from './T';

type Props = TextInputProps & { label: string; hint?: string; error?: string };

export type FieldRef = ComponentRef<typeof TextInput>;

export const Field = forwardRef<FieldRef, Props>(function Field({ label, hint, error, style, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <T v="smallStrong" style={styles.label}>
        {label}
      </T>
      <TextInput
        ref={ref}
        placeholderTextColor="#9A9DB3"
        {...rest}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, focused && styles.focused, !!error && styles.invalid, style]}
      />
      {error ? (
        <T v="small" style={styles.error}>
          {error}
        </T>
      ) : hint ? (
        <T v="caption" style={styles.hint}>
          {hint}
        </T>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { marginBottom: 6 },
  input: {
    minHeight: 50,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.midnight,
    // The field draws its own focus border; drop the browser's default ring in the web preview.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  focused: { borderColor: colors.lavenderDeep, borderWidth: 2, paddingHorizontal: 13 },
  invalid: { borderColor: colors.vermilion },
  error: { color: colors.vermilion, marginTop: 6 },
  hint: { marginTop: 6 },
});
