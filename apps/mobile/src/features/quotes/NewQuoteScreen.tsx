import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatEuros } from "@devispro/shared";
import { Button } from "@/components/ui/Button";
import { useCatalogItems } from "@/features/catalog/hooks";
import { useClients } from "@/features/clients/hooks";
import { toMessage } from "@/lib/errors";
import { colors, radius, spacing } from "@/theme";
import { useCreateQuote, useGenerateDraft } from "./hooks";
import { useNewQuote } from "./useNewQuote";
import { ClientPicker } from "./components/ClientPicker";
import { DictationButton } from "./components/DictationButton";
import { DraftLineRow } from "./components/DraftLineRow";

export default function NewQuoteScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useCatalogItems();
  const clients = useClients();
  const quote = useNewQuote(catalog.data ?? []);
  const generate = useGenerateDraft();
  const create = useCreateQuote();

  function handleGenerate() {
    generate.mutate(quote.description, {
      onSuccess: (draft) => quote.applyDraft(draft),
      onError: (err) => Alert.alert("Génération impossible", toMessage(err)),
    });
  }

  function handleSave() {
    create.mutate(
      {
        status: "draft",
        clientId: quote.clientId,
        notes: quote.description.trim().slice(0, 120) || null,
        lines: quote.toSaveLines(),
        expectedTtcCents: quote.totals.totalTtcCents,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) => Alert.alert("Enregistrement refusé", toMessage(err)),
      },
    );
  }

  if (catalog.isLoading || clients.isLoading) {
    return <ActivityIndicator style={{ marginTop: spacing(10) }} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: "Nouveau devis" }} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 1. Client */}
        <Text style={styles.section}>Client</Text>
        <ClientPicker clients={clients.data ?? []} value={quote.clientId} onChange={quote.setClientId} />

        {/* 2. Description + IA */}
        <Text style={styles.section}>Le chantier</Text>
        <TextInput
          value={quote.description}
          onChangeText={quote.setDescription}
          multiline
          placeholder="Dicte ou écris : « Salle de bain de 12 m², enlever l'ancien carrelage et poser du neuf au sol »"
          placeholderTextColor={colors.muted}
          style={styles.textarea}
        />
        <View style={styles.actions}>
          <DictationButton
            onText={(text) =>
              quote.setDescription(quote.description ? `${quote.description} ${text}` : text)
            }
          />
          <Button
            title="✨ Générer"
            variant="violet"
            loading={generate.isPending}
            disabled={quote.description.trim().length < 3}
            onPress={handleGenerate}
            style={{ flex: 1 }}
          />
        </View>

        {quote.questions.length > 0 && (
          <View style={styles.questions}>
            <Text style={styles.questionsTitle}>L'IA a besoin de précisions :</Text>
            {quote.questions.map((q) => (
              <Text key={q} style={styles.questionsText}>• {q}</Text>
            ))}
            <Text style={styles.questionsHint}>Complète la description puis relance.</Text>
          </View>
        )}
        {quote.rejected > 0 && (
          <Text style={styles.rejected}>
            {quote.rejected} proposition(s) écartée(s) : absente(s) de ton catalogue.
          </Text>
        )}

        {/* 3. Lignes */}
        <Text style={styles.section}>Lignes ({quote.lines.length})</Text>
        {quote.lines.length === 0 ? (
          <Text style={styles.empty}>Les lignes générées par l'IA apparaîtront ici.</Text>
        ) : (
          <View style={{ gap: spacing(2) }}>
            {quote.lines.map((line, i) => (
              <DraftLineRow
                key={line.key}
                line={line}
                calc={quote.calcLines[i] ?? null}
                onChangeQuantity={(q) => quote.updateQuantity(line.key, q)}
                onRemove={() => quote.removeLine(line.key)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Barre du bas : total + enregistrement */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing(3) }]}>
        <View>
          <Text style={styles.totalLabel}>Total TTC</Text>
          <Text style={styles.totalValue}>{formatEuros(quote.totals.totalTtcCents)}</Text>
          <Text style={styles.totalSub}>HT {formatEuros(quote.totals.totalHtCents)}</Text>
        </View>
        <Button
          title="Enregistrer"
          loading={create.isPending}
          disabled={quote.lines.length === 0 || quote.hasInvalid}
          onPress={handleSave}
          style={{ flex: 1, marginLeft: spacing(4) }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing(4), gap: spacing(3), paddingBottom: spacing(10) },
  section: { fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", marginTop: spacing(2) },
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(3),
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", gap: spacing(2) },
  questions: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radius.md,
    padding: spacing(3),
    gap: spacing(1),
  },
  questionsTitle: { fontWeight: "700", color: colors.amberText },
  questionsText: { color: colors.amberText },
  questionsHint: { fontSize: 12, color: colors.amberText, marginTop: spacing(1) },
  rejected: { fontSize: 12, color: colors.muted },
  empty: { color: colors.muted },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  totalLabel: { fontSize: 12, color: colors.muted },
  totalValue: { fontSize: 22, fontWeight: "700", color: colors.text },
  totalSub: { fontSize: 12, color: colors.muted },
});