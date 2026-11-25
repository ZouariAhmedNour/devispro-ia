import { StyleSheet, Text, View } from "react-native";
import { formatEuros } from "@devispro/shared";
import { colors, radius, spacing } from "@/theme";
import type { QuoteListItem } from "../api";
import { StatusBadge } from "./StatusBadge";

export function QuoteCard({ quote }: { quote: QuoteListItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.client} numberOfLines={1}>{quote.clients?.name ?? "Sans client"}</Text>
        <Text style={styles.total}>{formatEuros(quote.total_ttc_cents)}</Text>
      </View>
      {quote.notes ? <Text style={styles.notes} numberOfLines={2}>{quote.notes}</Text> : null}
      <View style={styles.row}>
        <StatusBadge status={quote.status} />
        <Text style={styles.date}>{new Date(quote.created_at).toLocaleDateString("fr-FR")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
    gap: spacing(2),
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing(2) },
  client: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  total: { fontSize: 16, fontWeight: "700", color: colors.text },
  notes: { fontSize: 14, color: colors.muted },
  date: { fontSize: 12, color: colors.muted },
});