import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      <Button title="Réessayer" variant="outline" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing(3), paddingVertical: spacing(10) },
  text: { color: colors.muted, textAlign: "center" },
});