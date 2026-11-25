import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

// Hors ligne : les requêtes se mettent en pause, puis repartent au retour du réseau
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);

// Retour de l'app au premier plan : les données périmées sont rafraîchies
AppState.addEventListener("change", (status) => focusManager.setFocused(status === "active"));