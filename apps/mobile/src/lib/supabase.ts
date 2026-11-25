import "react-native-url-polyfill/auto";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@devispro/shared";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY manquant dans apps/mobile/.env");
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,      // la session survit à la fermeture de l'app
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // pas d'URL de navigateur sur mobile
  },
});

// Rafraîchit le jeton uniquement quand l'app est au premier plan
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});