import type { Tables } from "@devispro/shared";
import { supabase } from "@/lib/supabase";

export type Client = Tables<"clients">;

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) throw error;
  return data;
}