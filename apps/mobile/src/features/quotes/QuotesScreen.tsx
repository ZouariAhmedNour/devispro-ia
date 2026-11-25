import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { colors, spacing } from "@/theme";
import { useQuotes } from "./hooks";
import { QuoteCard } from "./components/QuoteCard";

export default function QuotesScreen() {
    const insets = useSafeAreaInsets();
    const { profile, signOut } = useAuth();
    const { data: quotes = [], isLoading, isRefetching, refetch, error } = useQuotes();

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Mes devis",
                    headerRight: () => (
                        <Pressable onPress={signOut} hitSlop={10}>
                            <Text style={styles.logout}>Déconnexion</Text>
                        </Pressable>
                    ),
                }}
            />

            <FlatList
                data={quotes}
                keyExtractor={(q) => q.id}
                renderItem={({ item }) => <QuoteCard quote={item} />}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
                    />
                } ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.company}>{profile?.companyName ?? ""}</Text>
                        {error ? <Text style={styles.error}>Impossible de charger les devis.</Text> : null}
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator style={{ marginTop: spacing(10) }} />
                    ) : (
                        <Text style={styles.empty}>Aucun devis pour l'instant.</Text>
                    )
                }
            />

            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing(3) }]}>
                <Button
                    title="+ Nouveau devis"
                    variant="violet"
                    onPress={() => router.push("/new")}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing(4), gap: spacing(3), paddingBottom: spacing(28) },
    header: { gap: spacing(1), marginBottom: spacing(1) },
    company: { fontSize: 14, color: colors.muted },
    error: { color: colors.danger },
    empty: { textAlign: "center", marginTop: spacing(10), color: colors.muted },
    logout: { color: colors.danger, fontWeight: "600" },
    footer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing(4),
        paddingTop: spacing(3),
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});