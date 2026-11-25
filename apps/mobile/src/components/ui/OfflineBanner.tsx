import { StyleSheet, Text, View } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { colors, radius, spacing } from "@/theme";

/** Visible uniquement quand le téléphone n'a plus de réseau. */
export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Hors ligne : les données affichées peuvent ne pas être à jour.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.amberBg, borderColor: colors.amberBorder, borderWidth: 1, borderRadius: radius.md, padding: spacing(3) },
  text: { color: colors.amberText, fontSize: 13, fontWeight: "500" },
});