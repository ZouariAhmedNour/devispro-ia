import { Pressable, StyleSheet, Text, View } from "react-native";
import { QUOTE_STATUSES, STATUS_LABELS, type QuoteStatus } from "@devispro/shared";
import { colors, spacing } from "@/theme";

export function StatusSelector({
  value,
  onChange,
  disabled,
}: {
  value: QuoteStatus;
  onChange: (status: QuoteStatus) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      {QUOTE_STATUSES.map((s) => {
        const selected = s === value;
        return (
          <Pressable
            key={s}
            disabled={disabled || selected}
            onPress={() => onChange(s)}
            style={[styles.chip, selected && styles.selected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{STATUS_LABELS[s]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  chip: { paddingHorizontal: spacing(3), paddingVertical: spacing(2), borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.text, fontWeight: "500", fontSize: 13 },
  textSelected: { color: colors.primaryText },
});