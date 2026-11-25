import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { formatEuros, lineHtCents, type QuoteLineCalcInput } from "@devispro/shared";
import { colors, radius, spacing } from "@/theme";
import type { DraftLine } from "../useNewQuote";

export function DraftLineRow({
  line,
  calc,
  onChangeQuantity,
  onRemove,
}: {
  line: DraftLine;
  calc: QuoteLineCalcInput | null;
  onChangeQuantity: (quantity: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.row, !calc && styles.invalid]}>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={2}>
          {line.item.label}
          {line.note ? <Text style={styles.note}> ({line.note})</Text> : null}
        </Text>
        <Text style={styles.price}>
          {formatEuros(line.item.unit_price_cents)} / {line.item.unit}
        </Text>
      </View>

      <TextInput
        value={line.quantity}
        onChangeText={onChangeQuantity}
        keyboardType="decimal-pad"
        style={styles.qty}
        selectTextOnFocus
      />

      <Text style={styles.total}>{calc ? formatEuros(lineHtCents(calc)) : "—"}</Text>

      <Pressable onPress={onRemove} hitSlop={10}>
        <Text style={styles.remove}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    padding: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  invalid: { borderColor: colors.danger, backgroundColor: "#fef2f2" },
  info: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: "600", color: colors.text },
  note: { fontWeight: "400", color: colors.muted },
  price: { fontSize: 12, color: colors.muted },
  qty: {
    width: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing(1.5),
    textAlign: "center",
    fontSize: 15,
    color: colors.text,
  },
  total: { width: 78, textAlign: "right", fontWeight: "600", color: colors.text },
  remove: { fontSize: 16, color: colors.muted, paddingLeft: spacing(1) },
});