import { createClient } from "@supabase/supabase-js";
import type { Database } from "@devispro/shared";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env.local");
}

export const supabase = createClient<Database>(url, anonKey);