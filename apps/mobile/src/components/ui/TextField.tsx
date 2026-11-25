import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius, spacing } from "@/theme";

export function TextField({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing(1.5) },
  label: { fontSize: 14, fontWeight: "500", color: colors.text },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
});