import { StyleSheet, Text, View } from "react-native";
import { STATUS_LABELS, type QuoteStatus } from "@devispro/shared";

const STYLES: Record<QuoteStatus, { bg: string; fg: string }> = {
  draft: { bg: "#f1f5f9", fg: "#334155" },
  sent: { bg: "#eff6ff", fg: "#1d4ed8" },
  accepted: { bg: "#ecfdf5", fg: "#047857" },
  rejected: { bg: "#fef2f2", fg: "#b91c1c" },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const s = STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "600" },
});