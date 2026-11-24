import type { Tables, TablesInsert, TablesUpdate } from "@devispro/shared";
import { supabase } from "@/lib/supabase";

export type Client = Tables<"clients">;
export type ClientInput = Pick<TablesInsert<"clients">, "name" | "email" | "phone" | "address">;

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createClient(input: ClientInput): Promise<void> {
  const { error } = await supabase.from("clients").insert(input);
  if (error) throw error;
}

export async function updateClient(id: string, patch: TablesUpdate<"clients">): Promise<void> {
  const { error } = await supabase.from("clients").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}