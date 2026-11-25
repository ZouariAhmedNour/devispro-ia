import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { Client } from "@/features/clients/api";
import { colors, spacing } from "@/theme";

export function ClientPicker({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const options = [{ id: null as string | null, name: "Aucun" }, ...clients];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((c) => {
        const selected = c.id === value;
        return (
          <Pressable
            key={c.id ?? "none"}
            onPress={() => onChange(c.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing(2) },
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "500" },
  chipTextSelected: { color: colors.primaryText },
});