import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/theme";
import { useAuth } from "./useAuth";

export default function LoginScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState("artisan.a@demo.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/" />;

  async function handleLogin() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🔨</Text>
          </View>
          <Text style={styles.title}>DevisPro IA</Text>
          <Text style={styles.subtitle}>Tes devis dictés sur le chantier.</Text>
        </View>

        <View style={styles.card}>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Se connecter" onPress={handleLogin} loading={busy} />
        </View>

        <Text style={styles.demo}>Démo : artisan.a@demo.test / demo1234</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", padding: spacing(6), gap: spacing(6) },
  brand: { alignItems: "center", gap: spacing(2) },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 26 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(5),
    gap: spacing(4),
  },
  error: { color: colors.danger, fontSize: 14 },
  demo: { textAlign: "center", fontSize: 12, color: colors.muted },
});