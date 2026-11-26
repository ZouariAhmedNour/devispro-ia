import { ActivityIndicator, Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { buildQuoteMessage, formatEuros, lineHtCents, quoteEmailSubject, TvaRateSchema } from "@devispro/shared";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { toMessage } from "@/lib/errors";
import { colors, radius, spacing } from "@/theme";
import { useQuote, useQuotePdf, useUpdateQuoteStatus } from "./hooks";
import { StatusSelector } from "./components/StatusSelector";
import { useAuth } from "../auth/useAuth";

export default function QuoteDetailScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const { data: quote, isLoading, error, refetch } = useQuote(id);
  const updateStatus = useUpdateQuoteStatus(id);

  const { profile } = useAuth();
  const pdf = useQuotePdf();

  function handleOpenPdf() {
    pdf.mutate(id, {
      onSuccess: (url) => void Linking.openURL(url),
      onError: (err) => Alert.alert("PDF impossible", toMessage(err)),
    });
  }

  function handleShare() {
    pdf.mutate(id, {
      onSuccess: async (url) => {
        const companyName = profile?.companyName ?? "";
        const result = await Share.share({
          title: quoteEmailSubject(companyName),
          message: buildQuoteMessage({ clientName: quote?.clients?.name, companyName, url }),
        });
        // Un brouillon partagé passe au statut « Envoyé »
        if (result.action === Share.sharedAction && quote?.status === "draft") {
          updateStatus.mutate("sent");
        }
      },
      onError: (err) => Alert.alert("Envoi impossible", toMessage(err)),
    });
  }

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing(10) }} />;
  if (error || !quote) {
    return <ErrorState message="Impossible de charger ce devis." onRetry={() => void refetch()} />;
  }

  const phone = quote.clients?.phone;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: quote.clients?.name ?? "Devis" }} />
      <OfflineBanner />

      {/* En-tête */}
      <View style={styles.card}>
        <Text style={styles.client}>{quote.clients?.name ?? "Sans client"}</Text>
        {quote.notes ? <Text style={styles.notes}>{quote.notes}</Text> : null}
        <Text style={styles.date}>Créé le {new Date(quote.created_at).toLocaleDateString("fr-FR")}</Text>
        {phone ? (
          <Button title={`📞 Appeler ${phone}`} variant="outline" onPress={() => Linking.openURL(`tel:${phone}`)} />
        ) : null}
          <Button
          title="📤 Envoyer au client"
          variant="violet"
          loading={pdf.isPending}
          disabled={quote.quote_lines.length === 0}
          onPress={handleShare}
        />
        <Button
          title="📄 Voir le PDF"
          variant="outline"
          disabled={pdf.isPending || quote.quote_lines.length === 0}
          onPress={handleOpenPdf}
        />
      </View>

      {/* Statut */}
      <Text style={styles.section}>Statut</Text>
      <StatusSelector
        value={quote.status}
        disabled={updateStatus.isPending}
        onChange={(status) =>
          updateStatus.mutate(status, {
            onError: (err) => Alert.alert("Mise à jour impossible", toMessage(err)),
          })
        }
      />

      {/* Lignes */}
      <Text style={styles.section}>Lignes ({quote.quote_lines.length})</Text>
      <View style={styles.card}>
        {quote.quote_lines.length === 0 ? (
          <Text style={styles.notes}>Aucune ligne.</Text>
        ) : (
          quote.quote_lines.map((l) => (
            <View key={l.id} style={styles.line}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineLabel}>{l.label}</Text>
                <Text style={styles.lineSub}>
                  {String(l.quantity).replace(".", ",")} {l.unit} × {formatEuros(l.unit_price_cents)}
                  {l.discount_percent ? ` · −${l.discount_percent} %` : ""}
                </Text>
              </View>
              <Text style={styles.lineTotal}>
                {formatEuros(
                  lineHtCents({
                    quantity: l.quantity,
                    unitPriceCents: l.unit_price_cents,
                    vatRate: TvaRateSchema.parse(l.vat_rate),
                    discountPercent: l.discount_percent,
                  }),
                )}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Totaux stockés par le serveur */}
      <View style={styles.card}>
        <Row label="Total HT" value={formatEuros(quote.total_ht_cents)} />
        <Row label="TVA" value={formatEuros(quote.total_vat_cents)} />
        <View style={styles.separator} />
        <Row label="Total TTC" value={formatEuros(quote.total_ttc_cents)} strong />
        <Text style={styles.hint}>Montants calculés et vérifiés par le serveur.</Text>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strongValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing(4), gap: spacing(3), paddingBottom: spacing(10) },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing(4), gap: spacing(2) },
  client: { fontSize: 20, fontWeight: "700", color: colors.text },
  notes: { color: colors.muted, fontSize: 15 },
  date: { color: colors.muted, fontSize: 12 },
  section: { fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", marginTop: spacing(2) },
  line: { flexDirection: "row", alignItems: "center", gap: spacing(3), paddingVertical: spacing(1.5) },
  lineLabel: { fontWeight: "600", color: colors.text },
  lineSub: { fontSize: 12, color: colors.muted },
  lineTotal: { fontWeight: "600", color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.muted },
  rowValue: { color: colors.text },
  strong: { color: colors.text, fontWeight: "700" },
  strongValue: { fontSize: 20, fontWeight: "700", color: colors.text },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: spacing(1) },
  hint: { fontSize: 12, color: colors.muted, marginTop: spacing(1) },
});